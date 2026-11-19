/* Original, hand-built pixel art. No external assets, fonts, or canvas libraries. */
(function (root) {
  'use strict';

  const C = {
    ink: '#213332', deep: '#354244', cream: '#ffefce', white: '#fff9e9',
    orange: '#ed9a59', ochre: '#c47648', gold: '#e9be72', pale: '#ffe1a5',
    purple: '#a99bc7', plum: '#736187', darkPurple: '#4c405c', pink: '#e9a4b2',
    green: '#a8c68c', moss: '#72977b', mint: '#b8e4c8', teal: '#558d8c',
    brown: '#976b53', bark: '#664d43', red: '#d87968', burgundy: '#975767',
    gray: '#93aaa9', lightGray: '#c6d4c5', blue: '#8abec4', skin: '#e9bb96'
  };

  function painter(ctx) {
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };
    const box = (x, y, w, h, color, border = C.ink) => {
      rect(x, y, w, h, border);
      if (w > 2 && h > 2) rect(x + 1, y + 1, w - 2, h - 2, color);
    };
    // Rasterise polygons on the logical grid so diagonal edges stay pixel-crisp.
    const poly = (points, color) => {
      const ys = points.map(p => p[1]);
      const xs = points.map(p => p[0]);
      const minX = Math.floor(Math.min(...xs)), maxX = Math.ceil(Math.max(...xs));
      const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
      ctx.fillStyle = color;
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          let inside = false;
          for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const a = points[i], b = points[j];
            if (((a[1] > y + .5) !== (b[1] > y + .5)) &&
              (x + .5 < (b[0] - a[0]) * (y + .5 - a[1]) / (b[1] - a[1]) + a[0])) inside = !inside;
          }
          if (inside) ctx.fillRect(x, y, 1, 1);
        }
      }
    };
    const oval = (cx, cy, rx, ry, color) => {
      ctx.fillStyle = color;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          if (((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1) ctx.fillRect(x, y, 1, 1);
        }
      }
    };
    const head = (x, y, w, h, color, shade) => {
      box(x, y, w, h, color);
      rect(x + 2, y, w - 4, 1, color);
      rect(x, y + 2, 1, h - 4, color);
      if (shade) rect(x + w - 3, y + 2, 2, h - 4, shade);
    };
    const face = (x, y, gap = 8, color = C.ink, cheek = C.pink) => {
      rect(x, y, 2, 3, color); rect(x + gap, y, 2, 3, color);
      rect(x, y, 1, 1, C.white); rect(x + gap, y, 1, 1, C.white);
      rect(x + 4, y + 5, Math.max(2, gap - 4), 1, color);
      if (cheek) { rect(x - 2, y + 3, 3, 1, cheek); rect(x + gap + 1, y + 3, 3, 1, cheek); }
    };
    const sparkle = (x, y, color = C.gold) => {
      rect(x, y - 2, 1, 5, color); rect(x - 2, y, 5, 1, color);
    };
    const boot = (x, y, color = C.bark) => { box(x, y, 7, 4, color); rect(x + 1, y + 1, 3, 1, C.brown); };
    const bottle = (x, y, color, label = C.cream) => {
      box(x + 4, y, 8, 4, C.gold);
      box(x + 5, y + 4, 6, 3, color);
      box(x + 1, y + 7, 14, 21, color);
      rect(x + 2, y + 8, 2, 16, C.white);
      box(x + 4, y + 13, 9, 8, label);
      rect(x + 6, y + 16, 5, 1, C.bark);
    };
    return { rect, box, poly, oval, head, face, sparkle, boot, bottle };
  }

  const sprites = {
    boss(p) {
      const { rect: r, box: b, poly: q, oval: o, face: f } = p;
      q([[9,35],[5,31],[3,34],[6,40],[15,41]], C.ink);
      q([[10,35],[6,33],[5,35],[8,39],[15,39]], C.orange);
      b(14,29,22,14,C.cream); b(14,31,7,11,C.brown); b(29,31,7,11,C.brown);
      b(11,32,5,9,C.orange); b(34,32,5,9,C.orange);
      q([[12,18],[10,5],[20,11],[31,10],[39,5],[38,20]],C.ink);
      q([[14,17],[12,8],[20,13],[30,13],[37,8],[36,20]],C.orange);
      q([[14,10],[14,15],[18,14]],C.pink); q([[35,10],[31,15],[35,15]],C.pink);
      o(25,21,14,12,C.ink); o(25,20,13,11,C.orange);
      r(21,10,3,4,C.ochre); r(29,11,2,3,C.ochre);
      r(13,19,5,2,C.ochre); r(32,19,5,2,C.ochre);
      o(25,25,10,6,C.cream); f(19,19,10,C.ink,null);
      r(23,23,4,2,C.bark); r(25,25,1,2,C.bark);
      r(10,24,7,1,C.cream); r(33,24,7,1,C.cream);
      r(9,27,7,1,C.cream); r(34,27,7,1,C.cream);
      b(20,31,5,4,C.plum); b(26,31,5,4,C.purple); r(25,32,2,2,C.gold);
      r(24,37,2,2,C.gold); r(24,41,2,1,C.gold);
    },
    dragonkin(p) {
      const {rect:r, box:b, poly:q, head:h, face:f, boot, oval:o}=p;
      q([[16,22],[5,13],[4,31],[11,27],[17,34]],C.ink);
      q([[15,23],[7,17],[6,28],[11,25],[16,30]],C.burgundy);
      q([[33,22],[43,13],[45,31],[37,27],[32,34]],C.ink);
      q([[34,23],[41,17],[43,28],[37,25],[33,30]],C.burgundy);
      q([[30,35],[37,37],[42,32],[42,39],[36,42],[29,39]],C.ink);
      q([[31,36],[37,39],[41,36],[40,39],[36,40],[30,38]],C.red);
      boot(17,40); boot(28,40); b(16,26,19,15,C.red); b(21,29,9,11,C.pale);
      r(22,33,7,1,C.orange); r(22,37,7,1,C.orange);
      b(12,29,5,9,C.orange); b(34,29,5,9,C.orange);
      q([[14,15],[12,5],[19,10],[30,10],[36,5],[35,18]],C.ink);
      q([[15,13],[14,8],[20,13],[29,13],[34,8],[34,17]],C.cream);
      h(14,12,22,15,C.orange,C.ochre); r(21,10,9,3,C.red);
      b(20,21,18,9,C.orange); r(22,22,13,2,C.pale);
      r(31,23,2,2,C.bark); r(35,23,1,2,C.bark);
      f(18,16,10,C.ink,null); r(20,27,12,1,C.bark); r(23,27,2,2,C.cream);
      o(18,22,2,1,C.pink); r(24,8,3,2,C.gold);
    },
    ghost(p) {
      const { rect:r, poly:q, oval:o, face:f, sparkle:s }=p;
      q([[12,17],[15,10],[20,7],[29,7],[35,11],[37,23],[42,29],[37,32],[35,29],[34,39],[28,37],[24,41],[20,37],[13,39],[13,31],[7,32],[5,28],[11,24]],C.ink);
      q([[14,17],[17,12],[21,9],[28,9],[33,12],[35,25],[39,29],[36,30],[33,27],[32,36],[28,34],[24,38],[20,34],[15,36],[15,27],[9,30],[8,28],[13,25]],C.lightGray);
      q([[15,18],[18,12],[22,10],[27,10],[32,13],[33,28],[28,34],[23,33],[18,35],[16,30]],C.white);
      f(19,19,9,C.ink,C.pink); o(25,27,2,2,C.ink);
      r(15,13,3,2,C.cream); s(39,13,C.purple); s(7,19,C.purple);
      r(18,40,10,1,C.blue);
    },
    centaur(p) {
      const {rect:r, box:b, poly:q, head:h, face:f}=p;
      q([[33,27],[41,26],[43,32],[42,37],[39,32],[36,31]],C.bark);
      b(13,27,26,11,C.brown); r(16,28,20,3,C.ochre); r(15,35,21,2,C.bark);
      b(14,35,5,9,C.brown); b(22,35,4,8,C.brown); b(32,35,5,9,C.brown);
      r(14,41,5,3,C.ink); r(22,41,4,2,C.ink); r(32,41,5,3,C.ink);
      b(11,20,17,13,C.moss); b(8,22,5,9,C.skin); b(26,22,5,9,C.skin);
      r(13,21,3,9,C.green); r(14,29,12,2,C.gold);
      h(10,7,19,15,C.skin,C.orange);
      q([[9,13],[9,6],[14,3],[24,3],[29,7],[30,17],[27,17],[25,10],[18,8],[13,11]],C.bark);
      r(13,5,11,2,C.brown); f(14,12,8,C.ink,C.pink);
      r(19,20,3,3,C.skin); b(10,9,4,3,C.gold); r(10,10,3,1,C.cream);
    },
    goblin(p) {
      const {rect:r, box:b, poly:q, head:h, face:f, boot}=p;
      boot(15,40); boot(27,40); b(15,27,19,15,C.brown); r(17,29,3,11,C.ochre);
      b(11,29,6,8,C.green); b(33,29,6,8,C.green);
      q([[15,15],[3,9],[5,21],[16,25]],C.ink); q([[15,17],[6,13],[7,20],[16,23]],C.green);
      q([[33,15],[45,9],[43,21],[32,25]],C.ink); q([[33,17],[42,13],[41,20],[32,23]],C.green);
      r(7,16,5,2,C.moss); r(36,16,5,2,C.moss);
      h(12,10,24,20,C.green,C.moss); r(17,8,14,3,C.moss);
      b(13,8,9,6,C.gold); b(25,8,9,6,C.gold); r(15,9,5,3,C.blue); r(27,9,5,3,C.blue); r(22,10,3,2,C.bark);
      f(17,18,10,C.ink,C.orange); r(20,25,10,2,C.bark); r(22,25,2,3,C.cream);
      b(19,33,12,6,C.gold); r(21,34,8,3,C.bark); r(24,34,2,3,C.gold);
    },
    skeleton(p) {
      const {rect:r, box:b, oval:o, boot}=p;
      r(23,23,3,18,C.ink); r(24,23,1,17,C.cream);
      for (let y=25;y<=33;y+=4) { b(16,y,17,3,C.cream); r(23,y,3,3,C.cream); }
      b(12,25,4,12,C.cream); b(33,25,4,12,C.cream); b(10,35,6,5,C.cream); b(33,35,6,5,C.cream);
      b(18,35,13,4,C.cream); b(18,38,4,6,C.cream); b(27,38,4,6,C.cream);
      boot(15,42,C.cream); boot(27,42,C.cream);
      o(24,14,13,11,C.ink); o(24,13,12,10,C.cream); b(17,20,15,5,C.cream);
      b(15,12,7,7,C.ink); b(26,12,7,7,C.ink); r(17,13,2,2,C.blue); r(28,13,2,2,C.blue);
      r(23,18,3,3,C.brown); r(19,22,1,2,C.brown); r(23,22,1,2,C.brown); r(27,22,1,2,C.brown);
      r(17,6,12,2,C.white); b(18,26,5,3,C.burgundy); b(25,26,5,3,C.burgundy); r(23,26,2,3,C.gold);
    },
    vampire(p) {
      const {rect:r,box:b,poly:q,head:h,face:f,boot}=p;
      q([[17,21],[9,17],[12,29],[7,43],[21,40],[25,43],[29,40],[42,43],[36,29],[39,17],[31,21]],C.ink);
      q([[17,23],[12,20],[15,29],[11,40],[23,37],[25,41],[28,37],[38,40],[33,28],[36,20],[30,23]],C.burgundy);
      b(18,26,14,16,C.darkPurple); b(21,26,7,10,C.cream); boot(17,42,C.ink); boot(27,42,C.ink);
      b(13,28,5,9,C.purple); b(32,28,5,9,C.purple);
      h(14,7,22,19,C.purple,C.plum);
      q([[13,15],[13,7],[17,3],[31,3],[37,8],[36,18],[32,12],[28,9],[25,14],[21,9],[16,12]],C.darkPurple);
      r(18,5,13,2,C.plum); f(19,16,10,C.ink,C.pink);
      r(21,22,9,2,C.burgundy); r(22,22,2,3,C.white); r(27,22,2,3,C.white);
      b(22,27,5,4,C.red); r(23,28,2,2,C.gold);
    },
    slime(p) {
      const {rect:r,box:b,poly:q,oval:o,face:f,sparkle:s}=p;
      q([[7,32],[11,24],[15,21],[17,14],[23,11],[31,15],[34,25],[39,28],[43,34],[42,39],[35,42],[12,42],[5,38]],C.ink);
      q([[8,33],[13,26],[17,23],[19,16],[24,13],[29,17],[32,27],[37,29],[41,35],[40,38],[34,40],[13,40],[7,37]],C.moss);
      q([[9,33],[14,26],[19,24],[20,17],[24,15],[28,18],[31,29],[37,31],[38,36],[33,38],[15,38],[9,36]],C.mint);
      o(25,34,12,5,C.green); f(18,27,11,C.ink,C.pink);
      r(20,19,3,4,C.white); r(17,25,3,2,C.white); r(13,32,2,2,C.white);
      b(30,18,5,4,C.mint); r(31,19,2,1,C.white); s(9,17,C.blue); s(39,21,C.gold);
    },
    minotaur(p) {
      const {rect:r,box:b,poly:q,head:h,face:f,boot,oval:o}=p;
      boot(14,41); boot(29,41); b(12,27,26,15,C.brown); b(8,29,6,11,C.brown); b(36,29,6,11,C.brown);
      r(15,29,4,8,C.ochre); b(15,37,20,5,C.plum); b(23,37,5,4,C.gold);
      q([[15,13],[8,10],[5,3],[4,12],[10,19],[16,20]],C.ink);
      q([[14,14],[9,12],[7,7],[7,12],[11,17],[16,18]],C.cream);
      q([[32,13],[39,10],[42,3],[43,12],[37,19],[31,20]],C.ink);
      q([[33,14],[38,12],[40,7],[40,12],[36,17],[31,18]],C.cream);
      h(12,10,25,21,C.brown,C.bark); r(16,9,15,3,C.bark); r(19,7,7,3,C.bark);
      r(10,14,4,5,C.ochre); r(36,14,4,5,C.ochre);
      f(17,17,10,C.ink,null); b(15,24,20,9,C.ochre); r(17,25,16,2,C.orange);
      r(19,26,2,2,C.bark); r(29,26,2,2,C.bark); o(25,31,3,3,C.gold); r(24,29,2,3,C.bark);
    },
    werewolf(p) {
      const {rect:r,box:b,poly:q,head:h,face:f,boot}=p;
      q([[32,34],[39,30],[43,32],[42,39],[35,42],[28,40]],C.ink);
      q([[33,35],[39,33],[41,34],[40,37],[34,40],[30,39]],C.gray);
      boot(14,41); boot(28,41); b(14,26,21,16,C.plum); r(17,28,3,12,C.purple);
      q([[13,27],[8,31],[10,38],[14,40],[17,34]],C.ink); q([[13,29],[10,32],[12,37],[15,36]],C.gray);
      q([[35,27],[40,31],[38,38],[34,40],[31,34]],C.ink); q([[35,29],[38,32],[36,37],[33,36]],C.gray);
      q([[11,17],[10,3],[20,10],[29,10],[38,3],[37,18]],C.ink);
      q([[13,16],[12,7],[20,13],[29,13],[36,7],[35,18]],C.gray);
      r(13,10,3,5,C.pink); r(32,10,3,5,C.pink);
      h(11,13,27,16,C.gray,C.teal);
      q([[11,23],[7,24],[11,28],[9,30],[17,32],[23,29],[31,32],[39,29],[36,26],[41,23],[37,22]],C.gray);
      f(17,18,11,C.ink,null); b(18,24,15,8,C.lightGray); r(23,24,5,3,C.ink);
      r(21,29,10,1,C.ink); r(21,29,2,3,C.cream); r(28,29,2,3,C.cream);
      r(24,35,2,3,C.gold);
    },
    witch(p) {
      const {rect:r,box:b,poly:q,head:h,face:f,boot}=p;
      b(39,13,3,28,C.brown); q([[36,33],[44,33],[47,43],[34,43]],C.ink); q([[37,34],[43,34],[45,41],[36,41]],C.gold); r(39,35,1,7,C.ochre); r(42,36,1,6,C.ochre);
      boot(15,41); boot(25,41); q([[17,26],[30,26],[35,42],[10,42]],C.ink); q([[18,28],[28,28],[32,40],[13,40]],C.plum); r(17,32,4,8,C.purple);
      b(10,28,5,10,C.skin); b(30,28,8,5,C.skin); r(16,25,14,4,C.pink);
      b(11,13,23,18,C.burgundy); h(13,15,19,13,C.skin,C.orange); f(17,19,8,C.ink,C.pink);
      q([[6,16],[14,12],[20,2],[26,4],[29,12],[37,16],[33,19],[10,19]],C.ink);
      q([[9,16],[16,13],[21,4],[25,5],[28,14],[34,16],[31,17],[11,17]],C.plum);
      r(17,12,11,3,C.orange); b(22,12,4,4,C.gold); r(23,13,2,2,C.bark);
      r(21,6,2,3,C.purple); r(11,22,3,8,C.burgundy); r(31,22,3,8,C.burgundy);
    },
    mummy(p) {
      const {rect:r,box:b,head:h,boot}=p;
      boot(15,41,C.cream); boot(27,41,C.cream); b(16,26,17,17,C.cream);
      b(11,28,6,12,C.cream); b(32,27,6,11,C.cream);
      h(13,7,23,21,C.cream,C.gold); r(16,5,17,3,C.cream);
      r(14,11,20,1,C.gold); r(15,15,19,1,C.gold); r(18,7,1,6,C.gold);
      b(15,16,19,7,C.deep); r(18,18,3,3,C.blue); r(28,18,3,3,C.blue); r(19,18,1,1,C.white); r(29,18,1,1,C.white);
      r(16,24,17,1,C.gold); r(20,25,8,1,C.brown);
      for (let y=29;y<=39;y+=4) { r(17,y,15,1,C.gold); r(12,y+1,4,1,C.gold); r(33,y,4,1,C.gold); }
      r(22,30,1,4,C.gold); r(26,34,1,4,C.gold);
      b(36,34,6,3,C.cream); b(39,36,3,6,C.cream); r(40,42,5,2,C.cream);
    },
    imp(p) {
      const {rect:r,box:b,poly:q,head:h,face:f,boot}=p;
      q([[32,35],[39,35],[41,30],[39,27],[44,28],[45,33],[41,39],[32,39]],C.ink);
      q([[33,36],[40,36],[43,32],[42,29],[44,31],[42,36],[40,38],[33,38]],C.red);
      q([[37,27],[42,22],[45,29]],C.red);
      boot(15,41); boot(27,41); b(15,27,19,15,C.darkPurple); b(20,27,9,11,C.cream);
      b(10,29,6,9,C.red); b(33,29,6,9,C.red); r(23,28,3,9,C.burgundy);
      q([[14,13],[12,3],[20,10],[29,10],[37,3],[35,16]],C.ink);
      q([[15,12],[14,7],[20,13],[29,13],[35,7],[34,16]],C.gold);
      q([[14,17],[7,13],[8,23],[15,24]],C.red); q([[34,17],[41,13],[40,23],[34,24]],C.red);
      h(13,12,23,17,C.red,C.burgundy); f(18,18,10,C.ink,null);
      r(20,24,12,2,C.bark); r(22,24,2,3,C.cream); r(29,24,2,3,C.cream);
      b(28,32,7,5,C.gold); r(30,33,3,2,C.cream);
    },
    pumpkin(p) {
      const {rect:r,oval:o,poly:q}=p;
      o(24,29,19,15,C.ink); o(24,28,18,14,C.ochre); o(24,28,13,14,C.orange);
      o(24,28,6,13,C.gold); r(22,11,5,6,C.moss); r(25,8,6,4,C.moss); r(28,7,5,2,C.green);
      q([[13,22],[19,26],[12,27]],C.bark); q([[34,22],[28,26],[35,27]],C.bark);
      q([[12,31],[18,34],[22,32],[27,35],[34,31],[31,38],[19,38]],C.bark);
      r(18,32,3,3,C.gold); r(28,35,3,3,C.gold); r(9,24,2,6,C.orange);
    },
    parcel(p) {
      const {rect:r,box:b,poly:q}=p;
      q([[6,15],[25,9],[42,16],[42,37],[24,44],[6,36]],C.ink);
      q([[8,17],[24,12],[40,17],[24,23]],C.gold);
      q([[8,19],[23,25],[23,41],[8,35]],C.ochre);
      q([[25,25],[40,19],[40,35],[25,41]],C.brown);
      q([[17,14],[22,13],[36,19],[31,21]],C.purple);
      q([[29,23],[34,21],[34,37],[29,39]],C.plum);
      b(11,25,9,7,C.cream); r(13,27,5,1,C.bark); r(13,29,3,1,C.bark);
      r(9,20,2,14,C.orange);
    },
    human(p) {
      const {rect:r,box:b,poly:q}=p;
      b(8,18,33,23,C.brown); r(9,19,30,3,C.gold);
      q([[8,18],[2,13],[15,8],[24,15]],C.ochre); q([[24,15],[35,8],[46,14],[40,18]],C.gold);
      b(16,25,17,10,C.cream); r(19,29,11,2,C.burgundy); q([[18,30],[23,26],[23,34]],C.burgundy);
      r(10,23,2,15,C.ochre); b(18,8,12,10,C.white); r(20,10,8,1,C.gray); r(20,13,6,1,C.gray);
    },
    'dragon-droppings'(p) {
      const {rect:r,poly:q,sparkle:s}=p;
      q([[6,34],[8,26],[14,24],[15,17],[22,14],[25,8],[31,12],[32,19],[38,22],[39,28],[44,33],[41,39],[12,40]],C.ink);
      q([[9,33],[11,27],[18,25],[18,19],[25,17],[27,11],[30,15],[29,21],[35,24],[35,29],[41,34],[38,37],[13,38]],C.darkPurple);
      q([[12,28],[20,26],[19,21],[26,19],[30,22],[25,25],[28,29],[37,30],[39,33],[30,34],[27,31],[18,32]],C.plum);
      r(12,32,4,2,C.gray); r(23,21,3,2,C.gray); r(32,30,3,2,C.gray);
      r(19,11,1,4,C.orange); r(19,7,2,3,C.orange); r(36,15,1,4,C.orange); r(35,11,1,4,C.orange);
      s(7,17,C.gold); s(39,7,C.gold);
    },
    'ghost-macarons'(p) {
      const {rect:r,box:b,oval:o,face:f}=p;
      o(24,39,20,4,C.ink); o(24,38,18,3,C.gray);
      for (const [x,y,c] of [[15,30,C.purple],[31,29,C.mint],[23,18,C.cream]]) {
        o(x,y,9,7,C.ink); o(x,y-1,8,6,c); r(x-8,y+1,16,2,C.white); r(x-5,y-4,5,1,C.white);
      }
      f(19,15,6,C.ink,C.pink); r(17,8,2,3,C.gray); r(31,9,2,3,C.gray);
    },
    'hoof-polish'(p) {
      const {rect:r,box:b,poly:q,bottle}=p;
      bottle(8,10,C.plum); b(30,10,6,6,C.brown); b(31,15,4,18,C.ochre); b(28,31,10,8,C.cream);
      r(29,33,8,2,C.brown); r(29,37,8,2,C.gold);
      q([[17,25],[14,27],[14,31],[17,33],[20,31],[20,27]],C.gold); r(16,27,2,4,C.plum);
    },
    'tax-forms'(p) {
      const {rect:r,box:b,poly:q}=p;
      b(13,9,27,32,C.gray); b(9,6,27,32,C.cream); r(11,8,23,3,C.white);
      r(13,14,18,3,C.burgundy); r(13,20,12,1,C.brown); r(13,24,18,1,C.brown);
      r(13,27,18,1,C.brown); r(13,30,18,1,C.brown); r(13,33,8,1,C.brown);
      b(26,29,7,6,C.burgundy); r(28,31,3,2,C.cream);
      q([[36,23],[40,22],[44,39],[42,43],[39,40]],C.ink); q([[37,25],[39,25],[42,39],[40,39]],C.gold);
    },
    'pocket-magnet'(p) {
      const {rect:r,box:b,poly:q,sparkle:s}=p;
      q([[9,10],[20,10],[20,27],[23,30],[27,30],[30,27],[30,10],[41,10],[41,29],[36,36],[29,40],[20,40],[13,36],[9,29]],C.ink);
      q([[11,12],[18,12],[18,28],[23,33],[28,33],[32,28],[32,12],[39,12],[39,28],[34,34],[28,38],[21,38],[15,34],[11,28]],C.red);
      r(12,14,2,12,C.pink); r(35,14,2,12,C.pink); b(9,9,11,9,C.lightGray); b(30,9,11,9,C.lightGray);
      b(21,12,6,5,C.gold); r(23,13,2,3,C.orange); s(6,24,C.gold); s(42,4,C.gold);
    },
    'bone-varnish'(p) {
      const {rect:r,box:b,bottle,oval:o,sparkle:s}=p;
      bottle(8,9,C.blue); b(30,15,7,23,C.cream);
      o(30,16,4,4,C.ink); o(37,16,4,4,C.ink); o(30,36,4,4,C.ink); o(37,36,4,4,C.ink);
      o(30,16,3,3,C.cream); o(37,16,3,3,C.cream); o(30,36,3,3,C.cream); o(37,36,3,3,C.cream); r(31,16,5,20,C.cream);
      r(33,20,2,12,C.white); s(39,8,C.gold);
    },
    'moon-umbrella'(p) {
      const {rect:r,box:b,poly:q}=p;
      r(24,5,2,33,C.ink); q([[4,25],[9,16],[16,11],[24,8],[32,11],[39,16],[44,25],[34,23],[25,26],[15,23]],C.ink);
      q([[7,23],[11,17],[18,12],[24,10],[30,12],[37,17],[41,23],[34,21],[25,24],[15,21]],C.plum);
      q([[17,21],[20,14],[24,10],[28,15],[32,21],[25,24]],C.purple);
      r(25,26,1,12,C.gold); b(20,37,7,5,C.gold); r(20,34,2,5,C.gold);
      r(11,19,3,1,C.gold); r(12,18,1,3,C.gold); r(32,16,3,1,C.cream); r(33,15,1,3,C.cream);
    },
    'moisture-cubes'(p) {
      const {rect:r,box:b,poly:q,sparkle:s}=p;
      for(const [x,y] of [[8,23],[25,24],[17,9]]) {
        q([[x,y+4],[x+7,y],[x+17,y+4],[x+17,y+16],[x+9,y+20],[x,y+15]],C.ink);
        q([[x+2,y+5],[x+7,y+2],[x+14,y+5],[x+8,y+8]],C.mint);
        q([[x+2,y+7],[x+7,y+10],[x+7,y+17],[x+2,y+14]],C.green);
        q([[x+9,y+10],[x+15,y+7],[x+15,y+14],[x+9,y+17]],C.teal);
        r(x+3,y+5,3,1,C.white); r(x+3,y+8,1,4,C.white);
      }
      s(8,11,C.blue); s(40,16,C.gold);
    },
    'broken-stapler'(p) {
      const {rect:r,box:b,poly:q}=p;
      b(7,33,34,6,C.deep); r(9,34,29,2,C.gray);
      q([[6,29],[10,25],[35,28],[38,33],[13,33]],C.ink); q([[9,29],[12,27],[34,30],[34,31],[14,31]],C.burgundy);
      q([[8,25],[7,12],[12,10],[35,19],[38,25],[33,28]],C.ink); q([[10,23],[10,14],[13,13],[33,21],[35,24],[32,25]],C.red);
      q([[14,15],[30,21],[31,23],[14,18]],C.pink);
      b(23,29,5,3,C.gray); r(25,31,1,3,C.gray); r(38,14,4,1,C.gold); r(40,16,3,1,C.gold);
      b(4,39,5,3,C.gray); r(11,42,4,1,C.gray);
    },
    'maze-pretzel'(p) {
      const {rect:r,box:b,oval:o}=p;
      o(24,38,20,4,C.ink); o(24,37,18,3,C.cream);
      b(9,9,31,29,C.bark); b(11,11,27,25,C.orange); r(13,12,23,2,C.gold);
      for(const [x,y,w,h] of [[15,16,18,3],[15,16,3,8],[21,22,12,3],[30,17,3,13],[14,28,12,3],[21,25,3,6]]) r(x,y,w,h,C.bark);
      r(14,13,2,1,C.cream); r(26,14,1,2,C.cream); r(35,22,1,2,C.cream); r(18,33,2,1,C.cream); r(27,29,2,1,C.cream);
    },
    'fur-detangler'(p) {
      const {rect:r,box:b,poly:q}=p;
      b(12,9,22,18,C.brown); b(14,11,18,14,C.purple); r(15,12,3,11,C.pink);
      for(let x=15;x<32;x+=4) { r(x,15,1,12,C.cream); r(x,14,1,2,C.white); }
      b(20,27,7,16,C.brown); r(22,29,2,11,C.orange); r(23,39,2,2,C.ink);
      q([[34,17],[40,12],[43,18],[41,23],[45,25],[39,28],[34,23]],C.gray);
      r(37,17,1,6,C.lightGray); r(38,21,3,1,C.lightGray);
    },
    'cauldron-deodorizer'(p) {
      const {rect:r,box:b,oval:o,poly:q,sparkle:s}=p;
      b(12,36,6,6,C.ink); b(30,36,6,6,C.ink); o(24,29,17,12,C.ink); o(24,28,14,10,C.plum);
      r(11,23,3,10,C.purple); b(6,22,5,7,C.gold); b(38,22,5,7,C.gold);
      o(24,19,18,5,C.ink); o(24,18,15,3,C.moss); o(24,17,12,2,C.green);
      b(18,24,12,8,C.cream); q([[24,25],[21,29],[24,31],[27,29]],C.moss);
      r(18,10,2,4,C.mint); r(20,6,2,4,C.mint); r(28,9,2,5,C.mint); r(27,5,2,4,C.mint);
      s(37,10,C.gold);
    },
    'wrap-refresher'(p) {
      const {rect:r,box:b,poly:q}=p;
      b(16,13,7,6,C.purple); b(14,7,20,6,C.plum); r(17,8,15,2,C.purple); b(29,11,5,7,C.plum);
      q([[16,17],[24,17],[28,23],[28,40],[11,40],[11,23]],C.ink);
      q([[17,19],[23,19],[26,24],[26,38],[13,38],[13,24]],C.blue);
      r(14,24,2,12,C.white); b(16,26,10,8,C.cream); r(18,28,6,1,C.gold); r(18,31,6,1,C.gold);
      r(37,7,3,1,C.mint); r(39,10,4,1,C.mint); r(36,13,3,1,C.mint);
      b(32,27,10,14,C.cream); r(34,29,6,1,C.gold); r(34,33,6,1,C.gold); r(34,37,6,1,C.gold);
    },
    'microwave-manual'(p) {
      const {rect:r,box:b,poly:q}=p;
      q([[9,8],[33,5],[40,10],[40,40],[15,43],[9,38]],C.ink);
      q([[11,10],[33,7],[37,10],[15,13]],C.white); q([[15,15],[38,12],[38,38],[15,41]],C.blue); r(11,12,3,25,C.teal);
      b(19,18,16,13,C.cream); b(21,20,9,7,C.ink); r(22,21,6,4,C.gray); r(32,21,1,2,C.red); r(32,25,1,2,C.teal);
      r(20,34,14,1,C.ink); r(20,37,10,1,C.ink); r(18,14,17,1,C.mint);
    },
    'tiny-pitchfork'(p) {
      const {rect:r,box:b,poly:q,sparkle:s}=p;
      b(22,17,5,26,C.burgundy); r(23,20,1,20,C.red);
      q([[9,7],[12,3],[15,7],[15,17],[22,21],[22,8],[24,4],[27,8],[27,21],[34,17],[34,7],[37,3],[40,7],[40,19],[31,26],[18,26],[9,19]],C.ink);
      q([[11,8],[12,6],[13,8],[13,18],[23,24],[23,9],[24,7],[25,9],[25,24],[36,18],[36,8],[37,6],[38,8],[38,18],[30,24],[19,24],[11,18]],C.red);
      r(12,8,1,8,C.pink); r(24,10,1,10,C.pink); r(37,8,1,8,C.pink);
      b(29,29,10,7,C.cream); r(31,31,6,1,C.bark); r(31,33,4,1,C.bark); r(27,29,3,1,C.gold); s(6,28,C.gold);
    }
  };

  sprites['return-box'] = sprites.human;
  const ids = Object.freeze(Object.keys(sprites));

  /** Draw an original sprite at 96×96. CSS may scale it using image-rendering: pixelated. */
  function draw(canvas, id, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    canvas.width = 96;
    canvas.height = 96;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 96, 96);
    ctx.save();
    ctx.scale(2, 2);
    const p = painter(ctx);
    if (options.shadow !== false) {
      ctx.globalAlpha = .22;
      p.oval(24, 44, 17, 2, C.ink);
      ctx.globalAlpha = 1;
    }
    (sprites[id] || sprites.parcel)(p);
    ctx.restore();
    return true;
  }

  const api = Object.freeze({ draw, ids, palette: Object.freeze(C) });
  root.ShopSprites = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
