# Management Edition architecture

The new game uses a single authoritative shop state. The old fifteen-question engine is retained for history, not loaded as progression. The initial gate proved one autonomous reachable-stock transaction before receiving, special service, management, and expanded content were connected.

## Responsibilities

| Module | Responsibility |
| --- | --- |
| `catalog.js` | Commercial SKUs, tags/restrictions, prices, storage, identification clues |
| `content.js` | Twelve original monster personalities and writing |
| `simulation.js` | Grid/pathfinding, customers, staff, inventory, ledger, progression, saves |
| `renderer.js` | Pure dimetric tiles/objects/characters, visual effects, hit testing |
| `sprites.js` | Original reusable pixel characters and item families |
| `app.js` | Commands, panels, fixed-step driving, pause composition, persistence |

`ShopSim` is available as a browser global and CommonJS export. Its commands mutate the single state and return `{ok, message, ...}`. Rendering reads state only; no payment depends on an animation frame.

## World and entities

State version 2 contains a deterministic seed, stable IDs, the floor and entrance, cash/reputation, shift phase and time, price tier, fixtures, customers, workers, warehouse stock, parcels, supply orders, discoveries, ledger, reports, and settlement/recovery guards. Routes, reservations, and worker jobs are preserved for consistent resumption.

The grid starts at 10×9 and expands to 14×9. Fixtures occupy rectangular footprints and expose an interaction edge. Breadth-first pathfinding respects occupied tiles. Rotation changes the footprint/service side. Placement validates bounds, overlaps, entrance, and required interaction routes before cash changes. Preview/cancel is economically inert.

Ordinary customer flow:

```text
enter → walk to reachable stock → browse → walk to checkout → queue → pay → leave
```

Special-order flow:

```text
enter → service counter → request → assigned stock → worker pickup/carry → pay → leave
```

Ordinary purchases consider species compatibility, availability, budget, and reachability. Special requests add exact SKU or category tags. No stock, unaffordable goods, inaccessible service, and excessive waiting have visible reasons. Closing stops arrivals and waits for existing customers to complete or abandon before settling.

Customer satisfaction is distinct from reputation. Each visitor starts at 100 and may post one guarded review. Wrong delivery subtracts eight from that customer's eventual rating. A paid visit subtracts one more point per 15 seconds of recorded shopping/waiting time, including travel and browsing; unmet demand caps the review at 40, or 20 on timeout. The HUD averages reviews across the campaign; reports average the current shift's reviews, falling back to the campaign average when that shift has no reviews. Before any reviews the displayed value is 100. Early v2 saves without review fields receive defaults without changing cash or reservations.

## Inventory and transactions

A reservation holds one available unit and its quoted price. Payment consumes the unit once, posts a sale once, records COGS, and releases the reservation. Abandonment releases outstanding claims. Human misdeliveries remain outside saleable inventory.

Wholesale purchases reduce cash immediately and create delivery parcels. New SKUs use a three-choice inspection with clues; discovered batches can be sorted by parcel staff. Wrong tutorial guesses have no economic penalty; later parcel mistakes have a small bounded reputation consequence. Sorting enters the whole batch once. Human ownership is established by shipment manifests, not by an assumption about what monsters can use.

Storage separates normal, cold, fireproof, and moisture goods. Displays accept their own type. Shelf moves preserve quantity; safe removal returns stock to storage. Active claims prevent unsafe edits. Dragon Droppings are garden/furnace materials shared by witches and dragonkin; they never satisfy food tags. Beef is forbidden for minotaurs.

## Work and economy

Workers have ordered roles, current exclusive jobs, positions/routes, remaining work, level, and wage. Cashiers travel to payments; stock workers collect and carry replenishment; parcel workers sort known goods and routine service. The intern delivers player-assigned orders. Claim checks prevent duplicate customer, parcel, and restock jobs. Training and checkout upgrades change actual work time; layout changes travel.

The ledger distinguishes wholesale, sales, wages, hiring, training, furniture, upgrades, salvage, expansion, and recovery. Sales record unit cost. Operating profit is revenue minus COGS and wages; capital purchases remain separate cash movements. Wages are posted once using a settled-shift guard.

Bargain/Standard/Premium multipliers are 0.8/1/1.4. Budgets make Premium lose some sales. Shelf capacity, checkout labor, assortment, and specialist display investment compete for resources. The spirit pumpkin lantern offers a radius-two patience effect; a nearby cold display creates a capped non-stacking Ghost Corner attraction bonus.

## Growth and time

Six shifts occur within one Halloween. Hiring unlocks at shift 3, specialist displays at shift 4, expansion at shift 5. The extension adds 36 usable tiles. The full catalog has 24 monster products and four human errors. Conditional recovery prevents an exhausted cash/stock state from ending the campaign permanently.

Pause composition covers manual pause, required overlays, and background visibility. It freezes simulation clocks, movement, patience, arrivals, and jobs. No background catch-up is accumulated. Rendering can interpolate visual positions without changing simulation correctness. DOM alternatives cover important canvas actions; smaller screens use zoom/pan and collapsible panels.

Management saves use `legendary-shop.sim.v2`, leaving legacy quiz keys untouched. JSON export/import is available when localStorage cannot be used. Validation rejects inappropriate human stock, invalid claims/quantities, duplicate identities, and unsupported save versions. Transient routes and remaining jobs are preserved so loading does not duplicate a sale.

## Verification and deliberate limits

Gate 1 traced a no-click purchase from entry to exit, shelf 8→7, cash 220→236. Separate deterministic simulation tests exercise inventory and management integrity; browser checks exercise actual controls and rendered state. Screenshot review is separate from logic validation.

Crowd handling permits shared interaction positions. There is no spoilage or crafting. Human playtesting is still needed for long-term balance, assistive-technology comfort, and the 30–45 minute campaign target. Endless continuation is not implemented.
