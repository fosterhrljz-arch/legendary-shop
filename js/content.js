(function (root) {
  'use strict';

  // Add a monster here, then use its id as an item's recipient.
  const monsters = [
    {
      id: 'dragonkin', name: 'Ember', species: 'Dragonkin', color: '#ed8c50', sprite: 'dragonkin',
      likes: ['Volcanic snacks', 'Charred minerals', 'Heatproof goods'],
      dislikes: ['Ice packs', 'Fire extinguishers'],
      description: 'A tiny dragon with a very large barbecue opinion.',
      hint: 'Warm, smoky, or suspiciously volcanic? Ember probably ordered it.',
      approval: 'Perfect! Locally sourced, ethically scorched. Five stars.',
      complaint: 'Does this come in extra crispy? No? Then it is not mine.'
    },
    {
      id: 'ghost', name: 'Boo', species: 'Ghost', color: '#a3d3d3', sprite: 'ghost',
      likes: ['Cold mist', 'Transparent desserts', 'Eerie decorations'],
      dislikes: ['Heavy equipment', 'Anything requiring a stomach'],
      description: 'Cold, floaty, and still dramatic about a party from 1842.',
      hint: 'Boo likes treats light enough to pass through. Look for ghostly blue frost.',
      approval: 'Finally, a dessert that understands my lack of digestive system.',
      complaint: 'Do I look corporeal to you? Please do not answer that.'
    },
    {
      id: 'centaur', name: 'Clover', species: 'Centaur', color: '#bfa272', sprite: 'centaur',
      likes: ['Hoof care', 'Herbal leg balm', 'Grooming kits'],
      dislikes: ['Two-shoe gift sets', 'Tiny chairs'],
      description: 'Four hooves. One beauty routine. Absolutely no spare time.',
      hint: 'Four-hoof products and leafy grooming bottles belong to Clover.',
      approval: 'My hooves will be so shiny that traffic will have to slow down.',
      complaint: 'I have four legs and somehow none of them asked for this.'
    },
    {
      id: 'goblin', name: 'Nib', species: 'Goblin', color: '#a7bf68', sprite: 'goblin',
      likes: ['Shiny junk', 'Suspicious gadgets', 'Bargain-bin tools'],
      dislikes: ['Full price', 'Receipts with questions'],
      description: 'A collector of shiny things that were definitely already loose.',
      hint: 'If it attracts coins or looks questionably acquired, ask Nib.',
      approval: 'A bargain! The coins in your apron agree. No reason.',
      complaint: 'Can I resell it? No? Then our conversation is over.'
    },
    {
      id: 'skeleton', name: 'Rattle', species: 'Skeleton', color: '#e4d6af', sprite: 'skeleton',
      likes: ['Bone polish', 'Spare bones', 'Xylophone accessories'],
      dislikes: ['Calcium lectures', 'Sticky caramel'],
      description: 'Plays jazz on their own ribs. Never skips a sound check.',
      hint: 'Bone-shaped labels and rib-safe varnish are Rattle essentials.',
      approval: 'My ribs have never looked better. The encore is going to sparkle.',
      complaint: 'I would raise an eyebrow, but that department closed years ago.'
    },
    {
      id: 'vampire', name: 'Count Sip', species: 'Vampire', color: '#c699c6', sprite: 'vampire',
      likes: ['Blood-orange drinks', 'Sunproof umbrellas', 'Silk capes'],
      dislikes: ['Garlic', 'Sunrise appointments'],
      description: 'A night owl with excellent tailoring and terrible brunch availability.',
      hint: 'SPF numbers with far too many zeroes are usually for Count Sip.',
      approval: 'At last! I can attend brunch. From beneath a portable fortress.',
      complaint: 'This clashes with my cape, my complexion, and my entire century.'
    },
    {
      id: 'slime', name: 'Jellybean', species: 'Slime', color: '#8ac6a3', sprite: 'slime',
      likes: ['Moisture cubes', 'Sealed jelly food', 'Absorbent towels'],
      dislikes: ['Dehydrators', 'Uncovered floor vents'],
      description: 'Mostly water, entirely enthusiasm. Signs receipts with a little puddle.',
      hint: 'Hydration and sealed jelly treats keep Jellybean delightfully wobbly.',
      approval: 'Blorp! (My skin-care routine is now also my lunch.)',
      complaint: 'Blorp? (This is going straight through me emotionally.)'
    },
    {
      id: 'minotaur', name: 'Mino', species: 'Minotaur', color: '#b77d57', sprite: 'minotaur',
      likes: ['Maze-shaped snacks', 'Heavy equipment', 'Horn care'],
      dislikes: ['Beef products', 'Unsolicited directions'],
      description: 'Big, proud, and only slightly lost on the way to the snack aisle.',
      hint: 'Maze snacks are a safe bet. Beef products are an HR incident.',
      approval: 'A snack AND a maze? I may be here for a while.',
      complaint: 'I have taken six wrong turns today. Please do not make this seven.'
    },
    {
      id: 'werewolf', name: 'Floof', species: 'Werewolf', color: '#a0a7bd', sprite: 'werewolf',
      likes: ['Fur detangler', 'Moon biscuits', 'Heavy-duty combs'],
      dislikes: ['Silver accessories', 'Vacuum cleaners'],
      description: 'A fierce beast until someone mentions walkies.',
      hint: 'Look for fluffy packaging, combs, and moon-approved fur care.',
      approval: 'No more tangles! I am about to be the fluffiest problem in town.',
      complaint: 'I sniffed it twice. Still not mine. Excellent box, though.'
    },
    {
      id: 'witch', name: 'Hazel', species: 'Witch', color: '#b09ace', sprite: 'witch',
      likes: ['Cauldron supplies', 'Potion ingredients', 'Broom maintenance'],
      dislikes: ['Decaf potion mix', 'Microwave cooking'],
      description: 'Brews award-winning potions and extremely questionable office coffee.',
      hint: 'Cauldron-shaped labels and potion supplies are Hazel territory.',
      approval: 'Wonderful. My cauldron can stop smelling like emotional cabbage.',
      complaint: 'I could turn this into a frog. That would not make it my order.'
    },
    {
      id: 'mummy', name: 'Linen', species: 'Mummy', color: '#d5bd88', sprite: 'mummy',
      likes: ['Wrap refresher', 'Fresh bandages', 'Gentle fabric care'],
      dislikes: ['Unraveling sweaters', 'Aggressive spin cycles'],
      description: 'Has worn the same outfit for 3,000 years. Calls it a capsule wardrobe.',
      hint: 'Gentle wrap and bandage care help Linen smell less like ancient history.',
      approval: 'Fresh linen! Finally, a product named after my entire personality.',
      complaint: 'I waited three millennia for this? I should have kept the receipt.'
    },
    {
      id: 'imp', name: 'Pip', species: 'Imp', color: '#d78284', sprite: 'imp',
      likes: ['Tiny pitchforks', 'Mischief equipment', 'Fireproof stationery'],
      dislikes: ['Mandatory meetings', 'Adult-size uniforms'],
      description: 'Assistant to the regional chaos manager. Takes the title very seriously.',
      hint: 'Tiny official-looking mischief tools belong to Pip, not the salad bar.',
      approval: 'My promotion is official! The pitchfork is tiny, but the ambition is HUGE.',
      complaint: 'This is going in my very small, very formal complaint folder.'
    }
  ];

  // Exactly three candidate names; correctIndex refers to the displayed order.
  const items = [
    {
      id: 'dragon-droppings', name: 'Dragon Droppings', category: 'Magical materials', recipient: 'dragonkin', sprite: 'dragon-droppings',
      description: 'Warm to the touch. Deeply suspicious. Apparently premium dragon-furnace fuel.',
      visualHint: 'A charcoal-black lump with glowing cracks. The box is still warm.',
      candidates: ['A human’s burnt steak', 'Dragon Droppings', 'A very stressed potato'], correctIndex: 1,
      explanation: 'Those glowing cracks mean dragon business. Please stop calling it a steak.'
    },
    {
      id: 'ghost-macarons', name: 'Ghost Pepper Macarons', category: 'Food', recipient: 'ghost', sprite: 'ghost-macarons',
      description: 'Not spicy. Just haunted. Half the calories have already crossed over.',
      visualHint: 'Pale blue pastries float above a frosty tray. One whispers “boo.”',
      candidates: ['Ghost Pepper Macarons', 'Frozen blue hockey pucks', 'Dragon fire biscuits'], correctIndex: 0,
      explanation: 'They FLOAT. That is either a ghost dessert or a serious bakery inspection.'
    },
    {
      id: 'hoof-polish', name: 'Centaur Hoof Polish', category: 'Grooming', recipient: 'centaur', sprite: 'hoof-polish',
      description: 'Mirror shine for all four hooves. Sold in family size, for one customer.',
      visualHint: 'A leafy green bottle with four horseshoes on the label.',
      candidates: ['Goblin salad dressing', 'Emergency pond water', 'Centaur Hoof Polish'], correctIndex: 2,
      explanation: 'Four horseshoes. Four! The packaging is doing most of our job for us.'
    },
    {
      id: 'tax-forms', name: 'Human Tax Forms', category: 'Human / reject', recipient: 'human', sprite: 'tax-forms',
      description: 'The only paperwork in the shop that manages to frighten every monster.',
      visualHint: 'A paper stack stamped TAX. No magic, just many small boxes.',
      candidates: ['A necromancy permit', 'Human Tax Forms', 'Origami for skeletons'], correctIndex: 1,
      explanation: 'That says TAX. Even the curses want nothing to do with it. Human returns!'
    },
    {
      id: 'pocket-magnet', name: 'Goblin Pocket Magnet', category: 'Equipment', recipient: 'goblin', sprite: 'pocket-magnet',
      description: 'Attracts loose coins. The legal definition of “loose” remains under review.',
      visualHint: 'A horseshoe magnet is dragging three coins out of the packaging.',
      candidates: ['Goblin Pocket Magnet', 'A centaur’s spare smile', 'Vampire travel pillow'], correctIndex: 0,
      explanation: 'It is attracting the till. That is our goblin model. Keep it away from payroll.'
    },
    {
      id: 'bone-varnish', name: 'Skeleton Bone Varnish', category: 'Personal care', recipient: 'skeleton', sprite: 'bone-varnish',
      description: 'For a polished rib cage and a brighter afterlife. Do not apply to teeth while talking.',
      visualHint: 'An ivory bottle with a bone label and a tiny polishing brush.',
      candidates: ['Expired milk', 'Ghost furniture wax', 'Skeleton Bone Varnish'], correctIndex: 2,
      explanation: 'The bone on the bottle is not a serving suggestion. It is varnish.'
    },
    {
      id: 'moon-umbrella', name: 'Vampire SPF 5000 Umbrella', category: 'Equipment', recipient: 'vampire', sprite: 'moon-umbrella',
      description: 'Blocks sunlight, drizzle, and awkward invitations to daytime weddings.',
      visualHint: 'A purple umbrella with bat-wing edges. The tag reads SPF 5000.',
      candidates: ['Vampire SPF 5000 Umbrella', 'Witch emergency parachute', 'A very shy mushroom'], correctIndex: 0,
      explanation: 'SPF five thousand. Who else has that level of commitment to avoiding brunch?'
    },
    {
      id: 'moisture-cubes', name: 'Slime Moisture Cubes', category: 'Food', recipient: 'slime', sprite: 'moisture-cubes',
      description: 'Hydration you can chew, absorb, or become. Please keep the lid on your lunch.',
      visualHint: 'Sealed mint-green jelly cubes wobble even when the box is still.',
      candidates: ['Goblin dice', 'Slime Moisture Cubes', 'Ghost ice bricks'], correctIndex: 1,
      explanation: 'Those cubes are ninety-nine percent hydration and one percent excellent wobble.'
    },
    {
      id: 'broken-stapler', name: 'Broken Office Stapler', category: 'Human / reject', recipient: 'human', sprite: 'broken-stapler',
      description: 'Bites paper, then immediately gives up. A hauntingly accurate office employee.',
      visualHint: 'A grey desk tool marked OFFICE. One bent staple falls out.',
      candidates: ['A miniature mimic', 'Goblin tooth repair kit', 'Broken Office Stapler'], correctIndex: 2,
      explanation: 'The OFFICE label and bent staple give it away. It is ordinary human desk equipment, so send it to Human Returns.'
    },
    {
      id: 'maze-pretzel', name: 'Minotaur Maze Pretzel', category: 'Food', recipient: 'minotaur', sprite: 'maze-pretzel',
      description: 'Find your way to the middle. Eat the evidence if you get lost. Certified beef-free.',
      visualHint: 'A huge golden pretzel twists into a tiny edible labyrinth.',
      candidates: ['Minotaur Maze Pretzel', 'Witch broom knot', 'Human extension cable'], correctIndex: 0,
      explanation: 'It is a maze you can eat! A cable would have a much less satisfying crunch.'
    },
    {
      id: 'fur-detangler', name: 'Werewolf Fur Detangler', category: 'Grooming', recipient: 'werewolf', sprite: 'fur-detangler',
      description: 'For those full-moon mornings when your hair has filed for independence.',
      visualHint: 'A blue spray bottle with a fluffy tail and a moon-shaped comb.',
      candidates: ['Ghost cloud conditioner', 'Werewolf Fur Detangler', 'Mummy fabric glue'], correctIndex: 1,
      explanation: 'The moon comb is for fur, not clouds. Clouds have much better boundaries.'
    },
    {
      id: 'cauldron-deodorizer', name: 'Witch Cauldron Deodorizer', category: 'Magical materials', recipient: 'witch', sprite: 'cauldron-deodorizer',
      description: 'Removes frog, swamp, and last Tuesday. Lemon scent sold separately.',
      visualHint: 'A violet pouch with a bubbling cauldron label. It smells like minty magic.',
      candidates: ['Slime bath salts', 'Goblin soup powder', 'Witch Cauldron Deodorizer'], correctIndex: 2,
      explanation: 'The cauldron label is a hint. The smell of last Tuesday is the other hint.'
    },
    {
      id: 'wrap-refresher', name: 'Mummy Wrap Refresher', category: 'Personal care', recipient: 'mummy', sprite: 'wrap-refresher',
      description: 'Three thousand years of freshness, now in a spray. Delicate cycle only.',
      visualHint: 'A sandy bottle beside a clean rolled bandage. “Tomb-fresh!” says the label.',
      candidates: ['Mummy Wrap Refresher', 'Centaur mane mousse', 'Invisible ghost cologne'], correctIndex: 0,
      explanation: 'Bandages, tomb-fresh, delicate cycle. This product practically introduced itself.'
    },
    {
      id: 'microwave-manual', name: 'Microwave Instruction Manual', category: 'Human / reject', recipient: 'human', sprite: 'microwave-manual',
      description: 'A human spellbook that turns cold leftovers into hot disappointment.',
      visualHint: 'A booklet shows a microwave and the instruction “Do not insert metal.”',
      candidates: ['Beginner thunder spells', 'Microwave Instruction Manual', 'Imp lightning license'], correctIndex: 1,
      explanation: 'The microwave picture and “plug in” instructions mean human technology, not magic. Send this booklet to Human Returns.'
    },
    {
      id: 'tiny-pitchfork', name: 'Junior Mischief Pitchfork', category: 'Cursed objects', recipient: 'imp', sprite: 'tiny-pitchfork',
      description: 'For the ambitious little menace. Includes a promotion, but absolutely no pay rise.',
      visualHint: 'A tiny red three-pronged fork with an official “Junior Chaos” ribbon.',
      candidates: ['A vampire salad fork', 'Goblin antenna', 'Junior Mischief Pitchfork'], correctIndex: 2,
      explanation: 'Junior Chaos is a department, not a salad dressing. Please respect the tiny bureaucracy.'
    }
  ];

  const stages = [
    { id: 1, name: 'Training Chaos', subtitle: 'Small packages. Big learning opportunities.', start: 0, end: 4 },
    { id: 2, name: 'Peak Halloween Rush', subtitle: 'The queue is growing. So is the boss’s volume.', start: 5, end: 9 },
    { id: 3, name: 'Full Shop Meltdown', subtitle: 'Five packages stand between us and snack time.', start: 10, end: 14 }
  ];

  const boss = {
    name: 'Mr. Marmalade', species: 'Cat proprietor',
    description: 'An orange cat in a very serious waistcoat. Runs the shop on tea, drama, and impeccable whiskers.',
    welcome: 'Welcome to Legendary Shop! The truck broke down, the labels got mixed up, and my left eye is twitching. You will do great.',
    encouragement: ['A real professional! Please remember us when you become famous.', 'Correct! I knew hiring someone with eyes would pay off.', 'Beautiful work. My blood pressure just became a smaller number.'],
    drama: ['A tiny mix-up! We are learning. Loudly.', 'My stress pumpkin has developed its own stress pumpkin.', 'I am calm. THIS IS MY CALM RETAIL VOICE.', 'The till is haunted, the queue is glowing, and I need a biscuit.'],
    humanReturn: 'Back to the human depot! Their paperwork frightens me more than the haunted basement.'
  };

  const content = { monsters, items, stages, boss };
  root.ShopContent = content;
  if (typeof module !== 'undefined' && module.exports) module.exports = content;
})(typeof globalThis !== 'undefined' ? globalThis : this);
