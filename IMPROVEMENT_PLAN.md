# Arena Strike 3D: improvement plan

Built from code reviews by Fable 5.2 (November 2026). Phase 1 is done.
The effort numbers inside each phase are only relative sizes, from the first estimate in human working days. Real pace: Phase 1, estimated at 3 days, was built, checked and committed in one burst of about 15–20 minutes of agent work. The Totals table below gives agent time per phase on that basis. The real limit is your play-testing and decisions (how combat feels, which logo), not building time.

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

Later: filmic tone mapping on top of the colour management that Phase 1b brings. (Phong for the world batch is no longer needed after Phase 1b.)

## Phase 1b: Upgrade Three.js from r128 to a current release (about 2–4 days)

Done now, before Phase 2, so later effects and lighting are tuned only once.

| # | What | Where | Effort |
|---|------|-------|--------|
| 1b.1 | Loading: current Three.js ships only as an ES module. Pin one recent release, vendor it locally, and add a small module loader that imports it, sets the global `T`/`THREE`, then loads the existing classic scripts in their current order. No build step. | `index.html`, new loader in `js/`, `vendor/` | 0.5 |
| 1b.2 | Post-processing: replace `vendor/three-r128/*` (Copy, LuminosityHighPass, FXAA, SAO, DepthLimitedBlur, UnpackDepthRGBA, SMAA) and the composer/passes with the matching addons from the same release; add the output pass. Retune bloom and SAO. | `js/02b-post.js`, `vendor/` | 0.75 |
| 1b.3 | Colour and light: adopt the new colour management and physically based light intensities (legacy mode is gone since r165). Retune sun, fill, hemisphere, point/spot lights, fog, mist and the Phase 1 values on every map with the screenshot diff until each map looks as good or better than before. | `js/02c-light.js`, `js/02-render-audio.js`, `js/03-world.js`, theme tables | 1–1.5 |
| 1b.4 | Shader patches: check and fix the four `onBeforeCompile` patches and the custom `ShaderMaterial`s against the new shader chunks. | `js/03-world.js`, `js/08-parkour-radar.js`, others found by grep | 0.5 |
| 1b.5 | Clean-up: remove APIs that were renamed or dropped, confirm the viewmodel pass, scopes, sprites, instancing and shadows on every tier. Re-record `npm run perf` only for intended changes. | all | 0.5 |

What it brings: per-pixel shading on Lambert materials (the muzzle flash and flashlight stop looking blotchy without switching to Phong, which removes that later item), better shadows, proper colour management as the default instead of a risky later extra, batched drawing of identical props, and a maintained library.
Cost: current releases need WebGL 2, so very old WebGL-1-only devices can no longer run the game. Show a clear message on those devices instead of a blank screen.

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

## Phase 9: Phones and touch screens (about 7 days)

What exists today (`touchUI` in `js/11-main-loop.js`, `js/00-mobile.js`, `css/mobile.css`): a floating left joystick, a right-side look area, about 15 buttons, light vibration, fullscreen with landscape lock on first touch, a "turn your phone sideways" screen, and the `SOFT` low-power path. Main gaps: the joystick is on/off (it presses W/A/S/D) instead of analog, aiming with a thumb has no help, the layout is fixed, and iPhones can't go fullscreen from Safari.

**9a. Testing first (S)**
- `npm run shots` and `npm run smoke` get phone runs: landscape 844x390 and 932x430 plus a small 667x375 screen with `?touch=1`. They check that no buttons overlap each other or the HUD, every button is at least 44 px and inside the safe area, and that each mode plays with touch input. Pictures of the HUD go into the report.
- A way to open the local server on a real phone over Wi-Fi, for feel checks.

**9b. Aiming and movement (the biggest gain)**
- Analog joystick: speed follows how far the thumb pushes; push past the ring to lock sprint. M
- Touch aim assist: aim slows near enemies, gently follows a moving target while you drag, and snaps lightly onto a close target when AIM is pressed. Strength set by difficulty and a setting; off online, or kept the same for everyone. M
- Look curve for thumbs: small drags precise, fast swipes turn quickly; separate horizontal, vertical and aiming sensitivity. S
- Optional auto-fire: shoots when the crosshair is on an enemy, for one-thumb play. S
- Optional gyro aiming (tilt the phone to fine-tune aim); iOS asks for permission on first use. M

**9c. Layout and buttons**
- Layout editor: drag and resize every button, opacity slider, left-handed preset, reset; saved per device. M
- Fewer buttons on screen: reload happens automatically when empty, swipe up on the right side to jump and down to crouch/slide, mode-only buttons appear only in their mode, rarely used ones (emote, scoreboard, map) move into one small menu. S
- Clearer press feedback (button pop, ring on fire), and a HUD size setting for small phones. S

**9d. Phone performance and battery**
- Phones start one tier lower and the auto tier also lowers render resolution first; 30 / 60 frame cap option; "battery saver" switch (30 fps, Potato effects). S
- Pause and free the GPU when the app is in the background or the phone locks; resume cleanly. S
- Check memory: texture sizes and shadow maps on phones, so iOS does not reload the page. S

**9e. iPhone and Android details**
- Add-to-home-screen app (manifest, icon, landscape, standalone) so iPhones get true fullscreen; a one-time hint explaining it on iPhone. S
- Sound starts on the first touch on iOS; no text selection, long-press menus or double-tap zoom during play; notch and home-bar safe areas everywhere. S
- Vibration on hits, kills and damage on Android (iPhones don't support vibration in the browser). S
- Game controller support (Gamepad API) for phones and tablets with a controller. M

**9f. Menus on phones**
- Larger tap targets, menus that fit short landscape screens and also work in portrait, bottom sheets instead of small pop-ups, readable text sizes. M

Order: 9a first, then 9b and 9d (they decide how it feels), then 9c, 9e and 9f. Phase 4's third person gets a phone view button there; Phase 8d's settings table holds the touch settings.

## Phase 10: Logo, branding and outdated UI (about 6 days)

What looks dated today, from screenshots of the title screen and lobby:
- The logo (orange hexagon, white A with a lightning bolt) reads as a generic app icon and has no matching wordmark.
- The name appears three ways: "Arena Strike 3D", "ARENA.STRIKE" and "Arena Strike logo".
- `index.html` declares two favicons (the SVG file and an inline one that overrides it), and the canonical URL may point to an old address.
- The title screen has an unrelated "Case opening" card in the middle, and the "Beta Version 1.6" label is almost invisible.
- Every panel uses the same frosted-glass style, so nothing stands out. Many small uppercase spaced-out labels. Nav icons come from mixed sources.
- The lobby has 11 nav buttons in one long list, a plain two-column text list of modes, and a sunglasses glyph as the profile picture.

**10a. Audit (S).** `npm run shots` also captures every menu page (title, lobby, shop, loadout, battle pass, index, quests, leaderboard, settings, pause, end card, HUD, power-up picker) on desktop and phone sizes, so every later step has before/after pictures.

**10b. Logo and name (M).**
- New logo mark plus a wordmark that still reads at 16 px. Pick one name and use it everywhere.
- Regenerate the favicon, apple-touch icon, 192/512 and maskable manifest icons, and a social preview image. Remove the duplicate favicon and check the canonical URL.
- Show 2–3 directions as pictures and choose before building.

**10c. Title screen (S).** A logo lockup with a short intro motion, a readable version label and a clear "press to start". Move case opening off the title screen.

**10d. Type, colour and surfaces (M).**
- A heading font next to Outfit and a small type scale.
- Colour tokens.
- Two or three panel levels (main, secondary, inline) instead of one frosted style everywhere. Fewer uppercase eyebrow labels.
- Heavy blur only where it helps, and none under `body.lite` or on phones.

**10e. One icon set (S).** Matching SVG icons with one stroke weight for the nav, HUD, touch buttons and settings.

**10f. Lobby (M).**
- Nav grouped into Play / Collection / Progress / Social / Settings.
- Modes as cards with a picture per mode and a clear online tag.
- A profile card that shows your character instead of a glyph.

**10g. Remaining pages (M–L).** Bring the shop, loadout, battle pass, end card, pause, settings and HUD in line with 10d and 10e.

Rules: each step ships with before/after pictures from 10a, works on phones (Phase 9 sizes), and keeps Low/Potato menus cheap. Use the design skills (`impeccable`, `unslop`) and ask Fable for the look. This phase only touches HTML/CSS/UI files, so it can run alongside the gameplay phases. Do 10b (the logo) first: everything else takes its colours from it.

---

## Totals and suggested order

| Phase | Agent time | Needs from you | Why this order |
|-------|-----------|----------------|----------------|
| 1 Graphics foundation | done (~20 min) | | Biggest visual jump, cheap, helps every later screenshot |
| 1b Three.js upgrade | 45–60 min | a look at the before/after pictures | Before more effects are added, so lighting is retuned once |
| 2 Combat feel | 30–45 min | play-test and tune with `?tune` | Most of the "feels better" gain |
| 3 Bots and cover | ~30 min | play-test | Needs the crouch from phase 2 |
| 4 Third person | ~30 min | play-test | Reuses body poses from phase 3 |
| 5 Bullets and scopes | 45–60 min | play-test sniping | Bots leading shots pairs with cover AI |
| 6 HUD, maps, atmosphere | ~30 min | pictures | |
| 7 Movement polish | ~30 min | play-test | |
| 8 Small details | 1.5–2 h, in batches | settings and sound checks | 8a is ~10 min of quick wins and can go early |
| 9 Phones and touch | ~1 h | feel test on your phone | 9a and 9b can start any time; different files from Phases 2–7 |
| 10 Logo, branding, UI | ~1 h | pick a logo direction | Menus and CSS only, so it runs alongside gameplay phases; logo first |

About 8–10 hours of agent work in total, fewer in wall time when the separate-file phases (9, 10) run as parallel sessions. Each phase ends with `npm run finish` passing, the picture changes reviewed in `shots/report.html` and approved, a commit, and a push only with your OK.
