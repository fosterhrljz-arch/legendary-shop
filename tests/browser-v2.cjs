/* Browser acceptance of the living-shop simulation. No runtime dependencies. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('Install test-only Playwright: npm install --no-save --package-lock=false playwright'); process.exit(1); }

(async () => {
  const root = path.resolve(process.env.SHOP_APP_DIR || path.join(__dirname, '..'));
  const output = process.env.SHOP_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'legendary-management-qa-'));
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.SHOP_BROWSER_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, offline: true, reducedMotion: 'reduce', acceptDownloads: true });
  await context.addInitScript(() => localStorage.setItem('legendary-shop.shift.v1', 'LEGACY_QUIZ_SAVE_UNTOUCHED'));
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [], external = [], passed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
  const check = async (name, fn) => { await fn(); passed.push(name); console.log(`PASS ${name}`); };
  const state = () => page.evaluate(() => ShopApp.getState());
  const advance = async seconds => { await page.evaluate(seconds => ShopApp.advance(seconds), seconds); };
  const shot = name => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true, animations: 'disabled' });
  const panel = async name => { await page.locator(`[data-panel="${name}"]`).click(); await page.locator('#panel').waitFor({ state: 'visible' }); };
  const closePanel = async () => { if (await page.locator('#panel').isVisible()) await page.locator('#panel-close').click(); };
  const closeModal = async () => { if (await page.locator('#modal').isVisible()) await page.locator('#modal-close').click(); };
  const overflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'Horizontal page overflow');
  try {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => Boolean(window.ShopApp && window.ShopRenderer));
    await page.evaluate(() => document.fonts.ready);
    await check('management shell loads offline with a real canvas world and no quiz interface', async () => {
      assert.match(await page.title(), /Legendary Shop/);
      assert.equal((await state()).version, 2);
      assert.equal((await state()).phase, 'prep');
      assert.equal(await page.locator('#world').isVisible(), true);
      assert.equal(await page.locator('#workbench,[data-answer]').count(), 0);
      assert.equal(await page.locator('[data-panel]').count(), 5);
      await overflow(); await shot('01-preparation');
    });

    await check('hands-off customers enter, walk, reserve, queue, pay, consume stock, and leave', async () => {
      const before = await state();
      await page.locator('#shift-action').click();
      await page.waitForFunction(() => ShopApp.getState().served >= 1, null, { timeout: 45000 });
      await page.waitForFunction(() => ShopApp.getState().departed >= 1, null, { timeout: 12000 });
      const after = await state();
      assert.ok(after.cash > before.cash);
      assert.ok(after.ledger.some(entry => entry.type === 'sale'));
      const sales = after.ledger.filter(entry => entry.type === 'sale');
      assert.equal(new Set(sales.map(entry => entry.customerId)).size, sales.length);
      const physical = s => Object.values(s.storage).reduce((a,b)=>a+b,0) + s.objects.reduce((a,o)=>a+o.stock,0);
      assert.ok(physical(after) < physical(before));
      for (const type of ['enter', 'reserve', 'queue', 'payment', 'exit']) assert.ok(after.events.some(event => event.type === type), `Missing live event ${type}`);
      await shot('02-operating-shop');
    });

    await check('required overlays and explicit pause freeze shared simulation time', async () => {
      await panel('handbook');
      const before = await state(); await advance(8);
      assert.equal((await state()).clock, before.clock);
      assert.deepEqual((await state()).customers, before.customers);
      assert.match(await page.locator('#panel-content').innerText(), /Monsters|Products|Shop Basics/);
      await shot('03-handbook'); await closePanel();
      await page.locator('#pause').click(); const paused = await state(); await advance(5);
      assert.equal((await state()).clock, paused.clock);
      await page.locator('#normal').click(); await advance(1);
      assert.ok((await state()).clock > paused.clock);
    });

    await check('identification retry is fair and discoveries enter the same inventory exactly once', async () => {
      await panel('stock');
      const receiving = page.locator('[data-stock-tab="receiving"]');
      if (await receiving.isVisible()) await receiving.click();
      await page.locator('[data-inspect="parcel-intro"]').click();
      assert.equal(await page.locator('[data-identify]').count(), 3);
      assert.match(await page.locator('#modal-content').innerText(), /sulfur|spiral|fibers/i);
      const before = await state();
      await page.locator('[data-identify][data-index="0"]').click();
      assert.equal(await page.locator('[data-identify][data-index="0"]').isDisabled(), true);
      assert.match(await page.locator('#modal-content').innerText(), /dragon poop|restaurant license/i);
      assert.equal((await state()).reputation, before.reputation);
      await shot('04-identification');
      await page.locator('[data-identify][data-index="2"]').click();
      assert.ok((await state()).discovered.includes('dragon-droppings'));
      assert.ok((await state()).storage['dragon-droppings'] > 0);
      const quantity = (await state()).storage['dragon-droppings'];
      await shot('05-discovery');
      await page.locator('#discovery-close').click();
      assert.equal((await state()).storage['dragon-droppings'], quantity);
    });

    await check('human misdelivery is identified and returned without becoming saleable stock', async () => {
      await panel('stock');
      const receiving = page.locator('[data-stock-tab="receiving"]');
      if (await receiving.isVisible()) await receiving.click();
      const human = (await state()).parcels.find(parcel => parcel.sku === 'tax-forms' && parcel.status === 'unknown');
      assert.ok(human);
      await page.locator(`[data-inspect="${human.id}"]`).click();
      const correct = await page.evaluate(() => ShopSim.product('tax-forms').correctIndex);
      await page.locator(`[data-identify][data-index="${correct}"]`).click();
      await page.locator('#discovery-close').click();
      assert.equal((await state()).storage['tax-forms'] || 0, 0);
      await panel('stock');
      if (await receiving.isVisible()) await receiving.click();
      await page.locator(`[data-return="${human.id}"]`).click();
      assert.equal((await state()).parcels.find(parcel => parcel.id === human.id).status, 'returned');
      await closePanel();
    });

    await check('real customer order is dispatched, carried, and paid once', async () => {
      await advance(22);
      await panel('orders');
      const s = await state();
      const customer = s.customers.find(c => c.guided && c.phase === 'request') || s.customers.find(c => c.request?.productId === 'dragon-droppings' && c.phase === 'request');
      assert.ok(customer, 'The guided witch must be present at the service counter');
      await shot('06-real-service-order');
      const dispatch = page.locator(`[data-dispatch="${customer.id}"]`);
      await page.locator(`#deliver-${customer.id}`).selectOption('maze-pretzel');
      const beforeWrong = await state(); await dispatch.click();
      assert.match(await page.locator('#modal-content').innerText(), /WRONG PACKAGE/);
      assert.deepEqual((await state()).storage, beforeWrong.storage);
      assert.equal((await state()).cash, beforeWrong.cash);
      await page.locator('#complaint-close').click();
      await page.locator(`#deliver-${customer.id}`).selectOption('dragon-droppings');
      await dispatch.click(); await closePanel();
      await advance(35);
      const after = await state();
      assert.equal(after.ledger.filter(entry => entry.type === 'sale' && entry.customerId === customer.id).length, 1);
      assert.equal(after.guidedDone, true);
    });

    await check('layout placement preview cancels without charge and a valid tile creates furniture', async () => {
      await panel('build');
      const before = await state();
      await page.locator('[data-build="shelf"]').click();
      await page.locator('#placement-bar').waitFor({ state: 'visible' });
      await shot('07-placement');
      await page.locator('#cancel-placement').click();
      assert.equal((await state()).cash, before.cash);
      assert.equal((await state()).objects.length, before.objects.length);
      await closePanel();
      await panel('build');
      await page.locator('[data-build="shelf"]').click();
      const spot = await page.evaluate(() => {
        const state = ShopApp.getState();
        for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++) {
          if(ShopSim.validatePlacement(state,'shelf',x,y,0).ok) return { ...ShopApp.renderer.tileToScreen(x,y), tileX:x,tileY:y };
        }
      });
      assert.ok(spot, 'At least one reachable shelf placement remains');
      await page.mouse.move(spot.x, spot.y); await shot('07b-placement-preview');
      await page.mouse.click(spot.x, spot.y);
      assert.equal((await state()).objects.length, before.objects.length + 1);
      assert.equal((await state()).cash, before.cash - 45);
      await closePanel();
    });

    await check('save and reload preserve live reservations, inventory, cash, and legacy save', async () => {
      if (!(await state()).paused) await page.locator('#pause').click();
      await page.locator('#save').click();
      const before = await state();
      await page.reload(); await page.waitForFunction(() => Boolean(window.ShopApp));
      const after = await state();
      assert.equal(after.version, 2); assert.equal(after.cash, before.cash);
      assert.deepEqual(after.storage, before.storage);
      assert.deepEqual(after.customers.map(c=>c.reservation), before.customers.map(c=>c.reservation));
      assert.equal(await page.evaluate(() => localStorage.getItem('legendary-shop.shift.v1')), 'LEGACY_QUIZ_SAVE_UNTOUCHED');
      await page.locator('#normal').click();
    });

    await check('closing resolves guests and shift report shows economic accounting', async () => {
      if ((await state()).phase === 'open') await page.locator('#shift-action').click();
      await advance(220);
      assert.equal((await state()).phase, 'report');
      assert.equal((await state()).customers.length, 0);
      await shot('08-shift-report');
      assert.match(await page.locator('body').innerText(), /revenue/i);
      assert.match(await page.locator('body').innerText(), /profit/i);
    });

    await check('campaign progression unlocks staffing and actual hiring and training work', async () => {
      await page.locator('#next-shift').click();
      assert.equal((await state()).shift, 2);
      await page.locator('#shift-action').click(); await advance(12);
      await page.locator('#shift-action').click(); await advance(160);
      await page.locator('#next-shift').click(); assert.equal((await state()).shift, 3);
      await panel('staff'); await shot('09-staff-management');
      const before = await state();
      await page.locator('#hire').click(); assert.equal((await state()).staff.length, before.staff.length + 1);
      const internLevel = (await state()).staff.find(w => w.id === 'intern').level;
      await page.locator('[data-train="intern"]').click();
      assert.equal((await state()).staff.find(w => w.id === 'intern').level, internLevel + 1);
      const hire = (await state()).staff.find(w => w.id !== 'intern');
      await page.locator(`[data-role-select="${hire.id}"]`).selectOption('stock');
      assert.deepEqual((await state()).staff.find(w=>w.id===hire.id).roles, ['stock']);
      await shot('09b-hired-staff');
      await closePanel();
    });

    await check('earned coins fund usable expansion and all six shifts reach a campaign report', async () => {
      while ((await state()).shift < 5) {
        await page.locator('#shift-action').click(); await advance(15);
        await page.locator('#shift-action').click(); await advance(220);
        assert.equal((await state()).phase, 'report');
        await page.locator('#next-shift').click();
      }
      await panel('build'); const before = await state();
      assert.ok(before.cash >= 160, 'Ordinary previous sales fund the expansion');
      await page.locator('#expand').click();
      assert.equal((await state()).width, 14); assert.equal((await state()).cash, before.cash - 160);
      await closePanel(); await shot('13-expanded-shop');
      for (let shift=5;shift<=6;shift++) {
        await page.locator('#shift-action').click(); await advance(15);
        if (shift===5) { await advance(10); await shot('13b-expanded-operating-shop'); }
        await page.locator('#shift-action').click(); await advance(220);
        if(shift===5) await page.locator('#next-shift').click();
      }
      const end = await state();
      assert.equal(end.phase,'complete'); assert.equal(end.reports.length,6);
      assert.equal(end.ledger.filter(e=>e.type==='wages').length,6);
      assert.equal(new Set(end.settled).size,6);
      const totalRevenue = end.reports.reduce((sum, report) => sum + report.revenue, 0);
      const revenueCard = page.locator('#modal-content .mini-stats > div').filter({hasText:/sales revenue/i});
      assert.match(await revenueCard.innerText(), new RegExp('\\b' + totalRevenue + 'c\\b'));
      await shot('14-campaign-report'); await closeModal();
    });

    await check('manual JSON export fallback and import retain the versioned shop and sound preference', async () => {
      await page.locator('#settings').click();
      const before = await state();
      const downloadEvent = page.waitForEvent('download');
      await page.locator('#export-save').click();
      const download = await downloadEvent;
      const exportPath = path.join(output, 'browser-export.json');
      const failure = await download.failure();
      if (failure) console.log(`LIMITATION native Chrome download: ${failure}; validating visible JSON fallback instead.`);
      else { await download.saveAs(path.join(output,'native-browser-export.json')); console.log('Native download also succeeded.'); }
      const json = await page.locator('#save-json').inputValue();
      await page.locator('#select-save').click();
      assert.equal(await page.locator('#save-json').evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length),true);
      await fs.writeFile(exportPath,json,'utf8');
      const exported = JSON.parse(json);
      assert.equal(exported.version,2); assert.equal(exported.cash,before.cash);
      await page.locator('#export-close').click();
      await page.locator('#import-save').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1}')});
      assert.equal((await state()).cash,before.cash);
      const initialSound = await page.locator('#sound-toggle').getAttribute('aria-pressed');
      await page.locator('#sound-toggle').click();
      const finalSound = await page.locator('#sound-toggle').getAttribute('aria-pressed');
      assert.notEqual(finalSound,initialSound);
      await page.locator('#import-save').setInputFiles(exportPath);
      assert.equal((await state()).cash,before.cash);
      assert.deepEqual((await state()).storage,before.storage);
      await page.reload(); await page.waitForFunction(()=>Boolean(window.ShopApp));
      await page.locator('#settings').click();
      assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),finalSound);
      assert.equal(await page.evaluate(()=>localStorage.getItem('legendary-shop.shift.v1')),'LEGACY_QUIZ_SAVE_UNTOUCHED');
      await closePanel();
    });

    await check('tablet and mobile keep readable collapsible controls and camera navigation', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); await overflow(); await shot('10-tablet');
      await page.setViewportSize({ width: 390, height: 844 }); await overflow();
      await page.locator('#zoom-in').click(); await page.locator('#view-reset').click();
      await panel('handbook'); await shot('11-mobile-handbook');
      await closePanel(); await shot('12-mobile-shop');
      await page.setViewportSize({ width: 1440, height: 960 });
    });

    await check('storage-denied browsers remain playable and display the export recovery notice', async () => {
      const deniedContext = await browser.newContext({offline:true,viewport:{width:1280,height:900}});
      await deniedContext.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}}));
      const denied = await deniedContext.newPage();
      const deniedErrors=[]; denied.on('pageerror',error=>deniedErrors.push(error.message));
      await denied.goto(pathToFileURL(path.join(root,'index.html')).href);
      await denied.waitForFunction(()=>Boolean(window.ShopApp));
      assert.equal(await denied.locator('#storage-warning').isVisible(),true);
      await denied.locator('#shift-action').click();
      await denied.evaluate(()=>ShopApp.advance(35));
      assert.ok(await denied.evaluate(()=>ShopApp.getState().served>=1));
      assert.deepEqual(deniedErrors,[]);
      await deniedContext.close();
    });

    await check('no JavaScript errors, console errors, or runtime network requests', async () => {
      assert.deepEqual(errors, []); assert.deepEqual(external, []);
    });

    console.log(`\n${passed.length} management browser checks passed.\nEvidence: ${output}`);
  } catch (error) {
    await shot('FAILED').catch(() => {});
    console.error(`FAILED after ${passed.length} checks: ${error.stack}`);
    console.error('Console errors:', errors); console.error('Evidence:', output);
    process.exitCode = 1;
  } finally { await context.close(); await browser.close(); }
})();
