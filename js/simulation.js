(function(root){
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./catalog.js') : root.ShopCatalog;
  const facilities = {
    shelf:{name:'Oak display',cost:45,w:2,h:1,capacity:12,storage:'normal',effect:'Holds 12 normal goods. Each upgrade adds 8 slots.'},
    cold:{name:'Chilled spirit display',cost:85,w:2,h:1,capacity:12,storage:'cold',effect:'Stores cold goods. Within 2 tiles of a spirit lantern: 20% chance to favor a Ghost arrival; interval 1s shorter (minimum 4s). Does not stack.'},
    fireproof:{name:'Fireproof display',cost:85,w:2,h:1,capacity:12,storage:'fireproof',effect:'Holds heat-sensitive volcanic stock safely.'},
    moisture:{name:'Moisture-safe display',cost:70,w:2,h:1,capacity:12,storage:'moisture',effect:'Sealed display for slime hydration supplies.'},
    storage:{name:'Stockroom chest',cost:0,w:2,h:1,fixed:true,effect:'Safe separated storage for every product type.'},
    receiving:{name:'Receiving crates',cost:0,w:1,h:1,fixed:true,effect:'Incoming wholesale batches arrive here.'},
    inspection:{name:'Inspection desk',cost:0,w:2,h:1,fixed:true,effect:'Identify unknown goods; parcel staff sort discovered SKUs.'},
    returns:{name:'Human returns rack',cost:0,w:1,h:1,fixed:true,effect:'Human misdeliveries stay separate from saleable inventory.'},
    service:{name:'Special-order counter',cost:0,w:2,h:1,fixed:true,effect:'Customers request named products or compatible categories.'},
    checkout:{name:'Checkout',cost:65,w:2,h:1,effect:'A cashier travels here to process payments. Upgrades shorten payment time.'},
    lantern:{name:'Spirit pumpkin lantern',cost:30,w:1,h:1,effect:'Within 2 tiles: waiting patience drains 20% slower. One cold display nearby creates Ghost Corner; bonus does not stack.'}
  };
  const product=id=>C.products.find(p=>p.id===id);
  const result=(ok,message,extra={})=>({ok,message,...extra});
  const capacity=o=>(facilities[o.type]?.capacity||0)+(o.level-1)*8;
  function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function occupied(s,x,y,ignore){return s.objects.some(o=>o.id!==ignore&&x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h);}
  function walkable(s,x,y,ignore){return x>=0&&y>=0&&x<s.width&&y<s.height&&!occupied(s,x,y,ignore);}
  function path(s,from,to){
    if(!from||!to||!walkable(s,to.x,to.y))return null;
    const queue=[{x:Math.round(from.x),y:Math.round(from.y),path:[]}],seen=new Set();
    while(queue.length){const n=queue.shift(),key=n.x+','+n.y;if(seen.has(key))continue;seen.add(key);if(n.x===to.x&&n.y===to.y)return n.path;
      for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=n.x+dx,y=n.y+dy;if(walkable(s,x,y))queue.push({x,y,path:[...n.path,{x,y}]});}}
    return null;
  }
  function interaction(s,o){return o.rotation===1?{x:o.x+o.w,y:o.y}:{x:o.x,y:o.y+o.h};}
  function compatible(p,species,request){
    if(!p||p.human||p.forbiddenSpecies?.includes(species)||(species==='minotaur'&&p.tags.includes('beef')))return false;
    if(p.species.length&&!p.species.includes(species))return false;
    if(!request)return true;
    if(request.productId)return request.productId===p.id;
    return !request.tags?.length||request.tags.every(tag=>p.tags.includes(tag));
  }
  function log(s,type,text,extra={}){s.events.push({time:+s.clock.toFixed(1),type,text,...extra});if(s.events.length>80)s.events.shift();}
  function post(s,type,amount,extra={}){const e={id:'tx-'+s.nextId++,shift:s.shift,time:s.clock,type,amount,...extra};s.ledger.push(e);s.cash+=amount;return e;}
  function object(id,type,x,y,sku=null,stock=0){const f=facilities[type];return {id,type,x,y,w:f.w,h:f.h,rotation:0,level:1,sku,stock};}
  function create(seed=42){
    return {version:2,seed:seed>>>0,nextId:10,width:10,height:9,entrance:{x:4,y:8},cash:220,reputation:20,satisfaction:100,satisfactionTotal:0,reviews:0,shift:1,phase:'prep',clock:0,duration:240,paused:false,priceTier:'standard',spawnTimer:1,
      objects:[object('stockroom','storage',0,0),object('receiving','receiving',3,0),object('inspection','inspection',5,0),object('returns','returns',8,0),object('shelf-1','shelf',1,3,'maze-pretzel',8),object('shelf-2','shelf',5,3,'pocket-magnet',8),object('service','service',1,6),object('checkout-1','checkout',6,6)],
      customers:[],staff:[{id:'intern',name:'You · Intern',sprite:'witch',x:4,y:7,roles:['cashier','stock','parcel'],level:1,wage:0,job:null,path:[],moveTimer:0}],storage:{'maze-pretzel':8,'pocket-magnet':8},parcels:[{id:'parcel-intro',sku:'dragon-droppings',qty:6,cost:4,status:'unknown',tried:[],penalized:false,tutorial:true},{id:'parcel-human',sku:'tax-forms',qty:1,cost:0,status:'unknown',tried:[],penalized:false}],discovered:['maze-pretzel','pocket-magnet'],ledger:[],reports:[],events:[],departed:0,served:0,mistakes:0,stats:{sales:{},unmet:{},revenue:0,cogs:0,wages:0},recoveries:0,recoveryShifts:[],orders:[],settled:[],expanded:false,guidedDone:false,guidedSpawned:false};
  }
  const price=(s,p)=>Math.round(p.price*({bargain:.8,standard:1,premium:1.4}[s.priceTier]||1));
  function route(s,e,to){const route=path(s,e,to);if(route===null)return false;e.path=route;e.destination={...to};e.moveTimer=0;return true;}
  function walk(s,e,dt){if(!e.path?.length){if(e.destination&&(e.x!==e.destination.x||e.y!==e.destination.y)){if(!route(s,e,e.destination))return false;}else return true;}e.moveTimer=(e.moveTimer||0)+dt;
    while(e.moveTimer>=.32&&e.path.length){e.moveTimer-=.32;const n=e.path.shift();if(!walkable(s,n.x,n.y)){e.path=[];return false;}e.x=n.x;e.y=n.y;}return !e.path.length;}
  function reservationCount(s,id){return s.customers.filter(c=>c.reservation?.source===id&&!c.paid).length;}
  function release(s,c){c.reservation=null;for(const w of s.staff){if(w.job?.customerId===c.id){w.job=null;w.path=[];w.destination=null;w.carrying=null;}}}
  function leave(s,c,reason){release(s,c);c.phase='leaving';c.thought=reason;route(s,c,s.entrance);log(s,'leave',c.name+': '+reason,{customerId:c.id});}
  function review(s,c,score){if(c.reviewed)return;c.reviewed=true;const rating=Math.max(0,Math.min(100,Math.round(score)));c.satisfaction=rating;
    s.satisfactionTotal=(s.satisfactionTotal||0)+rating;s.reviews=(s.reviews||0)+1;s.satisfaction=Math.round(s.satisfactionTotal/s.reviews);
    s.stats.satisfactionTotal=(s.stats.satisfactionTotal||0)+rating;s.stats.reviews=(s.stats.reviews||0)+1;
  }
  function unmet(s,c,reason){s.stats.unmet[reason]=(s.stats.unmet[reason]||0)+1;
    const wanted=c.request?.productId||(c.reservation?.sku)||c.interestSku;if(wanted){s.stats.unmetProducts ||= {};s.stats.unmetProducts[wanted] ||= {};s.stats.unmetProducts[wanted][reason]=(s.stats.unmetProducts[wanted][reason]||0)+1;}
    review(s,c,Math.min(c.satisfaction,reason==='Waited too long'?20:40));s.reputation=Math.max(0,s.reputation-.15);leave(s,c,reason);}
  function unlockedSpecies(s){const groups=[['minotaur','goblin'],['centaur','skeleton'],['witch','dragonkin'],['ghost','slime'],['vampire','werewolf'],['mummy','imp']];return groups.slice(0,Math.min(6,s.shift)).flat();}
  function spawnCustomer(s,opts={}){
    const available=unlockedSpecies(s);let species=opts.species||available[Math.floor(random(s)*available.length)];
    if(!opts.species&&ghostCorner(s)&&available.includes('ghost')&&random(s)<.2)species='ghost';
    const names={minotaur:'Mino',goblin:'Nib',centaur:'Clover',skeleton:'Rattle',witch:'Hazel',dragonkin:'Ember',ghost:'Boo',slime:'Jellybean',vampire:'Count Sip',werewolf:'Floof',mummy:'Linen',imp:'Pip'};
    const c={id:'customer-'+s.nextId++,name:opts.name||names[species]+' '+['Jr.','the Polite','II','the Hungry'][Math.floor(random(s)*4)],species,x:s.entrance.x,y:s.entrance.y,phase:'entering',path:[],moveTimer:0,timer:0,patience:opts.patience??100,budget:opts.budget??(18+Math.floor(random(s)*18)),satisfaction:100,waitTime:0,reviewed:false,request:opts.request||null,special:!!opts.special,guided:!!opts.guided,reservation:null,paid:false,thought:'Ooh. A shop!',visited:[]};
    if(c.special&&!c.request){const possible=C.products.filter(p=>!p.human&&p.unlock<=s.shift&&compatible(p,species));const p=possible[Math.floor(random(s)*possible.length)];if(p)c.request=random(s)<.5?{productId:p.id}:{tags:[p.tags[0]]};else c.special=false;}
    const interests=C.products.filter(p=>p.unlock<=s.shift&&compatible(p,species));const interest=interests[Math.floor(random(s)*interests.length)];c.interestSku=interest?.id||null;c.preferences=interest?[interest.tags[0]]:[];
    s.customers.push(c);log(s,'enter',c.name+' enters.',{customerId:c.id});return c;
  }
  function choose(s,c){
    if(c.special){const counter=s.objects.find(o=>o.type==='service');if(counter&&route(s,c,interaction(s,counter))){c.phase='to-service';c.thought=c.request.productId?'I ordered '+product(c.request.productId).name:'Looking for '+c.request.tags.join(' + ');return;}unmet(s,c,'Service counter unreachable');return;}
    const shelves=s.objects.filter(o=>facilities[o.type]?.capacity&&o.sku&&o.stock>reservationCount(s,o.id)&&compatible(product(o.sku),c.species)).sort((a,b)=>Number(c.preferences.some(t=>product(b.sku).tags.includes(t)))-Number(c.preferences.some(t=>product(a.sku).tags.includes(t))));
    let affordable=false;
    for(const o of shelves){const p=product(o.sku);if(price(s,p)>c.budget)continue;affordable=true;const to=interaction(s,o);if(!route(s,c,to))continue;
      c.reservation={source:o.id,sku:p.id,price:price(s,p),cost:p.cost};c.phase='walking';c.thought='Found '+p.name;c.visited.push(o.id);log(s,'reserve',c.name+' reserves '+p.name,{customerId:c.id,sku:p.id});return;}
    unmet(s,c,shelves.length&&!affordable?'Too pricey':shelves.length?'No reachable display':'Sold out');
  }
  function pay(s,c){
    if(c.paid||!c.reservation)return false;const r=c.reservation,p=product(r.sku),o=s.objects.find(o=>o.id===r.source);
    if(r.source==='storage'){if((s.storage[r.sku]||0)<1){unmet(s,c,'Stock moved');return false;}s.storage[r.sku]--;}
    else if(!o||o.stock<1){unmet(s,c,'Stock moved');return false;}else o.stock--;
    c.paid=true;c.purchased=p.id;c.reservation=null;s.served++;s.stats.revenue+=r.price;s.stats.cogs+=r.cost;s.stats.sales[p.id]=(s.stats.sales[p.id]||0)+1;
    if(c.guided)s.guidedDone=true;
    post(s,'sale',r.price,{customerId:c.id,sku:p.id,cogs:r.cost});review(s,c,c.satisfaction-Math.floor((c.waitTime||0)/15));s.reputation=Math.min(100,s.reputation+.4);log(s,'payment',c.name+' paid '+r.price+' coins.',{customerId:c.id,sku:p.id});leave(s,c,'Lovely! Thank you.');return true;
  }
  function processCustomers(s,dt){
    for(const c of [...s.customers]){
      if(c.phase==='entering'){c.timer+=dt;if(c.timer>=.7)choose(s,c);}
      else if(c.phase==='walking'){if(walk(s,c,dt)){c.phase='browsing';c.timer=0;c.thought='Just what I need.';}}
      else if(c.phase==='browsing'){c.timer+=dt;if(c.timer>=2){const checkout=s.objects.filter(o=>o.type==='checkout'&&path(s,c,interaction(s,o))!==null).sort((a,b)=>s.customers.filter(c=>c.checkout===a.id&&c.phase!=='leaving').length-s.customers.filter(c=>c.checkout===b.id&&c.phase!=='leaving').length)[0];if(!checkout){unmet(s,c,'Where is the queue?');continue;}c.checkout=checkout.id;route(s,c,interaction(s,checkout));c.phase='to-checkout';c.thought='Off to pay.';}}
      else if(c.phase==='to-checkout'){if(walk(s,c,dt)){c.phase='queue';c.thought='Ready to pay';log(s,'queue',c.name+' joins checkout.',{customerId:c.id});}}
      else if(c.phase==='to-service'){if(walk(s,c,dt)){c.phase='request';c.thought=c.request.productId?'Order: '+product(c.request.productId).name:'Order: '+c.request.tags.join(' / ');}}
      else if(c.phase==='leaving'){if(walk(s,c,dt)){s.customers=s.customers.filter(e=>e.id!==c.id);s.departed++;log(s,'exit',c.name+' leaves the shop.',{customerId:c.id});}}
      if(!['leaving','entering'].includes(c.phase)){c.waitTime=(c.waitTime||0)+dt;const nearLantern=s.objects.some(o=>o.type==='lantern'&&Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=2);c.patience-=dt*(nearLantern?.8:1);if(c.patience<=0){if(c.guided)s.guidedSpawned=false;unmet(s,c,'Waited too long');}}
    }
  }
  function storageAvailable(s,sku){return Math.max(0,(s.storage[sku]||0)-s.customers.filter(c=>c.reservation?.source==='storage'&&c.reservation.sku===sku).length-s.staff.filter(w=>w.job?.type==='stock'&&w.job.sku===sku).reduce((n,w)=>n+w.job.qty,0));}
  function getJob(s,w){
    // Assigned special deliveries are intern work; routine parcel collections can be covered by parcel staff.
    const waiting=s.customers.find(c=>c.phase==='assigned'&&!s.staff.some(v=>v.job?.customerId===c.id));
    if(waiting&&(w.id==='intern'||w.roles.includes('parcel'))){const source=waiting.reservation.source==='storage'?s.objects.find(o=>o.type==='storage'):s.objects.find(o=>o.id===waiting.reservation.source);if(source&&route(s,w,interaction(s,source)))return {type:'delivery',customerId:waiting.id,remaining:1,stage:'pickup'};}
    for(const role of w.roles){
      if(role==='cashier'){const c=s.customers.find(c=>c.phase==='queue'&&!s.staff.some(v=>v.job?.customerId===c.id||v.job?.checkoutId===c.checkout));if(c){const checkout=s.objects.find(o=>o.id===c.checkout);if(checkout&&route(s,w,interaction(s,checkout)))return {type:'cashier',customerId:c.id,checkoutId:checkout.id,remaining:5/(1+(checkout.level-1)*.5)};}}
      if(role==='stock'){
        const shelf=s.objects.find(o=>facilities[o.type]?.capacity&&o.sku&&o.stock<capacity(o)&&storageAvailable(s,o.sku)>0&&!s.staff.some(v=>v.job?.objectId===o.id));
        if(shelf){const store=s.objects.find(o=>o.type==='storage');if(store&&path(s,w,interaction(s,shelf))!==null&&route(s,w,interaction(s,store)))return {type:'stock',objectId:shelf.id,sku:shelf.sku,qty:Math.min(4,capacity(shelf)-shelf.stock,storageAvailable(s,shelf.sku)),remaining:1,stage:'pickup'};}
      }
      if(role==='parcel'){
        const parcel=s.parcels.find(p=>p.status==='known'&&!s.staff.some(v=>v.job?.parcelId===p.id));
        if(parcel){const desk=s.objects.find(o=>o.type==='inspection');if(route(s,w,interaction(s,desk)))return {type:'parcel',parcelId:parcel.id,remaining:3};}
        const c=s.customers.find(c=>c.phase==='request'&&!c.guided);
        if(c){const p=C.products.find(p=>compatible(p,c.species,c.request)&&availableStock(s,p.id)>0&&price(s,p)<=c.budget);if(p)dispatch(s,c.id,p.id);}
      }
    }
    return null;
  }
  function processStaff(s,dt){
    for(const w of s.staff){if(!w.job)w.job=getJob(s,w);if(!w.job)continue;
      if(w.job.customerId&&!s.customers.some(c=>c.id===w.job.customerId)){w.job=null;w.path=[];continue;}
      if(!walk(s,w,dt))continue;
      w.job.remaining-=dt*(1+(w.level-1)*.35);if(w.job.remaining>0)continue;
      const j=w.job;
      if(j.type==='cashier'){const c=s.customers.find(c=>c.id===j.customerId);if(c?.phase==='queue')pay(s,c);w.job=null;}
      else if(j.type==='stock'){
        const o=s.objects.find(o=>o.id===j.objectId);
        if(!o){w.job=null;continue;}
        if(j.stage==='pickup'){j.stage='carry';j.remaining=1;w.carrying=j.sku;if(!route(s,w,interaction(s,o))){w.job=null;w.carrying=null;}}
        else {const qty=Math.min(j.qty,s.storage[j.sku]||0,capacity(o)-o.stock);s.storage[j.sku]-=qty;o.stock+=qty;w.job=null;w.carrying=null;log(s,'stock',w.name+' stocked '+qty+' '+product(j.sku).name);}
      }else if(j.type==='parcel'){const parcel=s.parcels.find(p=>p.id===j.parcelId);if(parcel?.status==='known')sortParcel(s,parcel);w.job=null;}
      else if(j.type==='delivery'){
        const c=s.customers.find(c=>c.id===j.customerId);
        if(!c?.reservation){w.job=null;w.carrying=null;continue;}
        if(j.stage==='pickup'){j.stage='carry';j.remaining=2;w.carrying=c.reservation.sku;const counter=s.objects.find(o=>o.type==='service');if(!route(s,w,interaction(s,counter))){leave(s,c,'Service counter unreachable');w.job=null;w.carrying=null;}}
        else {pay(s,c);w.job=null;w.carrying=null;}
      }
    }
  }
  function openShift(s){if(s.phase!=='prep')return result(false,'The shop is already open.');s.phase='open';log(s,'open','Halloween shift '+s.shift+' is open.');return result(true,'Doors open! The monsters will shop on their own.');}
  function closeShift(s){if(s.phase!=='open')return result(false,'No open shift.');s.phase='closing';return result(true,'Closing: finishing current purchases.');}
  function summary(s){return {...s.stats,satisfaction:s.stats.reviews?Math.round(s.stats.satisfactionTotal/s.stats.reviews):s.satisfaction,profit:s.stats.revenue-s.stats.cogs-s.stats.wages,cashflow:s.ledger.filter(e=>e.shift===s.shift).reduce((n,e)=>n+e.amount,0),cash:s.cash,served:Object.values(s.stats.sales).reduce((n,v)=>n+v,0),shift:s.shift};}
  function settle(s){if(s.settled.includes(s.shift))return;s.settled.push(s.shift);const wages=s.staff.reduce((n,w)=>n+w.wage,0);post(s,'wages',-wages);s.stats.wages+=wages;for(const w of s.staff){w.job=null;w.carrying=null;w.path=[];w.destination=null;}s.reports.push(summary(s));s.phase=s.shift>=6?'complete':'report';log(s,'settle','Shift complete. Time for a biscuit.');}
  function tick(s,dt){if(s.paused||!['open','closing'].includes(s.phase)||!Number.isFinite(dt)||dt<=0)return s;dt=Math.min(dt,1);
    s.clock+=dt;
    for(const order of s.orders.filter(o=>!o.arrived)){order.remaining-=dt;if(order.remaining<=0){order.arrived=true;addParcel(s,order.sku,order.qty);log(s,'supply','A supply crate arrived at receiving.');}}
    if(s.phase==='open'){s.spawnTimer-=dt;if(s.spawnTimer<=0){
      if(!s.guidedDone&&!s.guidedSpawned&&s.clock>15&&s.discovered.includes('dragon-droppings')){spawnCustomer(s,{species:'witch',name:'Hazel · garden club',special:true,guided:true,request:{productId:'dragon-droppings'},patience:180,budget:30});s.guidedSpawned=true;}
      else spawnCustomer(s,{special:s.shift>1&&random(s)<.2});s.spawnTimer=Math.max(4,8-(s.shift-1)*.4-(ghostCorner(s)?1:0));}if(s.clock>=s.duration)s.phase='closing';}
    processCustomers(s,dt);processStaff(s,dt);if(s.phase==='closing'&&!s.customers.length)settle(s);return s;
  }
  function stockShelf(s,id,sku,qty){const o=s.objects.find(o=>o.id===id),p=product(sku);qty=Math.floor(qty);if(!o||!p||p.human||!facilities[o.type]?.capacity||!Number.isFinite(qty)||qty<1)return result(false,'Choose a saleable product and display.');if(facilities[o.type].storage!==p.storage)return result(false,'This product needs a '+p.storage+' display.');if(o.stock&&o.sku!==sku)return result(false,'Empty the display before changing products.');if(s.staff.some(w=>w.job?.objectId===id))return result(false,'The stock assistant is already working on this display.');const n=Math.min(qty,storageAvailable(s,sku),capacity(o)-o.stock);if(n<=0)return result(false,'No storage stock or shelf capacity.');o.sku=sku;if(s.phase==='open'||s.phase==='closing')return result(true,'Display assigned. A stock assistant will carry goods from storage.');s.storage[sku]-=n;o.stock+=n;return result(true,'Stocked '+n+' units during preparation.');}
  function availableStock(s,sku){return storageAvailable(s,sku)+s.objects.filter(o=>o.sku===sku).reduce((n,o)=>n+Math.max(0,o.stock-reservationCount(s,o.id)),0);}
  function addParcel(s,sku,qty){const p=product(sku);const parcel={id:'parcel-'+s.nextId++,sku,qty,cost:p.cost,status:s.discovered.includes(sku)?'known':'unknown',tried:[],penalized:false};s.parcels.push(parcel);return parcel;}
  function sortParcel(s,parcel){const p=product(parcel.sku);if(!['unknown','known'].includes(parcel.status))return;
    if(p.human){parcel.status='return';log(s,'return','Human misdelivery flagged. Keep it off the shelves.');}
    else{s.storage[p.id]=(s.storage[p.id]||0)+parcel.qty;parcel.status='sorted';log(s,'discovery',p.name+' ×'+parcel.qty+' entered storage.');}
    if(!s.discovered.includes(p.id))s.discovered.push(p.id);
  }
  function buy(s,sku,qty=6){const p=product(sku);qty=Math.floor(qty);if(!p||p.human||p.unlock>s.shift||qty<1||qty>24)return result(false,'Choose an unlocked wholesale product, 1–24 units.');const cost=p.cost*qty;if(s.cash<cost)return result(false,'Not enough coins for this batch.');post(s,'wholesale',-cost,{sku,qty});
    if(s.phase==='prep'||s.phase==='report')addParcel(s,sku,qty);else s.orders.push({id:'order-'+s.nextId++,sku,qty,remaining:8,arrived:false});
    if(s.nextId%3===0){const humans=C.products.filter(p=>p.human&&p.unlock<=s.shift);if(humans.length)addParcel(s,humans[Math.floor(random(s)*humans.length)].id,1);}
    return result(true,'Batch ordered for '+cost+' coins. Mixed labels await inspection.');}
  function identify(s,id,index){const parcel=s.parcels.find(p=>p.id===id);if(!parcel||!['unknown','known'].includes(parcel.status))return result(false,'This parcel is already processed.');const p=product(parcel.sku);if(!Number.isInteger(index)||index<0||index>2||parcel.tried.includes(index))return result(false,'Try a remaining name.');parcel.tried.push(index);
    if(index!==p.correctIndex){s.mistakes++;if(!parcel.penalized&&!parcel.tutorial){s.reputation=Math.max(0,s.reputation-.5);parcel.penalized=true;}return result(false,p.wrongReaction||'A spectacular mix-up! '+p.clue,{retry:true});}
    sortParcel(s,parcel);return result(true,p.description,{discovery:true,sku:p.id});}
  function returnParcel(s,id){const p=s.parcels.find(p=>p.id===id);if(!p||p.status!=='return')return result(false,'Identify the manifest first.');p.status='returned';log(s,'return','Human parcel returned to its rightful depot.');return result(true,'Returned. Their paperwork is their problem.');}
  function dispatch(s,id,sku){const c=s.customers.find(c=>c.id===id),p=product(sku);if(!c||c.phase!=='request'||!p)return result(false,'Choose a customer waiting at the service counter.');
    if(!compatible(p,c.species,c.request)){c.satisfaction=Math.max(0,(c.satisfaction??100)-8);c.patience=Math.max(15,c.patience-4);s.mistakes++;s.reputation=Math.max(0,s.reputation-.3);c.thought=c.species==='ghost'&&p.tags.includes('hoof')?'Lovely. I will apply it to the feet I stopped owning in 1842.':c.species==='minotaur'&&p.tags.includes('beef')?'We need to discuss your understanding of customer relations.':'I requested '+(c.request.productId?product(c.request.productId).name:c.request.tags.join(' + '))+', not '+p.name+'.';return result(false,c.thought);}
    if(price(s,p)>c.budget)return result(false,'Too pricey for this customer. Try Bargain pricing.');
    const shelf=s.objects.find(o=>o.sku===sku&&o.stock>reservationCount(s,o.id)&&path(s,s.entrance,interaction(s,o))!==null);
    const source=storageAvailable(s,sku)>0?'storage':shelf?.id;if(!source)return result(false,'No unreserved stock available.');
    c.reservation={source,sku,price:price(s,p),cost:p.cost};c.phase='assigned';c.thought='My parcel is on its way!';return result(true,'Assigned. A worker will collect and carry the goods.');}
  function setPrice(s,tier){if(!['bargain','standard','premium'].includes(tier))return result(false,'Unknown price tier.');s.priceTier=tier;return result(true,'Prices changed. Existing reserved quotes remain honored.');}
  function hire(s,roles=['cashier','stock','parcel']){if(s.shift<3)return result(false,'Temporary staff unlock in shift 3.');if(s.staff.length>=4)return result(false,'Four staff is plenty for this little shop.');if(s.cash<45)return result(false,'Hiring costs 45 coins.');post(s,'hiring',-45);const n=s.staff.length;const w={id:'staff-'+s.nextId++,name:['','Nib · temp','Rattle · temp','Pip · temp'][n],sprite:['','goblin','skeleton','imp'][n],x:4,y:7,roles:['cashier','stock','parcel'].filter(r=>roles.includes(r)),level:1,wage:10,job:null,path:[],moveTimer:0};s.staff.push(w);return result(true,'Hired '+w.name+'. Wage: 10 coins per shift.');}
  function assign(s,id,roles){const w=s.staff.find(w=>w.id===id);if(!w||!Array.isArray(roles)||roles.some(r=>!['cashier','stock','parcel'].includes(r)))return result(false,'Choose valid job priorities.');w.roles=[...new Set(roles)];return result(true,'Priorities updated. Current work finishes first.');}
  function train(s,id){const w=s.staff.find(w=>w.id===id);if(!w||w.level>=4)return result(false,'Training already complete.');const cost=25*w.level;if(s.cash<cost)return result(false,'Training needs '+cost+' coins.');post(s,'training',-cost);w.level++;return result(true,'Work speed improved by 35% of base speed.');}
  function ghostCorner(s){return s.objects.some(o=>o.type==='cold'&&s.objects.some(l=>l.type==='lantern'&&Math.abs(l.x-o.x)+Math.abs(l.y-o.y)<=2));}
  function validatePlacement(s,type,x,y,rotation=0,id=null){
    const f=facilities[type];if(!f||!Number.isInteger(x)||!Number.isInteger(y)||![0,1].includes(rotation))return result(false,'Select a valid floor tile.');
    const candidate={...object(id||'preview',type,x,y),rotation,w:rotation?f.h:f.w,h:rotation?f.w:f.h};
    for(let xx=x;xx<x+candidate.w;xx++)for(let yy=y;yy<y+candidate.h;yy++)if(!walkable(s,xx,yy,id)||(xx===s.entrance.x&&yy===s.entrance.y))return result(false,'That space is occupied, locked, or blocks the entrance.');
    if(s.customers.some(c=>c.x>=x&&c.x<x+candidate.w&&c.y>=y&&c.y<y+candidate.h)||s.staff.some(w=>w.x>=x&&w.x<x+candidate.w&&w.y>=y&&w.y<y+candidate.h))return result(false,'Someone is standing there. Choose another tile.');
    const probe={...s,objects:[...s.objects.filter(o=>o.id!==id),candidate]};
    for(const o of probe.objects){if(o.type==='lantern')continue;const pos=interaction(probe,o);if(path(probe,s.entrance,pos)===null)return result(false,'Blocks access to '+facilities[o.type].name+'. Leave its service edge clear.');}
    for(const e of [...s.customers,...s.staff])if(path(probe,e,s.entrance)===null)return result(false,'This would trap someone inside the shop.');
    return result(true,'Placement is reachable.',{object:candidate});
  }
  function rebuildPaths(s){for(const e of [...s.customers,...s.staff]){if(e.path?.length){const target=e.path[e.path.length-1];route(s,e,target);}}}
  function place(s,type,x,y,rotation=0){const f=facilities[type];if(!f||f.fixed)return result(false,'This facility is part of the original building.');if(['cold','fireproof','moisture'].includes(type)&&s.shift<4)return result(false,'Specialist displays unlock in shift 4.');if(s.cash<f.cost)return result(false,'Not enough coins.');const check=validatePlacement(s,type,x,y,rotation);if(!check.ok)return check;const o=check.object;o.id='fixture-'+s.nextId++;s.objects.push(o);post(s,'furniture',-f.cost,{objectId:o.id});rebuildPaths(s);return result(true,'Placed '+f.name+'.',{objectId:o.id});}
  function move(s,id,x,y,rotation=0){const o=s.objects.find(o=>o.id===id);if(!o||facilities[o.type].fixed)return result(false,'This facility is fixed to the building.');if(reservationCount(s,id)||s.staff.some(w=>w.job?.objectId===id)||s.customers.some(c=>c.checkout===id&&c.phase!=='leaving'))return result(false,'Finish its current customers or stock job before moving.');const check=validatePlacement(s,o.type,x,y,rotation,id);if(!check.ok)return check;Object.assign(o,{x,y,w:check.object.w,h:check.object.h,rotation});rebuildPaths(s);return result(true,'Moved safely; its stock stays on the shelf.');}
  function remove(s,id){const o=s.objects.find(o=>o.id===id);if(!o||facilities[o.type].fixed)return result(false,'This facility cannot be removed.');if(o.type==='checkout'&&s.objects.filter(o=>o.type==='checkout').length===1)return result(false,'Keep at least one checkout.');if(reservationCount(s,id)||s.staff.some(w=>w.job?.objectId===id)||s.customers.some(c=>c.checkout===id&&c.phase!=='leaving'))return result(false,'Finish current work before removing this fixture.');if(o.sku&&o.stock)s.storage[o.sku]=(s.storage[o.sku]||0)+o.stock;s.objects=s.objects.filter(x=>x.id!==id);post(s,'salvage',Math.floor(facilities[o.type].cost/2));rebuildPaths(s);return result(true,'Removed. All stock returned safely to storage; half the base price refunded.');}
  function upgrade(s,id){const o=s.objects.find(o=>o.id===id);if(!o||(!facilities[o.type].capacity&&o.type!=='checkout'))return result(false,'This facility has no upgrade.');if(o.level>=3)return result(false,'Maximum level reached.');const cost=35*o.level;if(s.cash<cost)return result(false,'Upgrade needs '+cost+' coins.');post(s,'upgrade',-cost,{objectId:id});o.level++;return result(true,o.type==='checkout'?'Checkout processing is faster.':'Display capacity increased by 8.');}
  function expand(s){if(s.expanded)return result(false,'The extension is already open.');if(s.shift<5)return result(false,'Expansion unlocks in shift 5.');if(!['prep','report'].includes(s.phase))return result(false,'The magical builders work between shifts.');if(s.cash<160)return result(false,'Expansion costs 160 coins.');post(s,'expansion',-160);s.width=14;s.expanded=true;return result(true,'36 new usable floor tiles! The builders have already left.');}
  function recover(s){const stock=Object.values(s.storage).reduce((a,b)=>a+b,0)+s.objects.reduce((a,o)=>a+o.stock,0)+s.parcels.filter(p=>['unknown','known'].includes(p.status)&&!product(p.sku).human).reduce((a,p)=>a+p.qty,0)+s.orders.filter(o=>!o.arrived).reduce((a,o)=>a+o.qty,0);if(s.cash>=6||stock>0)return result(false,'You still have resources. Sell existing goods or order a small batch.');if(s.recoveryShifts.includes(s.shift))return result(false,'This shift’s emergency grant was used. Close the shift to request the next one.');s.recoveryShifts.push(s.shift);s.recoveries++;post(s,'recovery',40-s.cash);s.storage['maze-pretzel']=(s.storage['maze-pretzel']||0)+8;return result(true,'Mr. Marmalade grants 40 coins and 8 pretzels. Nobody tell accounting.');}
  function nextShift(s){if(!['report','complete'].includes(s.phase))return result(false,'Finish the current shift first.');if(s.phase==='complete')return result(false,'The six-shift Halloween campaign is complete.');s.shift++;s.clock=0;s.phase='prep';s.spawnTimer=1;s.stats={sales:{},unmet:{},revenue:0,cogs:0,wages:0};log(s,'shift','Shift '+s.shift+' preparation. New communities and goods unlocked.');return result(true,'Prepare the next Halloween shift.');}
  function serialize(s){return JSON.stringify(s);}
  function restore(raw){try{const s=typeof raw==='string'?JSON.parse(raw):JSON.parse(JSON.stringify(raw));
    if(!s||s.version!==2||![10,14].includes(s.width)||s.height!==9||!Number.isInteger(s.shift)||s.shift<1||s.shift>6||!['prep','open','closing','report','complete'].includes(s.phase)||!Number.isFinite(s.cash)||!Number.isFinite(s.clock)||s.clock<0)return null;
    if(!['bargain','standard','premium'].includes(s.priceTier)||!Number.isFinite(s.reputation)||!Number.isFinite(s.seed)||!Number.isFinite(s.spawnTimer)||typeof s.paused!=='boolean')return null;
    if(!['objects','customers','staff','parcels','discovered','ledger','reports','events','orders','settled','recoveryShifts'].every(k=>Array.isArray(s[k]))||!s.storage||!s.stats)return null;
    const ids=[...s.objects,...s.customers,...s.staff,...s.parcels].map(e=>e.id);if(new Set(ids).size!==ids.length)return null;
    if(Object.entries(s.storage).some(([id,n])=>!product(id)||product(id).human||!Number.isInteger(n)||n<0))return null;
    if(s.objects.some(o=>!facilities[o.type]||!Number.isInteger(o.stock)||o.stock<0||!Number.isInteger(o.level)||o.level<1||o.level>3||![0,1].includes(o.rotation)||o.sku&&(!product(o.sku)||product(o.sku).human)||!Number.isInteger(o.x)||!Number.isInteger(o.y)||!Number.isInteger(o.w)||!Number.isInteger(o.h)||o.w<1||o.h<1||o.x<0||o.y<0||o.x+o.w>s.width||o.y+o.h>s.height))return null;
    if(s.parcels.some(p=>!product(p.sku)||!Number.isInteger(p.qty)||p.qty<1||!Array.isArray(p.tried)||!['unknown','known','sorted','return','returned'].includes(p.status)))return null;
    if(!s.objects.some(o=>o.type==='checkout')||!s.objects.some(o=>o.type==='storage')||!s.objects.some(o=>o.type==='service')||!s.staff.some(w=>w.id==='intern'))return null;
    const phases=['entering','walking','browsing','to-checkout','queue','to-service','request','assigned','leaving'];
    if(s.customers.some(c=>!phases.includes(c.phase)||!Array.isArray(c.path)||!Array.isArray(c.preferences)||!Number.isFinite(c.patience)||!Number.isFinite(c.budget)||!Number.isInteger(c.x)||!Number.isInteger(c.y)||c.special&&(!c.request||!c.request.productId&&!Array.isArray(c.request.tags)||c.request.productId&&!product(c.request.productId))||c.reservation&&(!product(c.reservation.sku)||product(c.reservation.sku).human||c.paid||!Number.isFinite(c.reservation.price)||!Number.isFinite(c.reservation.cost)||(c.reservation.source==='storage'?(s.storage[c.reservation.sku]||0)<1:!s.objects.some(o=>o.id===c.reservation.source&&o.sku===c.reservation.sku)))))return null;
    for(const o of s.objects)if(reservationCount(s,o.id)>o.stock)return null;
    for(const sku of Object.keys(s.storage))if(s.customers.filter(c=>c.reservation?.source==='storage'&&c.reservation.sku===sku).length>s.storage[sku])return null;
    if(s.staff.some(w=>!Array.isArray(w.roles)||w.roles.some(r=>!['cashier','stock','parcel'].includes(r))||!Array.isArray(w.path)||!Number.isInteger(w.level)||w.level<1||w.level>4||w.job&&(!Number.isFinite(w.job.remaining)||!['cashier','stock','parcel','delivery'].includes(w.job.type))))return null;
    for(const e of [...s.customers,...s.staff])if(!Number.isInteger(e.x)||!Number.isInteger(e.y)||e.x<0||e.y<0||e.x>=s.width||e.y>=s.height||!Number.isFinite(e.moveTimer)||e.path.some(p=>!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x>=s.width||p.y>=s.height))return null;
    if(s.ledger.some(e=>!Number.isFinite(e.amount)||!Number.isInteger(e.shift))||new Set(s.ledger.map(e=>e.id)).size!==s.ledger.length)return null;
    const sales=s.ledger.filter(e=>e.type==='sale').map(e=>e.customerId);if(new Set(sales).size!==sales.length)return null;
    const claimed=s.staff.filter(w=>w.job?.customerId).map(w=>w.job.customerId);if(new Set(claimed).size!==claimed.length)return null;
    if(!Number.isInteger(s.nextId)||s.nextId<1||!Number.isFinite(s.duration)||s.duration<1)return null;
    // Early version-2 saves predate reviews. They retain their money and reservations,
    // and begin collecting satisfaction reviews from this point onward.
    s.satisfaction ??=100;s.satisfactionTotal ??=0;s.reviews ??=0;
    if(!Number.isFinite(s.satisfaction)||s.satisfaction<0||s.satisfaction>100||!Number.isFinite(s.satisfactionTotal)||!Number.isInteger(s.reviews)||s.reviews<0)return null;
    s.stats.satisfactionTotal ??=0;s.stats.reviews ??=0;
    for(const c of s.customers){c.satisfaction ??=100;c.waitTime ??=0;c.reviewed ??=false;if(!Number.isFinite(c.satisfaction)||c.satisfaction<0||c.satisfaction>100||!Number.isFinite(c.waitTime)||c.waitTime<0)return null;}
    return s;
  }catch(_){return null;}}
  const api={create,tick,openShift,closeShift,nextShift,spawnCustomer,stockShelf,product,compatible,path,interaction,capacity,facilities,summary,price,walkable,reservationCount,availableStock,unlockedSpecies,buy,identify,returnParcel,dispatch,setPrice,hire,assign,train,place,move,remove,upgrade,expand,recover,serialize,restore,validatePlacement,ghostCorner};
  root.ShopSim=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
