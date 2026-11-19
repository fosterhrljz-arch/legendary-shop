/* Original dimetric shop renderer. Rendering never changes simulation state. */
(function (root) {
  'use strict';
  const P = {
    ground: '#234b45', grass: '#2d5a4b', leaf: '#537652', ink: '#3b3438',
    floor: '#e5b16e', floor2: '#eabd7b', seam: '#b98053', cream: '#ffe9bd',
    wall: '#f2d5ae', wallShade: '#dfb691', purple: '#8e6687', purpleDark: '#634b69',
    wood: '#b87c55', woodLight: '#dfa36b', woodDark: '#845741', green: '#8da877',
    blue: '#9fcad2', orange: '#ed9a59', gold: '#f4cf76', white: '#fff5da'
  };
  const LABELS = {
    shelf: 'Display shelf', cold: 'Chilled spirits', fireproof: 'Fireproof display',
    moisture: 'Moisture display', storage: 'Stockroom', checkout: 'Checkout',
    inspection: 'Inspection desk', service: 'Special orders', receiving: 'Receiving',
    returns: 'Human returns', lantern: 'Pumpkin lantern', spirit: 'Spirit lantern'
  };

  function create(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const cache = new Map();
    const motion = new Map();
    const garden = new Image();
    garden.src = 'assets/garden.png';
    let state = null, options = {}, width = 1000, height = 650;
    let scale = 1, originX = 500, originY = 150, previousWallTime = 0, animationTime = 0;
    let hits = [], destroyed = false;
    const unitX = 32, unitY = 16;

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(240, Math.round(bounds.width || 1000));
      height = Math.max(240, Math.round(bounds.height || 650));
      const ratio = Math.min(2, root.devicePixelRatio || 1);
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const zoom = Number(options.zoom) || 1;
      scale = Math.min(width / 820, height / 540) * zoom;
      // Reserve a clear 4-tile extension on the right even before it is bought.
      originX = width / 2 - 80 * scale + (Number(options.panX) || 0);
      originY = height / 2 - 150 * scale + (Number(options.panY) || 0);
    }

    function point(x, y, z = 0) {
      return { x: originX + (x - y) * unitX * scale, y: originY + ((x + y) * unitY - z) * scale };
    }
    function tileToScreen(x, y) {
      const p = point(x + .5, y + .5);
      const bounds = canvas.getBoundingClientRect();
      return { x: p.x + bounds.left, y: p.y + bounds.top, localX: p.x, localY: p.y };
    }
    function polygon(points, color, stroke) {
      ctx.beginPath();
      points.forEach((p, index) => index ? ctx.lineTo(Math.round(p.x), Math.round(p.y)) : ctx.moveTo(Math.round(p.x), Math.round(p.y)));
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, scale); ctx.stroke(); }
    }
    function line(a, b, color, thickness = 1) {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, thickness * scale); ctx.beginPath();
      ctx.moveTo(Math.round(a.x), Math.round(a.y)); ctx.lineTo(Math.round(b.x), Math.round(b.y)); ctx.stroke();
    }
    function rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function text(value, x, y, size = 10, color = P.ink, align = 'center') {
      ctx.font = `bold ${Math.max(9, Math.round(size * scale))}px 'Trebuchet MS', sans-serif`;
      ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.fillText(value, Math.round(x), Math.round(y));
    }
    function tile(x, y, color, stroke = P.seam, z = 0) {
      polygon([point(x, y, z), point(x + 1, y, z), point(x + 1, y + 1, z), point(x, y + 1, z)], color, stroke);
    }
    function block(x, y, w, h, z, colors = {}) {
      const a = point(x, y, z), b = point(x + w, y, z), c = point(x + w, y + h, z), d = point(x, y + h, z);
      const b0 = point(x + w, y), c0 = point(x + w, y + h), d0 = point(x, y + h);
      polygon([b, c, c0, b0], colors.right || P.woodDark, P.ink);
      polygon([d, c, c0, d0], colors.left || P.wood, P.ink);
      polygon([a, b, c, d], colors.top || P.woodLight, P.ink);
      return { a, b, c, d, b0, c0, d0 };
    }
    function sprite(id) {
      if (!cache.has(id)) {
        const image = document.createElement('canvas');
        root.ShopSprites?.draw(image, id, { shadow: false }); cache.set(id, image);
      }
      return cache.get(id);
    }
    function drawSprite(id, x, y, size, flip = false) {
      const image = sprite(id);
      if (!image.width) return;
      const pixels = Math.round(size * scale);
      ctx.save(); ctx.translate(Math.round(x), Math.round(y));
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(image, -Math.round(pixels / 2), -pixels, pixels, pixels); ctx.restore();
    }
    function label(value, x, y, fill = P.cream, color = P.ink, small = false) {
      const fs = small ? 8 : 10;
      ctx.font = `bold ${Math.max(9, Math.round(fs * scale))}px 'Trebuchet MS', sans-serif`;
      const w = ctx.measureText(value).width + 14 * scale, h = (small ? 16 : 20) * scale;
      rect(x - w / 2 + 2 * scale, y - h / 2 + 3 * scale, w, h, '#342c3544');
      rect(x - w / 2 - scale, y - h / 2 - scale, w + scale * 2, h + scale * 2, P.ink);
      rect(x - w / 2, y - h / 2, w, h, fill); text(value, x, y, fs, color);
      return { x: x - w / 2, y: y - h / 2, w, h };
    }

    function background() {
      rect(0, 0, width, height, P.ground);
      if (garden.complete && garden.naturalWidth) {
        ctx.save(); ctx.globalAlpha = .2;
        const cover = Math.max(width / garden.naturalWidth, height / garden.naturalHeight);
        ctx.drawImage(garden, 0, 0, garden.naturalWidth * cover, garden.naturalHeight * cover);
        ctx.restore();
      }
      // A deterministic little garden texture, not randomized each frame.
      for (let i = 0; i < 86; i++) {
        const x = (i * 137 + 29) % width, y = (i * 83 + 41) % height;
        const hue = i % 3 ? P.grass : '#31574b';
        rect(x, y, 3, 8, hue); rect(x - 4, y + 4, 3, 4, hue); rect(x + 4, y + 3, 3, 5, hue);
      }
      // Ground-level shadow anchors the entire building in the garden.
      polygon([point(-.4, -.4, -14), point(14.4, -.4, -14), point(14.4, 9.5, -14), point(-.4, 9.5, -14)], '#163a36');
    }

    function gardenPlant(x, y, variant = 0) {
      const p = point(x, y), s = scale;
      rect(p.x - 8 * s, p.y - 10 * s, 16 * s, 11 * s, P.woodDark);
      rect(p.x - 10 * s, p.y - 14 * s, 20 * s, 6 * s, P.woodLight);
      [[-11,-24],[0,-33],[9,-22],[-6,-16],[4,-20]].forEach(([a,b], i) => {
        rect(p.x + a * s, p.y + b * s, 12 * s, 10 * s, i % 2 ? '#a4b46b' : '#70956a');
        if (variant && i % 2 === 0) rect(p.x + (a + 3) * s, p.y + (b + 2) * s, 5 * s, 5 * s, variant === 2 ? P.orange : '#c593b2');
      });
    }

    function room() {
      const w = Number(state.width || state.grid?.width || 10), h = Number(state.height || state.grid?.height || 9);
      const extended = w >= 14 || state.expanded;
      // Room foundation has visible thickness; front walls stay low for playability.
      const floor = block(0, 0, w, h, 0, { top: P.floor, left: P.purple, right: P.purpleDark });
      const a = point(0, h), b = point(w, h), c = point(w, 0);
      polygon([a, b, point(w, h, -14), point(0, h, -14)], P.purple, P.ink);
      polygon([b, c, point(w, 0, -14), point(w, h, -14)], P.purpleDark, P.ink);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        tile(x, y, (x + y) % 2 ? P.floor : P.floor2, options.showGrid ? '#986f57' : '#c79561');
        // Wood joints and a small light edge make each tile read as timber.
        line(point(x + .5, y), point(x + .5, y + 1), '#d5a66d', .6);
        if ((x * 3 + y) % 4 === 0) line(point(x + .12, y + .31), point(x + .37, y + .31), '#b8855738');
      }
      if (!extended) {
        for (let y = 0; y < h; y++) for (let x = w; x < 14; x++) tile(x, y, (x + y) % 2 ? '#41665a' : '#496e60', '#688379');
        const corners = [point(w, 0), point(14, 0), point(14, h), point(w, h)];
        ctx.setLineDash([7 * scale, 7 * scale]);
        polygon(corners, '#3d5b5633', '#9db2a1'); ctx.setLineDash([]);
        const p = point(12, 5, 18);
        label('ROOM TO GROW', p.x, p.y, '#b6c5ad', '#334b42');
        text('Unlock a real 4 × 9 extension', p.x, p.y + 23 * scale, 8, '#ccddc1');
        // Ghosted construction frame communicates an actual future floor.
        for (const x of [w, 14]) {
          line(point(x, 0), point(x, 0, 75), '#8fa99c', 2);
          line(point(x, 0, 75), point(x, h, 75), '#8fa99c', 2);
          line(point(x, h), point(x, h, 75), '#8fa99c', 2);
        }
      }
      const wallHeight = 73;
      polygon([point(0, 0), point(w, 0), point(w, 0, wallHeight), point(0, 0, wallHeight)], P.wall, P.purpleDark);
      polygon([point(0, 0), point(0, h), point(0, h, wallHeight), point(0, 0, wallHeight)], P.wallShade, P.purpleDark);
      line(point(0, 0, wallHeight), point(w, 0, wallHeight), P.purple, 8);
      line(point(0, 0, wallHeight), point(0, h, wallHeight), P.purple, 8);
      line(point(0, 0, 9), point(w, 0, 9), P.purple, 9);
      line(point(0, 0, 9), point(0, h, 9), P.purple, 9);
      for (let x = 0; x <= w; x += 2) line(point(x, 0, 11), point(x, 0, wallHeight - 2), '#c19787', 2);
      for (let y = 0; y <= h; y += 2) line(point(0, y, 11), point(0, y, wallHeight - 2), '#bd927b', 2);
      // Original wall hangings and pixel lights add Halloween character without fake stock.
      for (const y of [2.2, 5.4, 8.1]) {
        const p = point(0, y, 43), s = scale;
        rect(p.x - 12 * s, p.y - 21 * s, 24 * s, 36 * s, P.woodDark);
        rect(p.x - 9 * s, p.y - 18 * s, 18 * s, 30 * s, P.purple);
        rect(p.x - 7 * s, p.y - 16 * s, 14 * s, 25 * s, P.purpleDark);
        const moon = [[-2,-11,7,4],[-5,-7,7,8],[-2,1,7,4],[4,1,3,3]];
        moon.forEach(([a,b,c,d]) => rect(p.x + a * s, p.y + b * s, c * s, d * s, P.gold));
        rect(p.x - 13 * s, p.y - 23 * s, 26 * s, 4 * s, P.gold);
      }
      for (const x of [1.2, 4.2, 8.8]) {
        const p = point(x, 0, 54), s = scale;
        rect(p.x - 2 * s, p.y - 19 * s, 4 * s, 19 * s, P.woodDark);
        drawSprite('pumpkin', p.x, p.y + 11 * s, 28);
        rect(p.x - 3 * s, p.y - 2 * s, 6 * s, 4 * s, P.gold);
      }
      // Windows live on the rear wall, clear of traversable tiles.
      for (const x of [2.4, 7.5]) {
        const p = point(x, 0, 46), s = scale;
        rect(p.x - 13 * s, p.y - 21 * s, 26 * s, 39 * s, P.purpleDark);
        rect(p.x - 10 * s, p.y - 18 * s, 20 * s, 33 * s, '#829ab0');
        rect(p.x - 7 * s, p.y - 15 * s, 6 * s, 6 * s, '#f5e6bb');
        rect(p.x - 1 * s, p.y - 18 * s, 3 * s, 33 * s, P.purpleDark);
        rect(p.x - 10 * s, p.y - 2 * s, 20 * s, 3 * s, P.purpleDark);
        rect(p.x - 16 * s, p.y + 17 * s, 32 * s, 5 * s, P.purple);
      }
      // Halloween bunting follows the rear wall plane.
      for (let x = .3; x < w - .3; x += .65) {
        const start = point(x, 0, 65), end = point(x + .6, 0, 65), low = point(x + .3, 0, 53);
        line(start, end, P.purpleDark, 1);
        polygon([start, end, low], Math.round(x * 10) % 2 ? P.orange : P.purpleDark);
      }
      const sign = point(5, 0, 41);
      label('LEGENDARY SHOP', sign.x, sign.y, P.cream, P.purpleDark, true);
      gardenPlant(-.6, 1, 2); gardenPlant(-.65, 7.5, 1); gardenPlant(w + .5, h - .1, 2);
      const entrance = state.entrance || { x: 4, y: 8 };
      const e = point(entrance.x + .5, entrance.y + 1.15);
      polygon([point(entrance.x - .4, h), point(entrance.x + 1.4, h), point(entrance.x + 1.4, h + .8), point(entrance.x - .4, h + .8)], '#896c83', P.cream);
      label(state.phase === 'open' ? 'COME ON IN' : state.phase === 'closing' ? 'CLOSING TIME' : 'WELCOME', e.x, e.y + 17 * scale, P.cream, P.purpleDark, true);
      drawSprite('pumpkin', point(entrance.x - .7, h).x, point(entrance.x - .7, h).y, 32);
      drawSprite('pumpkin', point(entrance.x + 1.7, h).x, point(entrance.x + 1.7, h).y, 32);
      return { w, h };
    }

    function displayObject(obj, ghost = false) {
      obj = { level: 1, ...obj };
      const x = Number(obj.x) || 0, y = Number(obj.y) || 0;
      const w = Number(obj.w || obj.width) || 1, h = Number(obj.h || obj.height) || 1;
      const type = obj.type, selected = options.selectedId === obj.id;
      const center = point(x + w / 2, y + h / 2);
      const sku = root.ShopCatalog?.products?.find(p => p.id === obj.sku);
      const stocks = typeof obj.stock === 'number' ? obj.stock : Object.values(obj.stock || {}).reduce((a, b) => a + Number(b), 0);
      const shelf = ['shelf', 'cold', 'fireproof', 'moisture'].includes(type);
      let z = shelf ? 42 : type === 'storage' ? 47 : type === 'lantern' || type === 'spirit' ? 39 : 25;
      if (selected || ghost) {
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) tile(xx, yy, ghost ? options.placement?.valid === false ? '#d1837d' : '#afbf89' : '#ffdc87', P.cream, 1);
      }
      ctx.save(); if (ghost) ctx.globalAlpha = .65;
      if (shelf) {
        let top = P.woodLight, left = '#ac7481', right = '#705369';
        if (type === 'cold') { top = '#c8e4db'; left = '#83b9bc'; right = '#517f93'; }
        if (type === 'fireproof') { top = '#aaa5a0'; left = '#886b67'; right = '#5d5962'; }
        if (type === 'moisture') { top = '#b5cf9a'; left = '#83a18b'; right = '#547969'; }
        const shape = block(x + .12, y + .12, w - .24, h - .24, z, { top, left, right });
        // Recessed front, chunky side posts, shelf boards, and drawer feet.
        polygon([point(x + .22, y + h - .10, 6), point(x + w - .22, y + h - .10, 6), point(x + w - .22, y + h - .10, 38), point(x + .22, y + h - .10, 38)], type === 'cold' ? '#5d8b96' : type === 'moisture' ? '#53745f' : '#66494c');
        line(point(x + .16, y + h - .10, 3), point(x + .16, y + h - .10, 42), left, 6);
        line(point(x + w - .16, y + h - .10, 3), point(x + w - .16, y + h - .10, 42), left, 6);
        const lo = point(x + .13, y + h - .11, 9), hi = point(x + w - .13, y + h - .11, 9);
        line(lo, hi, P.woodDark, 4);
        line(point(x + .13, y + h - .11, 25), point(x + w - .13, y + h - .11, 25), P.cream, 3);
        line(point(x + .13, y + h - .11, 41), point(x + w - .13, y + h - .11, 41), P.cream, 3);
        const shown = Math.min(5, stocks);
        for (let i = 0; i < shown; i++) {
          const px = x + .28 + (w - .5) * (i % 3) / Math.max(1, Math.min(2, shown - 1));
          const p = point(px, y + h - .12, i >= 3 ? 10 : 26);
          drawSprite(sku?.sprite || ['ghost-macarons', 'hoof-polish', 'bone-varnish'][i % 3], p.x, p.y, 22);
        }
        // Small specialist icon, visibly different even when unstocked.
        if (type !== 'shelf') text(type === 'cold' ? '❄' : type === 'fireproof' ? '♨' : '≈', shape.a.x, shape.a.y - 9 * scale, 14, type === 'fireproof' ? P.orange : '#d6f5df');
        const badge = point(x + w / 2, y + h, -2);
        label(`${stocks}/${root.ShopSim?.capacity ? root.ShopSim.capacity(obj) : 8}`, badge.x, badge.y + 6 * scale, stocks > 0 ? '#f5e7b4' : '#d9c4b7', P.ink, true);
      } else if (type === 'storage' || type === 'receiving' || type === 'returns') {
        block(x + .1, y + .1, w - .2, h - .2, 10, { top: '#c2aa83', left: '#967a60', right: '#706150' });
        if (type === 'storage' || type === 'returns') {
          const rackColor = type === 'storage' ? '#7e8d83' : P.purple;
          for (const [xx,yy] of [[x+.12,y+.12],[x+w-.12,y+.12],[x+.12,y+h-.12],[x+w-.12,y+h-.12]]) line(point(xx,yy,9),point(xx,yy,46),rackColor,4);
          line(point(x+.12,y+.12,46),point(x+w-.12,y+.12,46),rackColor,5);
          line(point(x+.12,y+h-.12,28),point(x+w-.12,y+h-.12,28),rackColor,5);
          line(point(x+.12,y+h-.12,46),point(x+w-.12,y+h-.12,46),rackColor,5);
        }
        const quantity = type === 'receiving' ? (state.parcels || []).filter(p => ['unknown', 'known'].includes(p.status)).length : type === 'returns' ? (state.parcels || []).filter(p => p.status === 'return').length : Object.values(state.storage || {}).reduce((a, n) => a + Number(n || 0), 0);
        for (let i = 0; i < (quantity ? 3 : 1); i++) {
          const p = point(x + .35 + (i % 2) * Math.max(.35,w-.7), y + .55, 12 + (i === 2 ? 18 : 0));
          drawSprite(type === 'returns' ? 'human' : 'parcel', p.x, p.y, 35);
        }
        const p = point(x + w / 2, y + .15, z);
        label(type === 'receiving' ? `RECEIVING · ${quantity}` : type === 'returns' ? `RETURNS · ${quantity}` : 'STORAGE', p.x, p.y - 7 * scale, P.cream, P.ink, true);
      } else if (type === 'lantern' || type === 'spirit') {
        const p = point(x + .5, y + .5);
        rect(p.x - 3 * scale, p.y - 35 * scale, 6 * scale, 35 * scale, P.purpleDark);
        drawSprite(type === 'spirit' ? 'ghost' : 'pumpkin', p.x, p.y - 24 * scale, 35);
        rect(p.x - 10 * scale, p.y - 2 * scale, 20 * scale, 5 * scale, P.purpleDark);
      } else {
        const top = type === 'service' ? '#a5bd96' : type === 'inspection' ? '#e7c590' : '#e6bc83';
        block(x + .1, y + .1, w - .2, h - .2, z, { top, left: P.wood, right: P.woodDark });
        for (let i = .3; i < w - .1; i += .33) line(point(x + i, y + h - .1, 2), point(x + i, y + h - .1, z - 3), '#9a624b', 1);
        line(point(x + .14, y + h - .1, z - 3), point(x + w - .14, y + h - .1, z - 3), '#e5af75', 3);
        const p = point(x + w / 2, y + h / 2, z + 2);
        if (type === 'checkout') {
          rect(p.x - 11 * scale, p.y - 13 * scale, 24 * scale, 15 * scale, '#666979');
          rect(p.x - 6 * scale, p.y - 23 * scale, 15 * scale, 13 * scale, P.ink);
          rect(p.x - 3 * scale, p.y - 20 * scale, 9 * scale, 7 * scale, '#b7d5ac');
          rect(p.x - 8 * scale, p.y - 9 * scale, 17 * scale, 5 * scale, '#b4a9a0');
        } else if (type === 'inspection') {
          drawSprite('parcel', p.x - 10 * scale, p.y + 3 * scale, 29);
          rect(p.x + 8 * scale, p.y - 6 * scale, 18 * scale, 10 * scale, P.cream);
          for (let i = 0; i < 3; i++) rect(p.x + 10 * scale, p.y + (i * 2 - 4) * scale, 12 * scale, scale, P.wood);
        } else if (type === 'service') {
          drawSprite('parcel', p.x, p.y + 3 * scale, 28);
          rect(p.x - 13 * scale, p.y - 9 * scale, 4 * scale, 10 * scale, P.gold);
        }
        label(type === 'checkout' ? 'PAY HERE' : type === 'service' ? 'ORDERS' : 'INSPECT', center.x, center.y + 7 * scale, P.cream, P.ink, true);
      }
      if (Number(obj.level) > 1) {
        const p = point(x + w - .15, y + h - .15, z + 6);
        text('★'.repeat(Math.min(3, obj.level)), p.x, p.y, 10, P.gold);
      }
      ctx.restore();
      if (!ghost) {
        const left = point(x, y + h), right = point(x + w, y), top = point(x, y, z + 15), bottom = point(x + w, y + h);
        hits.push({ objectId: obj.id, x, y, left: left.x - 9 * scale, top: top.y - 8 * scale, right: right.x + 9 * scale, bottom: bottom.y + 18 * scale });
      }
    }

    function character(entity, worker, now) {
      const id = entity.id;
      let m = motion.get(id);
      if (!m) { m = { x: entity.x, y: entity.y, targetX: entity.x, targetY: entity.y, changed: now, lastX: entity.x, facing: 1 }; motion.set(id, m); }
      if (m.targetX !== entity.x || m.targetY !== entity.y) {
        m.startX = m.x; m.startY = m.y; m.targetX = entity.x; m.targetY = entity.y; m.changed = now;
        if ((entity.x - m.x) - (entity.y - m.y)) m.facing = (entity.x - m.x) - (entity.y - m.y) < 0 ? -1 : 1;
      }
      const t = options.reducedMotion ? 1 : Math.min(1, (now - m.changed) / 220);
      m.x = (m.startX ?? m.targetX) + (m.targetX - (m.startX ?? m.targetX)) * t;
      m.y = (m.startY ?? m.targetY) + (m.targetY - (m.startY ?? m.targetY)) * t;
      const walking = t < 1 || (entity.path && entity.path.length > 0);
      const nearby = [...(state.customers || []), ...(state.staff || [])].filter(other => other.x === entity.x && other.y === entity.y);
      const crowdIndex = nearby.findIndex(other => other.id === id);
      const crowdOffset = nearby.length > 1 ? (crowdIndex - (nearby.length - 1) / 2) * .43 : 0;
      const showBubble = nearby.length <= 1 || crowdIndex === nearby.length - 1 || options.selectedId === id;
      const p = point(m.x + .5 + crowdOffset, m.y + .5 - crowdOffset);
      const bounce = walking && !options.reducedMotion ? Math.sin(now / 85) * 1.7 * scale : 0;
      const species = worker ? (entity.sprite || (entity.id === 'intern' ? 'goblin' : 'skeleton')) : (entity.species || 'ghost');
      const size = worker ? 48 : species === 'centaur' || species === 'minotaur' ? 52 : 46;
      ctx.fillStyle = '#59463730'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2 * scale, 13 * scale, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();
      if (walking && !options.reducedMotion) {
        // Alternating grounded feet gives the reused silhouettes an actual walk cycle.
        const step = Math.sin(now / 80) * 3 * scale;
        rect(p.x - 8 * scale, p.y - 4 * scale + step, 6 * scale, 4 * scale, P.ink);
        rect(p.x + 2 * scale, p.y - 4 * scale - step, 6 * scale, 4 * scale, P.ink);
      }
      drawSprite(species, p.x, p.y + 4 * scale + bounce, size, m.facing < 0 && species !== 'centaur');
      const carries = entity.reservation || entity.carrying || (worker && entity.job && ['stock', 'parcel', 'delivery'].some(kind => String(entity.job.type || entity.job.kind).includes(kind)));
      if (carries) drawSprite('parcel', p.x + 10 * scale, p.y - 9 * scale + bounce, 21);
      if (worker) {
        rect(p.x - 5 * scale, p.y - 17 * scale + bounce, 10 * scale, 8 * scale, '#c9d89e');
        rect(p.x - 1 * scale, p.y - 15 * scale + bounce, 3 * scale, 3 * scale, P.cream);
        const job = entity.job?.type || entity.job?.kind;
        if (job && showBubble) label(job === 'cashier' || job === 'checkout' ? 'RINGING UP' : job === 'stock' ? 'RESTOCKING' : job === 'delivery' ? 'DELIVERING' : 'ON THE JOB', p.x, p.y - 50 * scale, '#d3dcb2', P.ink, true);
      } else {
        const bubble = entity.thought || entity.reaction || entity.message ||
          (entity.phase === 'queue' ? 'Ready to pay' : entity.phase === 'browsing' ? 'Ooh, lovely!' : entity.phase === 'service' || entity.phase === 'request' ? 'My order, please!' : '');
        if (bubble && showBubble && (!walking || options.selectedId === id)) {
          const value = String(bubble).length > 28 ? String(bubble).slice(0, 26) + '…' : String(bubble);
          label(value, p.x, p.y - 52 * scale, entity.patience < 15 ? '#f0c6a9' : P.white, P.ink, true);
        }
      }
      if (options.selectedId === id) {
        ctx.strokeStyle = P.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1 * scale, 17 * scale, 8 * scale, 0, 0, Math.PI * 2); ctx.stroke();
        label(entity.name || id, p.x, p.y + 18 * scale, P.gold, P.ink, true);
      }
      hits.push({ [worker ? 'staffId' : 'customerId']: id, x: entity.x, y: entity.y, left: p.x - size * scale / 2, right: p.x + size * scale / 2, top: p.y - size * scale, bottom: p.y + 8 * scale });
    }

    function draw(nextState, nextOptions = {}) {
      if (destroyed || !nextState) return;
      state = nextState; options = nextOptions; resize(); hits = [];
      const wallTime = performance.now();
      if (!state.paused && ['open', 'closing'].includes(state.phase) && previousWallTime) animationTime += Math.min(100, wallTime - previousWallTime);
      previousWallTime = wallTime;
      const now = options.reducedMotion ? 0 : animationTime;
      background(); room();
      const entities = [
        ...(state.objects || []).map(entity => ({ entity, kind: 'object', order: entity.x + entity.y + (entity.w || 1) + (entity.h || 1) - .3 })),
        ...(state.customers || []).map(entity => ({ entity, kind: 'customer', order: entity.x + entity.y + 1.8 })),
        ...(state.staff || []).map(entity => ({ entity, kind: 'staff', order: entity.x + entity.y + 1.8 }))
      ].sort((a, b) => a.order - b.order);
      entities.forEach(({ entity, kind }) => kind === 'object' ? displayObject(entity) : character(entity, kind === 'staff', now));
      // Payment effects read the authoritative ledger; they cannot create sales.
      (state.ledger || []).filter(entry => entry.type === 'sale' && entry.shift === state.shift && ['open', 'closing'].includes(state.phase) && state.clock - entry.time >= 0 && state.clock - entry.time < 2.5).slice(-3).forEach(entry => {
        const customer = (state.customers || []).find(c => c.id === entry.customerId);
        const checkout = (state.objects || []).find(o => o.type === 'checkout');
        const p = point(customer?.x ?? checkout?.x ?? 6, customer?.y ?? checkout?.y ?? 6, 60 + (options.reducedMotion ? 0 : (state.clock - entry.time) * 7));
        label('+' + entry.amount + ' coins', p.x, p.y, P.gold, P.ink, true);
      });
      if (options.placement) displayObject({ id: 'preview', ...options.placement }, true);
      const phases = { prep: 'PREPARING THE SHOP', open: 'THE SHOP IS ALIVE', closing: 'SERVING THE LAST GUESTS', report: 'SHIFT COMPLETE', complete: 'HALLOWEEN SAVED' };
      text(phases[state.phase] || 'LEGENDARY SHOP', 22, height - 20, 8, '#aac2ae', 'left');
    }

    function hitTest(clientX, clientY) {
      const bounds = canvas.getBoundingClientRect();
      const px = clientX - bounds.left, py = clientY - bounds.top;
      const dx = (px - originX) / (unitX * scale), dy = (py - originY) / (unitY * scale);
      const result = { x: Math.floor((dx + dy) / 2), y: Math.floor((dy - dx) / 2) };
      // Front-most visible entity gets first refusal, matching painter's order.
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i];
        if (px >= hit.left && px <= hit.right && py >= hit.top && py <= hit.bottom) {
          for (const key of ['objectId', 'customerId', 'staffId']) if (hit[key]) result[key] = hit[key];
          break;
        }
      }
      return result;
    }

    return { draw, hitTest, tileToScreen, resize, destroy: () => { destroyed = true; cache.clear(); motion.clear(); } };
  }

  root.ShopRenderer = Object.freeze({ create, palette: Object.freeze(P), labels: Object.freeze(LABELS) });
})(typeof globalThis !== 'undefined' ? globalThis : window);
