const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../js/simulation.js');
const C=require('../js/catalog.js');
const run=(s,seconds)=>{for(let n=0;n<seconds*4;n++)E.tick(s,.25);return s;};
const quiet=()=>{const s=E.create(42);E.openShift(s);s.duration=1000;s.spawnTimer=9999;s.staff[0].roles=['cashier'];return s;};
const shelf=s=>s.objects.find(o=>o.id==='shelf-1');

test('commercial catalog includes 24 real goods, four human misdeliveries and twelve species',()=>{
  assert.equal(C.products.filter(p=>!p.human).length,24);assert.equal(C.products.filter(p=>p.human).length,4);
  assert.equal(new Set(C.products.flatMap(p=>p.species)).size,12);
  for(const p of C.products){assert.equal(p.candidates.length,3);assert.equal(p.candidates[p.correctIndex],p.name);assert.ok(p.price>=p.cost);}
});
test('Gate 1: autonomous route, purchase, payment, inventory decrement, and exit',()=>{
  const s=quiet(),before=s.cash,c=E.spawnCustomer(s,{species:'minotaur'});run(s,35);
  assert.equal(s.served,1);assert.equal(shelf(s).stock,7);assert.equal(s.cash,before+16);assert.ok(!s.customers.includes(c));
  assert.deepEqual(s.events.filter(e=>e.customerId===c.id).map(e=>e.type),['enter','reserve','queue','payment','leave','exit']);
  assert.equal(s.ledger.filter(e=>e.type==='sale').length,1);
});
test('identification retries are bounded and correct discovery adds inventory only once',()=>{
  const s=E.create(),cash=s.cash,rep=s.reputation;assert.equal(E.identify(s,'parcel-intro',0).ok,false);assert.equal(s.reputation,rep);assert.equal(s.cash,cash);
  assert.equal(E.identify(s,'parcel-intro',2).ok,true);assert.equal(s.storage['dragon-droppings'],6);assert.equal(E.identify(s,'parcel-intro',2).ok,false);assert.equal(s.storage['dragon-droppings'],6);
  E.buy(s,'dragon-droppings',3);const parcel=s.parcels.find(p=>p.sku==='dragon-droppings'&&p.id!=='parcel-intro');assert.equal(parcel.status,'known');
  s.staff[0].roles=['parcel'];E.openShift(s);s.spawnTimer=9999;run(s,12);assert.equal(s.storage['dragon-droppings'],9);
});
test('human parcels enter returns, cannot stock or sell, and return exactly once',()=>{
  const s=E.create();assert.equal(E.identify(s,'parcel-human',1).ok,true);assert.equal(s.parcels.find(p=>p.id==='parcel-human').status,'return');assert.equal(s.storage['tax-forms'],undefined);
  assert.equal(E.stockShelf(s,'shelf-1','tax-forms',1).ok,false);assert.equal(E.compatible(E.product('tax-forms'),'goblin'),false);assert.equal(E.returnParcel(s,'parcel-human').ok,true);assert.equal(E.returnParcel(s,'parcel-human').ok,false);
});
test('compatibility accepts shared fertilizer and category solutions but rejects beef and food misuse',()=>{
  const p=E.product('dragon-droppings');assert.equal(E.compatible(p,'witch',{tags:['fertilizer']}),true);assert.equal(E.compatible(p,'dragonkin',{tags:['fuel']}),true);assert.equal(E.compatible(p,'dragonkin',{tags:['food']}),false);
  assert.equal(E.compatible({...E.product('maze-pretzel'),tags:['food','beef']},'minotaur',{tags:['food']}),false);
  assert.equal(E.compatible(E.product('maze-pretzel'),'werewolf',{tags:['food']}),true);assert.equal(E.compatible(E.product('moon-biscuits'),'werewolf',{tags:['food']}),true);
});
test('last unit is reserved once and completed transactions cannot charge twice',()=>{
  const s=quiet();shelf(s).stock=1;E.spawnCustomer(s,{species:'minotaur'});E.spawnCustomer(s,{species:'minotaur'});run(s,1);
  assert.equal(E.reservationCount(s,'shelf-1'),1);run(s,50);assert.equal(s.served,1);assert.equal(shelf(s).stock,0);assert.equal(s.ledger.filter(e=>e.type==='sale').length,1);
});
test('special service uses actual requests, wrong goods stay intact, correct goods physically arrive',()=>{
  const s=quiet();s.storage['dragon-droppings']=2;const c=E.spawnCustomer(s,{species:'witch',special:true,guided:true,request:{tags:['fertilizer']},budget:30});run(s,5);assert.equal(c.phase,'request');
  const cash=s.cash;assert.equal(E.dispatch(s,c.id,'maze-pretzel').ok,false);assert.equal(shelf(s).stock,8);assert.equal(s.cash,cash);
  assert.equal(E.dispatch(s,c.id,'dragon-droppings').ok,true);assert.equal(E.dispatch(s,c.id,'dragon-droppings').ok,false);assert.equal(s.storage['dragon-droppings'],2);
  run(s,3);assert.ok(s.staff[0].job?.type==='delivery');run(s,30);assert.equal(s.storage['dragon-droppings'],1);assert.equal(s.cash,cash+13);assert.equal(s.served,1);
});
test('abandoned request releases storage reservation and carried visual state',()=>{
  const s=quiet();s.storage['dragon-droppings']=1;const c=E.spawnCustomer(s,{species:'witch',special:true,guided:true,request:{productId:'dragon-droppings'},budget:30});run(s,5);E.dispatch(s,c.id,'dragon-droppings');c.patience=.01;run(s,10);
  assert.equal(s.storage['dragon-droppings'],1);assert.equal(s.served,0);assert.equal(E.availableStock(s,'dragon-droppings'),1);assert.ok(!s.staff[0].carrying);
});
test('manual shelf assignment cannot consume special-order or worker-reserved storage',()=>{
  const s=quiet();s.storage['dragon-droppings']=1;const c=E.spawnCustomer(s,{species:'witch',special:true,guided:true,request:{tags:['fuel']},budget:30});run(s,5);E.dispatch(s,c.id,'dragon-droppings');shelf(s).stock=0;shelf(s).sku=null;
  assert.equal(E.stockShelf(s,'shelf-1','dragon-droppings',1).ok,false);assert.equal(s.storage['dragon-droppings'],1);assert.equal(E.stockShelf(s,'shelf-1','dragon-droppings',NaN).ok,false);
});
test('unreachable display never sells',()=>{
  const s=quiet();s.objects.push({id:'obstruction',type:'lantern',x:1,y:4,w:1,h:1,stock:0,sku:null,level:1,rotation:0});E.spawnCustomer(s,{species:'minotaur'});run(s,40);assert.equal(s.served,0);assert.equal(shelf(s).stock,8);assert.equal(s.stats.unmet['No reachable display'],1);
});
test('move/remove preserve stock and cancel previews never charge; blocked routes rejected',()=>{
  const s=E.create(),cash=s.cash,before=E.serialize(s);assert.equal(E.validatePlacement(s,'shelf',4,8).ok,false);assert.equal(E.serialize(s),before);
  assert.equal(E.place(s,'lantern',1,4).ok,false);assert.equal(s.cash,cash);assert.equal(E.move(s,'shelf-1',1,2).ok,true);assert.equal(shelf(s).stock,8);assert.equal(shelf(s).sku,'maze-pretzel');
  assert.equal(E.remove(s,'shelf-1').ok,true);assert.equal(s.storage['maze-pretzel'],16);
});
test('workers claim unique jobs and stock assistants travel before moving inventory',()=>{
  const s=quiet();s.staff[0].roles=['stock'];s.shift=3;E.hire(s,['stock']);shelf(s).stock=0;const before=s.storage['maze-pretzel'];run(s,.5);
  assert.equal(shelf(s).stock,0);const claims=s.staff.filter(w=>w.job).map(w=>w.job.objectId);assert.equal(new Set(claims).size,claims.length);run(s,30);assert.ok(shelf(s).stock>0);assert.ok(s.storage['maze-pretzel']<before);
});
test('all simulation timers freeze under pause including orders, jobs, patience, wages',()=>{
  const s=quiet();E.buy(s,'maze-pretzel',4);E.spawnCustomer(s);s.paused=true;const frozen=E.serialize(s);run(s,100);assert.equal(E.serialize(s),frozen);
});
test('closing resolves reservations and posts wages only once',()=>{
  const s=quiet();s.shift=3;E.hire(s,['cashier']);E.spawnCustomer(s,{species:'minotaur'});run(s,2);E.closeShift(s);run(s,150);assert.equal(s.phase,'report');assert.equal(s.customers.length,0);assert.equal(s.ledger.filter(e=>e.type==='wages').length,1);const cash=s.cash;run(s,100);assert.equal(s.cash,cash);assert.equal(s.ledger.filter(e=>e.type==='wages').length,1);
});
test('new saves preserve reservations/job state and never reinterpret legacy quiz saves',()=>{
  const s=quiet();E.spawnCustomer(s,{species:'minotaur'});run(s,9);assert.ok(s.customers[0].reservation);const loaded=E.restore(E.serialize(s));assert.ok(loaded);run(s,40);run(loaded,40);assert.equal(loaded.cash,s.cash);assert.equal(loaded.served,1);assert.equal(shelf(loaded).stock,7);assert.equal(E.restore('{"version":1,"score":2250}'),null);
  const corrupt=JSON.parse(E.serialize(loaded));corrupt.staff[0].job={type:'cashier',remaining:'oops'};assert.equal(E.restore(corrupt),null);
});
test('price tiers affect affordability rather than labels only',()=>{
  const a=quiet(),b=quiet();E.setPrice(a,'bargain');E.setPrice(b,'premium');E.spawnCustomer(a,{species:'minotaur',budget:16});E.spawnCustomer(b,{species:'minotaur',budget:16});run(a,40);run(b,40);assert.equal(a.served,1);assert.equal(b.served,0);assert.equal(b.stats.unmet['Too pricey'],1);
});
test('second cashier plus reachable checkout measurably improves queue throughput',()=>{
  function scenario(extra){const s=quiet();s.shift=3;s.cash=1000;shelf(s).stock=30;E.assign(s,'intern',['cashier']);if(extra){assert.equal(E.place(s,'checkout',8,3).ok,true);E.hire(s,['cashier']);}for(let n=0;n<14;n++)E.spawnCustomer(s,{species:'minotaur',budget:50,patience:200});run(s,45);return s;}
  const one=scenario(false),two=scenario(true);assert.ok(two.served>one.served,`${one.served} vs ${two.served}`);console.log('Controlled throughput at 45s:',one.served,'one cashier /',two.served,'two cashiers + tills');
});
test('training, capacity, specialist fixtures and expansion alter real simulation variables',()=>{
  const s=E.create();s.shift=5;s.cash=1000;const cap=E.capacity(shelf(s));assert.equal(E.upgrade(s,'shelf-1').ok,true);assert.equal(E.capacity(shelf(s)),cap+8);E.train(s,'intern');assert.equal(s.staff[0].level,2);
  assert.equal(E.expand(s).ok,true);assert.equal(s.width,14);assert.equal(E.place(s,'cold',10,2).ok,true);assert.equal(E.place(s,'lantern',12,2).ok,true);assert.equal(E.ghostCorner(s),true);
  const cold=s.objects.find(o=>o.type==='cold');s.storage['moon-fog']=2;assert.equal(E.stockShelf(s,cold.id,'moon-fog',2).ok,true);assert.equal(cold.stock,2);assert.equal(E.stockShelf(s,'shelf-2','moon-fog',1).ok,false);
});
test('normal stocked campaign can afford hire, upgrade, and usable expansion; six shifts settle',()=>{
  const s=E.create(37);let hired=false,upgraded=false,expanded=false;
  for(let shift=1;shift<=6;shift++){
    for(const sku of ['maze-pretzel','pocket-magnet']){E.buy(s,sku,12);for(const p of s.parcels.filter(p=>p.sku===sku&&['known','unknown'].includes(p.status)))E.identify(s,p.id,E.product(sku).correctIndex);}
    if(shift===2){assert.equal(E.upgrade(s,'shelf-1').ok,true);upgraded=true;}
    if(shift===3){assert.equal(E.hire(s,['stock','cashier','parcel']).ok,true);hired=true;}
    if(shift===5){assert.equal(E.expand(s).ok,true);expanded=true;}
    E.openShift(s);run(s,430);assert.ok(['report','complete'].includes(s.phase));if(shift<6)E.nextShift(s);
  }
  assert.ok(hired&&upgraded&&expanded);assert.equal(s.phase,'complete');assert.equal(s.reports.length,6);assert.equal(s.ledger.filter(e=>e.type==='wages').length,6);assert.ok(s.cash>=0);console.log('Six-shift economic scenario:',s.cash,'coins;',s.served,'transactions; hire + upgrade + expansion achieved');
});
test('zero-resource recovery supplies a clear limited route back into trading',()=>{
  const s=E.create();s.cash=0;s.storage={};for(const o of s.objects)o.stock=0;s.parcels=[];assert.equal(E.recover(s).ok,true);assert.equal(s.cash,40);assert.equal(s.storage['maze-pretzel'],8);assert.equal(E.recover(s).ok,false);
});
test('wrong delivery lowers customer satisfaction; final experience posts one review',()=>{
  const s=quiet();s.storage['dragon-droppings']=2;const c=E.spawnCustomer(s,{species:'witch',special:true,guided:true,request:{tags:['fertilizer']},budget:30});run(s,5);
  assert.equal(c.satisfaction,100);E.dispatch(s,c.id,'maze-pretzel');assert.equal(c.satisfaction,92);assert.equal(s.reviews,0);
  E.dispatch(s,c.id,'dragon-droppings');run(s,35);assert.equal(s.reviews,1);assert.equal(s.stats.reviews,1);assert.ok(s.satisfaction<=92);assert.equal(E.summary(s).satisfaction,s.satisfaction);
  const reviews=s.reviews;run(s,10);assert.equal(s.reviews,reviews);assert.equal(E.restore(E.serialize(s)).satisfaction,s.satisfaction);
});
test('unmet demand records dissatisfaction and old version-2 saves receive safe review defaults',()=>{
  const s=quiet();shelf(s).stock=0;E.spawnCustomer(s,{species:'minotaur'});run(s,10);assert.equal(s.reviews,1);assert.equal(s.satisfaction,40);
  const old=JSON.parse(E.serialize(s));delete old.satisfaction;delete old.satisfactionTotal;delete old.reviews;delete old.stats.reviews;delete old.stats.satisfactionTotal;
  const loaded=E.restore(old);assert.ok(loaded);assert.equal(loaded.satisfaction,100);assert.equal(loaded.reviews,0);
});
