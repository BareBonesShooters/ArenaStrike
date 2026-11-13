# Arena Strike 3D: improvement plan

Built from code reviews by Fable 5.2 (November 2026). Nothing in it has been built yet.
Effort is in working days. Each phase can be handed to Haiku agents one batch at a time; I review and verify every batch in the browser before the next one starts.

Tooling (built first, see `tools/README.md`): `npm run finish` runs every check, a headless play test of each mode, a draw-call/triangle budget per tier and a screenshot diff of every map on Ultra and Potato. Edits go through `tools/patch.py`; tunable numbers go through `Tune.n()` and the `?tune` panel; work items are handed out with `tools/TASK_CARD.md`.

Still to build when the phase that needs them starts (so they are shaped by real use, not guessed): one settings table that drives the settings menu, saved values and defaults (Phase 8d, also used by the FOV slider in 8a); a sound table of names and parameters (Phase 8b); effect presets with per-tier limits (Phase 2.3).

Rule for every item: Low and Potato stay cheap. They only get changes that cost no GPU time (lighting values, baked vertex shading, CSS, springs). Decals, extra particles and post effects are gated by `LOD.fx` / quality tier.

---

## Phase 1: Graphics foundation (about 3 days)

| # | What | Where | Effort |
|---|------|-------|--------|
| 1.1 | Warm, stronger sun; cooler, weaker sky fill tinted by the ground colour, per theme. Today the sun is plain white and nearly as strong as the fill, so everything is flat. | `buildWorld` in `js/03-world.js`, lights in `js/02-render-audio.js` | 0.5 |
| 1.2 | Baked shading in the world batch: darker near the ground and under eaves, top-to-bottom gradient on walls, slight colour variation per face. Free at runtime; the main upgrade for Low/Potato. | `P()` / `Batch.add` in `js/03-world.js`, `js/03a-art-direction.js` | 1 |
| 1.3 | Bloom that actually shows: threshold 1.35 → about 1.05, glow gain 1.4 → 2–2.5, muzzle flash, tracers and monster eyes pushed above 1 on HDR tiers. | `js/02b-post.js` | 0.5 |
| 1.4 | Stop the effect chain being rebuilt on every resize and auto-quality step (causes hitches): resize targets in place. | `Post.size` / `build` in `js/02b-post.js`, `Q.refit` in `js/11-main-loop.js` | 0.5 |
| 1.5 | Shadow bias scaled to shadow map size (less acne on Medium, less floating shadows on Ultra). Drop the unused MSAA buffer on composer tiers. | `js/02c-light.js`, `js/02-render-audio.js` | 0.5 |

Later, done carefully behind a setting: proper colour management and tone mapping (sRGB output, linear colours, filmic rolloff). Highest ceiling, but every map needs retuning (1–2 days). Phong for the world batch on High/Ultra so the muzzle light and flashlight stop looking blotchy.

## Phase 2: Combat feel (about 4.5 days)

| # | What | Where | Effort |
|---|------|-------|--------|
| 2.1 | Monster hordes: build up speed, push apart from neighbours, spread out to surround instead of queuing; face where they walk, lean into turns. | `steer()`, `monStep` in `js/06-game-modes.js`, `poseMon` in `js/04-models.js` | 1.25 |
| 2.2 | Hit reactions: flinch toward the hit direction, stagger on big hits, head snap on headshots. | `hurtE` in `js/06-game-modes.js`, `poseMon` | 0.5 |
| 2.3 | Tracers become a streak that flies from the gun; impacts throw sparks and dust along the surface; pooled bullet marks; whizz sound when bot shots pass close. | `Fx.tracer` in `js/02-render-audio.js`, `Gfx.impact`, `botShot` | 1.25 |
| 2.4 | Kill feedback: short hit-stop on kills, hitmarker pop, kill tick, small FOV kick on fire. | `Death.frame`, `js/07-actions-update-hud.js`, `updateCamera` | 0.5 |
| 2.5 | Player feel: hold-to-crouch when slow, friction slide that can be jump-cancelled, separate acceleration/stopping/turn-around rates, spring-based landing and recoil camera, FOV widening on sprint and slide. | `movePlayer`, `updateCamera` in `js/05-player-input.js` | 1 |

Shared helper: one `spring(state,target,stiffness,damping,dt)` used for recoil, landing, flinch, torso lag and camera.

## Phase 3: Bots and cover (about 3.5 days)

| # | What | Where | Effort |
|---|------|-------|--------|
| 3.1 | Bot and remote-player feet stop sliding (walk cycle driven by distance, like monsters). | `poseHuman` in `js/04-models.js` | 0.5 |
| 3.2 | Directional walk/run: legs follow movement, torso follows aim. | `poseHuman` | 0.5 |
| 3.3 | Crouch and cover poses with lowered hit boxes. | `poseHuman`, hit tests | 0.5 |
| 3.4 | Cover-seeking bots: find spots behind walls the player can't see through, hide, peek, burst, duck back; retreat to cover when hurt. One bot evaluated per frame. | `botStep` in `js/06-game-modes.js` | 1.5–2 |
| 3.5 | Bots shoulder the gun before firing (a readable tell) and visibly reload. | `poseHuman`, `armIK` | 0.5 |

## Phase 4: Third person in every offline mode (about 3–4 days)

Today third person exists only in Parkour (V), with an empty-handed body.

1. V works in Monster Rush, bot matches and levels; online and Custom Battles later (0.5).
2. The body holds the current gun, turns with your aim, kicks and flashes when firing (0.5–1).
3. Shoulder camera: shoulder swap key with auto-swap, closer when aiming (true scopes switch to first person), several wall checks so it stops clipping, body fades when the camera is too close, lower when crouched (1).
4. Shots go where the crosshair points: ignore anything between camera and player; if the gun itself is blocked, show where the shot hit the wall (0.5).
5. Hide the first-person gun and skip its render pass; tracers and muzzle flash start from the body's gun (0.5).
6. Your own body must not block your shots; it casts shadows and gets rim light; Blackout flashlight from the head; phone view button; simple reload pose.

Third person sees over cover that bots can't, so it stays offline-only.

## Phase 5: Realistic bullets and better scopes (about 7.5 days)

Bullets (about 4 days):
1. Pooled flying bullets stepped every frame with a ray over each segment (1).
2. Per gun class: pistols, SMGs and shotguns instant within 25 m, flying beyond; rifles fast with slight drop; snipers about 0.3 s travel and 25 cm drop at 70 m; railgun instant and piercing; plasma slow visible bolts (0.5).
3. Tracers travel with the real bullet (0.5).
4. Thin cover can be shot through at reduced damage; shallow hits on metal ricochet as a spark (1).
5. Damage falloff by distance travelled (0.25).
6. Bots use the same bullets and lead moving targets by difficulty, so their shots can be dodged (0.5).
7. Online: the shooter still decides hits; others see a visual copy; flight time capped at 0.5 s (0.5).

Scopes (about 3.5 days):
1. Scope picture gets the same colour grade and smoothing as the main view (0.5).
2. Scope shadow ring that shifts with sway and closes in when raising the scope (0.5).
3. Scoped sway, Shift to hold breath for 3 s, crouch halves sway (0.5).
4. Range marks computed from each gun's bullet drop, plus a distance readout (0.5).
5. Mouse-wheel zoom levels on sniper scopes (0.5).
6. Glint on enemy snipers aiming at you (0.5).
7. Scope resolution per tier; Potato updates the scope every other frame (0.5).

Order inside the phase: bullets 1–3, scopes 1–2, then scope 4 (needs the drop numbers).

## Phase 6: HUD, maps and atmosphere (about 4 days)

1. HUD: health bar with a delayed "damage ghost", ammo pulses and turns red when low, reload ring on the crosshair, damage-direction arcs, floating damage numbers, kill feed and streak banner. Animations off under `body.lite` (1).
2. Maps: waist-high and head-high cover placed along lanes, one landmark per level, more height variation, accent lights and ground decals (2).
3. Atmosphere on Medium and up: fake light shafts toward the sun, stronger ground haze per theme, drifting cloud shadows on the ground (1).

## Phase 7: More movement and animation polish (about 5 days)

- Monsters: lunge with a dodgeable tell; a gait per monster type (fast ones lean, heavy ones shake the camera); deaths vary by weapon (shotgun knocks back, headshot drops); spawns with dirt and a roar; boss leap with squash, arc and landing shake.
- Player: air-strafe redirect, physical mantle (pitch dip, hand sound), head-bob strength setting (and less bob while scoped).
- Bots: torso lag and shoulder kick per shot, idle weight shift and head scans; remote players get the same poses.

## Phase 8: Small details

S = under half a day, M = about a day, L = 2+ days. Ranked by impact per effort.

**8a. First day (all S, felt immediately)**
- FOV slider 60–100 instead of the hard-coded 75 (`updateCamera`, `js/06-game-modes.js`, settings page).
- Low-health state under 30 hp: heartbeat, muffled sound, desaturated colour, red edge pulse (`hit()`, `look()` in `js/02b-post.js`).
- Kill confirm: distinct two-note sound (higher on headshots), crosshair X pop (`hurtE`).
- Last-rounds and empty cues: rising pitch on the last 5 rounds, a "mag empty" clack (`fire()`).
- Wave stingers: riser before a wave, chord on clear, quiet beat before the boss (`nextWave`).

**8b. Audio**
- Stereo positioning for world sounds, so bot shots and monsters can be located (`snd`/`gunSnd` in `js/02-render-audio.js`). M
- Muffled sound when the source is behind walls. S after the above.
- Music that builds with the wave: calm between waves, full during, extra layer for bosses and low health. M
- Per-map reverb (open field, stone hall, cave). M
- Footsteps that change by surface (grass, stone, wood, metal). S
- Separate UI sounds for open, close, confirm, error and purchase. S

**8c. Game feel**
- Pickup feedback: magnet pull, pop on collect, "+30 ammo" line by the ammo counter. S
- Weapon swap with weight-based lower/raise timing and holster/draw sounds. S
- Level-up banner with chord and particles; quest-complete card sliding in with the reward; XP bar overshoot. M

**8d. Accessibility and settings**
- Colour-blind presets for enemy colours and telegraph rings, plus a crosshair colour picker. M
- One comfort switch that turns off camera shake, head bob, FOV kick and screen flashes. S
- Sensitivity shown as cm per 360°, separate scoped multipliers, option to turn off the slow-down over targets. S
- Settings grouped with one-line explanations, live frame rate and active auto tier, "reset to recommended". S
- Key rebinding with conflict detection. M–L

**8e. World life (gated by quality tier)**
- Wind sway on trees and grass (vertex shader, off on Potato). M
- Flickering lamps and fires with crackle sounds. S
- Ambient birds, fireflies or butterflies by theme; crows that scatter on gunfire. M
- Weather per theme (rain, snow) with ambience and wet-ground darkening. M
- Slow day-night drift over a match. M

**8f. Menus and loading**
- Consistent 150–200 ms page transitions, hover lift and pressed states on buttons. S–M
- Loading screen with real progress, map name and a control tip. S
- Lower input latency: low-latency canvas where supported, coalesced mouse events. S

---

## Totals and suggested order

| Phase | Days | Why this order |
|-------|------|----------------|
| 1 Graphics foundation | 3 | Biggest visual jump, cheap, helps every later screenshot |
| 2 Combat feel | 4.5 | Most of the "feels better" gain |
| 3 Bots and cover | 3.5 | Needs the crouch from phase 2 |
| 4 Third person | 3–4 | Reuses body poses from phase 3 |
| 5 Bullets and scopes | 7.5 | Bots leading shots pairs with cover AI |
| 6 HUD, maps, atmosphere | 4 | |
| 7 Movement polish | 5 | |
| 8 Small details | about 12 | 8a can be slotted in early; it is one day of quick wins |

About 43–44 days of work as first estimated; with the tooling, expect roughly 28–30. Each phase ends with `npm run finish` passing, the picture changes reviewed in `shots/report.html` and approved, a commit, and a push only with your OK.
