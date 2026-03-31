/* ─────────────────────────────────────────────────────────────
   ai.js — AI Dungeon Master (OpenAI Chat Completions)
───────────────────────────────────────────────────────────── */

// Tags the AI uses in its response (parsed client-side)
// [SCENE:dungeon]   → change map/music scene
// [MUSIC:combat]    → change music only
// [DICE:d20+3]      → request a dice roll
// [HP:±N]           → change player HP
// [XP:+N]           → grant XP
// [DEAD]            → player death
// [WIN]             → campaign complete

const CAMPAIGN_DESC = {
  quick:    'a single-session adventure (about 1 hour). Keep it tight: one main objective, 1–2 encounters, a satisfying resolution.',
  standard: 'a standard session adventure (3–4 hours). Include exploration, roleplaying, 3–5 encounters, meaningful choices, and a climactic finale.',
  epic:     'an epic multi-act campaign (8+ hours across multiple sessions). Build a rich world, include subplots, NPC relationships, leveling up, and legendary encounters.',
  custom:   'a custom adventure described by the player.',
};

class AISystem {
  constructor() {
    this.messages    = [];
    this.apiKey      = '';
    this.model       = 'gpt-4o';
    this.provider    = 'openai';
    this.demoMode    = false;
    this.isTyping    = false;
    this.textSpeed   = 15;
    this._typeTimer  = null;
    this._demoState  = null;
  }

  // ── Start Campaign ───────────────────────────────────────────
  async start(character, campaignType, customDesc, apiKey, model, textSpeed, demoMode = false) {
    this.apiKey    = apiKey;
    this.model     = model;
    this.provider  = window.app?.settings?.provider || 'openai';
    this.demoMode  = demoMode;
    this.textSpeed = textSpeed;
    this.messages   = [];
    this._demoState  = null;
    window.journalSystem?.reset();

    const sysPrompt = this._buildSystemPrompt(character, campaignType, customDesc);
    this.messages.push({ role: 'system', content: sysPrompt });

    this._addSystemEntry('🎲 Your adventure is about to begin…');

    // Pre-load Open5e conditions in the background
    window.open5e?.init().catch(() => {});

    // Kick off with opening scene
    const openingRequest = `Begin the adventure! Introduce the setting vividly, establish the mood, and end with 3–4 numbered choices for the player.`;
    await this.sendMessage(openingRequest, true);
  }

  // ── Mock / Demo Responses (no API key) ───────────────────────
  _parseDemoChoice(text) {
    const num = text.match(/^\s*(\d+)[.):\-\s]/);
    if (num) return num[1];
    const t = text.toLowerCase();
    if (/\b(attack|charge|fight|rush|kill|strike|assault)\b/.test(t))               return '3';
    if (/\b(sneak|stealth|careful|quietly|observe|watch|listen|wait|peek)\b/.test(t)) return '2';
    if (/\b(distract|throw|stone|noise|diversion)\b/.test(t))                       return '2';
    if (/\b(circle|around|flank|back|alternate)\b/.test(t))                         return '4';
    if (/\b(ask|tell me|talk|speak|brom|question|details)\b/.test(t))               return '1';
    if (/\b(read|open|letter|parchment|seal|break)\b/.test(t))                      return '2';
    if (/\b(deeper|press on|continue|tunnel|map|follow)\b/.test(t))                 return '2';
    if (/\b(return|report|back|village|brom|town)\b/.test(t))                       return '1';
    if (/\b(rest|sleep|heal|recover|camp)\b/.test(t))                               return '3';
    if (/\b(snipe|shoot|arrow|ranged|bolt)\b/.test(t))                              return '1';
    if (/\b(confront|reveal|announce|challenge|step out)\b/.test(t))                return '3';
    if (/\b(trap|collapse|block|seal|cave.?in)\b/.test(t))                          return '4';
    return 'default';
  }

  _mockResponse() {
    const c    = window.characterSystem?.character;
    const name = c?.name || 'Adventurer';
    const str  = Math.floor(((c?.stats?.str ?? 10) - 10) / 2);
    const dex  = Math.floor(((c?.stats?.dex ?? 10) - 10) / 2);
    const con  = Math.floor(((c?.stats?.con ?? 10) - 10) / 2);
    const int_ = Math.floor(((c?.stats?.int ?? 10) - 10) / 2);
    const wis  = Math.floor(((c?.stats?.wis ?? 10) - 10) / 2);
    const cha  = Math.floor(((c?.stats?.cha ?? 10) - 10) / 2);
    const fmt  = v => (v >= 0 ? `+${v}` : `${v}`);

    const f = fmt;

    // ── Transition table: state → { choiceNum: nextState } ────
    const T = {
      tavern:           { '1':'brom_info',      '2':'read_letter',    '3':'head_out',        '4':'second_drink',    default:'brom_info'     },
      brom_info:        { default:'forest_road' },
      read_letter:      { default:'forest_road' },
      head_out:         { default:'forest_road' },
      second_drink:     { default:'forest_road' },
      forest_road:      { '1':'cave_careful',   '2':'cave_distract',  '3':'cave_charge',     '4':'cave_circle',     default:'cave_careful'  },
      cave_careful:     { '1':'combat_listen',  '2':'combat_surp',    '3':'combat_surp',     '4':'combat_surp',     default:'combat_surp'   },
      cave_distract:    { default:'combat_surp' },
      cave_circle:      { default:'combat_high' },
      cave_charge:      { '1':'combat_hot',     '2':'combat_hot',     '3':'combat_hot',      '4':'combat_dark',     default:'combat_hot'    },
      combat_listen:    { default:'combat_surp' },
      combat_surp:      { '1':'post_combat',    '2':'interrogate',    '3':'post_combat',     '4':'post_combat',     default:'post_combat'   },
      combat_high:      { default:'post_combat' },
      combat_hot:       { '1':'combat_dark',    '2':'post_combat',    '3':'post_combat',     '4':'post_combat',     default:'post_combat'   },
      combat_dark:      { default:'post_combat' },
      interrogate:      { default:'post_combat' },
      post_combat:      { '1':'return_brom',    '2':'deeper_dungeon', '3':'rest_scene',      '4':'deeper_dungeon',  default:'deeper_dungeon'},
      return_brom:      { default:'brom_reward' },
      brom_reward:      { default:'deeper_dungeon' },
      rest_scene:       { default:'deeper_dungeon' },
      deeper_dungeon:   { '1':'shaman_snipe',   '2':'shaman_observe', '3':'shaman_confront', '4':'shaman_trap',     default:'shaman_observe'},
      shaman_snipe:     { default:'boss_fight'  },
      shaman_observe:   { default:'boss_fight'  },
      shaman_confront:  { default:'boss_fight'  },
      shaman_trap:      { default:'boss_fight'  },
      boss_fight:       { '1':'victory',        '2':'victory',        '3':'victory',         '4':'boss_hard',       default:'victory'       },
      boss_hard:        { default:'victory'     },
      victory:          { default:'epilogue'    },
      epilogue:         { default:'epilogue'    },
    };

    // ── Response text for each state ──────────────────────────
    const R = {

      // tavern ── Opening
      tavern: `[SCENE:tavern][MUSIC:tavern]The **Tarnished Flagon** is the kind of tavern that swallows secrets. Tallow candles gutter in iron sconces, casting the common room in trembling amber. Outside, a late-autumn storm lashes the shuttered windows.\n\nBrom Ashkettle, the dwarf barkeep, slides a cup in front of you without being asked. Then: *"Goblin raid last night. Took the mill. The miller went out to check — hasn't come back. Locals won't go near the Ashwood."* He drops a rolled parchment beside your cup. The seal is a black sun: the **Order of the Ashen Veil**. *"You've done harder things than goblins."*\n\n1. Ask Brom what he knows — get the full picture\n2. Break the seal and read the parchment first\n3. Stand up and head out — you don't need convincing\n4. Order another drink — a plan is worth five minutes`,

      // tavern branches → all lead to forest_road
      brom_info: `[SCENE:tavern][MUSIC:tavern]Brom sets his cloth down and speaks quietly, eyes scanning the room.\n\n*"Three nights running. Coops, cold store, then the mill. The miller went out himself — his wife's at the shrine now."* He refills your cup. *"There's a hedge-witch, **Sister Vael**, keeps the Ashwood edge quiet. Hasn't been to market in a week."* A pause. *"If something's organising them, it'd be staging from **Greyvast Keep** — three miles north. Been empty sixty years."*\n\nYou have enough. The rain has softened to drizzle.\n\n1. Head for the mill road now\n2. Find Sister Vael's cottage first — she may know more\n3. Ask around town for other witnesses\n4. Leave at dusk — better to arrive in darkness`,

      read_letter: `[SCENE:tavern][MUSIC:tavern]The wax breaks with a soft crack. Inside: a rough map fragment and three lines of cramped handwriting.\n\n*A name* — **Aldric Vane**. *A date* — four days from now. *A phrase* in Old Common: *"the seal on the deep place must not be broken."*\n\nThe map shows the Ashwood with a path past the mill toward the hills northeast. At the end of the path: a jagged black sun, rendered in heavy ink. You've seen that symbol before — on a crypt wall, on an intercepted Consortium letter. You were never told what it meant. Someone knew about this and said nothing.\n\n1. Ask Brom if he recognises the name Aldric Vane\n2. Head for the mill road — you have a path now\n3. Study the map fragment for more details\n4. Pocket it and ask about Sister Vael`,

      head_out: `[SCENE:tavern][MUSIC:tavern]You stand and settle your kit. Brom grunts — the dwarf equivalent of *well done* — and passes you a worn lantern from behind the bar.\n\n*"Mill road's a quarter mile east. Turns to mud before the tree line. You'll know it by the crow totems."* He hesitates. *"One more thing. Three days ago a man passed through — Consortium rings, soft hands. Asked about a hedge-witch named Sister Vael by name. Paid in silver and left fast."*\n\nHe doesn't tell you what to do with that. He doesn't have to.\n\n1. Go straight for the mill — direct and fast\n2. Approach the Ashwood from the south\n3. Move like you're already being watched\n4. Take the road openly — let anyone trailing you think you haven't noticed`,

      second_drink: `[SCENE:tavern][MUSIC:tavern]You make good use of the time. A farmer saw pale torchlight in the Ashwood two nights running — not goblin-fire orange but cold blue. A carter confirms the miller's tracks went in on the old logging road. The barmaid says Sister Vael bought double her usual reagents three weeks ago, as if preparing for something.\n\nAnd the man in the corner — pretending to sleep — has Consortium-guild calluses on his right hand and has been here since midday.\n\nWhatever is in the Ashwood has been building for weeks. Someone in this room may already know why.\n\n1. Confront the Consortium man before you leave\n2. Slip out quietly — let him think you noticed nothing\n3. Say Aldric Vane's name loudly and watch who reacts\n4. Head out now — the Ashwood is your answer`,

      // forest
      forest_road: `[SCENE:forest][MUSIC:forest]The mill road turns to packed mud within a quarter mile of the last farmhouse. Ancient oaks press close overhead. Your lantern throws a twenty-foot circle that the forest swallows at its edges.\n\nThe ruined mill materialises out of the dark — waterwheel stopped, one wall caved in. Beyond it in the embankment: a cave mouth, gaping black. Two orange points of firelight dance inside. Voices, guttural, arguing in Goblin. At least three of them. They don't know you're here. [DICE:d20${f(wis)}]\n\n1. Move closer and peer inside — identify what you're dealing with\n2. Find a large stone and throw it past the cave to draw them out\n3. Walk in boldly — fast and loud\n4. Circle the mill — there may be another way in`,

      // cave approaches
      cave_careful: `[SCENE:dungeon][MUSIC:dungeon]You press against the embankment and slide to the cave mouth. Inside: three goblins around a small fire. Stolen grain sacks against the wall. The bones of something large in the corner. And tied to a post at the back: a bundle of rags that resolves, as your eyes adjust, into a *person*. Unconscious. Breathing.\n\nThe three are deep in an argument about division of spoils. None of them are looking your way. [DICE:d20${f(dex)}]\n\n1. Hold still and listen — they may reveal something useful\n2. Strike now while surprise is fully yours\n3. Go for the prisoner first — get them behind you\n4. Target the leader to break their nerve`,

      cave_distract: `[SCENE:dungeon][MUSIC:dungeon]The stone arcs cleanly into the dark beyond the cave mouth with a satisfying *clatter*. Inside, three heads snap toward the sound simultaneously. [DICE:d20${f(dex)}]\n\nTwo smaller goblins scramble toward the noise. The leader — pot-helm, bigger — squints directly at the entrance. His hand moves toward his blade. One full heartbeat. Then he follows the others. You have four seconds.\n\n1. Rush all three from behind while they're bunched up\n2. Get inside and put your back to the wall\n3. Strike the leader first — one chance at his blind side\n4. Hold — wait for all three to fully turn`,

      cave_charge: `[SCENE:combat][MUSIC:combat]You go in fast and loud. The goblins have time to react — the leader's blade is already drawn when you reach him, the other two fan left and right with rusted spears. You take a hit before you close the distance. [HP:-4][DICE:d20${f(str)}]\n\nThrough the chaos you can see a person tied to a post at the back. Get through these three and you can reach them.\n\n1. Lock onto the leader — break their nerve, the others scatter\n2. Drive all three toward the cave mouth — better footing\n3. Go for the torch — fight them in the dark\n4. Fall back to the entrance — force a chokepoint`,

      cave_circle: `[SCENE:dungeon][MUSIC:dungeon]The back fissure is narrow enough that you turn sideways to squeeze through. It opens onto a natural ledge four feet above the main floor. Below: three goblins, a fire, stolen sacks — and a person tied to a post. Alive.\n\nYou have the high ground. The pot-helmed leader is directly below. [DICE:d20${f(str)}]\n\n1. Drop onto the leader — end the chain of command immediately\n2. Shout to disorient all three at once, then drop\n3. Reach the prisoner first — untie them before engaging\n4. Hold your position and assess`,

      // combat variations
      combat_listen: `[SCENE:dungeon][MUSIC:dungeon]You control your breath and listen. Their Goblin is rough but workable.\n\nThe two smaller ones resent being stationed here while the others take positions in *"the keep."* The leader keeps telling them to wait for the signal. *"Three nights. Signal comes in three nights and we move. Until then we hold the entrance and keep the Witch quiet."*\n\n*The Witch.* Sister Vael — she's here, somewhere in these tunnels, still alive. You've learned enough. Now you act.\n\n1. Strike the leader first — most dangerous, most informed\n2. Take the two smaller ones simultaneously\n3. Slip back and find another way deeper without fighting\n4. Throw a stone to scatter them, then pick your moment`,

      combat_surp: `[SCENE:combat][MUSIC:combat]You have the advantage and use it cleanly. The first strike drops the leader — pot-helm clangs off the soil floor. [DICE:d20${f(dex)}]\n\nThe remaining two freeze. One bolts deeper into the tunnels. The other drops its spear and sits down hard, hands on its head, with the resigned posture of a creature that has been on the losing side before. [HP:-2]\n\nThe cave goes quiet. The prisoner at the post is alive — pulse steady, deep bruise along the jaw, unconscious but not in danger.\n\n1. Let the fleeing one go — search the cave thoroughly\n2. Question the surrendered goblin before it composes itself\n3. Chase the fleeing one — it's going somewhere important\n4. Tend to the prisoner first`,

      combat_high: `[SCENE:combat][MUSIC:combat]The drop is clean. You land on the leader with enough force to end his participation immediately. [DICE:d20${f(str)}] The other two find you already between them and the exit.\n\nThe fight is short. The cave is too small for their numbers. The second goes down. The third throws its spear — misses — and runs deeper, shrieking. [HP:-1]\n\nSilence. The prisoner at the post is stirring. In a corner: a crude bark map and three stolen coin purses.\n\n1. Check on the prisoner immediately\n2. Study the bark map before anything else\n3. Pursue the fleeing goblin — it's going somewhere\n4. Secure the cave entrance in case reinforcements come`,

      combat_hot: `[SCENE:combat][MUSIC:combat]The fight is ugly. Three-on-one in a confined space against goblins who've had time to plant their feet. The pot-helmed one has done this before. You take more hits than you'd like. [HP:-7][DICE:d20${f(dex)}]\n\nIt comes down to stamina. The leader goes down. The second folds when his weapon arm fails. The third runs, shouting back into the tunnels — *"INTRUDER! SHAMAN-HELP!"*\n\nBad. That warning got out. But the prisoner is still alive.\n\n1. Pursue immediately — stop the alarm spreading\n2. Bind your wounds before pressing on [HP:+2]\n3. Search the cave fast — take only what's essential\n4. Free the prisoner — see if they can fight`,

      combat_dark: `[SCENE:combat][MUSIC:combat]The torch goes down. Darkness.\n\nFor three seconds: pure chaos. You can hear them but not see them — and they cannot see you. [DICE:d20${f(dex)}] You put the fire position behind you, silhouetting them against the fading embers.\n\nIt's over faster in the dark. Two goblins go down by sound and training. The third scrambles deeper into the tunnel, fear carrying it. When the fire re-lights, the cave is yours. [HP:-3]\n\nThe prisoner is alive and beginning to stir.\n\n1. Free the prisoner — find out who they are\n2. Follow the fleeing goblin now\n3. Search the cave for supplies and maps\n4. Bar the entrance and take stock`,

      interrogate: `[SCENE:dungeon][MUSIC:dungeon]The surrendered goblin watches you with calculating eyes pretending to look stupid.\n\nIt tells you: three passages deeper in. One leads to *"the old rock place with the humming"* — the ritual space. One leads to the surface near the mill's foundation. The third leads to *"the Shaman's quiet place"* where *"the witch-woman sleeps and does not wake."*\n\nSister Vael. Still alive. You let the goblin go. It bolts with impressive speed. [XP:+30]\n\n1. Head for the ritual space — find Sister Vael\n2. Check the bark map on the cave wall first\n3. The surface exit may be important — note it\n4. Press deeper immediately`,

      // post-combat
      post_combat: `[SCENE:dungeon][MUSIC:dungeon]The silence after a finished fight lands differently every time. This one lands heavy.\n\nYou check the fallen and find the prisoner — a grey-haired woman, someone's grandmother by the look of her hands — and search the cave. Behind a loose stone: a bark map showing tunnels and a chamber at the end marked with the jagged black sun. A tally on the wall: numbers, dates, something like a patrol schedule. This has been organised carefully.\n\nThe prisoner's pulse is steady. You can't carry her and go deeper safely. [XP:+120]\n\n1. Bring the prisoner back to the village — report to Brom\n2. Leave her here safely and press deeper with the bark map\n3. Rest here, tend your wounds, decide [HP:+3]\n4. Send the bark map back with a note — press on alone`,

      // return & reward branches
      return_brom: `[SCENE:town][MUSIC:tavern]The walk back is long and wet. You make it before midnight, the prisoner over your shoulder.\n\nBrom doesn't ask questions. He has a cot and broth ready before you finish explaining. The prisoner — the miller's wife — stirs enough by morning to say three things: *"the Shaman,"* *"they took Vael,"* and *"Greyvast."*\n\nBrom says it three times. *"If a shaman is staging an operation from Greyvast... that's not a raid. That's an invasion."* He drops a coin purse on the table. *"Finish this."* [XP:+60]\n\n1. Head north for Greyvast before dawn\n2. Rest until first light\n3. Get Greyvast's layout from Brom first\n4. Go back via the cave tunnels — the bark map shows an underground route`,

      brom_reward: `[SCENE:town][MUSIC:tavern]Brom counts coin and slides it across the bar. Then, unusually, he sits.\n\n*"My grandfather's generation knew Greyvast. There's a way in from the cave system — a dry riverbed under the north wall. Flooded out forty years back. The water's down again now. Goblins would have found it."*\n\nHe pauses. *"Aldric Vane. I know that name. He ran intelligence work for the Consortium seven years ago. Officially retired. Unofficially — people who looked too hard at him went quiet."*\n\nDawn is two hours away. [XP:+40]\n\n1. Rest here until dawn, then go\n2. Leave now through the cave tunnels\n3. Get to high ground above Greyvast and observe before entering\n4. Go to Sister Vael's sanctum first — she's still in those tunnels`,

      rest_scene: `[SCENE:rest][MUSIC:rest]You find a defensible corner of the mill cottage — stone walls, chimney that draws, door that bolts from inside. Three hours.\n\nThe fire catches. The storm continues outside, muffled by old stone. You bind what needs binding and let the adrenaline go. [HP:+6]\n\nYou wake to silence — the storm finally spent — and something else. A sound from below the floor. Rhythmic. Low. Like a heartbeat built from stone and malice.\n\n**Drumming.**\n\nSomething is conducting a ritual beneath this building.\n\n1. Find the trapdoor — go down immediately\n2. Wait — assess the rhythm before acting\n3. Get outside first and orient yourself\n4. Check the bark map — mark where you think this is`,

      // shaman chamber
      deeper_dungeon: `[SCENE:cave][MUSIC:dungeon]The passage descends by degrees — earthen, then limestone, then something older. The drumming is everywhere, coming through the stone itself.\n\nThe passage opens into a vast natural chamber lit by iron-sconce torches. In the centre, surrounded by kneeling goblin soldiers, stands a **Hobgoblin Shaman** — tall, robed, skull-staff raised. Before him on a stone altar: a crystal of green-black mineral pulsing in time with the drums.\n\nAnd to the right, against the wall, in a faintly glowing chalk circle: **Sister Vael**. Cross-legged. Breathing. Eyes open on something invisible. [DICE:d20${f(wis)}]\n\nThey haven't noticed you.\n\n1. Target the crystal — a ranged strike to shatter it\n2. Watch and listen — learn the ritual before acting\n3. Step into the torchlight and announce yourself\n4. Find the chamber supports — a controlled collapse traps them`,

      shaman_snipe: `[SCENE:combat][MUSIC:combat]The shot connects. The crystal *cracks* — green fire sprays outward, sending the kneeling goblins scrambling. The shaman staggers. [DICE:d20${f(dex)}]\n\nThen he rights himself. The crystal — cracked, not destroyed — still pulses. Slower. Weaker. But the connection holds. He finds you with the calm of someone who sensed you before you moved.\n\n*"You have weakened it. You have not stopped it. And now I know exactly who you are, ${name}."* [HP:-3]\n\n1. Press your advantage before he recovers\n2. Target the cracked crystal again — finish it\n3. Fall back to the passage — better defensive ground\n4. Go for Sister Vael — free her while the chaos holds`,

      shaman_observe: `[SCENE:cave][MUSIC:dungeon]You hold still and watch. The drumming has a pattern — a *binding* rhythm, the kind used to maintain a connection to an unwilling vessel. Sister Vael isn't captured. She's a **lock**. Whatever is trying to come through the crystal is stopped by her resistance. The shaman needs her alive and conscious. [DICE:d20${f(int_)}]\n\nThis changes things. Kill the shaman carelessly — or shatter the crystal — and whatever she's containing walks free. You need to free her *cleanly*, not just fast.\n\n1. Step into the light — draw the shaman to you, away from Vael\n2. Target the crystal — break the shaman's leverage\n3. Go for Vael directly — the binding looks physical\n4. Throw something into the ritual circle — interrupt the rhythm`,

      shaman_confront: `[SCENE:combat][MUSIC:combat]You step into the torchlight. The drumming skips one beat.\n\n*"The thread-puller arrives,"* the shaman says in accented Common, almost impressed. *"Aldric said one would come. He said to tell you: you are three moves behind."*\n\nThen he strikes. [HP:-5][DICE:d20${f(con)}]\n\nThe goblins scatter, clearing the floor. This is between you and the shaman now. Sister Vael's eyes — still unfocused — track toward your voice as if she can hear you through whatever holds her.\n\n1. Keep moving — deny him a static target\n2. Drive him toward the altar — his crystal link is a liability\n3. Call Vael's name loudly and repeatedly\n4. Hit hard and fast — overwhelming force before he settles`,

      shaman_trap: `[SCENE:cave][MUSIC:dungeon]The supports are old — limestone and dried timber. Two strikes in the right places bring the entry tunnel down in a controlled collapse. [DICE:d20${f(int_)}]\n\nDust rolls through the chamber. When it clears, the goblins are gone — bolted through the far passages — leaving only the shaman, Sister Vael, and you.\n\n*"Clever,"* the shaman says quietly, turning from the altar. *"Aldric will be disappointed it ended here."* [HP:-2]\n\n1. End this now — attack while he's recalibrating\n2. Ask about Aldric — you're trapped here anyway\n3. Go for Sister Vael while his attention is on you\n4. Use the dust still in the air — reposition under cover`,

      // boss
      boss_fight: `[SCENE:boss][MUSIC:boss]The fight with the shaman is the hardest thing you have done in a long time.\n\nHe is not relying on the staff alone — there is genuine martial skill in his footwork. Twice he anticipates your angle before you commit. The crystal pulses irregular green bursts. Sister Vael, in her circle, begins to shake. [HP:-8][DICE:d20${f(dex)}]\n\nYou are getting through his guard. Slowly. Expensively. The ritual destabilises without his full focus. The crystal cracks down its centre. Vael gasps. [DICE:d20${f(str)}]\n\nOne clean opening. That's all you need.\n\n1. Everything you have — overwhelm the opening now\n2. Drive him into the cracking crystal — use it against him\n3. Call Vael's name — let whatever she's holding go\n4. Fall back and make him come to you`,

      boss_hard: `[SCENE:boss][MUSIC:boss]You fall back and make him pursue — patient discipline or a miscalculation; the shaman closes faster than expected. [HP:-5][DICE:d20${f(con)}]\n\nBut his focus on you pulls it from the crystal entirely. Behind him the crystal fractures with a sound like splitting glass. Vael's eyes clear — fully, completely — and she rises from the circle with the deliberateness of someone who has been waiting for exactly this moment.\n\n*"${name},"* she says, and her voice fills the chamber without effort. *"Step back."*\n\nYou step back.\n\n1. Let Vael act — trust her completely\n2. Cover her — keep the shaman's attention on you\n3. Strike the shaman one final time\n4. Destroy the crystal shards — don't leave them intact`,

      // victory + loop
      victory: `[SCENE:rest][MUSIC:rest]The shaman collapses. The green light goes out.\n\nSister Vael lowers her hands and exhales a breath she seems to have been holding for three days. She looks at you with clear grey eyes: *"Thank you."*\n\nIn the shaman's robes: a sealed letter. The Merchant's Consortium's black sun seal. Inside: a name, a route, a payment record. **Aldric Vane** paid for all of this — the goblins, the ritual, Vael's capture — four months ago. This was planned, thoroughly, by someone who knew exactly what she was protecting.\n\nGreyvast Keep still has lights in its windows. [HP:+8][XP:+500][WIN]\n\n1. Rest here before anything else\n2. Ask Vael what she was protecting — what was behind the seal\n3. Head for Greyvast immediately — catch Aldric before news arrives\n4. Get back to Brom with the letter — this is evidence`,

      epilogue: `[SCENE:town][MUSIC:tavern]Three days later. The **Tarnished Flagon** is warm and full again — the kind of noise that means people feel safe enough to be careless.\n\nSister Vael sits across from you, clean hands, bowl of Brom's stew, the watchful calm of someone who was underground too long. The letter is with a courier in the capital. Aldric Vane is gone — Greyvast empty when anyone reached it — but the payment record has names, and names have consequences.\n\n*"What was behind the seal?"* you asked her, that first night. She considered a long time. *"Something old. Something that shouldn't be accessible from this side of the world. Now that the ritual is broken, it will try another anchor. Within the year."*\n\nA log settles in the fire. Outside: ordinary stars, ordinary wind. [XP:+200]\n\n1. Ask where the next anchor point might be\n2. Begin preparing — this isn't over\n3. Enjoy the peace while it lasts\n4. Study the letter — look for more names in Vane's network`,
    };

    // ── Journal tags appended to key demo states ──────────────
    const TAGS = {
      tavern:         '[NPC:Brom Ashkettle:innkeeper:Friendly][LORE:The Order of the Ashen Veil uses a jagged black sun as their seal]',
      brom_info:      '[NPC:Brom Ashkettle:innkeeper:Friendly][NPC:Sister Vael:hedge-witch:Unknown][LORE:Greyvast Keep lies abandoned three miles north of the village]',
      read_letter:    '[NPC:Aldric Vane:Consortium agent:Hostile][LORE:A phrase in Old Common warns the seal on the deep place must not be broken]',
      head_out:       '[NPC:Brom Ashkettle:innkeeper:Friendly][LORE:A Consortium agent was asking about Sister Vael by name shortly before the goblin raids]',
      second_drink:   '[NPC:Sister Vael:hedge-witch:Unknown][LORE:Cold blue goblin-fire was seen in the Ashwood two nights running]',
      forest_road:    '[LORE:A cave beneath the ruined mill appears to be the goblin staging point]',
      combat_listen:  '[NPC:Sister Vael:hedge-witch:Captured][LORE:Goblins are waiting three nights for a signal from deeper in the tunnels]',
      interrogate:    '[LORE:Three passages lead deeper under the Ashwood — one to a ritual space, one back to the surface, one to Sister Vael]',
      post_combat:    '[DECISION:Player cleared goblin scouts from the cave entrance and found a bark map showing the tunnel layout]',
      return_brom:    '[NPC:Brom Ashkettle:innkeeper:Friendly][DECISION:Player rescued the miller\'s wife and returned her to the village][LORE:The miller\'s wife confirmed a Shaman is operating from Greyvast Keep]',
      brom_reward:    '[NPC:Aldric Vane:Consortium agent:Hostile][LORE:Aldric Vane ran Consortium intelligence work and people who looked too hard at him went quiet]',
      deeper_dungeon: '[NPC:Hobgoblin Shaman:ritual leader:Hostile][NPC:Sister Vael:hedge-witch:Captive][LORE:Sister Vael is being used as a binding lock on a pulsing green-black crystal]',
      shaman_observe: '[DECISION:Player observed the ritual and learned Sister Vael must be freed cleanly — killing the shaman carelessly could release what she is containing]',
      shaman_confront:'[DECISION:Player stepped into the torchlight and confronted the Hobgoblin Shaman directly][LORE:Aldric Vane warned the shaman that an adventurer would come and said they were three moves behind]',
      victory:        '[DECISION:Player defeated the Hobgoblin Shaman and broke the ritual binding][NPC:Sister Vael:hedge-witch:Friendly][NPC:Aldric Vane:Consortium mastermind:Hostile][LORE:Aldric Vane paid the Consortium to orchestrate the goblin raids and capture Sister Vael four months ago]',
      epilogue:       '[LORE:Sister Vael warned that whatever she was containing will seek a new anchor within the year]',
    };

    // ── Opening call ───────────────────────────────────────────
    if (!this._demoState) {
      this._demoState = 'tavern';
      return new Promise(r => setTimeout(() => r(R.tavern + ' ' + (TAGS.tavern || '')), 800));
    }

    // ── Parse player's choice and transition ──────────────────
    const lastMsg = [...this.messages].reverse().find(m => m.role === 'user')?.content || '';
    const choice  = this._parseDemoChoice(lastMsg);
    const node    = T[this._demoState] || {};
    const nextId  = node[choice] || node.default || 'epilogue';
    this._demoState = nextId;

    const responseText = (R[nextId] || R.epilogue) + ' ' + (TAGS[nextId] || '');
    return new Promise(r => setTimeout(() => r(responseText), 800));
  }

  // ── Scene inference from response text (fallback when AI omits tags) ──
  _inferScene(text) {
    const t = text.toLowerCase();
    // Priority: most specific / highest-stakes first
    if (/\b(lich|demon lord|dragon|archlich|ancient evil|dark god|eldritch horror)\b/.test(t))
      return 'boss';
    if (/\b(attack|combat|fight(?:ing)?|battle|clash|brawl|skirmish|sword|blade|spear|arrow|wound|blood|strikes?|parr(?:y|ied)|dodge|slay|slain|slaughter)\b/.test(t)
        && /\b(enemy|enemies|goblin|orc|bandit|monster|creature|foe|opponent|assailant)\b/.test(t))
      return 'combat';
    if (/\b(cave|cavern|stalactite|stalagmite|spelunk|grotto|underground.*chamber|echoes.*rock|dripping.*stone)\b/.test(t))
      return 'cave';
    if (/\b(dungeon|corridor|torch(?:lit|es?)?|iron sconce|stone floor|damp.*stone|passage|portcullis|crypt|underground ruin|iron door|dark hall)\b/.test(t))
      return 'dungeon';
    if (/\b(castle|keep|great hall|throne(?: room)?|rampart|battlement|parapet|tower|fortress|baron|lord.*hall)\b/.test(t))
      return 'castle';
    if (/\b(tavern|inn|alehouse|common room|fireplace|hearth|mug|tankard|bard|barkeep|innkeeper|taproom)\b/.test(t))
      return 'tavern';
    if (/\b(town|village|market(?:place)?|cobble|street|town square|settlement|merchant|blacksmith|guard post|city)\b/.test(t))
      return 'town';
    if (/\b(forest|wood(?:s|land)|trees?|canopy|undergrowth|leaves|thicket|birdsong|wilderness|trail|clearing|overgrown)\b/.test(t))
      return 'forest';
    if (/\b(rest(?:ing)?|camp(?:fire|site)?|safe haven|recover(?:ing)?|tend.*wound|sleep|shelter|warmth.*night)\b/.test(t))
      return 'rest';
    return null;
  }

  // ── Build System Prompt ──────────────────────────────────────
  _buildSystemPrompt(character, campaignType, customDesc) {
    const c      = character;
    const mods   = Object.fromEntries(
      ['str','dex','con','int','wis','cha'].map(ab => [ab, Math.floor((c.stats[ab] - 10) / 2)])
    );
    const modStr = (v) => (v >= 0 ? `+${v}` : `${v}`);

    const memoryBlock = window.journalSystem?.buildMemoryBlock();

    return `You are a master Dungeon Master running ${CAMPAIGN_DESC[campaignType] || CAMPAIGN_DESC.standard}
${campaignType === 'custom' && customDesc ? `The player has requested: "${customDesc}"` : ''}

═══ CHARACTER SHEET ═══
Name:       ${c.name}
Race:       ${c.race}
Class:      ${c.class} (Level ${c.level})
Background: ${c.background}
HP:         ${c.currentHp}/${c.maxHp}
AC:         ${c.ac}    Speed: ${c.speed}ft    Proficiency: +${c.profBonus}
STR ${c.stats.str}(${modStr(mods.str)})  DEX ${c.stats.dex}(${modStr(mods.dex)})  CON ${c.stats.con}(${modStr(mods.con)})
INT ${c.stats.int}(${modStr(mods.int)})  WIS ${c.stats.wis}(${modStr(mods.wis)})  CHA ${c.stats.cha}(${modStr(mods.cha)})
Equipment:  ${(c.equipment || []).slice(0,4).join(', ')}
${memoryBlock ? '\n' + memoryBlock + '\n' : ''}
═══ DM INSTRUCTIONS ═══
• Narrate in vivid, atmospheric prose (2–4 paragraphs per turn).
• Present 3–4 **numbered choices** at the end of most turns for the player to pick from. Honor free-text input too.
• When a skill/attack check is needed, include a roll tag: [DICE:d20+3] (replace 3 with the relevant modifier).
  Use D&D 5e DCs: Easy=10, Medium=15, Hard=20, Very Hard=25.
• EVERY response MUST begin with [SCENE:X] matching the current location and environment. X must be one of:
  dungeon  — underground corridors, torchlit passages, ruins, crypts
  tavern   — inns, alehouses, common rooms, hearths
  forest   — woods, wilderness, canopy, trails, clearings
  cave     — natural caverns, stalactites, deep rock, echoes
  castle   — keeps, halls, towers, battlements, fortresses
  town     — villages, markets, streets, town squares, settlements
  combat   — any active fight or skirmish (use MUSIC:combat too)
  boss     — major villain showdown or climactic encounter
  rest     — camps, safe havens, recovery moments
  Choose based on where the player is RIGHT NOW and what surrounds them (objects, creatures, terrain, lighting, sounds).
• EVERY response must also include [MUSIC:X] when the atmosphere should change — combat always gets [MUSIC:combat], boss always gets [MUSIC:boss], peaceful moments get [MUSIC:rest], etc. If the scene and music are the same value, emit both anyway.
• When the character takes damage, include [HP:-N] (e.g. [HP:-5]).
• When the character is healed, include [HP:+N].
• When the character earns XP, include [XP:+N].
• If the character gains a status condition (Poisoned, Blinded, Frightened, etc.), include [CONDITION:name].
• If the character finds or is given a named magic item, include [ITEM:name].
• If the character dies, include [DEAD].
• When the adventure concludes successfully, include [WIN].
• Keep implied D&D 5e rules: proficiency, saving throws, spell slots, etc.
• NEVER break character or mention that you are an AI.
• Maintain a consistent tone: dark and atmospheric for dungeons/caves, warm for taverns, epic for boss fights.
• MEMORY TAGS (include these silently in every response as applicable; they are parsed by the game engine):
  - When you introduce or reference a named NPC, include [NPC:Name:Role:Attitude] — e.g. [NPC:Brom Ashkettle:innkeeper:Friendly]
  - When the story reveals a significant fact or piece of lore, include [LORE:one-sentence fact]
  - When the player makes a key story decision that shapes the narrative, include [DECISION:one-sentence summary]`;
  }

  // ── Send Player Message ──────────────────────────────────────
  async sendMessage(text, isSystem = false) {
    if (this.isTyping) return;

    // Player-initiated attack actions require an initiative roll first
    if (!isSystem && this._isAttackAction(text)) {
      const dex    = window.characterSystem?.character?.stats?.dex ?? 10;
      const dexMod = Math.floor((dex - 10) / 2);
      this._openInitiativeModal(dexMod, 0, () => this._doSend(text, isSystem));
      return;
    }

    this._doSend(text, isSystem);
  }

  _isAttackAction(text) {
    return /\b(attack|strike|stab|slash|shoot|fire|charge|swing|lunge|cleave|cast|smite|backstab|ambush|rush|assault)\b/i.test(text);
  }

  async _doSend(text, isSystem = false) {
    if (!isSystem) {
      // Show player's action
      this._addPlayerEntry(text);
      this.messages.push({ role: 'user', content: text });
    } else {
      this.messages.push({ role: 'user', content: text });
    }

    window.journalSystem?.incTurn();

    // Disable input
    document.getElementById('player-input').disabled = true;
    document.getElementById('btn-send').disabled     = true;

    // Trim context to last 20 messages + system, updating memory in system prompt
    const sysMsg  = { ...this.messages[0] };
    const char = window.characterSystem?.character;
    if (char) {
      sysMsg.content = this._buildSystemPrompt(
        char,
        window.app?.gameState?.campaignType || 'standard',
        window.app?.gameState?.customDesc   || ''
      );
    }
    const trimmed = [sysMsg, ...this.messages.slice(1).slice(-20)];

    // Track the last user message so errors can offer a retry
    this._lastSentText   = text;
    this._lastSentSystem = isSystem;

    try {
      const response = (this.demoMode || !this.apiKey)
        ? await this._mockResponse()
        : await window.electronAPI.sendToAI(trimmed, this.apiKey, this.model, this.provider);
      this.messages.push({ role: 'assistant', content: response });
      await this._processResponse(response);
    } catch (err) {
      this._addErrorEntry(err);
    } finally {
      document.getElementById('player-input').disabled = false;
      document.getElementById('btn-send').disabled     = false;
      document.getElementById('player-input').focus();
    }
  }

  // ── Process AI Response ──────────────────────────────────────
  async _processResponse(raw) {
    // Extract and strip command tags
    const commands = [];
    const text = raw.replace(/\[(\w+):([^\]]+)\]/g, (full, cmd, val) => {
      commands.push({ cmd: cmd.toUpperCase(), val: val.trim() });
      return '';
    })
    // Collapse runs of spaces/tabs only — preserve newlines so choice lines stay on their own lines
    .replace(/[ \t]{2,}/g, ' ')
    // Limit to at most one blank line between paragraphs
    .replace(/\n{3,}/g, '\n\n')
    .trim();

    // Accumulate incoming damage separately — applied only after initiative roll
    let pendingDamage = 0;

    // Track whether the AI emitted explicit scene/music tags
    let sceneSet = false;
    let musicSet = false;

    // Process commands first (scene/music changes happen behind the text)
    commands.forEach(({ cmd, val }) => {
      switch (cmd) {
        case 'SCENE': try { window.mapSystem?.setScene(val.toLowerCase()); window.audioSystem?.setScene(val.toLowerCase()); sceneSet = true; musicSet = true; } catch (e) { console.warn('Scene error:', e); } break;
        case 'MUSIC': try { window.audioSystem?.setScene(val.toLowerCase()); musicSet = true; } catch (e) { console.warn('Audio error:', e); } break;
        case 'HP': {
          const delta = parseInt(val);
          if (!isNaN(delta)) {
            if (delta < 0) {
              pendingDamage += delta;
            } else {
              window.characterSystem?.applyHPChange(delta);
              const name = window.characterSystem?.character?.name || 'You';
              this._addSystemEntry(`💚 ${name} heals ${delta} HP!`);
            }
          }
          break;
        }
        case 'XP':       window.characterSystem?.gainXP(parseInt(val) || 0); break;
        case 'DEAD':     this._handleDeath(); break;
        case 'WIN':      this._handleVictory(); break;
        case 'CONDITION': this._showConditionCard(val); break;
        case 'ITEM':      this._fetchAndShowItem(val); break;
        // ── Memory tags ───────────────────────────────────────
        case 'NPC': {
          const [name, role, attitude] = val.split(':');
          window.journalSystem?.addNPC(name, role, attitude);
          break;
        }
        case 'NPC': {
          const parts = val.split(':');
          const npcName = parts[0]?.trim();
          const npcRole = parts[1]?.trim() || '';
          const npcAtt  = parts[2]?.trim() || '';
          if (npcName) window.journalSystem?.addNPC(npcName, npcRole, npcAtt);
          break;
        }
        case 'LORE':     window.journalSystem?.addLore(val); break;
        case 'DECISION': window.journalSystem?.addDecision(val); break;
      }
    });

    // ── Fallback: if the AI omitted SCENE/MUSIC tags, infer from the response text ──
    if (!sceneSet) {
      const inferred = this._inferScene(raw);
      if (inferred) {
        try { window.mapSystem?.setScene(inferred); } catch (e) { console.warn('Scene infer error:', e); }
        if (!musicSet) {
          try { window.audioSystem?.setScene(inferred); } catch (e) { console.warn('Music infer error:', e); }
        }
      }
    }

    // Parse numbered choices out of response text
    const { prose, choices, diceRequest } = this._parseText(text);

    // Typewriter effect for the DM entry
    await this._typewriterEntry(prose, choices);

    // TTS narration (after typewriter finishes)
    this._speakTTS(prose);

    // Helper to trigger the regular skill-check dice prompt (if any)
    const triggerDiceRequest = () => {
      if (!diceRequest) return;
      window.diceSystem.requestRoll(diceRequest.spec, diceRequest.label, (result) => {
        const modifier  = diceRequest.spec.match(/[+-]\d+/)?.[0] || '+0';
        const checkText = `I rolled a ${result.total} (${diceRequest.spec}: ${result.rolls.join('+')}${modifier}) for ${diceRequest.label}.`;
        this.sendMessage(checkText);
      });
    };

    if (pendingDamage < 0) {
      const dex    = window.characterSystem?.character?.stats?.dex ?? 10;
      const dexMod = Math.floor((dex - 10) / 2);
      this._openInitiativeModal(dexMod, Math.abs(pendingDamage), (rollTotal) => {
        if (rollTotal < 10) {
          window.characterSystem?.applyHPChange(pendingDamage);
        } else {
          const charName = window.characterSystem?.character?.name || 'You';
          this._addSystemEntry(`🛡 ${charName} reacts swiftly and dodges the attack!`);
        }
        triggerDiceRequest();
      });
    } else {
      triggerDiceRequest();
    }
  }

  // ── TTS ──────────────────────────────────────────────────────
  _speakTTS(text) {
    if (!window.app?.settings?.ttsEnabled) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip HTML, markdown, and numbered choice lines (those are UI, not narration)
    let plain = text
      .replace(/<[^>]+>/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/[_`]/g, '')
      .replace(/^\s*\d+[.)]\s+.+$/gm, '')  // strip numbered choices
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Only narrate first 2 sentences — keeps it punchy, not a wall of speech
    const sentMatch = plain.match(/^(.*?[.!?…]+\s+.*?[.!?…]+)/s);
    if (sentMatch) plain = sentMatch[1].trim();
    if (!plain) return;

    const utt  = new SpeechSynthesisUtterance(plain);
    utt.rate   = 0.85;
    utt.pitch  = 0.9;

    const voices     = window.speechSynthesis.getVoices();
    const preferred  = window.app?.settings?.ttsVoice;
    if (preferred) {
      const match = voices.find(v => v.name === preferred);
      if (match) utt.voice = match;
    } else {
      // Auto-pick best voice: neural/natural first, then known good Windows/Google voices
      const pick =
        voices.find(v => /natural|neural/i.test(v.name) && v.lang.startsWith('en')) ||
        voices.find(v => /Microsoft (Aria|Guy|David|Zira|Mark)/i.test(v.name)) ||
        voices.find(v => /google/i.test(v.name) && v.lang.startsWith('en')) ||
        voices.find(v => v.lang.startsWith('en-'));
      if (pick) utt.voice = pick;
    }

    window.speechSynthesis.speak(utt);
  }

  // ── Initiative Roll Overlay ──────────────────────────────────
  // damage > 0 : enemy attack — show damage warning after roll
  // damage = 0 : player attack — show "entering combat" after roll
  _openInitiativeModal(dexMod, damage, onConfirm) {
    const overlay  = document.getElementById('modal-initiative');
    const face     = document.getElementById('init-d20-face');
    const svg      = document.getElementById('init-d20-svg');
    const modLabel = document.getElementById('init-mod-label');
    const rollBtn  = document.getElementById('btn-init-roll');
    const result   = document.getElementById('init-result');
    const confirm  = document.getElementById('btn-init-confirm');
    const heading  = overlay.querySelector('.modal-head h3');
    const flavour  = overlay.querySelector('.init-flavour');

    if (damage === 0) {
      heading.textContent  = '⚔ Roll for Initiative';
      flavour.textContent  = 'You move to attack! Roll initiative to determine how quickly you act.';
    } else {
      heading.textContent  = '⚡ Roll for Initiative';
      flavour.textContent  = 'Combat begins! Roll 10 or higher to react in time and dodge. 9 or lower — the hit lands.';
    }

    // Reset state
    face.textContent = '20';
    modLabel.textContent = dexMod >= 0 ? `DEX modifier: +${dexMod}` : `DEX modifier: ${dexMod}`;
    result.classList.add('hidden');
    result.innerHTML = '';
    confirm.classList.add('hidden');
    rollBtn.disabled = false;
    svg.classList.remove('spinning');

    overlay.classList.remove('hidden');

    // Roll handler
    let lastTotal = 0;
    const doRoll = () => {
      rollBtn.disabled = true;
      svg.classList.remove('spinning');
      void svg.offsetWidth; // reflow to restart animation
      svg.classList.add('spinning');

      // Animate face cycling
      let ticks = 0;
      const ticker = setInterval(() => {
        face.textContent = Math.ceil(Math.random() * 20);
        ticks++;
        if (ticks >= 12) {
          clearInterval(ticker);
          const raw   = Math.ceil(Math.random() * 20);
          const total = raw + dexMod;
          lastTotal = total;
          face.textContent = raw;

          const name = window.characterSystem?.character?.name || 'You';
          let outcomeHtml;
          if (damage > 0) {
            outcomeHtml = total >= 10
              ? `<span class="init-dodge-ok">🛡 ${name} reacts in time — attack dodged!</span>`
              : `<span class="init-damage-warn">💔 ${name} takes ${damage} damage!</span>`;
          } else {
            outcomeHtml = `<span class="init-attack-go">⚔ ${name} moves to strike!</span>`;
          }
          result.innerHTML =
            `${total}<span class="init-breakdown">d20(${raw}) ${dexMod >= 0 ? '+' : ''}${dexMod} = ${total}</span>` +
            outcomeHtml;
          result.classList.remove('hidden');
          confirm.classList.remove('hidden');
        }
      }, 55);
    };

    rollBtn.onclick = doRoll;

    confirm.onclick = () => {
      overlay.classList.add('hidden');
      rollBtn.onclick = null;
      confirm.onclick = null;
      onConfirm(lastTotal);
    };
  }

  // ── Condition & Item Pop-ups (Open5e) ────────────────────────
  _showConditionCard(name) {
    const cond = window.open5e?.getCondition(name);
    // Notify in story log regardless
    const charName = window.characterSystem?.character?.name || 'You';
    this._addSystemEntry(`⚠️ ${charName} is now <strong>${name}</strong>!`);
    if (!cond) return; // No description available

    document.getElementById('condition-title').textContent = cond.name;
    const desc = (cond.desc || '').replace(/\n/g, '<br>').replace(/\* /g, '• ');
    document.getElementById('condition-body').innerHTML = `
      <div class="condition-desc">${desc || 'No description available.'}</div>`;
    document.getElementById('modal-condition').classList.remove('hidden');
  }

  async _fetchAndShowItem(name) {
    this._addSystemEntry(`✨ ${window.characterSystem?.character?.name || 'You'} obtained: <strong>${name}</strong>!`);
    try {
      const item = await window.open5e?.searchMagicItem(name);
      if (!item) return;
      document.getElementById('item-title').textContent = item.name;
      const rarity  = item.rarity ? `<span class="spell-card-tag">${item.rarity}</span>` : '';
      const type    = item.type   ? `<span class="spell-card-tag">${item.type}</span>`   : '';
      const attune  = (item.requires_attunement || '').includes('requires') ? '<span class="spell-card-tag warn">Attunement</span>' : '';
      const desc    = (item.desc || '').replace(/\n/g, '<br>');
      document.getElementById('item-body').innerHTML = `
        <div class="spell-card-meta">${rarity}${type}${attune}</div>
        <div class="spell-card-desc">${desc || 'No description available.'}</div>`;
      document.getElementById('modal-item').classList.remove('hidden');
    } catch (e) {
      console.warn('[Open5e] Could not fetch item:', name, e.message);
    }
  }

  _parseText(text) {
    // Detect dice request remnants like "roll d20+3 for Stealth"
    let diceRequest = null;
    const diceMatch = text.match(/roll\s+a?\s*((?:\d+)?d\d+(?:[+-]\d+)?)\s*(?:for\s+([^.!?]+))?/i);
    if (diceMatch) {
      diceRequest = { spec: diceMatch[1].toLowerCase(), label: diceMatch[2]?.trim() || 'Check' };
    }

    // Extract numbered choices — only match at the START of a line to avoid
    // false positives like "pressing on 3." mid-sentence
    const choicePattern = /^[ \t]*(\d+)[.)]\s+(.+)/gm;
    const choices = [];
    let firstChoiceIdx = -1;
    let match;
    while ((match = choicePattern.exec(text)) !== null) {
      if (firstChoiceIdx === -1) firstChoiceIdx = match.index;
      choices.push({ num: match[1], label: match[2].trim() });
    }
    const prose = firstChoiceIdx > 0
      ? text.slice(0, firstChoiceIdx).trim()
      : text.trim();

    return { prose: prose || text.trim(), choices, diceRequest };
  }

  // ── UI Renderers ─────────────────────────────────────────────
  _addPlayerEntry(text) {
    const log   = document.getElementById('story-log');
    const entry = document.createElement('div');
    entry.className = 'story-entry player';
    entry.innerHTML = `<div class="entry-label">⚔ ${window.characterSystem.character?.name || 'You'}</div>
      <div class="entry-text player-text">"${text}"</div>`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  _addSystemEntry(text) {
    const log   = document.getElementById('story-log');
    const entry = document.createElement('div');
    entry.className = 'story-entry system';
    entry.innerHTML = `<div class="entry-text system-text">${text}</div>`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  _addErrorEntry(err) {
    const log   = document.getElementById('story-log');
    const entry = document.createElement('div');
    entry.className = 'story-entry system';
    const msg = String(err).replace(/Error:\s*/i, '').split('\n')[0];
    entry.innerHTML = `
      <div class="entry-text system-text error-text">
        ⚠ The Oracle is silent: <em>${msg}</em>
        <button class="btn-retry" title="Retry sending your last message">↺ Retry</button>
      </div>`;
    entry.querySelector('.btn-retry').addEventListener('click', () => {
      entry.remove();
      // Remove the failed user message from history so it isn't duplicated
      const lastIdx = [...this.messages].map(m => m.role).lastIndexOf('user');
      if (lastIdx !== -1) this.messages.splice(lastIdx, 1);
      this._doSend(this._lastSentText, this._lastSentSystem);
    });
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  addSystemMessage(text) { this._addSystemEntry(text); }

  async _typewriterEntry(prose, choices) {
    const log   = document.getElementById('story-log');
    const entry = document.createElement('div');
    entry.className = 'story-entry dm';
    entry.innerHTML = `<div class="entry-label dm-label">📖 Dungeon Master</div>
      <div class="entry-text typing-cursor" id="dm-text-live"></div>`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;

    const textEl = entry.querySelector('#dm-text-live');
    textEl.id = '';

    await this._typewrite(textEl, prose);

    // Remove cursor and add choices
    textEl.classList.remove('typing-cursor');

    if (choices.length > 0) {
      const choiceBox = document.createElement('div');
      choiceBox.className = 'story-choices';
      choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<span class="choice-num">${c.num}</span><span class="choice-label">${c.label}</span><span class="choice-key">${c.num}</span>`;
        btn.onclick = () => {
          choiceBox.querySelectorAll('.choice-btn').forEach(b => { b.disabled = true; b.classList.remove('selected'); });
          btn.classList.add('selected');
          this.sendMessage(`${c.num}. ${c.label}`);
        };
        choiceBox.appendChild(btn);
      });
      entry.appendChild(choiceBox);

      // Also surface as hint chips in input bar
      const hints = document.getElementById('input-hints');
      hints.innerHTML = '';
      choices.slice(0, 4).forEach(c => {
        const chip = document.createElement('span');
        chip.className   = 'hint-chip';
        chip.textContent = `${c.num}. ${c.label.slice(0, 30)}${c.label.length > 30 ? '…' : ''}`;
        chip.onclick = () => {
          hints.innerHTML = '';
          this.sendMessage(`${c.num}. ${c.label}`);
        };
        hints.appendChild(chip);
      });
    }

    log.scrollTop = log.scrollHeight;
  }

  _typewrite(el, text) {
    return new Promise(resolve => {
      if (this.textSpeed === 0) { el.innerHTML = this._markupText(text); resolve(); return; }
      let i = 0;
      const step = () => {
        if (i < text.length) {
          el.innerHTML = this._markupText(text.slice(0, ++i));
          document.getElementById('story-log').scrollTop = document.getElementById('story-log').scrollHeight;
          this._typeTimer = setTimeout(step, this.textSpeed);
        } else { resolve(); }
      };
      step();
    });
  }

  _markupText(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // ── Rebuild log from message history (on load) ───────────────
  rebuildLog() {
    const log = document.getElementById('story-log');
    log.innerHTML = '';

    // Find index of the last assistant message so we can make its choices interactive
    let lastAssistantIdx = -1;
    this.messages.forEach((msg, i) => { if (msg.role === 'assistant') lastAssistantIdx = i; });

    this.messages.forEach((msg, idx) => {
      if (msg.role === 'system') return;
      if (msg.role === 'user' && !msg.content.startsWith('Begin the adventure') && !msg.content.includes('[ROLL RESULT:')) {
        this._addPlayerEntry(msg.content);
      } else if (msg.role === 'assistant') {
        const cleaned = msg.content.replace(/\[(\w+):([^\]]+)\]/g, '').trim();
        const { prose, choices } = this._parseText(cleaned);
        const entry = document.createElement('div');
        entry.className = 'story-entry dm';
        entry.innerHTML = `<div class="entry-label dm-label">📖 Dungeon Master</div>
          <div class="entry-text">${this._markupText(prose)}</div>`;
        if (choices.length) {
          const cb = document.createElement('div');
          cb.className = 'story-choices';
          const isLatest = idx === lastAssistantIdx;
          choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            if (isLatest) {
              btn.innerHTML = `<span class="choice-num">${c.num}</span><span class="choice-label">${c.label}</span><span class="choice-key">${c.num}</span>`;
              btn.onclick = () => {
                cb.querySelectorAll('.choice-btn').forEach(b => { b.disabled = true; b.classList.remove('selected'); });
                btn.classList.add('selected');
                this.sendMessage(`${c.num}. ${c.label}`);
              };
            } else {
              btn.disabled = true;
              btn.textContent = `${c.num}. ${c.label}`;
            }
            cb.appendChild(btn);
          });
          entry.appendChild(cb);

          // Restore input-hints for the latest message
          if (isLatest) {
            const hints = document.getElementById('input-hints');
            hints.innerHTML = '';
            choices.slice(0, 4).forEach(c => {
              const chip = document.createElement('span');
              chip.className = 'hint-chip';
              chip.textContent = `${c.num}. ${c.label.slice(0, 30)}${c.label.length > 30 ? '…' : ''}`;
              chip.onclick = () => { hints.innerHTML = ''; this.sendMessage(`${c.num}. ${c.label}`); };
              hints.appendChild(chip);
            });
          }
        }
        log.appendChild(entry);
      }
    });
    log.scrollTop = log.scrollHeight;
  }

  // ── Special Events ───────────────────────────────────────────
  _handleDeath() {
    window.audioSystem?.setScene('dungeon');
    window.speechSynthesis?.cancel();
    this._addSystemEntry('💀 You have fallen… Your adventure ends here. Reload a save to continue.');
    document.getElementById('player-input').disabled = true;
    document.getElementById('btn-send').disabled     = true;

    // Show death screen after a short pause so the message is readable
    setTimeout(() => window.app?._showDeathScreen(), 2500);
  }

  _handleVictory() {
    window.audioSystem?.setScene('victory');
    this._addSystemEntry('🏆 Victory! Your legend is complete. Well played, adventurer!');
    window.saveSystem.save('auto');
  }
}

window.aiSystem = new AISystem();
