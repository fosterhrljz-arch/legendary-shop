# Legendary Shop: Halloween Mix-Up
## Management Edition — Project Overview

**Version 2.0.0 · Updated November 7, 2026**

A cozy, humorous pixel-art shop simulation in which monsters shop on their own while you manage stock, staff, prices, and a growing store.

Halloween is almost here. The delivery truck has broken down, human parcels have become mixed with monster goods, and owner Mr. Marmalade has left the newest intern in charge. Your job is to keep the business running while untangling the delivery disaster.

![An operating pixel-art shop with monster customers, stocked shelves, a checkout, and a 16-coin sale notification.](https://agent-git.com/api/agents/fosterhrljz/legendary-shop/file-content/artifacts/legendary-shop-v2-qa/02-operating-shop.png?ref=62c9d6fec580121db26da746a7a6ceedc829632a)

*The shop in operation after a completed sale. Customers, shelves, checkout activity, cash, and customer satisfaction share the same simulation state.*

## At a glance

| Feature | Current implementation |
| --- | --- |
| Genre | Relaxed shop-management simulation with package identification and customer service |
| Campaign | Preparation plus six operating shifts within one Halloween |
| Customers | 12 monster species with distinct preferences and restrictions |
| Catalog | 24 saleable products and four human misdeliveries |
| Presentation | Original pixel art, a dimetric shop floor, English interface and writing |
| Technology | HTML, CSS, vanilla JavaScript, and Canvas |
| Runtime | Local browser; no backend, paid API, account, or external CDN |
| Persistence | Browser saves, JSON export/import, and sound preferences |

The current version replaces the original fixed fifteen-question format. Identification and delivery now feed inventory and transactions within a working business.

## Run the game locally

**Requirement:** Node.js 20 or newer.

1. Open a terminal in the `legendary-shop` folder.
2. Start the local server:

   ```sh
   npm start
   ```

3. Open <http://127.0.0.1:4173> in your browser.
4. Select **Open the shop** and watch the first customer.

**Success sign:** a monster enters, walks to a stocked shelf, queues, pays, and leaves. Cash increases and inventory decreases without a click for each sale.

Playing requires no `npm install` or build step. Assets are bundled with the project. The server listens only on your computer; press **Ctrl+C** in its terminal to stop it. Use the same localhost address for consistent browser saves. Opening the HTML file directly is not the verified launch method.

## How a shift works

### Autonomous shopping

A customer enters, finds suitable reachable stock, browses, reserves a unit, and queues at checkout. A cashier completes payment, the ledger records the sale, and the customer leaves with a review.

Layout, availability, customer budgets, and service capacity affect the outcome. Reservations prevent two customers from buying the same final unit; transaction guards prevent duplicate charges. Customers can leave dissatisfied when their needs are not met.

### Identify incoming goods

Open **Stock**, inspect an unknown parcel, and choose from three possible names. Clues and the handbook keep discoveries approachable. Correct identification reveals the product and adds its batch to storage exactly once. Discovered products can later be sorted by assigned parcel staff.

![The parcel-inspection panel showing a clue, three candidate names, and a humorous reaction to an incorrect answer.](https://agent-git.com/api/agents/fosterhrljz/legendary-shop/file-content/artifacts/legendary-shop-v2-qa/04-identification.png?ref=62c9d6fec580121db26da746a7a6ceedc829632a)

*An identification mistake produces a short comic reaction and removes the rejected choice. This introductory parcel has no economic penalty.*

**Dragon Droppings** are fertilizer or fuel for compatible customers, never food. Human Tax Forms, Human-Made Burnt Steak, a Broken Office Stapler, and a Microwave Instruction Manual belong in returns, not saleable inventory.

### Fulfill special orders

The **Orders** panel lists requests from actual customers at the service counter. Select compatible available goods and dispatch a worker, who physically collects and carries the parcel before completing a paid transaction.

Requests can specify an exact product or a category. Compatibility uses tags, species restrictions, and stock availability. Wrong goods remain in inventory so the choice can be corrected; mistakes can affect the customer's satisfaction. For example, a minotaur must not receive beef products.

### Review and prepare

At closing, new arrivals stop and existing customers resolve before the shift settles. Review sales, unmet demand, wages, and customer satisfaction, then adjust supplies, staffing, and layout for the next shift.

## Management decisions with real effects

| Decision | Effect on the shop |
| --- | --- |
| Buy wholesale stock | Spend cash immediately and receive batches that enter the receiving workflow |
| Set prices | Choose Bargain, Standard, or Premium; higher prices increase margins but exceed some budgets |
| Hire and train staff | Add labor, pay shift wages, and improve work speed |
| Assign priorities | Decide whether employees focus on checkout, stock, or parcels |
| Place and move furniture | Change walking routes, assortment, and service capacity |
| Upgrade facilities | Increase display capacity or shorten checkout work |
| Add specialist displays | Make cold, fireproof, or moisture-safe products suitable for display |
| Add decorations | Influence nearby customer patience or specific attraction bonuses |
| Expand | Unlock 36 additional usable floor tiles during the later campaign |

Coins represent business cash. Revenue is earned at payment; operating profit subtracts the cost of sold goods and wages. Capital purchases affect cash flow separately. More employees cannot compensate for empty shelves or an unsuitable assortment.

![The staff panel showing the intern and a hired goblin temp with different role priorities, wages, and training controls.](https://agent-git.com/api/agents/fosterhrljz/legendary-shop/file-content/artifacts/legendary-shop-v2-qa/09b-hired-staff.png?ref=62c9d6fec580121db26da746a7a6ceedc829632a)

*Staff management during preparation: a trained intern prioritizes checkout while a hired temp handles stock. Workers travel to their jobs, and each job is claimed by only one worker.*

Movable shelves retain their stock when relocated. Removing a stocked display returns its goods to storage. Busy or reserved fixtures cannot be moved until their work finishes. Invalid overlaps and blocked routes are rejected, and canceling a placement preview spends nothing. Receiving, inspection, stockroom, service, and returns are fixed building facilities.

## Monsters and campaign progression

The twelve species are **Minotaur, Ghost, Centaur, Goblin, Dragonkin, Skeleton, Slime, Vampire, Werewolf, Witch, Mummy, and Imp**. Shared products can suit several species; preferences are not a rigid one-product-to-one-monster mapping.

The catalog mixes practical goods with absurd retail writing: Maze Pretzels, Goblin Pocket Magnets, Skeleton Bone Varnish, Slime Moisture Cubes, and Polite Mandrake Seeds, which still scream but first ask whether now is a good time.

| Shift | New focus |
| --- | --- |
| 1 | Minotaur and Goblin trade; receiving and the guided witch fertilizer order |
| 2 | Centaur and Skeleton communities; stock planning |
| 3 | Witch and Dragonkin communities; temporary staff |
| 4 | Ghost and Slime communities; specialist displays |
| 5 | Vampire and Werewolf communities; expansion |
| 6 | Mummy and Imp communities; the final rush and campaign report |

Product unlocks and community arrivals are separate, allowing preparation before new customers appear. The sixth settlement ends the campaign. A limited recovery action helps a shop that has exhausted both cash and saleable resources.

![The expanded shop during shift five, with additional usable floor space and a customer requesting Herbal Leg Balm.](https://agent-git.com/api/agents/fosterhrljz/legendary-shop/file-content/artifacts/legendary-shop-v2-qa/13b-expanded-operating-shop.png?ref=62c9d6fec580121db26da746a7a6ceedc829632a)

*Expansion changes the actual grid from 10 × 9 to 14 × 9. It costs 160 coins, unlocks in shift five, and installs between shifts.*

## Saves and accessible controls

- **Save** stores inventory, employees, customers, reservations, jobs, fixtures, cash, the ledger, and shift progress.
- Management saves use `legendary-shop.sim.v2`. Legacy quiz saves remain untouched.
- Settings offers JSON export/import and sound controls. Importing a valid save replaces the current management state.
- Relaxed-mode panels and background tabs pause the simulation. Pause, normal speed, and double speed are also available.
- Labeled page controls and visible keyboard focus support Tab/Enter navigation. Escape closes an overlay or cancels placement.
- Small screens provide zoom, pan, and collapsible panels. Reduced-motion preferences suppress optional animation.

Browser storage belongs to a particular browser and site address. Export JSON when moving between environments or when storage is unavailable.

**Download fallback:** the earlier test environment canceled native downloads. The verified alternative is to select the full export text, copy it into a text editor, save it as `legendary-shop.json`, and import that file. Native-download success is not claimed for that environment.

## Code organization

The simulation owns business state. Rendering and interface code display it and request actions; they do not independently award money or remove inventory.

```text
legendary-shop/
  index.html                  Browser entry point
  styles.css                  Responsive interface and pixel styling
  js/content.js               Monster profiles and original writing
  js/catalog.js               Products, prices, tags, clues, compatibility
  js/simulation.js            World state, customers, jobs, economy, saves
  js/renderer.js              Shop, furniture, characters, hit testing
  js/sprites.js               Original sprites and item icon families
  js/app.js                   Interface, time control, storage, sound
  js/engine.js                Retained legacy quiz engine; not loaded
  assets/                     Bundled art, fonts, and license files
  server.cjs                  Dependency-free localhost server
  tests/gate1.cjs              Autonomous shopping proof
  tests/simulation.test.cjs    Management logic tests
  tests/browser-v2.cjs         Browser acceptance tests
  docs/                       Design, implementation, and asset notes
```

To add a product, extend `js/catalog.js` with a unique ID, name, description, category, tags, compatible and forbidden species, storage type, cost, retail price, unlock shift, sprite key, clue, three candidates, correct-answer index, and human-return flag. The correct candidate must match the product's name. Update the catalog tests when changing content counts.

Keep economic and inventory rules in `simulation.js`, and use the renderer only for presentation.

## Verification and test commands

The following results were recorded during development and are documented in the project's README and implementation report. **Game tests were not rerun for this documentation revision.**

| Check | Recorded result |
| --- | --- |
| Management logic | 22 tests passed |
| Browser acceptance | 15 groups passed, including desktop, tablet, and mobile layouts |
| Autonomous purchase | Stock 8 → 7; cash 220 → 236; exactly one completed transaction |
| Controlled 45-second queue | One cashier/till: 7 sales; two cashiers/tills: 14 sales |
| Deterministic six-shift scenario | A hire, upgrade, and expansion; final cash 1,076 and 125 sales |
| Save behavior | Reservations, stock, and cash survive reload; legacy saves remain unchanged |

The controlled scenarios establish working mechanics and a viable management path. They do not establish universal balance or a measured human playthrough duration.

Run the logic checks from the project folder:

```sh
npm run test:gate1
npm test
```

**Success sign:** the first command reports `passed: true` with entry, reservation, queue, payment, and exit; the second reports zero failures.

Browser acceptance uses optional development tooling and installed Chrome:

```sh
npm install --no-save --package-lock=false playwright
npm run test:browser
```

The install command downloads third-party test software; it is not needed to play. Tests use an isolated browser context. These instructions are provided for future checks; this revision did not install dependencies or run the game suites.

## Current limits and useful next steps

This is a compact single-store campaign. Crowd avoidance is simple, customers may share interaction areas, and related products reuse some icon families. There is no endless mode, spoilage, theft, crafting, town travel, multiplayer, cloud save, or real-money payment.

Firefox, Safari, and human screen-reader testing remain unverified. The 30–45-minute campaign duration is a playtesting target, not a measured result.

The most useful next steps are human economy and pacing tests, more directional character animation, improved crowd movement, broader browser and assistive-technology checks, and an optional endless mode.

## About this document

This overview describes the current Management Edition. Screenshots are existing, unmodified captures from the project's `legendary-shop-v2-qa` verification set, not concept mockups. Their cash, stock, and staffing values illustrate particular test moments.

The overview is maintained as `artifacts/LEGENDARY_SHOP_PROJECT_OVERVIEW.md` on the existing AgentGit branch `fosterhrljz/legendary-shop@shop-management-session`. Its four accompanying images are documentation assets. Publishing them does not deploy the game or upload its source archive.

Project facts were checked against `README.md`, `docs/IMPLEMENTATION.md`, `package.json`, and the current source. Document updates use the official `agit file` workflow without importing another session or enabling automatic uploads. See the [AgentGit command reference](https://agent-git.com/docs/command-reference/).
