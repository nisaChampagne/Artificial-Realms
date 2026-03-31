/* ─────────────────────────────────────────────────────────────
   map.js — Animated Canvas Map
───────────────────────────────────────────────────────────── */

const T = { VOID:0, WALL:1, FLOOR:2, WATER:3, LAVA:4, GRASS:5, TREE:6, PATH:7,
             TORCH:8, DOOR:9, CHEST:10, STAIRS:11, TABLE:12, COLUMN:13, SAND:14 };

// ── Scene Palette ────────────────────────────────────────────
const PALETTES = {
  dungeon: { floor:'#1e1a10', wall:'#0e0c08', torch:true },
  tavern:  { floor:'#4a2d14', wall:'#2e1c0c', torch:true },
  forest:  { floor:'#152810', wall:'#0a1a08' },
  cave:    { floor:'#181418', wall:'#0c0a0c' },
  castle:  { floor:'#1a1820', wall:'#0e0c14' },
  town:    { floor:'#2a2015', wall:'#1a1410' },
  combat:  { floor:'#1e1408', wall:'#0e0a04' },
  boss:    { floor:'#1e0808', wall:'#0e0404' },
  rest:    { floor:'#1a2010', wall:'#101408' },
  manor:   { floor:'#2a1e0e', wall:'#16100a', torch:true },
  ruins:   { floor:'#181c10', wall:'#0e100a' },
  crypt:   { floor:'#141018', wall:'#0a080e', torch:true },
};

// ── Map Layouts ──────────────────────────────────────────────
// Each layout is a string grid: # = wall, . = floor, ~ = water,
// t = torch, D = door, C = chest, S = stairs, T = tree,
// P = path, p = pillar, L = lava, s = sand, A = table
const LAYOUTS = {
  dungeon: `
############################
#......t..........t......#.#
#..####...........####...#.#
#..#..#...........#..#...###
#..#..#####D#######..#.....#
#..#.....t.........t.#.....#
#t.#..####.........####....#
#..#..#....C.....p.....#...#
#..#..#..###########...#...t
#S.#..#..#.....p.......#...#
########.#.....(a).....#.###
#.......D#.............D...#
#..t.....#####.....#####...#
#.........#..#.....#..#....#
#p........#t.#######..#....#
#.......#.#.........p.#....#
###..####.#.....t.....#.###t
#t.........####D####p......#
#..........#..........t....#
############################`,

  tavern: `
#####################
#.........A........#
#t....A...A...A....#
#.....A...........t#
#.####.............#
#.#..#...AAAAAA....#
#t#..#.............#
#.D..#.....A....A..#
#.####....A........#
#..................t#
##....####.....####.#
#t....#..#.....#..#t#
#.....#..#.....#..#.#
#.....####.....####.#
#...................#
#t...AAAAAA........t#
#...................#
#####################`,

  forest: `
TTT.TTTTTTTTTTTTTTTTTTTTTTT
TT...TTTTTTTTTTTTTTTTTTTTTTT
T.....TTTTTT............TTTTT
......TTTT...............TTTT
PPPPPPPP..................TTT
T.......PPPPPP............TTT
TT..........PPPP.......TTTTTT
TTT...........PPPPPPPPTTTTTTTT
TTT.....T..........PPPPPTTTTTT
TTTT...TTT....~~......PPPPTTT
TTTTT.TTTTT...~~~..........TT
TTTTT.TTTTT...~~............T
TTTTTTTTTTTT...............TT
TTTTT.......PPPPPPPP.......TTT
TTTT....TT....T...PPPPPPPPTTTT
TTT...TTTT....TT.....PPPPTTTTT`,

  cave: `
############################
##......#######.....#######
#..####....#....ttt...#....#
#..#..####.D.#######..####.#
#..#.....#..#......#.......#
#t.####..#..#..####......###
#......~~~~~#..#...#####...#
#......~~~~~D..#...#...C...#
#......~~~~~#..#...#####...#
####...#####...####......###
#...##.......t.........###.#
#..#.######...######...#...#
#t.#.#....#...#....#...#...t
#..#.#....####..##.#####...#
#..D.#.t.......##..D.......#
S....####.....####.....#####
############################`,

  castle: `
################################
#p............p...........p....#
#....####.........####.........#
#....#..#.........#..#.........#
#....#..###########..#.........#
#p...D.......t.......D.......p.#
#....#..###########..#.........#
#....#..#.........#..#.........#
#....####.........####.........#
#..............................#
#p....####.t.......t.####....p.#
#.....#..#...........#..#......#
#.....#..###########.#..######.#
#.....D.....t....t...D.........#
#.....#..#############..###....#
#.....####.................#...#
#S...........................#..#
################################`,

  town: `
########.########
#.......D.......#
#.A.A...........#
#.A.A...t.......#
#...............#
########.########
#.......D.......#
#.....t.........#
#...............#
#.A.A.A.........#
#.A.............#
########.########
......P..........
......P..........
######P##########
#.....P.........#
#.....t.........#
#...............#
#...............#
#################`,

  combat: `
##############################
#.....t...................t..#
#....#####.............#####.#
#....#...#.............#...#.#
#...D#...#...########..#...#.#
#....#...D...#......#..D...#.#
#....#####...#...t..#..#####.#
#............########........#
#t.....................t......#
#....####.D..D..####.........#
#....#..#........#..#........#
#....#..##########..#........#
#....#..............#........#
#....##################......#
#....#.............t.#.......#
#....#...C...C...C...#.......t
##############################`,

  boss: `
##############################
#.p..p..p..p..p..p..p..p..p.#
#............................#
#....####....####....####....#
#....#..####.#..#####..#.....#
#....#......####.......#.....#
#p...##....L.LLL.L....##...p.#
#.....#...LLLLLLLLL...#......#
#.....####LLLLLLLLL####......#
#..........LLLLLLL...........#
#p....L....LLLLLLL....L....p.#
#.....####LLLLLLLLL####......#
#.....#...LLLLLLLLL...#......#
#p...##....L.LLL.L....##...p.#
#....#......####.......#.....#
S....########.########.......#
##############################`,

  rest: `
###############
#.............#
#.t...........#
#.............#
#..####...##..#
#..#..#...##..#
#..#..#...##..#
#..####...##..#
#.............#
#...t.....t...#
#.............#
###############`,

  manor: `
##############################
#p....t....................p.#
#.##########...##########...#
#.#.........D.D.........#...#
#.#...A..t..#.#..t..A...#...#
#.D.........D.D.........D...#
#.#...A.....#.#.....A...#...#
#.##########...##########...#
#...........t.t.............#
##########D.....D############
#.........#.....#...........#
#...A.A...D..S..D....A.A....#
#.........#.....#...........#
##########.#####.############
##############################`,

  ruins: `
##....####....####....##.....
#......#........#......#.....
#...T..D........D...T..#.....
####...#....t...#...#####....
.......####.D.####...........
.......#...D...#.............
....T..#.......#...T.........
.......####.####.............
.......#.................#...
.....###...T..S..T...###.....
.....#...................#...
.....###################.....
.............................
##....####....####....##.....
#......#........#......#.....
T......D........D......T.....
####T...#....t...#...T####...`,

  crypt: `
##############################
#...t..#########.########.t.#
#......D...C...D.D...C...D..#
#......#########.########...#
######.#.........#.#.########
#......D....A....D.D.........#
#......#########.########...#
######.#.........#.#.########
#......D...C...D.D...C...D..#
#...t..#########.########.t.#
#..............S.............#
##############################`,
};

// ── ProceduralMapGen ─────────────────────────────────────────
class ProceduralMapGen {

  static generate(type) {
    switch (type) {
      case 'cave':               return this._cellular(30, 20);
      case 'dungeon':
      case 'combat':
      case 'castle':
      case 'boss':               return this._bsp(32, 22, type);
      default:                   return null;
    }
  }

  // Room-corridor BSP dungeon
  static _bsp(w, h, type) {
    const map = Array.from({ length: h }, () => new Array(w).fill(T.WALL));
    const rooms = [];
    const minR  = 3;
    const maxR  = type === 'boss' ? 12 : type === 'combat' ? 5 : 7;
    const target = type === 'boss' ? 4 : type === 'combat' ? 6 : 9;

    for (let attempts = 0; attempts < 120 && rooms.length < target; attempts++) {
      const rw = minR + ~~(Math.random() * (maxR - minR));
      const rh = minR + ~~(Math.random() * (maxR - minR));
      const rx = 1 + ~~(Math.random() * (w - rw - 2));
      const ry = 1 + ~~(Math.random() * (h - rh - 2));
      if (rooms.some(r => rx < r.x + r.w + 2 && rx + rw + 2 > r.x && ry < r.y + r.h + 2 && ry + rh + 2 > r.y)) continue;
      for (let y = ry; y < ry + rh; y++)
        for (let x = rx; x < rx + rw; x++)
          map[y][x] = T.FLOOR;
      rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: ~~(rx + rw / 2), cy: ~~(ry + rh / 2) });
    }

    // Shuffle connections so layout feels less linear
    for (let i = rooms.length - 1; i > 0; i--) {
      const j  = ~~(Math.random() * (i + 1));
      [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
    }

    // Connect rooms with L-corridors
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1], b = rooms[i];
      let cx = a.cx, cy = a.cy;
      const horizontal = Math.random() < 0.5;
      if (horizontal) {
        while (cx !== b.cx) { if (cy >= 0 && cy < h && cx >= 0 && cx < w) map[cy][cx] = T.FLOOR; cx += cx < b.cx ? 1 : -1; }
        while (cy !== b.cy) { if (cy >= 0 && cy < h && cx >= 0 && cx < w) map[cy][cx] = T.FLOOR; cy += cy < b.cy ? 1 : -1; }
      } else {
        while (cy !== b.cy) { if (cy >= 0 && cy < h && cx >= 0 && cx < w) map[cy][cx] = T.FLOOR; cy += cy < b.cy ? 1 : -1; }
        while (cx !== b.cx) { if (cy >= 0 && cy < h && cx >= 0 && cx < w) map[cy][cx] = T.FLOOR; cx += cx < b.cx ? 1 : -1; }
      }
    }

    // Place Stairs in room 0, chest in last room
    if (rooms.length > 0) {
      map[rooms[0].cy][rooms[0].cx] = T.STAIRS;
      const last = rooms[rooms.length - 1];
      map[last.cy][last.cx] = T.CHEST;
    }

    // Torches in interior corners of each room
    rooms.forEach((r, i) => {
      if (i === 0) return;
      if (r.w > 3 && r.h > 3) {
        map[r.y + 1][r.x + 1]           = T.TORCH;
        map[r.y + 1][r.x + r.w - 2]     = T.TORCH;
      }
    });

    // Doors at corridor-room junctions (simple: place on first floor tile entering a room)
    rooms.forEach(r => {
      const entries = [
        [r.x - 1, r.cy], [r.x + r.w, r.cy],
        [r.cx, r.y - 1], [r.cx, r.y + r.h],
      ];
      entries.forEach(([ex, ey]) => {
        if (ey >= 0 && ey < h && ex >= 0 && ex < w && map[ey][ex] === T.FLOOR) {
          if (Math.random() < 0.6) map[ey][ex] = T.DOOR;
        }
      });
    });

    // Boss room gets lava ring
    if (type === 'boss' && rooms.length > 1) {
      const br = rooms[rooms.length - 1];
      for (let y = br.y; y < br.y + br.h; y++)
        for (let x = br.x; x < br.x + br.w; x++)
          if (y === br.y || y === br.y + br.h - 1 || x === br.x || x === br.x + br.w - 1)
            if (map[y][x] === T.FLOOR) map[y][x] = T.LAVA;
    }

    return map;
  }

  // Cellular automata cave
  static _cellular(w, h) {
    let map = Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) =>
        (x === 0 || x === w - 1 || y === 0 || y === h - 1)
          ? T.WALL
          : Math.random() < 0.44 ? T.WALL : T.FLOOR
      )
    );

    for (let iter = 0; iter < 5; iter++) {
      map = map.map((row, y) => row.map((_, x) => {
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1) return T.WALL;
        let walls = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (!(dx === 0 && dy === 0) && map[y + dy]?.[x + dx] === T.WALL) walls++;
        return walls >= 5 ? T.WALL : T.FLOOR;
      }));
    }

    // Place stairs at first open cell near top-left
    let startX = 2, startY = 2;
    outer: for (let y = 2; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++)
        if (map[y][x] === T.FLOOR) { startX = x; startY = y; break outer; }
    map[startY][startX] = T.STAIRS;

    // Scatter torches in open areas
    let tc = 0;
    for (let y = 1; y < h - 1 && tc < 6; y++)
      for (let x = 1; x < w - 1 && tc < 6; x++)
        if (map[y][x] === T.FLOOR && Math.random() < 0.025) { map[y][x] = T.TORCH; tc++; }

    // Chest near bottom-right
    for (let y = h - 3; y > h / 2; y--)
      for (let x = w - 3; x > w / 2; x--)
        if (map[y][x] === T.FLOOR) { map[y][x] = T.CHEST; return map; }

    return map;
  }
}

// ── MapSystem ────────────────────────────────────────────────
class MapSystem {
  constructor() {
    this.canvas       = null;
    this.ctx          = null;
    this.tileSize     = 24;
    this.map          = [];
    this.fog          = [];
    this.playerX      = 5;
    this.playerY      = 10;
    this.enemies      = [];
    this.items        = [];
    this.landmarks    = [];   // [{ label, x, y }] named POI pins
    this.currentScene = 'dungeon';
    this.fogEnabled   = true;
    this.time         = 0;
    this._raf         = null;
    this._offscreen   = null;
    this._dirty       = true;
    // Sprite appearance cache
    this.sprite       = { skin:'#e3c49a', hair:'#3d2008', hairStyle:'short', eye:'#4878b0', bodyType:'average' };
    // Perception rolls per scene — persisted so we don't re-roll on revisit
    this._perceptionCache = {};
  }

  init() {
    // Always re-query the canvas so loading saves works
    this.canvas = document.getElementById('map-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resize();

    // Only attach listeners once
    if (!this._listenersAttached) {
      this._listenersAttached = true;
      window.addEventListener('resize', () => this._resize());
      document.getElementById('btn-fog-toggle').addEventListener('click', () => {
        this.fogEnabled = !this.fogEnabled;
        this._dirty = true;
      });
    }

    this.setScene('dungeon');
  }

  _resize() {
    if (!this.canvas) return;
    const panel = this.canvas.parentElement;
    if (!panel) return;
    this.canvas.width  = panel.clientWidth;
    this.canvas.height = Math.max(100, panel.clientHeight - 58); // topbar + legend
    this._dirty = true;
  }

  // ── Scene ────────────────────────────────────────────────────
  setScene(name) {
    if (!this.canvas) return;
    this.currentScene = name;
    this.landmarks    = [];
    document.getElementById('map-location').textContent = this._sceneLabel(name);
    document.getElementById('music-now').textContent    = this._musicLabel(name);

    // Use procedural generation for dungeon-type scenes
    const proceduralScenes = new Set(['dungeon', 'cave', 'combat', 'castle', 'boss']);
    const generatedMap = proceduralScenes.has(name) ? ProceduralMapGen.generate(name) : null;
    if (generatedMap) {
      this.map = generatedMap;
    } else {
      this._parseLayout(LAYOUTS[name] || LAYOUTS.dungeon);
    }

    // Find player start (S tile or default position)
    let startX = 3, startY = 5;
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < (this.map[y]?.length || 0); x++) {
        if (this.map[y][x] === T.STAIRS) { startX = x; startY = y; }
      }
    }
    this.playerX = startX;
    this.playerY = startY;
    this.enemies = this._spawnEnemies(name);
    this.fog     = this.map.map(row => row.map(() => true));

    // Perception check — only rolls once per scene; re-uses cached result on revisit
    const { radius, roll, bonus, label } = this._rollPerception(name);
    this._revealAround(this.playerX, this.playerY, radius);
    this._dirty = true;

    // Cancel any existing loop then restart fresh
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._loop();
  }

  // Roll perception (or return cached result) and compute reveal radius
  _rollPerception(scene) {
    if (this._perceptionCache[scene]) {
      // Return cached — no re-roll, no message
      return { ...this._perceptionCache[scene], cached: true };
    }
    const roll  = Math.floor(Math.random() * 20) + 1;
    const bonus = window.characterSystem?.getPerceptionBonus?.() ?? 0;
    const total = roll + bonus;
    // Radius tiers
    const radius = total >= 20 ? 12 : total >= 16 ? 9 : total >= 11 ? 6 : total >= 6 ? 4 : 2;
    const label  = this._sceneLabel(scene);
    const entry  = { roll, bonus, radius, label };
    this._perceptionCache[scene] = entry;
    return entry;
  }

  _perceptionDesc(total) {
    if (total >= 20) return 'You take in every detail of the surroundings.';
    if (total >= 16) return 'You notice most of the area around you.';
    if (total >= 11) return 'You get a reasonable sense of the space.';
    if (total >= 6)  return 'You can make out the immediate area.';
    return 'Everything beyond arm\'s reach is shrouded in darkness.';
  }

  _sceneLabel(s) {
    return { dungeon:'The Dungeon', tavern:'The Tavern', forest:'Whispering Forest',
             cave:'Dark Caverns', castle:'The Castle', town:'Town Square',
             combat:'Battle Arena', boss:"Dragon's Lair", rest:'Safe Camp',
             manor:'The Manor', ruins:'Ancient Ruins', crypt:'The Crypt' }[s] || s;
  }

  _musicLabel(s) {
    return { dungeon:'Dungeon Depths', tavern:'Tavern Lofi', forest:'Forest Ambience',
             cave:'Cave Echoes', castle:'Castle Hall', town:'Town Square',
             combat:'Battle Theme', boss:'Boss Encounter', rest:'Campfire Rest',
             manor:'Manor Halls', ruins:'Ancient Ruins', crypt:'Dark Crypt' }[s] || s;
  }

  _parseLayout(str) {
    const lines = str.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    this.map = lines.map(row =>
      row.split('').map(ch => {
        switch(ch) {
          case '#': return T.WALL;
          case '.': return T.FLOOR;
          case '~': return T.WATER;
          case 'L': return T.LAVA;
          case 'T': return T.TREE;
          case 'P': case 'p': return ch === 'P' ? T.PATH : T.COLUMN;
          case 't': return T.TORCH;
          case 'D': return T.DOOR;
          case 'C': return T.CHEST;
          case 'S': return T.STAIRS;
          case 'A': case 'a': return T.TABLE;
          case 's': return T.SAND;
          default:  return T.FLOOR;
        }
      })
    );
  }

  // ── Named POI landmark beacon ────────────────────────────────
  addLandmark(label) {
    const rows = this.map.length;
    const cols = this.map[0]?.length || 0;
    if (!rows || !cols) return;

    // Target position: halfway between player and map centre
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    const dx = cx - this.playerX;
    const dy = cy - this.playerY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const frac = Math.max(4 / dist, 0.5);
    let tx = Math.round(this.playerX + dx * Math.min(frac, 0.65));
    let ty = Math.round(this.playerY + dy * Math.min(frac, 0.65));
    tx = Math.max(1, Math.min(cols - 2, tx));
    ty = Math.max(1, Math.min(rows - 2, ty));

    // Spiral outward to find nearest walkable tile
    outer: for (let r = 0; r <= 5; r++) {
      for (let dy2 = -r; dy2 <= r; dy2++) {
        for (let dx2 = -r; dx2 <= r; dx2++) {
          if (Math.abs(dx2) !== r && Math.abs(dy2) !== r) continue;
          const nx = tx + dx2, ny = ty + dy2;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && !this._isSolid(nx, ny)) {
            tx = nx; ty = ny; break outer;
          }
        }
      }
    }

    this.landmarks.push({ label, x: tx, y: ty });
    this._revealAround(tx, ty, 3);
    this._dirty = true;
  }

  _spawnEnemies(scene) {
    if (scene === 'rest' || scene === 'tavern' || scene === 'town') return [];
    const count = scene === 'combat' ? 4 : scene === 'boss' ? 1 : 2;
    const enms  = [];
    for (let i = 0; i < count; i++) {
      let ex, ey, tries = 0;
      do {
        ey = Math.floor(Math.random() * this.map.length);
        ex = Math.floor(Math.random() * (this.map[ey]?.length || 1));
        tries++;
      } while (tries < 50 && (this._isSolid(ex, ey) || (Math.abs(ex - this.playerX) + Math.abs(ey - this.playerY)) < 4));
      if (tries < 50) {
        enms.push({ x:ex, y:ey, hp:scene === 'boss' ? 80 : 20, maxHp: scene === 'boss' ? 80 : 20, icon: scene === 'boss' ? '🐉' : '☠' });
      }
    }
    return enms;
  }

  _isSolid(x, y) {
    if (y < 0 || y >= this.map.length || x < 0 || x >= (this.map[y]?.length || 0)) return true;
    const t = this.map[y][x];
    return t === T.WALL || t === T.TREE;
  }

  _revealAround(cx, cy, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const ny = cy + dy, nx = cx + dx;
          if (ny >= 0 && ny < this.fog.length && nx >= 0 && nx < (this.fog[ny]?.length || 0)) {
            this.fog[ny][nx] = false;
          }
        }
      }
    }
  }

  // ── Render ───────────────────────────────────────────────────
  _loop() {
    this.time++;
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const { canvas, ctx, map, fog, time, currentScene } = this;
    if (!canvas || !ctx) return;
    const pal   = PALETTES[currentScene] || PALETTES.dungeon;
    const rows  = map.length;
    const cols  = map[0]?.length || 0;

    // Auto-scale tile size to fit canvas
    const fitTile = Math.min(
      Math.floor(canvas.width  / cols),
      Math.floor(canvas.height / rows)
    );
    const ts = Math.max(8, Math.min(fitTile, 28));

    const totalW = ts * cols;
    const totalH = ts * rows;
    const offX   = Math.floor((canvas.width  - totalW) / 2);
    const offY   = Math.floor((canvas.height - totalH) / 2);

    ctx.fillStyle = '#050404';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px  = offX + x * ts;
        const py  = offY + y * ts;
        const isF = this.fogEnabled && fog[y]?.[x] !== false;

        if (isF) {
          ctx.fillStyle = '#050404';
          ctx.fillRect(px, py, ts, ts);
          continue;
        }

        const tile = map[y][x];
        this._drawTile(ctx, px, py, ts, tile, pal, time);
      }
    }

    // Torch glows (drawn after tiles, before fog)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (map[y][x] !== T.TORCH) continue;
        if (this.fogEnabled && fog[y]?.[x] !== false) continue;
        const px = offX + x * ts + ts / 2;
        const py = offY + y * ts + ts / 2;
        const r  = ts * (2.2 + 0.4 * Math.sin(time * 0.08 + x + y));
        const g  = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0,   'rgba(255,180,40,0.22)');
        g.addColorStop(0.5, 'rgba(255,100,0,0.08)');
        g.addColorStop(1,   'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(px - r, py - r, r * 2, r * 2);
      }
    }

    // Half fog (explored but dark)
    if (this.fogEnabled) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (fog[y]?.[x] === false) continue;
          const px = offX + x * ts;
          const py = offY + y * ts;
          ctx.fillStyle = '#050404';
          ctx.fillRect(px, py, ts, ts);
        }
      }
    }

    // Enemies
    this.enemies.forEach(e => {
      if (this.fogEnabled && fog[e.y]?.[e.x] !== false) return;
      const px = offX + e.x * ts + ts / 2;
      const py = offY + e.y * ts + ts / 2;
      // Glow ring
      ctx.fillStyle = 'rgba(200,40,40,0.2)';
      ctx.beginPath();
      ctx.arc(px, py, ts * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e05050';
      ctx.font = `${Math.max(10, ts - 4)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', px, py + 1);
    });

    // Landmark POI beacons
    this.landmarks.forEach(({ label, x, y }) => {
      if (this.fogEnabled && fog[y]?.[x] !== false) return;
      const px = offX + x * ts + ts / 2;
      const py = offY + y * ts + ts / 2;
      const pulse = 0.8 + 0.2 * Math.sin(time * 0.04 + x * 0.7);

      // Outer pulsing glow
      const gr = ts * (1.9 + 0.5 * Math.sin(time * 0.06 + y));
      const grd = ctx.createRadialGradient(px, py, 0, px, py, gr);
      grd.addColorStop(0, `rgba(220,185,40,${0.38 * pulse})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(px - gr, py - gr, gr * 2, gr * 2);

      // Diamond marker
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.PI / 4);
      const hs = ts * 0.27 * pulse;
      ctx.fillStyle = `rgba(240,200,50,${0.95 * pulse})`;
      ctx.fillRect(-hs, -hs, hs * 2, hs * 2);
      ctx.restore();

      // Vertical stem
      ctx.strokeStyle = `rgba(240,200,50,${0.55 * pulse})`;
      ctx.lineWidth = Math.max(1, ts * 0.07);
      ctx.beginPath();
      ctx.moveTo(px, py - ts * 0.42);
      ctx.lineTo(px, py - ts * 1.15);
      ctx.stroke();

      // Label text
      ctx.fillStyle = `rgba(250,225,140,${0.95 * pulse})`;
      ctx.font = `bold ${Math.max(8, Math.round(ts * 0.52))}px Cinzel, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 5;
      ctx.fillText(label, px, py - ts * 1.18);
      ctx.shadowBlur = 0;
    });

    // Player
    const ppx = offX + this.playerX * ts + ts / 2;
    const ppy = offY + this.playerY * ts + ts / 2;
    // Player glow
    const pg = ctx.createRadialGradient(ppx, ppy, 0, ppx, ppy, ts * 1.2);
    pg.addColorStop(0,   'rgba(240,210,50,0.3)');
    pg.addColorStop(1,   'transparent');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(ppx, ppy, ts * 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Sprite or fallback dot
    if (ts >= 14) {
      this._drawPlayerSprite(ctx, ppx, ppy, ts);
    } else {
      ctx.strokeStyle = '#f0d050';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(ppx, ppy, ts * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f0d050';
      ctx.beginPath();
      ctx.arc(ppx, ppy, ts * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Set sprite appearance from character data ────────────────
  updateSprite(appearance) {
    if (!appearance) return;
    // Swatches store { name, color } objects; buttons store plain strings
    const col = v => (v && typeof v === 'object') ? v.color : v;
    const low = v => (typeof v === 'string') ? v.toLowerCase() : v;
    if (appearance.skinTone)  this.sprite.skin      = col(appearance.skinTone)  || this.sprite.skin;
    if (appearance.hairColor) this.sprite.hair      = col(appearance.hairColor) || this.sprite.hair;
    if (appearance.eyeColor)  this.sprite.eye       = col(appearance.eyeColor)  || this.sprite.eye;
    if (appearance.hairStyle) this.sprite.hairStyle = low(appearance.hairStyle) || this.sprite.hairStyle;
    if (appearance.bodyType)  this.sprite.bodyType  = low(appearance.bodyType)  || this.sprite.bodyType;
    this._dirty = true;
  }

  // ── Pixel-art sprite centred at (cx, cy) ────────────────────
  _drawPlayerSprite(ctx, cx, cy, ts) {
    const s   = this.sprite;
    const u   = ts / 24; // unit scale — sprite designed at 24px tile

    // Colours
    const skin   = s.skin;
    const hair   = s.hair;
    const eye    = s.eye;
    const outfit = this._outfitColor(s.bodyType);
    const boots  = this._darken(outfit, 0.55);
    const belt   = this._darken(outfit, 0.7);

    ctx.save();
    ctx.translate(cx, cy);

    const r = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x * u), Math.round(y * u), Math.round(w * u), Math.round(h * u));
    };

    // ── Legs ──
    const legW = s.bodyType === 'muscular' || s.bodyType === 'stocky' ? 3.5 : 2.5;
    r(-legW - 0.5,  4,   legW, 5, outfit);
    r( 0.5,         4,   legW, 5, outfit);
    // Boots
    r(-legW - 0.5,  8,   legW + 1, 1.5, boots);
    r( 0.5,         8,   legW + 1, 1.5, boots);

    // ── Torso ──
    const torsoW = s.bodyType === 'muscular' ? 9  :
                   s.bodyType === 'stocky'   ? 8.5 :
                   s.bodyType === 'athletic' ? 7.5 :
                   s.bodyType === 'slight'   ? 6   : 7;
    r(-torsoW / 2, -2, torsoW, 6, outfit);
    // Belt
    r(-torsoW / 2,  3, torsoW, 1, belt);

    // ── Arms ──
    const armW = s.bodyType === 'muscular' ? 3 : 2;
    r(-torsoW / 2 - armW, -2, armW, 5, outfit);
    r( torsoW / 2,        -2, armW, 5, outfit);
    // Hands
    r(-torsoW / 2 - armW, 2.5, armW, 1.5, skin);
    r( torsoW / 2,        2.5, armW, 1.5, skin);

    // ── Neck ──
    r(-1, -3.5, 2, 1.5, skin);

    // ── Head ──
    const hx = -4.5, hy = -11, hw = 9, hh = 8;
    r(hx, hy, hw, hh, skin);

    // Eyes
    r(hx + 2,     hy + 3, 1.5, 1.5, eye);
    r(hx + hw - 3.5, hy + 3, 1.5, 1.5, eye);
    // Pupils
    r(hx + 2.5,     hy + 3.5, 0.8, 0.8, this._darken(eye, 0.4));
    r(hx + hw - 3,  hy + 3.5, 0.8, 0.8, this._darken(eye, 0.4));

    // ── Hair ──
    this._drawHair(ctx, r, s.hairStyle, hair, hx, hy, hw, hh, u);

    ctx.restore();
  }

  _drawHair(ctx, r, style, color, hx, hy, hw, hh) {
    switch (style) {
      case 'shaved':
        // Thin stubble strip across top
        r(hx + 1, hy,       hw - 2, 1.2, color);
        break;
      case 'short':
        r(hx,     hy - 2,   hw,     3,   color);
        r(hx - 1, hy,       1.5,   3.5,  color);
        r(hx + hw - 0.5, hy, 1.5,  3.5,  color);
        break;
      case 'medium':
        r(hx,     hy - 2.5, hw,     3.5, color);
        r(hx - 1.5, hy,     2,      6,   color);
        r(hx + hw - 0.5, hy, 2,    6,    color);
        break;
      case 'long':
        r(hx,     hy - 2.5, hw,     3.5, color);
        r(hx - 1.5, hy,     2,      9,   color);
        r(hx + hw - 0.5, hy, 2,    9,    color);
        r(hx,     hy + hh - 1, 2,   5,   color);
        r(hx + hw - 2, hy + hh - 1, 2, 5, color);
        break;
      case 'braided':
        r(hx,     hy - 2.5, hw,     3.5, color);
        r(hx + hw / 2 - 1, hy + hh - 1, 2, 7, color);
        r(hx + hw / 2 - 1.5, hy + hh + 2, 3, 1, this._darken(color, 0.7));
        r(hx + hw / 2 - 1.5, hy + hh + 4, 3, 1, this._darken(color, 0.7));
        break;
      case 'curly':
        r(hx - 1, hy - 3,   hw + 2, 4,   color);
        r(hx - 2, hy,       3,      4,    color);
        r(hx + hw - 1, hy,  3,      4,    color);
        r(hx,     hy - 4,   2.5,    2.5,  color);
        r(hx + hw - 2.5, hy - 4, 2.5, 2.5, color);
        r(hx + hw / 2 - 1.5, hy - 5, 3, 2, color);
        break;
      default: // wild
        r(hx - 2, hy - 3,   hw + 4, 4,   color);
        r(hx - 3, hy,       2.5,    5,    color);
        r(hx + hw + 0.5, hy, 2.5,   5,    color);
        r(hx - 1, hy - 5,   2,      3,    color);
        r(hx + hw - 1, hy - 5, 2,   3,    color);
        r(hx + hw / 2 - 1, hy - 6, 2,  3, color);
        break;
    }
  }

  _outfitColor(bodyType) {
    return { slight:'#2a3850', average:'#2d3e2a', athletic:'#3a2a1a',
             muscular:'#3a1e1e', stocky:'#2a2a3a' }[bodyType?.toLowerCase()] || '#2d3e2a';
  }

  _darken(hex, factor) {
    const n = parseInt(hex.replace('#',''), 16);
    const r = Math.round(((n >> 16) & 0xff) * factor);
    const g = Math.round(((n >>  8) & 0xff) * factor);
    const b = Math.round(( n        & 0xff) * factor);
    return `rgb(${r},${g},${b})`;
  }

  _drawTile(ctx, px, py, ts, tile, pal, time) {
    switch(tile) {
      case T.WALL: {
        ctx.fillStyle = pal.wall;
        ctx.fillRect(px, py, ts, ts);
        // Stone texture lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
        ctx.beginPath();
        ctx.moveTo(px, py + ts * 0.5);
        ctx.lineTo(px + ts * 0.5, py + ts * 0.5);
        ctx.stroke();
        break;
      }
      case T.FLOOR: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
        break;
      }
      case T.WATER: {
        const phase = time * 0.04;
        const alpha = 0.75 + 0.25 * Math.sin(phase + px * 0.3 + py * 0.2);
        ctx.fillStyle = `rgba(20,60,140,${alpha})`;
        ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = `rgba(80,140,255,${0.25 + 0.2 * Math.sin(phase * 1.3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + ts * 0.5 + 1.5 * Math.sin(phase + px));
        ctx.lineTo(px + ts - 2, py + ts * 0.5 + 1.5 * Math.sin(phase + px + 2));
        ctx.stroke();
        break;
      }
      case T.LAVA: {
        const lp = time * 0.03;
        const la = 0.8 + 0.2 * Math.sin(lp + px * 0.4);
        ctx.fillStyle = `rgba(200,60,10,${la})`;
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = `rgba(255,140,0,${0.4 + 0.4 * Math.sin(lp * 1.5 + py)})`;
        ctx.beginPath();
        ctx.ellipse(px + ts / 2, py + ts / 2, ts * 0.3, ts * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case T.TREE: {
        ctx.fillStyle = '#0a1608';
        ctx.fillRect(px, py, ts, ts);
        const tr = ts * (0.38 + 0.04 * Math.sin(time * 0.015 + px + py));
        ctx.fillStyle = '#1a4010';
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts * 0.42, tr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a5818';
        ctx.beginPath();
        ctx.arc(px + ts / 2 + 1, py + ts * 0.38, tr * 0.55, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case T.PATH: {
        ctx.fillStyle = '#3a2e1a';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = 'rgba(255,220,140,0.05)';
        ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
        break;
      }
      case T.TORCH: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
        // Torch bracket
        ctx.fillStyle = '#7a5020';
        ctx.fillRect(px + ts * 0.43, py + ts * 0.55, ts * 0.14, ts * 0.3);
        // Flame
        const f1 = 0.12 * Math.sin(time * 0.18 + px);
        const f2 = 0.08 * Math.sin(time * 0.22 + py);
        ctx.fillStyle = `rgba(255,${130 + 80 * Math.sin(time * 0.15)},0,0.95)`;
        ctx.beginPath();
        ctx.ellipse(px + ts / 2 + f1, py + ts * 0.38 + f2, ts * 0.12, ts * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,150,0.7)';
        ctx.beginPath();
        ctx.ellipse(px + ts / 2 + f1 * 0.5, py + ts * 0.42 + f2, ts * 0.05, ts * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case T.DOOR: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#6a4010';
        ctx.fillRect(px + ts * 0.15, py + ts * 0.05, ts * 0.7, ts * 0.9);
        ctx.strokeStyle = '#8a5820';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + ts * 0.15 + 1, py + ts * 0.05 + 1, ts * 0.7 - 2, ts * 0.9 - 2);
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.arc(px + ts * 0.75, py + ts * 0.5, ts * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case T.CHEST: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#7a4a10';
        ctx.fillRect(px + ts * 0.12, py + ts * 0.35, ts * 0.76, ts * 0.5);
        ctx.fillStyle = '#5a3508';
        ctx.fillRect(px + ts * 0.12, py + ts * 0.35, ts * 0.76, ts * 0.15);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(px + ts * 0.43, py + ts * 0.42, ts * 0.14, ts * 0.12);
        break;
      }
      case T.STAIRS: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = '#a09070';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const sy = py + ts * (0.2 + i * 0.18);
          ctx.beginPath();
          ctx.moveTo(px + ts * (0.1 + i * 0.05), sy);
          ctx.lineTo(px + ts * (0.9 - i * 0.05), sy);
          ctx.stroke();
        }
        ctx.fillStyle = '#c9a227';
        ctx.font = `${ts * 0.4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↓', px + ts / 2, py + ts / 2);
        break;
      }
      case T.TABLE: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#6a4010';
        ctx.fillRect(px + ts * 0.1, py + ts * 0.2, ts * 0.8, ts * 0.5);
        ctx.strokeStyle = '#8a5820';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + ts * 0.1, py + ts * 0.2, ts * 0.8, ts * 0.5);
        break;
      }
      case T.COLUMN: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#4a4050';
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts / 2, ts * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6a6080';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }
      case T.SAND: {
        ctx.fillStyle = '#4a3820';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = 'rgba(200,170,80,0.12)';
        ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
        break;
      }
      default: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
      }
    }
  }

  // ── Player Movement ──────────────────────────────────────────
  movePlayer(dx, dy) {
    const nx = this.playerX + dx;
    const ny = this.playerY + dy;
    if (!this._isSolid(nx, ny)) {
      this.playerX = nx;
      this.playerY = ny;
      this._revealAround(nx, ny, 4);
    }
  }
}

window.mapSystem = new MapSystem();
