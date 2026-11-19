# Legendary Shop: Halloween Mix-Up — Management Edition

An original pixel-art shop-management simulation. Customers walk through a real shop, choose reachable stock, reserve goods, queue, pay, and leave. The intern and temporary staff travel to their jobs. Stock, prices, layout, staffing, and improvements affect the same business.

The setting is one Halloween with preparation and six operating shifts. Mr. Marmalade has delegated the shop to you while he argues with the broken delivery truck. Identification and funny monster service now belong to the simulation; there is no fixed fifteen-question campaign.

## Launch locally

1. Open a terminal in the `legendary-shop` folder.
2. With Node.js 20 or newer installed, run `npm start`.
3. Open <http://127.0.0.1:4173>.
4. Select **Open the shop**.

**Success sign:** a monster enters at the front mat, walks to a shelf, browses, queues at checkout, pays the intern, and leaves. Coins rise and stock decreases without clicking every sale.

No `npm install`, build command, backend, account, API key, or CDN is needed to play. All runtime assets are bundled. The server listens on this computer only; Ctrl+C stops a server started in your terminal. Use localhost for a consistent browser origin and saves. Direct-file support is not assumed as the deployment contract.

## Your first shift

1. **Watch the shop work.** The starting shelves have pretzels and pocket magnets. The intern can cashier, restock, and handle parcels. Let an ordinary transaction finish before opening a panel.
   - Success: coins increase, a shelf loses one unit, and the customer exits.
2. **Inspect the mixed delivery.** Open **Stock** and inspect the introductory unknown parcel. Read its clue and choose one of three names.
   - Spiral shape, sulfurous warmth, and no meat fibers identify **Dragon Droppings**: fertilizer/fuel, never food. Tutorial mistakes have no economic penalty.
   - Success: a discovery card shows useful product facts and six units enter storage exactly once.
3. **Return human property.** Identify the tax forms using their human-depot manifest, then return the parcel.
   - Success: it is marked returned and never becomes saleable stock.
4. **Help Hazel at the service counter.** After discovery, a guided witch customer requests fertilizer. Open **Orders**, choose compatible available stock, and dispatch it.
   - Success: the intern physically collects and carries the parcel to that real customer, then completes a paid transaction. Wrong goods remain in inventory and can be corrected.
5. **Plan supplies.** Buy batches through **Stock**. New goods require inspection; assigned parcel staff can sort discovered SKUs automatically.
6. **Review results.** Close early or let the shift clock finish. New arrivals stop; existing customers resolve before settlement. Use product sales and unmet-demand reasons to plan the next shift.

Panels pause the shop in relaxed mode. Closing one resumes only if no other pause condition remains. The top bar also offers pause, normal, and double speed.

## Management controls

| Command | What changes |
| --- | --- |
| Build | Buy, preview, rotate, move, remove, or upgrade movable furniture; invalid routes/overlaps are rejected before charging |
| Stock | Purchase batches, inspect goods, return human parcels, select display stock, and set retail pricing |
| Staff | Hire temps, assign role priorities, and train workers; travel, work time, and wages affect service |
| Orders | View real customers' exact-product/category requests and dispatch compatible stock |
| Handbook | Read monster profiles, product clues/uses, and shop guidance without penalty |
| Shop objects | Use DOM controls to select facilities instead of clicking the canvas |

Moved shelves retain stock. Removing a stocked display returns its contents to storage. Fixtures with reservations or active jobs cannot be moved/removed until work finishes. Canceling placement spends nothing. The original receiving, inspection, stockroom, service, and returns fixtures are fixed building facilities.

## Economy and tradeoffs

Coins are cash, not quiz score. Wholesale purchases reduce cash immediately. Revenue appears only at a completed payment, with cost of goods sold recorded for that sale. Shift operating profit is revenue minus COGS and wages; capital purchases affect cash flow separately. The ledger preserves transactions.

**Customer satisfaction** appears in the HUD as the campaign's average review, starting at 100% before any reviews. Each customer submits one review. Wrong delivery lowers that customer's satisfaction by eight points; a completed sale also loses one point per 15 seconds of browsing, travel, and waiting after entry. An unmet request scores at most 40, or 20 after a timeout. The shift report shows that shift's review average, or the campaign average if nobody reviewed that shift. Reputation is a separate shop metric.

Pricing is **Bargain (0.8×)**, **Standard (1×)**, or **Premium (1.4×)** base price, rounded. Premium increases margins but exceeds some customer budgets. Existing reservations retain their original quote. Every reserved unit and completed payment is guarded against duplication.

- A shelf costs 45 coins and adds assortment/capacity; another checkout costs 65 and needs cashier labor.
- Hiring costs 45, with a 10-coin wage per settled shift. Training costs 25 × current level and improves work speed by 35% of base per level, up to level 4.
- Upgrades cost 35 × current fixture level. Display upgrades add eight slots; checkout upgrades shorten payment work.
- Specialist displays consume coins and floor space but admit cold, fireproof, or moisture-safe goods.
- A spirit pumpkin lantern slows nearby patience loss by 20% within two Manhattan tiles. A chilled display within two tiles creates a capped, non-stacking **Ghost Corner** attraction bonus.

Staff follow configured job priorities. Cashiering may delay restocking; more labor cannot fix empty shelves or an unsuitable assortment. Ordinary service becomes autonomous early, while first discoveries and the guided special order remain player activities.

## Six shifts within Halloween

| Shift | Communities and milestones |
| --- | --- |
| 1 | Minotaur/Goblin trade, receiving, guided witch fertilizer request |
| 2 | Centaur/Skeleton communities and stock planning |
| 3 | Witch/Dragonkin communities and temporary staff hiring |
| 4 | Ghost/Slime communities and specialist displays |
| 5 | Vampire/Werewolf communities and expansion |
| 6 | Mummy/Imp communities and final rush |

The catalog contains **24 monster SKUs and four human mix-ups**. Product unlocks are independent of community arrivals, allowing preparation. Shared goods use tags and compatibility rather than one species owner.

The 160-coin expansion unlocks in shift 5 and installs between shifts. It changes the actual grid from 10×9 to 14×9, adding **36 usable tiles**. The sixth report ends the campaign; Endless mode is not included. The requested 30–45 minute campaign duration remains a playtesting target, not a measured claim.

If cash and saleable resources are exhausted, the conditional recovery action provides a modest rescue, at most once per shift. A poor shift never requires deleting your save.

## Saving and accessibility

- **Save** records management state. Settings provides export/import and sound controls.
- New saves use `legendary-shop.sim.v2`. Legacy keys such as `legendary-shop.shift.v1` remain untouched; quiz points never become coins.
- Saves include inventory, placed objects, employees, customers, outstanding reservations/jobs, money, ledger, and shift progress. Invalid saves are rejected.
- Browser storage belongs to one browser/origin. Export to JSON if storage is unavailable; importing a validated file replaces the current management save.
- Important actions have labeled DOM controls and visible keyboard focus. Use Tab/Enter; Escape closes the active overlay or cancels placement. Smaller screens use zoom/pan and collapsible panels.
- Required overlays and background tabs pause simulation clocks, patience, arrivals, and work. There is no large background catch-up step.
- Reduced-motion preferences suppress optional animation. Sound is optional and never the sole feedback.

## Source structure

```text
index.html / styles.css    Canvas world and responsive semantic interface
js/content.js             Reused species profiles and original writing
js/catalog.js             Commercial SKUs, costs, tags, restrictions, clues
js/simulation.js          Authoritative world, customers, inventory, staff,
                         transactions, facilities, progression, saves
js/renderer.js            Dimetric world, furniture, characters, hit testing
js/sprites.js             Original character sprites and item icon families
js/app.js                 UI, controlled-time driving, pause, storage, sound
js/engine.js              Legacy quiz engine; not loaded by the new game
assets/                   Local art, pixel font, icon, font license
tests/gate1.cjs           Autonomous shopping proof
tests/simulation.test.cjs Simulation integrity/management checks
tests/browser-v2.cjs      Rendered management acceptance checks
tests/browser.cjs         Archived v1 browser checks, not used by the new game
tests/engine.test.cjs     Retained legacy quiz regression checks
docs/                    Design, art, and asset-credit notes
server.cjs               Dependency-free local server
```

## Tests

Run the living-shop proof first:

```sh
npm run test:gate1
```

**Success sign:** `passed: true` and a trace of entering, reservation, queue, payment, and exit. The controlled proof changes stock **8 → 7** and cash **220 → 236**, with exactly one sale.

Run logic checks:

```sh
npm test
```

**Success sign:** zero failures. The default test command runs management simulation checks covering reservations, unique transactions, identification, human returns, compatibility, closing, saves, staffing, layout, and controlled economic scenarios. Run `npm run test:legacy` separately for the retained v1 quiz regressions; those are not substitutes for simulation checks.

Browser acceptance needs optional developer-only Playwright and installed Chrome:

```sh
npm install --no-save --package-lock=false playwright
npm run test:browser
```

Installing the test tool downloads third-party development software; it is not a game dependency. The tests use an isolated browser context, not your personal profile. Screenshots go to a temporary QA directory or `SHOP_QA_DIR`. Set `SHOP_BROWSER_CHANNEL=msedge` for installed Edge. The command prints its actual pass/fail results.

## Add products and tune behavior

Add a unique record to `js/catalog.js`: name, description, category, `tags`, compatible `species`, `forbiddenSpecies`, `storage`, cost, retail price, unlock shift, sprite key, clue, exactly three candidates, correct index, and `human` flag. The correct candidate must exactly equal the name. Human status comes from a misaddressed manifest. Minotaurs reject beef tags; droppings must never have a food tag.

Orders accept an exact SKU or all requested tags plus species restrictions. Reuse related icon families or draw a new original sprite. Update catalog-count tests. Balance constants/facilities are in `simulation.js`; the renderer must never award money, remove goods, or change a reservation.

## Deliberate limits

This is a compact single-store campaign with simple crowd avoidance: customers may share interaction areas. Related SKUs reuse some item icons. There is no spoilage, theft, crafting, town travel, multiplayer, cloud save, or real payment. More directional character sheets, longer economy playtests, and assistive-technology playtests are useful future work.

The original project is preserved outside this folder as `legendary-shop-v1-quiz-backup.zip`. This build does not publish the game or upload the conversation.

## Export fallback in restricted browsers

Settings → Export save requests a JSON download and also shows the complete save text. If the browser cancels downloads:

1. Select **Select all save text**, then press Ctrl+C (or Copy).
2. Paste into a plain-text editor and save as `legendary-shop.json` (not `.json.txt`).
3. In the game, open Settings → Import v2 save and choose that file.

Success sign: the shop restores with the same cash, stock, fixtures, workers, and shift, then pauses for you. The delivery environment canceled native Chrome downloads, so the copyable JSON → import path is the verified fallback. Native downloading is not claimed as passed here.
