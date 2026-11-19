/* Real browser acceptance tests. Requires Playwright only for testing, never for playing. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  console.error('Browser tests require Playwright. Run npm install --no-save playwright, then npm run test:browser.');
  process.exit(1);
}

(async () => {
  const root = path.resolve(process.env.SHOP_APP_DIR || path.join(__dirname, '..'));
  const output = process.env.SHOP_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'legendary-shop-qa-'));
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.SHOP_BROWSER_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, offline: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const url = pathToFileURL(path.join(root, 'index.html')).href;
  const errors = [], network = [], passed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  const check = async (name, fn) => { await fn(); passed.push(name); console.log(`PASS ${name}`); };
  const shot = name => page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true, animations: 'disabled' });
  const state = () => page.evaluate(() => window.ShopApp.getState());
  const phase = value => page.waitForFunction(expected => window.ShopApp.getState()?.phase === expected, value);
  const item = () => page.evaluate(() => window.ShopEngine.currentItem(window.ShopApp.getState()));
  const resumeIfOffered = async () => {
    const resume = page.locator('#resume-shift');
    if (await resume.isVisible()) await resume.click();
  };
  const noOverflow = async label => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${label}: horizontal overflow`);
  };
  const canvasPixels = () => page.evaluate(() => [...document.querySelectorAll('canvas')].filter(canvas => {
    const bounds = canvas.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0;
  }).map(canvas => {
    const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0;
    for (let n = 3; n < bytes.length; n += 4) if (bytes[n]) opaque++;
    return { width: canvas.width, height: canvas.height, opaque };
  }));

  try {
    await page.goto(url);
    await page.locator('#start-shift').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await check('offline title page, local art, identity, and no error overlay', async () => {
      assert.match(page.url(), /^file:/);
      assert.match(await page.title(), /Legendary Shop/);
      assert.match(await page.locator('body').innerText(), /Halloween Mix-Up/i);
      assert.equal(await page.locator('vite-error-overlay, nextjs-portal, #webpack-dev-server-client-overlay').count(), 0);
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      await noOverflow('desktop title');
      await shot('01-title-desktop');
    });

    await check('sound setting survives a reload', async () => {
      const initial = await page.locator('#sound-toggle').getAttribute('aria-pressed');
      await page.locator('#sound-toggle').click();
      const changed = await page.locator('#sound-toggle').getAttribute('aria-pressed');
      assert.notEqual(changed, initial);
      await page.reload();
      await page.locator('#start-shift').waitFor();
      assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), changed);
      // Remaining acceptance checks are quiet regardless of the default setting.
      if (changed === 'true') await page.locator('#sound-toggle').click();
    });

    await check('handbook contains all 12 useful monster profiles and closes accessibly', async () => {
      await page.locator('#handbook-open').click();
      await page.locator('#handbook').waitFor({ state: 'visible' });
      const text = await page.locator('#handbook').innerText();
      const monsters = await page.evaluate(() => window.ShopContent.monsters);
      assert.equal(monsters.length, 12);
      for (const monster of monsters) {
        assert.ok(text.includes(monster.species), `Missing species: ${monster.species}`);
        assert.ok(monster.likes.some(like => text.toLowerCase().includes(like.toLowerCase())), `Missing preference: ${monster.species}`);
      }
      assert.match(text, /beef/i);
      assert.match(text, /dislike|avoid|never|no thanks/i);
      const art = await canvasPixels();
      assert.ok(art.length >= 12);
      assert.ok(art.every(canvas => canvas.opaque > 0), 'Empty character canvas in handbook');
      await shot('02-handbook-desktop');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#handbook').isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'handbook-open');
      await page.keyboard.press('h');
      await page.locator('#handbook').waitFor({ state: 'visible' });
      await page.locator('#handbook-close').click();
      assert.equal(await page.locator('#handbook').isVisible(), false);
    });

    await check('start button opens tutorial and starts the real game', async () => {
      await page.locator('#start-shift').click();
      await page.locator('#tutorial').waitFor({ state: 'visible' });
      assert.match(await page.locator('#tutorial').innerText(), /name that package|identif/i);
      assert.match(await page.locator('#tutorial').innerText(), /give the item|deliver/i);
      await page.locator('#tutorial-start').click();
      await page.locator('#workbench').waitFor({ state: 'visible' });
      await phase('identify');
      assert.equal((await state()).round, 0);
      assert.equal((await state()).score, 0);
      assert.equal((await state()).mistakes, 0);
      assert.equal(await page.locator('[data-answer]').count(), 3);
      await noOverflow('desktop identification');
      await shot('03-identify-desktop');
    });

    await check('wrong identity gives comic feedback, one mistake, and a disabled retry choice', async () => {
      const current = await item();
      const wrongIndex = (current.correctIndex + 1) % 3;
      const before = await state();
      await page.locator(`[data-answer="${wrongIndex}"]`).click();
      const after = await state();
      assert.equal(after.phase, 'identify');
      assert.equal(after.mistakes, before.mistakes + 1);
      assert.equal(after.score, Math.max(0, before.score - 10));
      assert.equal(after.feedback.kind, 'error');
      assert.ok((await page.locator('#feedback').innerText()).length > 12);
      assert.equal(await page.locator(`[data-answer="${wrongIndex}"]`).isDisabled(), true);
      await page.locator(`[data-answer="${wrongIndex}"]`).evaluate(button => button.click());
      assert.equal((await state()).mistakes, after.mistakes, 'A disabled duplicate answer must not count twice');
      await shot('04-wrong-answer');
    });

    await check('keyboard answer reveals the real item card and awards 50 points once', async () => {
      const current = await item();
      const before = await state();
      await page.keyboard.press(String(current.correctIndex + 1));
      await phase('reveal');
      assert.equal((await state()).score, before.score + 50);
      assert.ok((await page.locator('#workbench').innerText()).includes(current.name));
      assert.ok((await page.locator('#workbench').innerText()).includes(current.description));
      const saved = (await state()).score;
      await page.keyboard.press(String(current.correctIndex + 1));
      assert.equal((await state()).score, saved, 'Replaying an answer cannot award duplicate points');
      await shot('05-reveal-desktop');
      await page.locator('#continue-delivery').click();
      await phase('deliver');
    });

    await check('wrong recipient complains; correct recipient delivers and scores once', async () => {
      const current = await item();
      const choices = await page.locator('[data-recipient]').evaluateAll(elements => elements.map(el => el.dataset.recipient));
      assert.equal(choices.length, 4, 'Three monster choices plus the human returns desk');
      assert.ok(choices.includes(current.recipient));
      const wrong = choices.find(id => id !== current.recipient && id !== 'human');
      const before = await state();
      await page.locator(`[data-recipient="${wrong}"]`).click();
      assert.equal((await state()).phase, 'deliver');
      assert.equal((await state()).mistakes, before.mistakes + 1);
      assert.equal((await state()).score, Math.max(0, before.score - 10));
      assert.equal((await state()).feedback.kind, 'error');
      assert.equal(await page.locator(`[data-recipient="${wrong}"]`).isDisabled(), true);
      await page.locator(`[data-recipient="${wrong}"]`).evaluate(button => button.click());
      assert.equal((await state()).mistakes, before.mistakes + 1);
      await shot('06-delivery-desktop');
      const score = (await state()).score;
      await page.locator(`[data-recipient="${current.recipient}"]`).click();
      await phase('delivered');
      assert.equal((await state()).score, score + 100);
      assert.equal((await state()).feedback.kind, 'success');
      assert.ok((await page.locator('.customer-quote').innerText()).includes((await state()).feedback.text));
      await page.locator('#next-package').click();
      await phase('identify');
      assert.equal((await state()).round, 1);
    });

    await check('reload offers or restores a mid-shift save without lost progress', async () => {
      const current = await item();
      await page.locator(`[data-answer="${current.correctIndex}"]`).click();
      await phase('reveal');
      const before = await state();
      await page.reload();
      await resumeIfOffered();
      await phase('reveal');
      const after = await state();
      for (const key of ['round', 'phase', 'score', 'mistakes']) assert.equal(after[key], before[key], key);
      assert.ok((await page.locator('#workbench').innerText()).includes(current.description));
    });

    await check('all 15 packages, all 12 species, human returns, and stage progression complete', async () => {
      const recipients = new Set(['dragonkin']);
      let humanReturns = 0;
      for (let round = 1; round < 15; round++) {
        assert.equal((await state()).round, round);
        const current = await item();
        if ((await state()).phase === 'identify') {
          await page.locator(`[data-answer="${current.correctIndex}"]`).click();
          await phase('reveal');
        }
        await page.locator('#continue-delivery').click();
        await phase('deliver');
        assert.ok((await canvasPixels()).every(canvas => canvas.opaque > 0), `Empty sprite in round ${round + 1}`);
        const expectedStage = await page.evaluate(index => window.ShopEngine.stageForRound(index).name, round);
        assert.ok((await page.locator('#stage-name').innerText()).includes(expectedStage));
        if (current.recipient === 'human') {
          humanReturns++;
          await page.keyboard.press('4');
        } else {
          recipients.add(current.recipient);
          await page.locator(`[data-recipient="${current.recipient}"]`).click();
        }
        await phase('delivered');
        await page.locator('#next-package').click();
        await phase(round === 14 ? 'ended' : 'identify');
      }
      assert.equal(recipients.size, 12);
      assert.equal(humanReturns, 3);
      assert.equal((await state()).mistakes, 2);
      assert.equal((await state()).score, 2240, '2250 maximum minus one effective 10-point deduction; first mistake clamps at zero');
      await page.locator('#results').waitFor({ state: 'visible' });
      assert.match(await page.locator('#results').innerText(), /2[,.]?240/);
      const rank = await page.evaluate(() => window.ShopEngine.getRank(window.ShopApp.getState()).title);
      assert.ok((await page.locator('#results').innerText()).includes(rank));
      await shot('07-ending-desktop');
    });

    await check('high score persists after completion; replay resets score and mistakes', async () => {
      await page.locator('#back-title').click();
      await page.locator('#start-shift').waitFor({ state: 'visible' });
      await page.reload();
      await page.locator('#start-shift').waitFor({ state: 'visible' });
      assert.match(await page.locator('body').innerText(), /2[,.]?240/);
      await page.locator('#start-shift').click();
      if (await page.locator('#tutorial').isVisible()) await page.locator('#tutorial-start').click();
      await phase('identify');
      assert.equal((await state()).round, 0);
      assert.equal((await state()).score, 0);
      assert.equal((await state()).mistakes, 0);
    });

    await check('tablet and mobile layouts remain usable; handbook and delivery work', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await noOverflow('tablet workbench');
      await shot('08-tablet');
      await page.setViewportSize({ width: 390, height: 844 });
      await noOverflow('mobile workbench');
      assert.equal(await page.locator('[data-answer]').count(), 3);
      await shot('09-mobile-identify');
      await page.locator('#handbook-open').click();
      await page.locator('#handbook').waitFor({ state: 'visible' });
      await noOverflow('mobile handbook');
      await shot('10-mobile-handbook');
      await page.locator('#handbook-close').click();
      const current = await item();
      await page.locator(`[data-answer="${current.correctIndex}"]`).click();
      await page.locator('#continue-delivery').click();
      await phase('deliver');
      await noOverflow('mobile delivery');
      await shot('11-mobile-delivery');
      await page.locator(`[data-recipient="${current.recipient}"]`).click();
      await phase('delivered');
      assert.equal((await state()).score, 150);
      await page.locator('#help-open').click();
      await page.locator('#tutorial').waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#tutorial').isVisible(), false);
      assert.equal((await state()).phase, 'delivered', 'Opening help must not reset a shift');
    });

    await check('every sprite renderer produces nonempty local pixel art', async () => {
      const result = await page.evaluate(() => window.ShopSprites.ids.map(id => {
        const canvas = document.createElement('canvas');
        window.ShopSprites.draw(canvas, id);
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        return { id, drawn: data.some((value, index) => index % 4 === 3 && value > 0) };
      }));
      assert.ok(result.length >= 29);
      assert.deepEqual(result.filter(sprite => !sprite.drawn), []);
    });

    await check('blocked browser storage shows a notice and still allows playing', async () => {
      const restricted = await browser.newContext({ offline: true, reducedMotion: 'reduce' });
      await restricted.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get() { throw new DOMException('Storage blocked by browser privacy settings', 'SecurityError'); }
        });
      });
      const restrictedPage = await restricted.newPage();
      restrictedPage.on('pageerror', error => errors.push(error.message));
      restrictedPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      restrictedPage.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
      try {
        await restrictedPage.goto(url);
        await restrictedPage.locator('#start-shift').click();
        await restrictedPage.locator('#tutorial-start').click();
        await restrictedPage.locator('#storage-notice').waitFor({ state: 'visible' });
        const current = await restrictedPage.evaluate(() => window.ShopEngine.currentItem(window.ShopApp.getState()));
        await restrictedPage.locator(`[data-answer="${current.correctIndex}"]`).click();
        assert.equal(await restrictedPage.evaluate(() => window.ShopApp.getState().phase), 'reveal');
        assert.equal(await restrictedPage.evaluate(() => window.ShopApp.getState().score), 50);
      } finally {
        await restricted.close();
      }
    });

    await check('no JavaScript errors, console errors, or external network requests', async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(network, []);
    });
    console.log(`\n${passed.length} browser acceptance checks passed.`);
    console.log(`Evidence: ${output}`);
  } catch (error) {
    await shot('FAILURE').catch(() => {});
    console.error(error);
    console.error(`Completed ${passed.length} checks before failure. Evidence: ${output}`);
    if (errors.length) console.error('Browser errors:', errors);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
