# Blokus Online — Product Requirements Document

## 1. Vision

A frictionless, mobile-first Blokus app for friends to play asynchronously over hours or days. You open it, take your turn, close it. The other player gets notified, takes theirs whenever. No scheduling, no real-time coordination, no app store. One link, one tap, you're playing.

Quality bar: chess.com-level polish — clear board, satisfying piece placement, instant feedback. If a friend opens it on their iPhone in line at a coffee shop, they should be able to take their turn in under 15 seconds.

## 2. Target user & use case

**Primary user**: A casual board-game-loving adult on a phone who wants to play with 1–3 specific friends, not strangers. They are not waiting around in the app; they pop in, move, leave.

**Primary device**: iPhone or Android phone in portrait. Desktop is a secondary supported surface (same web app, wider layout), not the design target.

**Primary scenario**: I see a "Marno played a piece — your turn" notification, tap it, see the board, drag a piece, place it, close the app. 10 seconds, done.

## 3. Game formats supported

| Format | Board | Players | Default? |
|---|---|---|---|
| **Blokus Duo** | 14×14 | 2 | ✅ Yes — fits one phone screen comfortably |
| **Classic Blokus** | 20×20 | 4 | Optional — for "we have a group chat" play |

Each player has 21 pieces (same set across formats). Duo starting cells: (4,4) and (9,9). Classic starting cells: the four corners.

3-player variant: out of scope for v1.

## 4. Core UX decisions

### 4.1 Board view: 2D top-down

Drop three.js. The board is a flat grid of square cells rendered in CSS Grid (or SVG for snappier large-scale rendering). Reasons:

- Every cell is the same size and trivially tappable.
- No grid-vs-surface alignment bugs.
- Pieces are crisp colored squares with subtle rounded corners and a 1px inner highlight — readable at any zoom.
- Pinch-to-zoom + pan via standard CSS `touch-action: pan-x pan-y; transform: scale()` (or a small library like `react-zoom-pan-pinch`).

Visual style reference: chess.com board on mobile. Dark background, light grid lines, vibrant piece colors. Each player's starting cell is marked with a colored dot until the first piece is placed there.

### 4.2 Placement: drag from tray, ghost above finger, lift to confirm

The most important interaction in the entire app. Specs:

1. **Tray** (bottom of screen): horizontally scrollable strip of the player's remaining pieces, filtered by size tab (see §4.3). Each piece is rendered as a small colored polyomino, ~44×44pt minimum hit area.
2. **Pick up**: `pointerdown` on a piece → tray piece dims (visual cue: "this is in your hand"), and a **floating ghost** appears anchored to the touch point but offset **60pt above the finger** so the user can see the cells they're hovering.
3. **Drag**: as the user moves their finger across the board, the ghost snaps its anchor cell to the nearest valid grid cell. The ghost is colored:
   - **Green tint + solid border** when placement is legal.
   - **Red tint + dashed border** when illegal (overlap, edge-touch own color, no diagonal contact, off-board, first-piece-not-on-start).
4. **Rotate / flip during drag**: floating action buttons (↻ rotate, ⇔ flip) appear pinned to the bottom-left and bottom-right of the screen during a drag. Tap to transform the piece in-flight without dropping it.
5. **Drop**:
   - On a **legal** cell: piece commits with a brief snap-and-bounce animation. Move broadcast to server. Tray piece removed.
   - On an **illegal** cell: piece flies back to its tray position, no move sent.
6. **Cancel**: drag the piece back into the tray and lift, OR tap a "cancel" button. No accidental commits.

Desktop: same model with mouse drag. Shortcut keys R / F / Esc still work.

### 4.3 Piece filter: size tabs

Tabs at the top of the tray: **1 · 2 · 3 · 4 · 5**, with a count badge per tab (e.g. "5 (12)" = size 5, 12 remaining). Default tab on game start: 5 (highest-value pieces, played first per Blokus strategy). Tab persists across turns.

A subtle "(12 of 21 remaining)" total indicator next to the player color dot.

### 4.4 Layout (portrait phone, ~375×812pt baseline)

```
┌───────────────────────────────┐
│ ← Game      You · 18 left   ⋯ │  44pt — top bar
├───────────────────────────────┤
│ 🔵 Marno  vs  🟡 You          │  36pt — score / turn strip
├───────────────────────────────┤
│                               │
│                               │
│                               │
│        BOARD (square)         │  flex; pinch-zoom; pan
│        ~375×375pt             │
│                               │
│                               │
├───────────────────────────────┤
│ [1] [2] [3] [4] [⬤5]          │  32pt — size tabs
│ ▭ ▬ ▦ ▩ ▤ ▣ ▥ ▧ ▨ ▷           │  90pt — piece tray (h-scroll)
│             [Pass]            │  44pt — pass button
└───────────────────────────────┘
```

Total chrome above/below board: ~250pt. Board fills the rest. On a small phone (iPhone SE), board is ~340×340pt — still very playable.

### 4.5 Turn indicator

When it's your turn the score strip pulses a soft glow in your color. When it's the opponent's turn, their name is dimmed less (active) and yours is dimmed more. No popup, no banner — quiet and unmistakable.

When the game is finished, a single full-screen modal shows scores, with "Rematch" and "New game" buttons.

## 5. Async + identity model

### 5.1 Identity

Username + display name, stored in `localStorage`. No password. Server issues a long random `playerToken` on first launch and stores it server-side keyed by username.

**Trade-off acknowledged**: clearing browser storage or switching devices loses your games. To mitigate:

- **Recovery code**: when you create your account, the app shows a 6-word recovery code (e.g. `apple-tiger-cloud-mint-river-stone`). Users are encouraged to screenshot it. Entering it on another device transfers the identity. Stored as an optional, hashed field server-side.
- This stays simple: no email infra, no SMS, no OAuth. Users who want durability copy down 6 words.

### 5.2 Joining a game

Host taps "New Game", picks Duo or Classic, gets a shareable URL like `blokus.app/g/AB7K2`. Sends to friend(s) via iMessage / WhatsApp / Discord. Friend opens link → sets display name on first launch → joins.

Game starts when host taps "Start" once required players are present. Anyone can leave the app; the game is durable.

### 5.3 Async game state

Server holds all game state in a real database (Postgres). Game state survives server restarts and player disconnects. There is no "live session" anymore — every action is a stateless API/socket call against persistent state.

A game has lifecycle: `waiting → active → finished → archived (after 30 days)`.

## 6. Notifications

### 6.1 Channel: Web Push (PWA)

- Requires the app to be **added to home screen** as a PWA on iOS 16.4+ (system limitation; we cannot work around it). Android Chrome supports web push without install.
- On first turn-completion, app shows a one-time prompt: *"Get notified when it's your turn?"* with "Yes" / "Not now". On Yes: register service worker subscription, send subscription to server.
- Server sends push when turn changes to a player who has a subscription.

### 6.2 Notification content

```
Title:  Your turn in Blokus
Body:   Marno played the L-piece. 18 pieces left.
Tap →   opens the app directly to that game
```

Quiet hours respected — server batches and delays pushes between 10pm–8am in the recipient's timezone (sent in the morning).

### 6.3 Fallbacks for non-installed users

If a player has not enabled push, the in-app turn-indicator is the only signal. Acceptable for v1 — the install prompt is non-blocking but persistent.

## 7. Technical architecture

### 7.1 Stack

| Layer | Choice |
|---|---|
| Client | React + Vite, **no three.js**. CSS Grid board. PWA via `vite-plugin-pwa`. |
| State | Zustand (client) |
| Realtime | Socket.io for in-session updates when both online |
| Persistence | Postgres (Render Postgres free tier or Neon) |
| Push | Web Push protocol with VAPID keys; `web-push` npm package |
| Hosting | Render (current) — single web service serving client + API |

### 7.2 Data model (Postgres)

```sql
players (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  player_token TEXT UNIQUE,          -- bearer auth
  recovery_code_hash TEXT,           -- bcrypt of 6-word phrase
  created_at TIMESTAMPTZ
)

push_subscriptions (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ
)

games (
  id TEXT PRIMARY KEY,               -- short shareable code
  format TEXT,                       -- 'duo' | 'classic'
  status TEXT,                       -- 'waiting'|'active'|'finished'
  current_turn INT,                  -- player index
  board JSONB,                       -- 14x14 or 20x20 grid
  remaining_pieces JSONB,            -- per-color piece arrays
  scores JSONB,
  pass_count INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

game_players (
  game_id TEXT REFERENCES games,
  player_id UUID REFERENCES players,
  color TEXT,                        -- 'blue'|'yellow'|'red'|'green'
  seat INT,
  PRIMARY KEY (game_id, player_id)
)

moves (
  id BIGSERIAL PRIMARY KEY,
  game_id TEXT REFERENCES games,
  player_id UUID REFERENCES players,
  piece_id TEXT,
  rotation INT,
  flipped BOOL,
  row INT,
  col INT,
  played_at TIMESTAMPTZ
)
```

### 7.3 API surface

REST for state, Socket.io for realtime nudges only.

```
POST  /api/players                  create username + return token + recovery code
POST  /api/players/recover          exchange recovery code → token
POST  /api/games                    create game (format)
POST  /api/games/:id/join           join via shareable code
POST  /api/games/:id/start
POST  /api/games/:id/move           place piece (validated server-side)
POST  /api/games/:id/pass
GET   /api/games/:id                full game state
GET   /api/me/games                 list my active + recent games
POST  /api/push/subscribe           register push subscription
```

Socket.io events: `game:updated` (fires when any player moves; clients in the room re-fetch or get patch).

## 8. Phased rollout

### Milestone 1 — "It works on my phone" (1 week)

- Replace three.js with 2D CSS Grid board.
- Implement drag-from-tray placement with ghost-above-finger.
- Size tabs in tray.
- Mobile-first portrait layout.
- Keep current in-memory server (no DB yet).
- Ship to Render, validate on a real iPhone with a friend.

**Exit criteria**: Two people on iPhones can complete a Duo game start to finish without confusion.

### Milestone 2 — "Async works" (1 week)

- Postgres + data model above.
- Persistent identity (username + token + recovery code).
- Game state survives restarts.
- Game listing screen ("Your games").
- Shareable game URLs.

**Exit criteria**: A game can be paused for 24h on one device and resumed on another.

### Milestone 3 — "Notifications" (3–5 days)

- PWA manifest + service worker + install prompt.
- Web Push subscription flow.
- Server sends push on turn change.
- Quiet hours.

**Exit criteria**: A friend gets a tap-to-resume notification on their phone within 30s of the opponent's move.

### Milestone 4 — "Polish" (ongoing)

- Move history / replay.
- Animations (piece snap, score tick).
- Sound effects (optional, off by default).
- 4-player Classic UX refinement (tabs split into 4 corners maybe).
- Accessibility: VoiceOver labels, sufficient color contrast, alternative pattern fills for colorblind users.

## 9. Success metrics

- ≥80% of started Duo games are completed (not abandoned mid-game).
- ≥60% of players who play a first game return for a second within 7 days.
- p50 turn-time on mobile (open notification → submit move) ≤30s.
- Zero placement errors due to UI ambiguity (measured via a "this didn't go where I wanted" feedback button).

## 10. Explicitly out of scope (v1)

- Matchmaking with strangers / public lobbies.
- Spectator mode.
- ELO / ranking.
- Tournaments.
- AI opponents.
- 3-player variant.
- Replay export / sharing animated GIFs.
- Native iOS/Android apps (revisit if PWA validates).
- Real-money or in-app purchases.

## 11. Known risks

| Risk | Mitigation |
|---|---|
| iOS Web Push only works after PWA install | Persistent in-app install prompt; clear "tap share → add to home screen" tutorial on iOS |
| Device-bound identity loses games on storage clear | Recovery code shown at signup; encourage screenshot; consider optional email backup in v2 |
| Render free tier cold starts (~30s) | Acceptable for async (notification → user wakes app, brief loading spinner). Monitor; upgrade to paid $7/mo if it hurts |
| Drag-and-drop edge cases on iOS Safari | Use Pointer Events API uniformly; test on real device every milestone, not just simulator |
| Postgres connection limits on Render free | Use a connection pool (`pg-pool`), keep concurrent open queries low |
