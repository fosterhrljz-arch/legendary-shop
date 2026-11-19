(function (root) {
  'use strict';

  // Commercial stock is distinct from the legacy quiz's recipient-only items.
  // Tags describe use; species limits describe safe compatibility, not ownership.
  const products = [
    {
      id: 'maze-pretzel', name: 'Maze Pretzels', description: 'Finally, a maze you can solve with your mouth. Certified beef-free.',
      category: 'Food', tags: ['food', 'snack', 'maze', 'vegetarian'], species: ['minotaur', 'goblin', 'centaur', 'werewolf'], forbiddenSpecies: [],
      storage: 'normal', cost: 6, price: 16, unlock: 1, sprite: 'maze-pretzel',
      clue: 'A golden, salted pretzel winds into an edible labyrinth. The label confirms it contains no meat.',
      candidates: ['Maze Pretzels', 'Witch Broom Knots', 'Human Extension Cable'], correctIndex: 0, human: false
    },
    {
      id: 'pocket-magnet', name: 'Goblin Pocket Magnet', description: 'A legal substitute for mysteriously missing cutlery. Legality varies by pocket.',
      category: 'Equipment', tags: ['equipment', 'tool', 'metal', 'collecting'], species: ['goblin', 'imp', 'skeleton'], forbiddenSpecies: [],
      storage: 'normal', cost: 6, price: 16, unlock: 1, sprite: 'pocket-magnet',
      clue: 'A horseshoe-shaped magnet pulls three loose coins through its wrapping. It has no shoe holes.',
      candidates: ['Centaur Spare Horseshoe', 'Goblin Pocket Magnet', 'Vampire Travel Pillow'], correctIndex: 1, human: false
    },
    {
      id: 'hoof-polish', name: 'Four-Hoof Polish', description: 'Four applications per appointment. Budget accordingly. The fifth application is ambition.',
      category: 'Grooming', tags: ['grooming', 'hoof', 'polish'], species: ['centaur'], forbiddenSpecies: ['ghost'],
      storage: 'normal', cost: 6, price: 16, unlock: 2, sprite: 'hoof-polish',
      clue: 'A leafy green bottle bears four horseshoes and a mirror-shine instruction. For external hoof use.',
      candidates: ['Goblin Salad Dressing', 'Emergency Pond Water', 'Four-Hoof Polish'], correctIndex: 2, human: false
    },
    {
      id: 'bone-varnish', name: 'Skeleton Bone Varnish', description: 'Shine without gluing the elbows together. Jazz hands sold separately.',
      category: 'Personal care', tags: ['personal-care', 'bone', 'polish'], species: ['skeleton'], forbiddenSpecies: ['ghost'],
      storage: 'normal', cost: 6, price: 16, unlock: 2, sprite: 'bone-varnish',
      clue: 'An ivory bottle with a bone label and a polishing brush. The instructions mention articulated elbows.',
      candidates: ['Skeleton Bone Varnish', 'Expired Milk', 'Ghost Furniture Wax'], correctIndex: 0, human: false
    },
    {
      id: 'dragon-droppings', name: 'Dragon Droppings',
      description: 'A charcoal-black lump of fire-dragon poop. Judging by the shape, somebody has been constipated. Premium fertilizer. Absolutely not a snack.',
      category: 'Magical materials', tags: ['fertilizer', 'fuel', 'garden', 'volcanic', 'not-food'], species: ['witch', 'dragonkin'], forbiddenSpecies: [],
      storage: 'normal', cost: 4, price: 13, unlock: 1, sprite: 'dragon-droppings',
      clue: 'The black slab has a spiral shape, sulfurous warmth, and no meat fibers. Its sealed bag is marked garden / furnace use. Never food.',
      candidates: ['Human-Made Burnt Steak', 'Abyssal Roast', 'Dragon Droppings'], correctIndex: 2, human: false,
      wrongReaction: 'That is dragon poop, not a steak. One goes in the herb garden. The other goes on a plate. Please protect our restaurant license.'
    },
    {
      id: 'ghost-macarons', name: 'Ghost Pepper Macarons', description: 'Not spicy. Just haunted. An incorporeal dessert absorbed as cold, sweet mist.',
      category: 'Food', tags: ['food', 'dessert', 'spirit', 'cold'], species: ['ghost'], forbiddenSpecies: [],
      storage: 'cold', cost: 7, price: 19, unlock: 4, sprite: 'ghost-macarons',
      clue: 'Pale blue pastries hover above a frosty tray. Their label says they dissolve into edible spirit mist.',
      candidates: ['Frozen Hockey Pucks', 'Ghost Pepper Macarons', 'Dragon Fire Biscuits'], correctIndex: 1, human: false
    },
    {
      id: 'moon-umbrella', name: 'Midnight Sunshade', description: 'Blocks sunlight, drizzle, and invitations to daytime weddings. Brunch remains your problem.',
      category: 'Accessories', tags: ['accessory', 'sunproof', 'equipment'], species: ['vampire'], forbiddenSpecies: [],
      storage: 'normal', cost: 9, price: 24, unlock: 3, sprite: 'moon-umbrella',
      clue: 'A dark parasol has bat-wing edges and an SPF 5000 label. The handle stays cool under a lamp.',
      candidates: ['Midnight Sunshade', 'Witch Emergency Parachute', 'A Shy Mushroom'], correctIndex: 0, human: false
    },
    {
      id: 'moisture-cubes', name: 'Slime Moisture Cubes', description: 'Hydration you can chew, absorb, or become. Please do not become the entire display.',
      category: 'Personal care', tags: ['personal-care', 'hydration', 'moisture'], species: ['slime'], forbiddenSpecies: [],
      storage: 'moisture', cost: 5, price: 17, unlock: 4, sprite: 'moisture-cubes',
      clue: 'Sealed green jelly cubes wobble inside a moisture-proof sleeve. Keep humid; do not freeze.',
      candidates: ['Goblin Dice', 'Ghost Ice Bricks', 'Slime Moisture Cubes'], correctIndex: 2, human: false
    },
    {
      id: 'fur-detangler', name: 'Werewolf Fur Detangler', description: 'The full moon is not an excuse for split ends. Neither is the new moon.',
      category: 'Grooming', tags: ['grooming', 'fur', 'comb'], species: ['werewolf', 'minotaur'], forbiddenSpecies: ['ghost'],
      storage: 'normal', cost: 6, price: 18, unlock: 3, sprite: 'fur-detangler',
      clue: 'A blue spray bottle and moon-shaped comb promise knot-free fur. External use only.',
      candidates: ['Ghost Cloud Conditioner', 'Werewolf Fur Detangler', 'Mummy Fabric Glue'], correctIndex: 1, human: false
    },
    {
      id: 'cauldron-deodorizer', name: 'Witch Cauldron Deodorizer', description: 'Removes frog, swamp, and last Tuesday. Lemon scent sold separately.',
      category: 'Magical materials', tags: ['cleaning', 'cauldron', 'magic'], species: ['witch', 'imp'], forbiddenSpecies: [],
      storage: 'normal', cost: 5, price: 15, unlock: 2, sprite: 'cauldron-deodorizer',
      clue: 'A violet sachet shows a bubbling cauldron and says neutralizes potion residue. It smells like minty magic.',
      candidates: ['Witch Cauldron Deodorizer', 'Goblin Soup Powder', 'Slime Bath Salts'], correctIndex: 0, human: false
    },
    {
      id: 'wrap-refresher', name: 'Mummy Wrap Refresher', description: 'Three thousand years of freshness. Allegedly. Do not test this claim during your shift.',
      category: 'Personal care', tags: ['personal-care', 'fabric', 'cleaning'], species: ['mummy', 'vampire'], forbiddenSpecies: [],
      storage: 'normal', cost: 6, price: 18, unlock: 5, sprite: 'wrap-refresher',
      clue: 'A sandy bottle rests beside rolled linen. The label promises tomb-fresh fabric on a delicate cycle.',
      candidates: ['Centaur Mane Mousse', 'Invisible Ghost Cologne', 'Mummy Wrap Refresher'], correctIndex: 2, human: false
    },
    {
      id: 'tiny-pitchfork', name: 'Junior Mischief Pitchfork', description: 'Small fork. Enormous professional ambitions. The promotion does not include a pay rise.',
      category: 'Equipment', tags: ['equipment', 'mischief', 'tool'], species: ['imp', 'goblin'], forbiddenSpecies: [],
      storage: 'normal', cost: 8, price: 22, unlock: 5, sprite: 'tiny-pitchfork',
      clue: 'A tiny red three-pronged fork carries an official Junior Chaos ribbon. Not approved for salads.',
      candidates: ['Vampire Salad Fork', 'Junior Mischief Pitchfork', 'Goblin Antenna'], correctIndex: 1, human: false
    },
    {
      id: 'moon-fog', name: 'Bottled Moon Fog', description: 'Zero calories. Several unresolved emotions. Ghosts inhale it with their entire personality.',
      category: 'Refreshment', tags: ['drink', 'spirit', 'cold', 'refreshment'], species: ['ghost'], forbiddenSpecies: [],
      storage: 'cold', cost: 5, price: 16, unlock: 4, sprite: 'bone-varnish',
      clue: 'A chilled glass bottle holds silver mist, not liquid. Open near an incorporeal customer; do not shake.',
      candidates: ['Bottled Moon Fog', 'Mummy Dust Sample', 'Invisible Lemonade'], correctIndex: 0, human: false
    },
    {
      id: 'fireproof-teaset', name: 'Fireproof Tea Set', description: 'The tea should be hot. The table should remain a table. Finally, both can happen.',
      category: 'Household goods', tags: ['household', 'heatproof', 'tea'], species: ['dragonkin', 'witch', 'imp'], forbiddenSpecies: [],
      storage: 'fireproof', cost: 11, price: 29, unlock: 4, sprite: 'cauldron-deodorizer',
      clue: 'The box contains glazed cups with insulated claws for handles. A flame test seal marks the heatproof display requirement.',
      candidates: ['Slime Picnic Bowls', 'Goblin Tiny Helmets', 'Fireproof Tea Set'], correctIndex: 2, human: false
    },
    {
      id: 'ember-crunch', name: 'Volcanic Ember Crunch', description: 'A mineral snack with a satisfying lava finish. This is the edible volcanic product. Read that twice.',
      category: 'Food', tags: ['food', 'snack', 'volcanic', 'mineral'], species: ['dragonkin'], forbiddenSpecies: [],
      storage: 'fireproof', cost: 7, price: 21, unlock: 4, sprite: 'dragon-droppings',
      clue: 'Red crystalline nuggets have an explicit FOOD-GRADE MINERAL seal. Angular crystals, no spiral, no sulfur smell.',
      candidates: ['Dragon Droppings', 'Volcanic Ember Crunch', 'Coal for Tiny Trains'], correctIndex: 1, human: false
    },
    {
      id: 'moon-biscuits', name: 'Full-Moon Biscuits', description: 'Crunchy, beef-free, and shaped like moons. May cause enthusiastic tail-based inventory damage.',
      category: 'Food', tags: ['food', 'snack', 'moon', 'vegetarian'], species: ['werewolf', 'minotaur', 'centaur', 'goblin'], forbiddenSpecies: [],
      storage: 'normal', cost: 5, price: 15, unlock: 3, sprite: 'maze-pretzel',
      clue: 'Round golden biscuits smell like oats. The ingredient list confirms vegetarian and silver-free.',
      candidates: ['Full-Moon Biscuits', 'Skeleton Spare Discs', 'Tiny Witch Hats'], correctIndex: 0, human: false
    },
    {
      id: 'leg-balm', name: 'Herbal Leg Balm', description: 'For sore legs after standing in shop queues. We recognize the irony and charge anyway.',
      category: 'Grooming', tags: ['grooming', 'leg-care', 'herbal'], species: ['centaur', 'minotaur', 'werewolf'], forbiddenSpecies: ['ghost'],
      storage: 'normal', cost: 5, price: 15, unlock: 2, sprite: 'hoof-polish',
      clue: 'A green jar shows a leg, herbs, and massage arrows. The cream is for muscles, not a hoof mirror finish.',
      candidates: ['Goblin Pesto', 'Witch Boot Glue', 'Herbal Leg Balm'], correctIndex: 2, human: false
    },
    {
      id: 'broom-wax', name: 'Low-Altitude Broom Wax', description: 'Smooth takeoffs. Fewer embarrassing squeaks. Does not replace a pilot license.',
      category: 'Equipment', tags: ['equipment', 'maintenance', 'wood', 'broom'], species: ['witch', 'goblin'], forbiddenSpecies: [],
      storage: 'normal', cost: 5, price: 16, unlock: 2, sprite: 'bone-varnish',
      clue: 'A wax tin is stamped WOOD ONLY and illustrated with a broom. Not safe on articulated bones.',
      candidates: ['Skeleton Elbow Glue', 'Low-Altitude Broom Wax', 'Ghost Sandwich Spread'], correctIndex: 1, human: false
    },
    {
      id: 'spare-kneecap', name: 'Spare Kneecap', description: 'Because sometimes your knees really do leave the meeting before you.',
      category: 'Personal care', tags: ['personal-care', 'bone', 'replacement'], species: ['skeleton'], forbiddenSpecies: ['ghost'],
      storage: 'normal', cost: 7, price: 19, unlock: 3, sprite: 'bone-varnish',
      clue: 'An ivory oval rests in sterile packing labeled PATELLA. No polish, no brush: this is the actual spare part.',
      candidates: ['Spare Kneecap', 'Ghost Soap', 'Goblin Skipping Stone'], correctIndex: 0, human: false
    },
    {
      id: 'bone-mallets', name: 'Rib-Xylophone Mallets', description: 'For the musician whose instrument follows them everywhere. Please practice outside opening hours.',
      category: 'Equipment', tags: ['equipment', 'music', 'percussion'], species: ['skeleton', 'imp'], forbiddenSpecies: [],
      storage: 'normal', cost: 7, price: 20, unlock: 3, sprite: 'tiny-pitchfork',
      clue: 'Two felt-tipped sticks come with a rib-safe sound chart. No sharp prongs and no chaos ribbon.',
      candidates: ['Goblin Chopsticks', 'Centaur Hairpins', 'Rib-Xylophone Mallets'], correctIndex: 2, human: false
    },
    {
      id: 'blood-orange-juice', name: 'Blood-Orange Juice', description: 'One hundred percent fruit. The Count still insists it is a very serious beverage.',
      category: 'Refreshment', tags: ['drink', 'fruit', 'refreshment', 'vegetarian'], species: ['vampire', 'witch', 'centaur', 'goblin'], forbiddenSpecies: [],
      storage: 'cold', cost: 6, price: 18, unlock: 4, sprite: 'wrap-refresher',
      clue: 'A chilled red bottle has an orange slice on its food label. Ingredients: fruit, water, dramatic branding.',
      candidates: ['Werewolf Shampoo', 'Blood-Orange Juice', 'Imp Ink Refill'], correctIndex: 1, human: false
    },
    {
      id: 'silk-cape-kit', name: 'Moonlight Fabric Repair Kit', description: 'Repairs capes, wraps, and the dignity damaged by a revolving door.',
      category: 'Personal care', tags: ['personal-care', 'fabric', 'repair'], species: ['vampire', 'mummy', 'witch'], forbiddenSpecies: [],
      storage: 'normal', cost: 7, price: 21, unlock: 5, sprite: 'wrap-refresher',
      clue: 'Soft thread, blunt needles, and matching patches sit in a cloth pouch. For fabric, never skin.',
      candidates: ['Moonlight Fabric Repair Kit', 'Centaur Salad Kit', 'Ghost Fishing Tackle'], correctIndex: 0, human: false
    },
    {
      id: 'potion-seeds', name: 'Polite Mandrake Seeds', description: 'They still scream when harvested, but they first ask whether now is a good time.',
      category: 'Magical materials', tags: ['garden', 'seed', 'magic'], species: ['witch', 'centaur'], forbiddenSpecies: [],
      storage: 'normal', cost: 6, price: 18, unlock: 5, sprite: 'cauldron-deodorizer',
      clue: 'A paper packet contains actual brown seeds and planting depth instructions. Use fertilizer; do not season lunch.',
      candidates: ['Goblin Coffee Beans', 'Mummy Bath Beads', 'Polite Mandrake Seeds'], correctIndex: 2, human: false
    },
    {
      id: 'pocket-lantern', name: 'Pocket Will-o-Wisp', description: 'A helpful little light that only occasionally suggests taking the scenic route into a bog.',
      category: 'Equipment', tags: ['equipment', 'light', 'magic'], species: ['goblin', 'imp', 'skeleton', 'vampire', 'witch'], forbiddenSpecies: [],
      storage: 'normal', cost: 9, price: 25, unlock: 6, sprite: 'pumpkin',
      clue: 'A caged green spark follows your finger. The latch is marked LIGHT SOURCE: DO NOT RELEASE OUTDOORS.',
      candidates: ['A Very Small Slime', 'Pocket Will-o-Wisp', 'Ghost Pepper Sauce'], correctIndex: 1, human: false
    },
    {
      id: 'tax-forms', name: 'Human Tax Forms', description: 'The only paper in the shop that frightens every monster. Belongs to the human depot, not our inventory.',
      category: 'Human misdelivery', tags: ['human', 'paperwork', 'manifest-return'], species: [], forbiddenSpecies: [],
      storage: 'normal', cost: 0, price: 0, unlock: 1, sprite: 'tax-forms',
      clue: 'The parcel manifest names the human tax office. The packet says TAX and is not addressed to Legendary Shop.',
      candidates: ['A Necromancy Permit', 'Human Tax Forms', 'Origami for Skeletons'], correctIndex: 1, human: true
    },
    {
      id: 'burnt-steak', name: 'Human-Made Burnt Steak', description: 'A human restaurant delivery that lost an argument with a pan. Return to its owner; never put it on a monster shelf.',
      category: 'Human misdelivery', tags: ['human', 'beef', 'food', 'manifest-return'], species: [], forbiddenSpecies: ['minotaur'],
      storage: 'normal', cost: 0, price: 0, unlock: 2, sprite: 'dragon-droppings',
      clue: 'The slab has meat fibers and grill marks, no spiral and no sulfur. Its restaurant manifest names a human customer.',
      candidates: ['Human-Made Burnt Steak', 'Dragon Droppings', 'Abyssal Roast'], correctIndex: 0, human: true
    },
    {
      id: 'broken-stapler', name: 'Broken Office Stapler', description: 'Bites paper, then immediately gives up. It belongs to a human office; the goblins may not keep it.',
      category: 'Human misdelivery', tags: ['human', 'office', 'manifest-return'], species: [], forbiddenSpecies: [],
      storage: 'normal', cost: 0, price: 0, unlock: 3, sprite: 'broken-stapler',
      clue: 'A grey stapler has one bent staple. The shipping label belongs to Human Resources, not our equally dramatic staff room.',
      candidates: ['A Miniature Mimic', 'Goblin Tooth Repair Kit', 'Broken Office Stapler'], correctIndex: 2, human: true
    },
    {
      id: 'microwave-manual', name: 'Microwave Instruction Manual', description: 'A human spellbook that turns cold leftovers into hot disappointment. Please return the paperwork, not the leftovers.',
      category: 'Human misdelivery', tags: ['human', 'paperwork', 'manifest-return'], species: [], forbiddenSpecies: [],
      storage: 'normal', cost: 0, price: 0, unlock: 4, sprite: 'microwave-manual',
      clue: 'A booklet illustrates a microwave and says do not insert metal. Its parcel manifest names the human appliance depot.',
      candidates: ['Beginner Thunder Spells', 'Microwave Instruction Manual', 'Imp Lightning License'], correctIndex: 1, human: true
    }
  ];

  const catalog = { products, byId: Object.fromEntries(products.map(product => [product.id, product])) };
  root.ShopCatalog = catalog;
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
})(typeof globalThis !== 'undefined' ? globalThis : this);
