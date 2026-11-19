# Version 2 implementation report

The game is now a timed shop-management simulation. The interactive dimetric floor, inhabitants, stock reservations, staff jobs and transaction ledger share one authoritative state. The older quiz code remains unused historical source; index.html loads simulation.js and renderer.js.

## Gates completed

1. **Living shop proof:** `npm run test:gate1` traces an autonomous customer entering at 0s, reserving reachable pretzels at 0.8s, reaching checkout at 7.8s, paying at 13s, and leaving at 14s. Shelf stock changes 8→7; coins 220→236; one sale is posted.
2. **Signature activities:** receiving parcels, exact three-choice introduction, bounded errors, discovery stock, human returns, real service-counter customers, compatible requests, staff pickup and delivery.
3. **Management:** wholesale costs, three price tiers, jobs and wages, staff priorities and training, furniture placement/movement/removal, reachable service edges, capacity/checkout upgrades, specialist displays, lantern effects and a usable 36-tile expansion.
4. **Campaign:** preparation plus six shifts within Halloween; 24 saleable SKUs, 4 human mix-ups, 12 species, reports, satisfaction, settings, safe saves and optional sounds. Endless mode was deliberately omitted.
5. **Verification:**22 simulation tests and 15 browser acceptance groups passed. Browser tests use offline Chrome with Playwright because a Browser plugin was unavailable. Desktop 1440×960, tablet 768×1024 and mobile 390×844 were checked.

## Measured scenarios

- Controlled 45-second queue: one cashier/till completes 7 sales; two cashiers/tills complete 14.
- A deterministic six-shift ordinary stock-purchase plan achieves a hire, upgrade and expansion; it ends with 1,076 coins and 125 sales. This verifies a recovery-friendly path, not universal balance or a human campaign-duration claim.
- Browser checks observe an initial sale in real wall time, then use deterministic time stepping for later campaign assertions.
- Legacy quiz saves remain untouched. Outstanding reservations, stock and cash survive reload. Pausing panels freezes simulation time.
- Actual scene, inspection, placement, staff, report and responsive screenshots were captured and inspected outside the source directory in `legendary-shop-v2-qa`.
- The localhost preview returned HTTP 200 and served the management entry point.

## Limits and scope

The current browser environment cancels native file downloads, including independent diagnostic downloads. Export also displays complete, selectable JSON; that exact data was successfully reimported. Native download success is not claimed.

The project uses original procedural furniture and the existing original character art. Related product families share sprites. Crowd handling is deliberately simple; characters can share an interaction tile with visual offsets. Firefox/Safari and human screen-reader testing remain unverified. The 30–45 minute first-campaign duration is a playtesting target.

No backend, runtime AI, CDN, remote assets, accounts or paid APIs are required. No publication was performed. The original release is separately preserved as `legendary-shop-v1-quiz-backup.zip` in the workspace.
