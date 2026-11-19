# Management Edition art direction

The rebuild uses a readable dimetric shop: warm plank tiles, cream walls, muted purple trim, orange pumpkins, small inhabitants, and a visibly locked extension. The main game surface is a real Canvas world, not the previous panorama with answer cards.

The full-screen generated concept established layout and palette. Text and controls remain native DOM: slim HUD, speed controls, bottom commands, contextual management panels, temporary dialogs. A flattened image never substitutes for interactive furniture or stock.

## Layers

- `assets/garden.png` is original generated exterior scenery, subdued behind the procedural building. It determines no paths or placements.
- `js/renderer.js` draws separate floor tiles, walls, entrance, extension fencing, facilities, placement previews, stock indicators, character shadows, and thought bubbles. Fixture positions come from simulation state.
- `js/sprites.js` supplies the twelve original monster silhouettes and item families. The renderer adds movement interpolation, alternating walking feet, carrying poses, and reactions at actual world positions.
- Related products share selected item icons; text clues, names, costs, tags, and uses distinguish SKUs. This is a disclosed art limitation.
- `assets/shop-interior.png` remains bundled as prior original artwork, not the operating shop floor.

The renderer uses a 2:1 dimetric grid, consistent outlines, golden wood `#e5b16e`, cream `#f2d5ae`, muted plum `#8e6687`, orange `#ed9a59`, sage, and exterior teal `#234b45`. Locally bundled Press Start 2P serves short labels; system sans-serif makes explanations readable.

Characters retain readable front-facing silhouettes in the dimetric room; these are not full eight-direction sprite sheets. Optional animation respects reduced motion. All art is local at runtime. No Kairosoft characters, commercial sprites, logos, or exact UI screens were copied. See `ASSET-CREDITS.md` for source details.
