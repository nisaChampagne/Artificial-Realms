/* ─────────────────────────────────────────────────────────────
   map.js — Animated Canvas Map
───────────────────────────────────────────────────────────── */

const T = { VOID:0, WALL:1, FLOOR:2, WATER:3, LAVA:4, GRASS:5, TREE:6, PATH:7,
             TORCH:8, DOOR:9, CHEST:10, STAIRS:11, TABLE:12, COLUMN:13, SAND:14 };

// ── Scene Palette ────────────────────────────────────────────
const PALETTES = {
  dungeon: { floor:'#221d11', wall:'#110f09', wallEdge:'rgba(255,255,255,0.07)', floorEdge:'rgba(0,0,0,0.45)', torch:true,  fogColor:'#04030a', ambient:'rgba(18,10,50,0.10)', particles:'dust'      },
  tavern:  { floor:'#52311a', wall:'#311e0e', wallEdge:'rgba(255,210,130,0.07)', floorEdge:'rgba(0,0,0,0.40)', torch:true,  fogColor:'#080400', ambient:'rgba(170,70,10,0.07)', particles:null        },
  forest:  { floor:'#1c3012', wall:'#0d1f09', wallEdge:'rgba(100,200,50,0.05)',  floorEdge:'rgba(0,0,0,0.25)', torch:false, fogColor:'#020600', ambient:'rgba(10,55,5,0.09)',   particles:'leaves'    },
  cave:    { floor:'#1c181c', wall:'#0e0c0e', wallEdge:'rgba(255,255,255,0.05)', floorEdge:'rgba(0,0,0,0.55)', torch:false, fogColor:'#050305', ambient:'rgba(28,5,38,0.08)',   particles:'drips'     },
  castle:  { floor:'#1e1c26', wall:'#0f0e16', wallEdge:'rgba(200,185,255,0.06)', floorEdge:'rgba(0,0,0,0.45)', torch:false, fogColor:'#040410', ambient:'rgba(18,14,55,0.08)', particles:'dust'      },
  town:    { floor:'#2e2418', wall:'#1c1812', wallEdge:'rgba(255,225,140,0.06)', floorEdge:'rgba(0,0,0,0.35)', torch:false, fogColor:'#060402', ambient:'rgba(90,55,8,0.06)',   particles:null        },
  combat:  { floor:'#221608', wall:'#100a04', wallEdge:'rgba(255,90,0,0.08)',    floorEdge:'rgba(0,0,0,0.45)', torch:false, fogColor:'#080300', ambient:'rgba(75,15,5,0.10)',   particles:'embers'    },
  boss:    { floor:'#220808', wall:'#0e0404', wallEdge:'rgba(255,40,0,0.11)',    floorEdge:'rgba(0,0,0,0.50)', torch:false, fogColor:'#0a0202', ambient:'rgba(110,8,5,0.14)',   particles:'embers'    },
  rest:    { floor:'#1e2612', wall:'#12180a', wallEdge:'rgba(150,220,90,0.05)',  floorEdge:'rgba(0,0,0,0.30)', torch:false, fogColor:'#030601', ambient:'rgba(15,45,5,0.08)',   particles:'fireflies' },
  manor:   { floor:'#2e2212', wall:'#18110a', wallEdge:'rgba(255,195,90,0.06)',  floorEdge:'rgba(0,0,0,0.40)', torch:true,  fogColor:'#080500', ambient:'rgba(55,26,5,0.08)',   particles:'dust'      },
  ruins:   { floor:'#1c2012', wall:'#0e1209', wallEdge:'rgba(195,215,145,0.05)', floorEdge:'rgba(0,0,0,0.38)', torch:false, fogColor:'#040502', ambient:'rgba(28,38,8,0.08)',   particles:'dust'      },
  crypt:   { floor:'#14101a', wall:'#0a0810', wallEdge:'rgba(150,100,210,0.08)', floorEdge:'rgba(0,0,0,0.55)', torch:true,  fogColor:'#030206', ambient:'rgba(36,5,55,0.10)',   particles:'spirits'   },
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
    this.npcs         = [];   // [{ name, role, attitude, x, y }] characters from narrative
    this.mapObjects   = [];   // [{ icon, label, x, y }] objects inferred from text
    this.items        = [];
    this.landmarks    = [];   // [{ label, x, y }] named POI pins
    this._sceneEntitiesAdded = new Set(); // dedup guard per scene
    this.currentScene     = null; // Wait for AI to set the scene
    this._locationOverride = null; // Named location (e.g. "The Tarnished Flagon") overrides generic label
    this._combatFlash     = 0;    // Used for combat border pulse effect
    this.fogEnabled   = true;
    this.time         = 0;
    this._raf         = null;
    this._offscreen   = null;
    this._dirty       = true;
    // Sprite appearance cache
    this.sprite       = { skin:'#e3c49a', hair:'#3d2008', hairStyle:'short', eye:'#4878b0', bodyType:'average' };
    // Perception rolls per scene — persisted so we don't re-roll on revisit
    this._perceptionCache = {};
    this._floatingTexts   = []; // [{ wx, wy, text, color, life, maxLife }]
    this._particles       = [];
    this._particleScene   = null;
    this._trail           = []; // [{x,y}] last N player positions
    this._rooms           = []; // [{cx,cy,label}] detected room centres
    this._bumpFX          = 0;  // fractional-tile bump offset X (decays)
    this._bumpFY          = 0;  // fractional-tile bump offset Y
    this._wallFlash       = null; // {x, y, life} — flashing obstacle tile
    this._impactDust      = []; // [{wx,wy,vx,vy,life,decay,size}]
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

    // Initialize with minimal map if no scene is set yet
    if (!this.currentScene && this.map.length === 0) {
      // Create a small empty map as placeholder until AI sets the scene
      const emptyMap = Array(15).fill(null).map(() => Array(20).fill(0)); // 0 = floor
      this.map = emptyMap;
      this.fog = emptyMap.map(row => row.map(() => 1)); // All fog
      document.getElementById('map-location').textContent = this._sceneLabel(null);
      document.getElementById('music-now').textContent = this._musicLabel(null);
    }
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
    if (this.currentScene === name) return; // same scene — keep the existing map intact
    this.currentScene = name;
    this.landmarks    = [];
    this.npcs         = [];
    this.mapObjects   = [];
    this._trail       = [];
    this._rooms       = [];
    this._sceneEntitiesAdded = new Set();
    
    // Track location visits for achievements (skip during initial setup)
    if (!window.achievementSystem?._initialSetup) {
      window.achievementSystem?.track('location_visited', name);
      if (['dungeon', 'cave', 'castle', 'boss'].includes(name)) {
        window.achievementSystem?.track('dungeon_entered');
      }
    }
    
    this._locationOverride = null;
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

    // Torches illuminate their surroundings even before the player reaches them
    for (let ty = 0; ty < this.map.length; ty++) {
      for (let tx = 0; tx < (this.map[ty]?.length || 0); tx++) {
        if (this.map[ty][tx] === T.TORCH) this._revealAround(tx, ty, 3);
      }
    }
    this._dirty = true;

    this._detectRooms(name);

    // Cancel any existing loop then restart fresh
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._initParticles(name);
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
    if (!s) return 'Awaiting Adventure...';
    return { dungeon:'The Dungeon', tavern:'The Tavern', forest:'Whispering Forest',
             cave:'Dark Caverns', castle:'The Castle', town:'Town Square',
             combat:'Battle Arena', boss:"Dragon's Lair", rest:'Safe Camp',
             manor:'The Manor', ruins:'Ancient Ruins', crypt:'The Crypt' }[s] || s;
  }

  _musicLabel(s) {
    if (!s) return '—';
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

  // ── Place NPC from narrative ─────────────────────────────────
  addNPC(name, role, attitude) {
    const existing = this.npcs.find(n => n.name === name);
    if (existing) {
      existing.attitude = attitude;
      this._dirty = true;
      return;
    }
    const rows = this.map.length;
    const cols = this.map[0]?.length || 0;
    if (!rows || !cols) return;

    // Place 3–6 tiles from player in a random direction
    const angle = Math.random() * Math.PI * 2;
    const dist  = 3 + Math.floor(Math.random() * 4);
    let tx = Math.round(this.playerX + Math.cos(angle) * dist);
    let ty = Math.round(this.playerY + Math.sin(angle) * dist);
    tx = Math.max(1, Math.min(cols - 2, tx));
    ty = Math.max(1, Math.min(rows - 2, ty));

    outer: for (let r = 0; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = tx + dx, ny = ty + dy;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols &&
              !this._isSolid(nx, ny) &&
              !(nx === this.playerX && ny === this.playerY)) {
            tx = nx; ty = ny; break outer;
          }
        }
      }
    }

    this.npcs.push({ name, role, attitude, x: tx, y: ty, origX: tx, origY: ty,
                     wanderTimer: 100 + Math.floor(Math.random() * 100) });
    this._revealAround(tx, ty, 2);
    this._dirty = true;
  }

  // ── Give spawned enemy a name + creature icon ────────────────
  nameEnemy(name, curHp, maxHp) {
    if (this.enemies.length === 0) return;
    const e = this.enemies[0];
    // Spawn floating text on HP change
    if (e.hp !== undefined && curHp < e.hp) {
      this.addFloatingText(e.x, e.y, `-${e.hp - curHp}`, '#ff5050');
    } else if (e.hp !== undefined && curHp > e.hp) {
      this.addFloatingText(e.x, e.y, `+${curHp - e.hp}`, '#50ee80');
    }
    e.name  = name;
    e.icon  = this._monsterIcon(name);
    e.hp    = curHp;
    e.maxHp = maxHp;
    this._dirty = true;
  }

  // ── Spawn floating text at a world-grid position ─────────────
  addFloatingText(wx, wy, text, color = '#ff6060') {
    this._floatingTexts.push({ wx, wy, text, color, life: 55, maxLife: 55 });
  }

  _npcIcon(role) {
    const r = (role || '').toLowerCase();
    if (r.includes('innkeeper') || r.includes('bartender')) return '🍺';
    if (r.includes('witch') || r.includes('mage') || r.includes('wizard') || r.includes('sorcerer')) return '🧙';
    if (r.includes('guard') || r.includes('soldier') || r.includes('knight')) return '🛡';
    if (r.includes('merchant') || r.includes('trader') || r.includes('shopkeeper')) return '💰';
    if (r.includes('priest') || r.includes('cleric') || r.includes('healer')) return '✚';
    if (r.includes('thief') || r.includes('rogue') || r.includes('assassin')) return '🗡';
    if (r.includes('bard') || r.includes('musician') || r.includes('singer')) return '🎵';
    if (r.includes('captain') || r.includes('lord') || r.includes('king') || r.includes('queen')) return '👑';
    if (r.includes('ranger') || r.includes('hunter') || r.includes('scout')) return '🏹';
    if (r.includes('shaman') || r.includes('ritual')) return '🔮';
    return '👤';
  }

  _monsterIcon(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('dragon') || n.includes('wyvern') || n.includes('drake')) return '🐉';
    if (n.includes('goblin')) return '👺';
    if (n.includes('orc') || n.includes('ogre') || n.includes('troll')) return '👹';
    if (n.includes('skeleton') || n.includes('lich') || n.includes('wight')) return '💀';
    if (n.includes('zombie') || n.includes('ghoul') || n.includes('specter')) return '🧟';
    if (n.includes('wolf') || n.includes('bear') || n.includes('beast') || n.includes('dire')) return '🐺';
    if (n.includes('spider') || n.includes('scorpion')) return '🕷';
    if (n.includes('vampire') || n.includes('bat')) return '🦇';
    if (n.includes('demon') || n.includes('devil') || n.includes('fiend')) return '😈';
    if (n.includes('shaman') || n.includes('cultist') || n.includes('warlock')) return '🔮';
    if (n.includes('bandit') || n.includes('thug') || n.includes('assassin')) return '🗡';
    if (n.includes('guard') || n.includes('soldier') || n.includes('knight')) return '⚔';
    return '☠';
  }

  _attitudeGlow(attitude) {
    switch ((attitude || '').toLowerCase()) {
      case 'friendly': return 'rgba(50,200,80,';
      case 'hostile':  return 'rgba(220,80,50,';
      case 'captive':  return 'rgba(220,150,40,';
      default:         return 'rgba(180,180,200,';
    }
  }

  // ── Named location label (overrides generic scene label) ────
  setLocationName(name) {
    this._locationOverride = name || null;
    document.getElementById('map-location').textContent = name || this._sceneLabel(this.currentScene);
  }

  // ── Clear enemies and hostile NPCs after combat ends ────────
  clearEnemies() {
    this.enemies = [];
    this.npcs = this.npcs.filter(n => (n.attitude || '').toLowerCase() !== 'hostile');
    this._dirty = true;
  }

  // ── Infer entities from narrative prose ─────────────────────
  inferFromText(text) {
    if (!text || !this.map.length) return;

    // ── Anonymous NPC patterns ────────────────────────────────
    const npcPatterns = [
      { re: /\b(?:the |an? )?inn?keeper\b/i,                        name: 'Innkeeper',  role: 'innkeeper',  att: 'Friendly' },
      { re: /\b(?:the |an? )?barkeep(?:er)?\b/i,                    name: 'Barkeep',    role: 'innkeeper',  att: 'Friendly' },
      { re: /\b(?:the |an? )?merchant\b/i,                          name: 'Merchant',   role: 'merchant',   att: 'Neutral'  },
      { re: /\b(?:the |an? )?(?:city |town |village )?guard\b/i,    name: 'Guard',      role: 'guard',      att: 'Neutral'  },
      { re: /\b(?:the |an? )?(?:wizard|mage|arcanist|sorcerer)\b/i, name: 'Mage',       role: 'mage',       att: 'Neutral'  },
      { re: /\b(?:the |an? )?(?:priest|cleric|acolyte)\b/i,         name: 'Priest',     role: 'priest',     att: 'Friendly' },
      { re: /\b(?:the |an? )?bard\b/i,                              name: 'Bard',       role: 'bard',       att: 'Friendly' },
      { re: /\b(?:the |an? )?blacksmith\b/i,                        name: 'Blacksmith', role: 'blacksmith', att: 'Friendly' },
      { re: /\b(?:the |an? )?ranger\b/i,                            name: 'Ranger',     role: 'ranger',     att: 'Neutral'  },
      { re: /\b(?:the |an? )?(?:hooded|cloaked|robed|masked) (?:figure|stranger|man|woman)\b/i, name: 'Stranger', role: 'figure', att: 'Unknown' },
      { re: /\b(?:the |an? )?(?:old|elderly) (?:man|woman|crone|sage)\b/i, name: 'Elder', role: 'elder', att: 'Neutral' },
      { re: /\bpatrons?\b/i,                                         name: 'Patron',     role: 'commoner',   att: 'Friendly' },
      { re: /\bbarmaids?\b/i,                                        name: 'Barmaid',    role: 'commoner',   att: 'Friendly' },
      { re: /\b(?:the |an? )?(?:town|village) elder\b/i,            name: 'Elder',      role: 'elder',      att: 'Friendly' },
      { re: /\b(?:the |an? )?stable(?:\s?boy|hand|master)\b/i,      name: 'Stablehand', role: 'commoner',   att: 'Friendly' },
      { re: /\b(?:the |an? )?blackguard\b/i,                        name: 'Blackguard', role: 'guard',      att: 'Hostile'  },
      { re: /\b(?:the |an? )?captain\b/i,                           name: 'Captain',    role: 'captain',    att: 'Neutral'  },
      { re: /\b(?:a |an? )?(?:wounded|injured|dying) (?:man|woman|traveler|soldier|figure)\b/i, name: 'Wounded', role: 'commoner', att: 'Friendly' },
    ];

    // ── Object / prop patterns ────────────────────────────────
    const objPatterns = [
      { re: /\b(?:camp)?fire\b|\bhearth\b|\bfireplace\b/i,          icon: '🔥', label: 'Fire'        },
      { re: /\b(?:stone |ancient |ritual |sacrificial )?altar\b/i,  icon: '⛩',  label: 'Altar'       },
      { re: /\bshrine\b/i,                                           icon: '🕯',  label: 'Shrine'      },
      { re: /\b(?:stone |ancient |crumbling )?statue\b|\bidol\b/i,  icon: '🗿', label: 'Statue'      },
      { re: /\bsarcophag(?:us|i)\b|\bcoffin\b/i,                    icon: '⚰',  label: 'Tomb'        },
      { re: /\b(?:glowing |pulsing |arcane )?crystal\b/i,           icon: '💎', label: 'Crystal'     },
      { re: /\b(?:ancient |old |forbidden )?tome\b|\bgrimoire\b/i,  icon: '📖', label: 'Tome'        },
      { re: /\bbod(?:y|ies)\b|\bcorpses?\b/i,                       icon: '🩸', label: 'Body'        },
      { re: /\bbarrel/i,                                             icon: '🛢',  label: 'Barrel'      },
      { re: /\bcrate/i,                                              icon: '📦', label: 'Crate'       },
      { re: /\b(?:iron |rusted )?cage\b/i,                          icon: '⛓',  label: 'Cage'        },
      { re: /\bportal\b|\bvortex\b|\brift\b/i,                      icon: '🌀', label: 'Portal'      },
      { re: /\b(?:stone |old )?well\b/i,                             icon: '🪣',  label: 'Well'        },
      { re: /\bwagon\b|\bcart\b/i,                                   icon: '🪵', label: 'Cart'        },
      { re: /\b(?:iron |wooden )?throne\b/i,                         icon: '🪑', label: 'Throne'      },
      { re: /\b(?:magic |arcane |glowing )?orb\b/i,                  icon: '🔮', label: 'Orb'         },
      { re: /\bcauldron\b|\bbubbling pot\b/i,                        icon: '🫕', label: 'Cauldron'    },
      { re: /\bbound|chained|shackled/i,                             icon: '⛓',  label: 'Chains'      },
      { re: /\btrap\b|\bpressure plate\b|\btripwire\b/i,             icon: '⚠',  label: 'Trap'        },
    ];

    for (const p of npcPatterns) {
      if (!p.re.test(text)) continue;
      // Skip if a named or anonymous NPC with same role is already on the map
      if (this.npcs.some(n => n.role === p.role)) continue;
      if (this._sceneEntitiesAdded.has('npc:' + p.name)) continue;
      this._sceneEntitiesAdded.add('npc:' + p.name);
      this.addNPC(p.name, p.role, p.att);
    }

    for (const p of objPatterns) {
      if (!p.re.test(text)) continue;
      if (this._sceneEntitiesAdded.has('obj:' + p.label)) continue;
      this._sceneEntitiesAdded.add('obj:' + p.label);
      this._placeObject(p.icon, p.label);
    }
  }

  _placeObject(icon, label) {
    const rows = this.map.length;
    const cols = this.map[0]?.length || 0;
    if (!rows || !cols) return;

    const angle = Math.random() * Math.PI * 2;
    const dist  = 2 + Math.floor(Math.random() * 6);
    let tx = Math.round(this.playerX + Math.cos(angle) * dist);
    let ty = Math.round(this.playerY + Math.sin(angle) * dist);
    tx = Math.max(1, Math.min(cols - 2, tx));
    ty = Math.max(1, Math.min(rows - 2, ty));

    outer: for (let r = 0; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = tx + dx, ny = ty + dy;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols &&
              !this._isSolid(nx, ny) &&
              !(nx === this.playerX && ny === this.playerY) &&
              !this.npcs.some(n => n.x === nx && n.y === ny) &&
              !this.mapObjects.some(o => o.x === nx && o.y === ny)) {
            tx = nx; ty = ny; break outer;
          }
        }
      }
    }

    this.mapObjects.push({ icon, label, x: tx, y: ty });
    this._revealAround(tx, ty, 1);
    this._dirty = true;
  }

  _enemyTypesForScene(scene) {
    const pool = {
      dungeon: [
        { icon:'👺', hp:15, maxHp:15, type:'goblin',   glow:'rgba(100,160,40,'  },
        { icon:'💀', hp:22, maxHp:22, type:'undead',   glow:'rgba(140,120,200,' },
        { icon:'🗡',  hp:18, maxHp:18, type:'humanoid', glow:'rgba(180,100,40,'  },
      ],
      cave: [
        { icon:'🕷', hp:12, maxHp:12, type:'beast',    glow:'rgba(80,40,130,'   },
        { icon:'🐺', hp:20, maxHp:20, type:'beast',    glow:'rgba(100,150,40,'  },
        { icon:'👹', hp:28, maxHp:28, type:'goblin',   glow:'rgba(160,80,20,'   },
      ],
      forest: [
        { icon:'🐺', hp:18, maxHp:18, type:'beast',    glow:'rgba(100,160,40,'  },
        { icon:'🕷', hp:10, maxHp:10, type:'beast',    glow:'rgba(80,40,130,'   },
        { icon:'🧟', hp:20, maxHp:20, type:'undead',   glow:'rgba(40,150,80,'   },
      ],
      castle: [
        { icon:'⚔',  hp:25, maxHp:25, type:'humanoid', glow:'rgba(180,160,80,'  },
        { icon:'💀', hp:22, maxHp:22, type:'undead',   glow:'rgba(140,120,200,' },
        { icon:'🧙', hp:20, maxHp:20, type:'humanoid', glow:'rgba(80,120,200,'  },
      ],
      combat: [
        { icon:'⚔',  hp:20, maxHp:20, type:'humanoid', glow:'rgba(200,120,40,'  },
        { icon:'🗡',  hp:16, maxHp:16, type:'humanoid', glow:'rgba(160,80,40,'   },
        { icon:'🏹', hp:14, maxHp:14, type:'humanoid', glow:'rgba(120,160,60,'  },
      ],
      boss: [
        { icon:'🐉', hp:80, maxHp:80, type:'dragon',   glow:'rgba(210,40,20,'   },
      ],
      ruins: [
        { icon:'💀', hp:18, maxHp:18, type:'undead',   glow:'rgba(140,120,200,' },
        { icon:'🧟', hp:22, maxHp:22, type:'undead',   glow:'rgba(40,150,80,'   },
      ],
      crypt: [
        { icon:'💀', hp:20, maxHp:20, type:'undead',   glow:'rgba(140,120,200,' },
        { icon:'🧟', hp:18, maxHp:18, type:'undead',   glow:'rgba(40,150,80,'   },
        { icon:'🦇', hp:10, maxHp:10, type:'beast',    glow:'rgba(100,60,170,'  },
      ],
      manor: [
        { icon:'🧟', hp:20, maxHp:20, type:'undead',   glow:'rgba(40,150,80,'   },
        { icon:'🦇', hp:10, maxHp:10, type:'beast',    glow:'rgba(100,60,170,'  },
      ],
    };
    return pool[scene] || [{ icon:'☠', hp:20, maxHp:20, type:'unknown', glow:'rgba(200,40,40,' }];
  }

  _spawnEnemies(scene) {
    if (scene === 'rest' || scene === 'tavern' || scene === 'town') return [];
    const count     = scene === 'combat' ? 4 : scene === 'boss' ? 1 : 2;
    const templates = this._enemyTypesForScene(scene);
    const enms      = [];
    for (let i = 0; i < count; i++) {
      let ex, ey, tries = 0;
      do {
        ey = Math.floor(Math.random() * this.map.length);
        ex = Math.floor(Math.random() * (this.map[ey]?.length || 1));
        tries++;
      } while (tries < 50 && (this._isSolid(ex, ey) || (Math.abs(ex - this.playerX) + Math.abs(ey - this.playerY)) < 4));
      if (tries < 50) {
        const tmpl = templates[i % templates.length];
        enms.push({ x: ex, y: ey, spawnX: ex, spawnY: ey,
                    hp: tmpl.hp, maxHp: tmpl.maxHp, icon: tmpl.icon, type: tmpl.type, glow: tmpl.glow,
                    wanderTimer: 60 + Math.floor(Math.random() * 80) });
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
    this._updateParticles();
    this._updateWander();
    // Decay bump
    this._bumpFX *= 0.68; if (Math.abs(this._bumpFX) < 0.003) this._bumpFX = 0;
    this._bumpFY *= 0.68; if (Math.abs(this._bumpFY) < 0.003) this._bumpFY = 0;
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const { canvas, ctx, map, fog, time, currentScene } = this;
    if (!canvas || !ctx) return;
    
    // If no scene is set yet, use a neutral default for rendering
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

    const fogColor = pal.fogColor || '#050404';
    ctx.fillStyle = fogColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px  = offX + x * ts;
        const py  = offY + y * ts;
        const isF = this.fogEnabled && fog[y]?.[x] !== false;

        if (isF) {
          ctx.fillStyle = fogColor;
          ctx.fillRect(px, py, ts, ts);
          continue;
        }

        const tile = map[y][x];
        this._drawTile(ctx, px, py, ts, tile, pal, time, x, y);
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

    // Fog layer (unexplored tiles)
    if (this.fogEnabled) {
      ctx.fillStyle = fogColor;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (fog[y]?.[x] === false) continue;
          const px = offX + x * ts;
          const py = offY + y * ts;
          ctx.fillRect(px, py, ts, ts);
        }
      }
    }

    // Wall flash (hit obstacle highlight)
    if (this._wallFlash && this._wallFlash.life > 0) {
      const { x: fx, y: fy, life } = this._wallFlash;
      if (!this.fogEnabled || fog[fy]?.[fx] === false) {
        const alpha = (life / 14) * 0.55;
        ctx.fillStyle = `rgba(255,215,120,${alpha})`;
        ctx.fillRect(offX + fx * ts, offY + fy * ts, ts, ts);
      }
      this._wallFlash.life--;
    }

    // Room labels (over tiles, under entities)
    this._drawRoomLabels(ctx, offX, offY, ts);

    // Scene ambient colour wash (over tiles, under entities)
    this._drawAmbientOverlay(ctx, canvas, pal);

    // Enemies
    this.enemies.forEach(e => {
      if (this.fogEnabled && fog[e.y]?.[e.x] !== false) return;
      const px = offX + e.x * ts + ts / 2;
      const py = offY + e.y * ts + ts / 2;
      const isBoss = e.maxHp >= 60;
      // Glow ring (type-colored; boss pulses)
      const glowBase  = e.glow || 'rgba(200,40,40,';
      const glowPulse = isBoss ? 0.08 * Math.sin(time * 0.07) : 0;
      const glowAlpha = (isBoss ? 0.32 : 0.22) + glowPulse;
      const glowR     = ts * (isBoss ? 0.88 + glowPulse : 0.68);
      ctx.fillStyle = glowBase + glowAlpha + ')';
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fill();
      // Icon (slightly larger for boss)
      ctx.font = `${Math.max(10, ts - (isBoss ? 1 : 4))}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.icon || '☠', px, py + 1);
      // Name label (first word only)
      if (e.name) {
        const label = e.name.split(' ')[0];
        ctx.font = `bold ${Math.max(6, Math.round(ts * 0.42))}px Cinzel, serif`;
        ctx.fillStyle = 'rgba(230,110,110,0.95)';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(label, px, py + ts * 0.52);
        ctx.shadowBlur = 0;
      }
      // HP bar
      if (e.maxHp > 0) {
        const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));
        const barW    = ts * 0.82;
        const barH    = Math.max(2, Math.round(ts * 0.11));
        const barX    = px - barW / 2;
        const barY    = py + ts * 0.76;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        const hpColor = hpRatio > 0.6 ? '#44bb44' : hpRatio > 0.3 ? '#bbbb22' : '#cc3030';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
      }
    });

    // NPCs (narrative characters)
    this.npcs.forEach(npc => {
      if (this.fogEnabled && fog[npc.y]?.[npc.x] !== false) return;
      const px = offX + npc.x * ts + ts / 2;
      const py = offY + npc.y * ts + ts / 2;
      const glow = this._attitudeGlow(npc.attitude);
      // Attitude glow
      const gr = ts * (1.1 + 0.15 * Math.sin(time * 0.05 + npc.x + npc.y));
      const grd = ctx.createRadialGradient(px, py, 0, px, py, gr);
      grd.addColorStop(0, glow + '0.35)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(px - gr, py - gr, gr * 2, gr * 2);
      // Icon
      ctx.font = `${Math.max(10, ts - 5)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this._npcIcon(npc.role), px, py + 1);
      // Name label (first word) — color matches attitude
      const label = npc.name.split(' ')[0];
      ctx.font = `bold ${Math.max(6, Math.round(ts * 0.42))}px Cinzel, serif`;
      ctx.fillStyle = {
        friendly: 'rgba(100,230,110,0.95)',
        hostile:  'rgba(255,110,80,0.95)',
        captive:  'rgba(240,175,50,0.95)',
      }[(npc.attitude || '').toLowerCase()] || 'rgba(230,210,160,0.95)';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 4;
      ctx.fillText(label, px, py + ts * 0.52);
      ctx.shadowBlur = 0;
    });

    // Map objects (inferred from narrative)
    this.mapObjects.forEach(obj => {
      if (this.fogEnabled && fog[obj.y]?.[obj.x] !== false) return;
      const px = offX + obj.x * ts + ts / 2;
      const py = offY + obj.y * ts + ts / 2;
      // Subtle floor highlight
      ctx.fillStyle = 'rgba(200,180,100,0.10)';
      ctx.beginPath();
      ctx.arc(px, py, ts * 0.55, 0, Math.PI * 2);
      ctx.fill();
      // Icon
      ctx.font = `${Math.max(9, ts - 6)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.icon, px, py + 1);
      // Label
      ctx.font = `${Math.max(5, Math.round(ts * 0.38))}px Cinzel, serif`;
      ctx.fillStyle = 'rgba(210,195,150,0.80)';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 3;
      ctx.fillText(obj.label, px, py + ts * 0.48);
      ctx.shadowBlur = 0;
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

    // Footprint trail
    this._drawTrail(ctx, offX, offY, ts);

    // Impact dust (wall collision particles)
    this._impactDust = this._impactDust.filter(p => {
      p.wx  += p.vx; p.wy += p.vy; p.life -= p.decay;
      if (p.life <= 0) return false;
      const px = offX + p.wx * ts + ts / 2;
      const py = offY + p.wy * ts + ts / 2;
      ctx.save();
      ctx.globalAlpha = p.life * 0.75;
      ctx.fillStyle   = 'rgba(205,188,148,1)';
      ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    });

    // Player (with bump offset)
    const ppx = offX + (this.playerX + this._bumpFX) * ts + ts / 2;
    const ppy = offY + (this.playerY + this._bumpFY) * ts + ts / 2;
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

    // Floating damage / heal texts
    this._floatingTexts = this._floatingTexts.filter(ft => ft.life > 0);
    this._floatingTexts.forEach(ft => {
      ft.life--;
      const progress = 1 - ft.life / ft.maxLife;
      const alpha    = ft.life < ft.maxLife * 0.35 ? ft.life / (ft.maxLife * 0.35) : 1;
      const screenX  = offX + ft.wx * ts + ts / 2;
      const screenY  = offY + ft.wy * ts - progress * ts * 2.2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font        = `bold ${Math.max(9, Math.round(ts * 0.68))}px Cinzel, serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle   = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur  = 5;
      ctx.fillText(ft.text, screenX, screenY);
      ctx.restore();
    });

    // Atmospheric particles (drawn over everything so they float above the map)
    this._drawParticles(ctx);

    // Weather + time-of-day overlay
    this._drawWeatherOverlay(ctx, canvas);

    // Vignette + compass (UI layer, always on top)
    this._drawVignette(ctx, canvas);
    this._drawCompass(ctx, canvas);
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

  _drawTile(ctx, px, py, ts, tile, pal, time, gx = 0, gy = 0) {
    // Deterministic RNG seeded by grid position
    const _rng = s => (Math.abs(Math.sin(s * 127.1 + 311.7) * 43758.5453) % 1);

    switch(tile) {
      case T.WALL: {
        ctx.fillStyle = pal.wall;
        ctx.fillRect(px, py, ts, ts);
        // Top-left highlight edge (simulates top-left light source)
        const wEdge = pal.wallEdge || 'rgba(255,255,255,0.07)';
        ctx.strokeStyle = wEdge;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py + ts);
        ctx.lineTo(px, py);
        ctx.lineTo(px + ts, py);
        ctx.stroke();
        // Bottom-right shadow edge
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + ts, py);
        ctx.lineTo(px + ts, py + ts);
        ctx.lineTo(px, py + ts);
        ctx.stroke();
        // Occasional cracks (deterministic by grid position)
        const seed = gx * 13 + gy * 7;
        if (_rng(seed) < 0.18 && ts >= 10) {
          ctx.strokeStyle = 'rgba(255,255,255,0.07)';
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          const cx1 = px + _rng(seed + 1) * ts * 0.7 + ts * 0.1;
          const cy1 = py + _rng(seed + 2) * ts * 0.7 + ts * 0.1;
          ctx.moveTo(cx1, cy1);
          ctx.lineTo(cx1 + (_rng(seed + 3) - 0.5) * ts * 0.4, cy1 + (_rng(seed + 4) - 0.5) * ts * 0.4);
          ctx.stroke();
          if (_rng(seed + 5) < 0.3) {
            ctx.beginPath();
            ctx.moveTo(cx1, cy1);
            ctx.lineTo(cx1 + (_rng(seed + 6) - 0.5) * ts * 0.25, cy1 + (_rng(seed + 7) - 0.5) * ts * 0.25);
            ctx.stroke();
          }
        }
        break;
      }
      case T.FLOOR: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        // Grout line
        const fEdge = pal.floorEdge || 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = fEdge;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
        // Subtle top-left inner highlight
        if (ts >= 14) {
          ctx.strokeStyle = 'rgba(255,255,255,0.028)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px + 1.5, py + ts - 2);
          ctx.lineTo(px + 1.5, py + 1.5);
          ctx.lineTo(px + ts - 2, py + 1.5);
          ctx.stroke();
        }
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
        const lp   = time * 0.03;
        const la   = 0.8 + 0.2 * Math.sin(lp + gx * 0.4);
        ctx.fillStyle = `rgba(200,60,10,${la})`;
        ctx.fillRect(px, py, ts, ts);
        // Multiple animated bubble spots (positions seeded by grid)
        const lseed = gx * 17 + gy * 31;
        for (let b = 0; b < 3; b++) {
          const bx    = px + _rng(lseed + b * 10)      * ts * 0.75 + ts * 0.1;
          const by    = py + _rng(lseed + b * 10 + 1)  * ts * 0.75 + ts * 0.1;
          const phase = lp * (1.2 + b * 0.4) + gy + b * 1.3;
          const ba    = 0.25 + 0.35 * Math.sin(phase);
          const bRot  = _rng(lseed + b + 2) * Math.PI;
          ctx.fillStyle = `rgba(255,${110 + b * 25},0,${Math.max(0, ba)})`;
          ctx.beginPath();
          ctx.ellipse(bx, by, ts * 0.13, ts * 0.08, bRot, 0, Math.PI * 2);
          ctx.fill();
        }
        // Bright highlight flicker on the surface
        ctx.fillStyle = `rgba(255,200,40,${0.08 + 0.07 * Math.sin(lp * 2.1 + gy)})`;
        ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
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
        // Pulsing gold glow
        const cpulse = 0.78 + 0.22 * Math.sin(time * 0.06 + gx * 0.7 + gy * 0.5);
        const cgr = ctx.createRadialGradient(px + ts/2, py + ts*0.6, 0, px + ts/2, py + ts*0.6, ts * 1.1);
        cgr.addColorStop(0, `rgba(220,165,25,${0.38 * cpulse})`);
        cgr.addColorStop(0.6, `rgba(180,110,10,${0.14 * cpulse})`);
        cgr.addColorStop(1, 'transparent');
        ctx.fillStyle = cgr;
        ctx.fillRect(px - ts * 0.15, py - ts * 0.15, ts * 1.3, ts * 1.3);
        // Chest body
        ctx.fillStyle = '#7a4a10';
        ctx.fillRect(px + ts * 0.12, py + ts * 0.35, ts * 0.76, ts * 0.5);
        ctx.fillStyle = '#5a3508';
        ctx.fillRect(px + ts * 0.12, py + ts * 0.35, ts * 0.76, ts * 0.15);
        // Lid highlight
        ctx.fillStyle = `rgba(${160 + Math.round(40 * cpulse)},${90 + Math.round(30 * cpulse)},20,0.5)`;
        ctx.fillRect(px + ts * 0.14, py + ts * 0.36, ts * 0.72, ts * 0.05);
        // Clasp
        ctx.fillStyle = `rgba(${200 + Math.round(55 * cpulse)},${165 + Math.round(35 * cpulse)},35,0.95)`;
        ctx.fillRect(px + ts * 0.43, py + ts * 0.42, ts * 0.14, ts * 0.12);
        break;
      }
      case T.STAIRS: {
        ctx.fillStyle = pal.floor;
        ctx.fillRect(px, py, ts, ts);
        // Pulsing blue-white glow
        const spulse = 0.7 + 0.3 * Math.sin(time * 0.038 + gx * 0.4 + gy * 0.4);
        const sgr = ctx.createRadialGradient(px + ts/2, py + ts/2, 0, px + ts/2, py + ts/2, ts * 1.05);
        sgr.addColorStop(0, `rgba(80,155,255,${0.28 * spulse})`);
        sgr.addColorStop(0.6, `rgba(40,100,200,${0.10 * spulse})`);
        sgr.addColorStop(1, 'transparent');
        ctx.fillStyle = sgr;
        ctx.fillRect(px - ts * 0.1, py - ts * 0.1, ts * 1.2, ts * 1.2);
        // Step lines
        ctx.strokeStyle = `rgba(${130 + Math.round(60 * spulse)},${175 + Math.round(50 * spulse)},255,0.82)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const sy = py + ts * (0.2 + i * 0.18);
          ctx.beginPath();
          ctx.moveTo(px + ts * (0.1 + i * 0.05), sy);
          ctx.lineTo(px + ts * (0.9 - i * 0.05), sy);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${155 + Math.round(70 * spulse)},${195 + Math.round(55 * spulse)},255,0.88)`;
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

  // ── Room detection & labels ──────────────────────────────────
  _detectRooms(scene) {
    const map  = this.map;
    const rows = map.length;
    const cols = map[0]?.length || 0;
    if (!rows || !cols) return;

    const WALKABLE = new Set([T.FLOOR, T.TORCH, T.DOOR, T.CHEST, T.STAIRS, T.TABLE, T.COLUMN, T.SAND, T.PATH]);
    const visited  = Array.from({ length: rows }, () => new Uint8Array(cols));
    this._rooms    = [];

    for (let sy = 0; sy < rows; sy++) {
      for (let sx = 0; sx < cols; sx++) {
        if (visited[sy][sx] || !WALKABLE.has(map[sy][sx])) continue;

        // BFS flood fill to find the connected region
        const region = [];
        const queue  = [[sx, sy]];
        visited[sy][sx] = 1;
        while (queue.length) {
          const [cx, cy] = queue.shift();
          region.push([cx, cy]);
          for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            if (visited[ny][nx] || !WALKABLE.has(map[ny][nx])) continue;
            visited[ny][nx] = 1;
            queue.push([nx, ny]);
          }
        }

        if (region.length < 4) continue; // skip tiny alcoves

        // Compute centroid
        const cx = Math.round(region.reduce((s, [x]) => s + x, 0) / region.length);
        const cy = Math.round(region.reduce((s, [, y]) => s + y, 0) / region.length);

        // Count tile types inside the region
        const counts = {};
        for (const [rx, ry] of region) {
          const t = map[ry][rx];
          counts[t] = (counts[t] || 0) + 1;
        }
        const n = region.length;

        const label = this._roomLabel(scene, counts, n);
        if (label) this._rooms.push({ cx, cy, label });
      }
    }
  }

  _roomLabel(scene, counts, size) {
    if (counts[T.STAIRS])                          return 'Exit';
    if (counts[T.CHEST])                           return 'Vault';
    if (counts[T.LAVA] > 4)                        return 'Inferno';
    if (counts[T.WATER] > 4)                       return 'Cistern';
    if ((counts[T.TABLE] || 0) >= 3) {
      const halls = { tavern:'Dining Hall', manor:'Grand Hall', castle:'Banquet Hall', town:'Market', dungeon:'Mess Hall' };
      return halls[scene] || 'Hall';
    }
    if ((counts[T.TORCH] || 0) >= 3 && size < 14) return 'Watch Post';
    if ((counts[T.COLUMN] || 0) >= 2)             return 'Pillared Hall';

    // Generic room names per scene
    const small = size < 8;
    const large = size > 22;
    const NAMES = {
      dungeon: small ? 'Cell'        : large ? 'Great Hall'    : 'Chamber',
      cave:    small ? 'Alcove'      : large ? 'Cavern'        : 'Grotto',
      castle:  small ? 'Anteroom'    : large ? 'Throne Room'   : 'Corridor',
      boss:    small ? 'Approach'    : large ? "Dragon's Lair" : 'Arena',
      tavern:  small ? 'Backroom'    : large ? 'Common Room'   : 'Side Room',
      forest:  small ? 'Clearing'    : large ? 'Grove'         : 'Glade',
      combat:  small ? 'Approach'    : large ? 'Arena Floor'   : 'Pit',
      rest:    small ? 'Nook'        : large ? 'Camp'          : 'Shelter',
      manor:   small ? 'Closet'      : large ? 'Ballroom'      : 'Study',
      ruins:   small ? 'Niche'       : large ? 'Courtyard'     : 'Ruin',
      crypt:   small ? 'Burial Nook' : large ? 'Ossuary'       : 'Tomb',
      town:    small ? 'Alley'       : large ? 'Plaza'         : 'Street',
    };
    return NAMES[scene] || (small ? 'Alcove' : large ? 'Hall' : 'Room');
  }

  _drawRoomLabels(ctx, offX, offY, ts) {
    if (!this._rooms.length || ts < 10) return;
    ctx.save();
    ctx.font         = `bold ${Math.max(7, Math.round(ts * 0.44))}px Cinzel, serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (const { cx, cy, label } of this._rooms) {
      if (this.fogEnabled && this.fog[cy]?.[cx] !== false) continue;
      const px = offX + cx * ts + ts / 2;
      const py = offY + cy * ts + ts / 2;
      ctx.globalAlpha  = 0.52;
      ctx.fillStyle    = 'rgba(210,185,110,1)';
      ctx.shadowColor  = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur   = 4;
      ctx.fillText(label, px, py);
      ctx.shadowBlur   = 0;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Wander (enemies + NPCs) ──────────────────────────────────
  _updateWander() {
    const rows = this.map.length;
    const cols = this.map[0]?.length || 0;

    const tryStep = (entity, radius, ox, oy) => {
      entity.wanderTimer--;
      if (entity.wanderTimer > 0) return;
      entity.wanderTimer = 70 + Math.floor(Math.random() * 90);

      // Pick a random adjacent walkable tile, biased toward origin
      const candidates = [];
      const DIRS = [[0,-1],[0,1],[-1,0],[1,0]];
      for (const [dx, dy] of DIRS) {
        const nx = entity.x + dx, ny = entity.y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (this._isSolid(nx, ny)) continue;
        if (nx === this.playerX && ny === this.playerY) continue;
        // Stay within wander radius of origin
        if (Math.abs(nx - ox) > radius || Math.abs(ny - oy) > radius) continue;
        // Don't collide with other entities
        const blocked = this.enemies.some(e => e !== entity && e.x === nx && e.y === ny) ||
                        this.npcs.some(n => n !== entity && n.x === nx && n.y === ny);
        if (!blocked) candidates.push([nx, ny]);
      }
      if (!candidates.length) return;
      const [nx, ny] = candidates[Math.floor(Math.random() * candidates.length)];
      entity.x = nx;
      entity.y = ny;
      if (this.fogEnabled && this.fog[ny]?.[nx] === false) this._dirty = true;
    };

    for (const e of this.enemies) tryStep(e, 5, e.spawnX, e.spawnY);
    for (const n of this.npcs)    tryStep(n, 3, n.origX,  n.origY);
  }

  // ── Particles ────────────────────────────────────────────────
  _initParticles(scene) {
    this._particles = [];
    this._particleScene = scene;
    const type = PALETTES[scene]?.particles;
    if (!type) return;
    const count = { embers:40, spirits:12, fireflies:15, drips:20, leaves:25, dust:30 }[type] ?? 28;
    for (let i = 0; i < count; i++) this._particles.push(this._spawnParticle(type, true));
  }

  _spawnParticle(type, initial = false) {
    const w = this.canvas?.width  || 400;
    const h = this.canvas?.height || 300;
    const x = Math.random() * w;
    const y = initial ? Math.random() * h
            : (type === 'embers' || type === 'spirits') ? h + 4 : -4;
    const base = { type, x, y, life: 1, decay: 0 };
    switch (type) {
      case 'dust':
        return { ...base, vx:(Math.random()-0.5)*0.28, vy:0.18+Math.random()*0.28, size:0.6+Math.random()*1.1, alpha:0.12+Math.random()*0.20 };
      case 'embers':
        return { ...base, vx:(Math.random()-0.5)*0.5, vy:-(0.35+Math.random()*0.75), size:1+Math.random()*1.4, alpha:0.55+Math.random()*0.45, decay:0.003+Math.random()*0.003 };
      case 'leaves':
        return { ...base, y: initial ? Math.random()*h : -4, vx:0.18+Math.random()*0.38, vy:0.14+Math.random()*0.28, rot:Math.random()*Math.PI*2, rotV:(Math.random()-0.5)*0.05, size:2+Math.random()*2, alpha:0.3+Math.random()*0.38 };
      case 'drips':
        return { ...base, y: initial ? Math.random()*h*0.6 : 0, vx:0, vy:0.55+Math.random()*0.75, size:0.7+Math.random()*0.7, alpha:0.35+Math.random()*0.3 };
      case 'fireflies':
        return { ...base, y: initial ? Math.random()*h : Math.random()*h, vx:(Math.random()-0.5)*0.38, vy:(Math.random()-0.5)*0.28, size:1.4+Math.random()*0.9, alpha:0, targetAlpha:0.35+Math.random()*0.45, blinkTimer:Math.random()*200 };
      case 'spirits':
        return { ...base, vx:(Math.random()-0.5)*0.42, vy:-(0.18+Math.random()*0.35), size:2.5+Math.random()*3, alpha:0.08+Math.random()*0.18, decay:0.001 };
    }
  }

  _updateParticles() {
    const type = PALETTES[this._particleScene]?.particles;
    if (!type) { this._particles = []; return; }
    const w = this.canvas?.width  || 400;
    const h = this.canvas?.height || 300;
    this._particles = this._particles.filter(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.life -= p.decay;
      if (p.type === 'leaves')    { p.rot += p.rotV; p.vx += Math.sin(this.time * 0.018) * 0.018; }
      if (p.type === 'embers')    { p.vx  += (Math.random()-0.5) * 0.09; p.vx = Math.max(-0.75, Math.min(0.75, p.vx)); }
      if (p.type === 'spirits')   { p.alpha = 0.08 + 0.10 * Math.sin(this.time * 0.028 + p.x * 0.1); p.vx += Math.sin(this.time * 0.018) * 0.018; }
      if (p.type === 'fireflies') {
        p.blinkTimer++;
        p.alpha = Math.max(0, Math.sin(p.blinkTimer * 0.025) * p.targetAlpha);
        p.vx += (Math.random()-0.5) * 0.035;
        p.vy += (Math.random()-0.5) * 0.035;
        p.vx = Math.max(-0.48, Math.min(0.48, p.vx));
        p.vy = Math.max(-0.48, Math.min(0.48, p.vy));
      }
      // Wrap / cull per type
      if (p.type === 'dust' || p.type === 'drips') {
        if (p.y > h) { p.y = 0; p.x = Math.random() * w; }
        if (p.x < -2) p.x = w; if (p.x > w + 2) p.x = 0;
      } else if (p.type === 'leaves') {
        if (p.y > h + 8) { p.y = -4; p.x = Math.random() * w; }
      } else if (p.type === 'fireflies') {
        if (p.x < -20) p.x = w+10; if (p.x > w+20) p.x = -10;
        if (p.y < -20) p.y = h+10; if (p.y > h+20) p.y = -10;
      } else if (p.type === 'embers' || p.type === 'spirits') {
        if (p.y < -12 || p.life <= 0) return false;
      }
      return p.life > 0;
    });
    const target = { embers:40, spirits:12, fireflies:15, drips:20, leaves:25, dust:30 }[type] ?? 28;
    while (this._particles.length < target) this._particles.push(this._spawnParticle(type));
  }

  _drawParticles(ctx) {
    const type = PALETTES[this._particleScene]?.particles;
    if (!type || !this._particles.length) return;
    ctx.save();
    for (const p of this._particles) {
      if (p.alpha <= 0.01) continue;
      ctx.globalAlpha = p.alpha;
      switch (p.type) {
        case 'dust':
          ctx.fillStyle = 'rgba(200,190,160,1)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
          break;
        case 'embers': {
          const hue = 60 + Math.round(Math.random() * 50);
          ctx.fillStyle = `rgba(255,${hue},0,1)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
          // Inner bright core
          ctx.fillStyle = 'rgba(255,240,180,0.6)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI*2); ctx.fill();
          break;
        }
        case 'leaves':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = Math.sin(p.rot) > 0 ? 'rgba(110,175,35,1)' : 'rgba(55,125,18,1)';
          ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size*0.45, 0, 0, Math.PI*2); ctx.fill();
          ctx.restore(); break;
        case 'drips':
          ctx.fillStyle = 'rgba(90,130,195,1)';
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size*0.35, p.size, 0, 0, Math.PI*2); ctx.fill();
          break;
        case 'fireflies': {
          const fg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
          fg.addColorStop(0, 'rgba(210,255,90,0.95)');
          fg.addColorStop(0.4, 'rgba(160,230,40,0.5)');
          fg.addColorStop(1, 'transparent');
          ctx.fillStyle = fg;
          ctx.fillRect(p.x - p.size*3.5, p.y - p.size*3.5, p.size*7, p.size*7);
          break;
        }
        case 'spirits': {
          const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
          sg.addColorStop(0, 'rgba(185,155,255,0.7)');
          sg.addColorStop(1, 'transparent');
          ctx.fillStyle = sg;
          ctx.fillRect(p.x - p.size*2.2, p.y - p.size*2.2, p.size*4.4, p.size*4.4);
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Scene ambient colour wash ─────────────────────────────────
  _drawAmbientOverlay(ctx, canvas, pal) {
    if (!pal.ambient) return;
    ctx.fillStyle = pal.ambient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── Weather + time-of-day overlay ────────────────────────────
  _drawWeatherOverlay(ctx, canvas) {
    const weather = window.worldState?.weather || 'clear';
    const tod     = window.worldState?.timeOfDay || 'morning';
    const w = canvas.width, h = canvas.height;
    const t = this.time;

    // ── Time-of-day tint ──────────────────────────────────────
    const timeTint = {
      dawn:      'rgba(210,110,30,0.12)',
      morning:   null,
      afternoon: null,
      dusk:      'rgba(180,80,20,0.14)',
      evening:   'rgba(20,10,60,0.20)',
      night:     'rgba(5,5,35,0.38)',
    }[tod];
    if (timeTint) {
      ctx.fillStyle = timeTint;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Weather overlays ──────────────────────────────────────
    if (weather === 'fog') {
      // Rolling fog — layered horizontal gradient bands
      for (let i = 0; i < 3; i++) {
        const speed  = 0.18 + i * 0.09;
        const offY2  = ((t * speed + i * h / 3) % h);
        const alpha  = 0.11 + 0.04 * Math.sin(t * 0.02 + i);
        const grad   = ctx.createLinearGradient(0, offY2, 0, offY2 + h * 0.35);
        grad.addColorStop(0,   `rgba(220,225,230,0)`);
        grad.addColorStop(0.4, `rgba(220,225,230,${alpha})`);
        grad.addColorStop(1,   `rgba(220,225,230,0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, offY2 - h * 0.1, w, h * 0.5);
        ctx.fillRect(0, offY2 - h * 0.1 - h, w, h * 0.5); // wrap
      }
    }

    if (weather === 'rain' || weather === 'storm') {
      const count  = weather === 'storm' ? 120 : 60;
      const speed  = weather === 'storm' ? 14  : 8;
      const alpha  = weather === 'storm' ? 0.28 : 0.18;
      ctx.save();
      ctx.strokeStyle = `rgba(160,185,220,${alpha})`;
      ctx.lineWidth   = 0.8;
      for (let i = 0; i < count; i++) {
        // Deterministic per frame + index so drops don't flicker
        const seed = i * 127.1 + t * speed;
        const rx   = ((seed * 13.7) % w + w) % w;
        const ry   = ((seed * 7.3  + t * speed) % (h + 40) + h + 40) % (h + 40) - 20;
        const len  = 6 + (i % 5);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + len * 0.3, ry + len);
        ctx.stroke();
      }
      ctx.restore();

      // Storm: occasional lightning flash
      if (weather === 'storm' && (t % 240 < 3 || t % 379 < 2)) {
        ctx.fillStyle = 'rgba(200,220,255,0.10)';
        ctx.fillRect(0, 0, w, h);
      }
    }

    if (weather === 'snow') {
      ctx.save();
      for (let i = 0; i < 55; i++) {
        const seed = i * 83.1;
        const sx   = ((seed * 17.3 + t * 0.3) % (w + 20) + w + 20) % (w + 20) - 10;
        const sy   = ((seed * 5.7  + t * (0.5 + (i % 5) * 0.12)) % (h + 20) + h + 20) % (h + 20) - 10;
        const sr   = 0.8 + (i % 4) * 0.4;
        ctx.globalAlpha = 0.45 + (i % 3) * 0.1;
        ctx.fillStyle   = 'rgba(230,240,255,1)';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // ── Dark vignette around canvas edges ────────────────────────
  _drawVignette(ctx, canvas) {
    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const r  = Math.max(cx, cy) * 1.42;
    const vg = ctx.createRadialGradient(cx, cy, r * 0.32, cx, cy, r);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Combat border pulse — red radial ring while an enemy is active
    if (window.aiSystem?.currentEnemy) {
      const pulse = 0.38 + 0.28 * Math.sin(this.time * 0.07);
      const cg = ctx.createRadialGradient(cx, cy, r * 0.38, cx, cy, r);
      cg.addColorStop(0, 'transparent');
      cg.addColorStop(1, `rgba(210,30,10,${pulse})`);
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ── Compass rose ─────────────────────────────────────────────
  _drawCompass(ctx, canvas) {
    const margin = 28;
    const cx = canvas.width - margin;
    const cy = margin;
    const r  = 14;
    ctx.save();
    ctx.globalAlpha = 0.52;
    // Outer ring
    ctx.strokeStyle = 'rgba(200,175,110,0.45)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    // Cardinal direction lines + labels
    const dirs = [
      { a: -Math.PI/2, label:'N', color:'#e05555' },
      { a:  Math.PI/2, label:'S', color:'#b09060' },
      { a:  0,         label:'E', color:'#b09060' },
      { a:  Math.PI,   label:'W', color:'#b09060' },
    ];
    dirs.forEach(d => {
      const ex = cx + Math.cos(d.a) * r * 0.82;
      const ey = cy + Math.sin(d.a) * r * 0.82;
      ctx.strokeStyle = d.color;
      ctx.lineWidth   = d.label === 'N' ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(d.a) * r * 0.28, cy + Math.sin(d.a) * r * 0.28);
      ctx.lineTo(ex, ey); ctx.stroke();
      ctx.font        = `bold ${Math.round(r * 0.58)}px Cinzel, serif`;
      ctx.fillStyle   = d.color;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur  = 3;
      ctx.fillText(d.label, cx + Math.cos(d.a) * (r * 0.58), cy + Math.sin(d.a) * (r * 0.58));
      ctx.shadowBlur  = 0;
    });
    // Centre dot
    ctx.fillStyle = 'rgba(200,175,110,0.75)';
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Player Movement ──────────────────────────────────────────
  movePlayer(dx, dy) {
    const nx = this.playerX + dx;
    const ny = this.playerY + dy;
    if (!this._isSolid(nx, ny)) {
      this._trail.push({ x: this.playerX, y: this.playerY });
      if (this._trail.length > 22) this._trail.shift();
      this.playerX = nx;
      this.playerY = ny;
      this._revealAround(nx, ny, 4);
    } else {
      // ── Collision feedback ───────────────────────────────────
      // 1. Player bump nudge
      this._bumpFX = dx * 0.28;
      this._bumpFY = dy * 0.28;
      // 2. Flash the obstacle tile
      this._wallFlash = { x: nx, y: ny, life: 14 };
      // 3. Impact dust burst at the contact edge
      const cx = this.playerX + dx * 0.62;
      const cy = this.playerY + dy * 0.62;
      for (let i = 0; i < 7; i++) {
        this._impactDust.push({
          wx: cx, wy: cy,
          vx: (Math.random() - 0.5) * 0.14,
          vy: -0.04 - Math.random() * 0.10,
          life: 1, decay: 0.07 + Math.random() * 0.06,
          size: 0.8 + Math.random() * 1.4,
        });
      }
      // 4. Thud sound
      this._playThud();
    }
  }

  // ── Wall thud sound ──────────────────────────────────────────
  _playThud() {
    const as = window.audioSystem;
    if (!as?._ctx || as.muted) return;
    const ac  = as._ctx;
    const now = ac.currentTime;
    const len = Math.floor(ac.sampleRate * 0.07);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src  = ac.createBufferSource();
    src.buffer = buf;
    const filt = ac.createBiquadFilter();
    filt.type            = 'lowpass';
    filt.frequency.value = 190;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.10, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(as._master);
    src.start(now);
    src.stop(now + 0.08);
  }

  // ── Footprint trail ──────────────────────────────────────────
  _drawTrail(ctx, offX, offY, ts) {
    if (!this._trail.length) return;
    const total = this._trail.length;
    ctx.save();
    for (let i = 0; i < total; i++) {
      const { x, y } = this._trail[i];
      if (this.fogEnabled && this.fog[y]?.[x] !== false) continue;
      const age   = (total - i) / total;       // 1 = oldest, ~0 = newest
      const alpha = (1 - age) * 0.38;
      const r     = ts * (0.12 + (1 - age) * 0.10);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#c8a840';
      ctx.beginPath();
      ctx.arc(offX + x * ts + ts / 2, offY + y * ts + ts / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

window.mapSystem = new MapSystem();
