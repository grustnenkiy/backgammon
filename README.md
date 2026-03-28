# Backgammon

A full-stack, real-time backgammon game. Play locally against a friend on the same screen, or create an online room and share the link to play over a network.

## Tech Stack

| Layer | Technology |
|---|---|
| Client | React 19, React Router 7, Vite, TypeScript |
| Server | Node.js, Express 5, Socket.IO 4, TypeScript |
| Shared | Pure TypeScript — game rules engine and types |
| Monorepo | npm workspaces |
| Tests | Vitest |
| Formatting | Prettier |

## Project Structure

```
backgammon/
├── shared/        # Game rules engine, types, unit tests
├── server/        # Socket.IO server, room store, game handlers
└── client/        # React app — local and online game screens
```

### `shared/`
Contains the portable rules engine used by both client and server:
- `types.ts` — `GameState`, `Move`, `Point`, `BarState`, `BorneOffState`, `RoomState`
- `createInitialGameState.ts` — standard starting position (15 checkers per player)
- `applyMove.ts` — immutable state update: moves checkers, handles hits, bearing off, detects winner
- `getValidMoves.ts` — legal move generator with full two-dice priority rules and bearing-off logic

### `server/`
- `src/index.ts` — Express + Socket.IO server on port `3001` (configurable via `PORT` env var)
- `src/rooms/roomStore.ts` — in-memory room store (create, join, leave, lookup)
- `src/socket/registerGameHandlers.ts` — game event handlers: `create_game`, `join_game`, `roll_dice`, `move_checker`, `disconnect`

### `client/`
- `src/app/router.tsx` — two routes: `/` (home) and `/game/:roomId`
- `src/pages/HomePage` — choose local or online play; online creates a room and navigates to its URL
- `src/pages/GamePage` — routes `roomId=local` to the local screen, anything else to the online screen
- `src/features/game/hooks/useLocalGame.ts` — local two-player game state (both players share one browser)
- `src/features/game/hooks/useOnlineGame.ts` — online game state via Socket.IO
- `src/components/Board` — renders all 24 points, bar, and borne-off tray; highlights selected point and valid destinations

## Quick Start

**Prerequisites:** Node.js ≥ 18

```bash
# Install all workspace dependencies
npm install

# Start client (Vite on :5173) and server (:3001) in parallel
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client and server in parallel |
| `npm run build` | Build client (Vite) and server (tsc) |
| `npm test` | Run shared + server test suites |
| `npm run format` | Prettier-format all source files |

## Environment Variables (server)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the server listens on |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## Online Play Flow

1. Player A clicks **Play Online** → server creates a room, client navigates to `/game/<roomId>`
2. Player A copies and shares the URL with Player B
3. Player B opens the URL → joins the room as the second player, game starts
4. Each player sees only their own **Roll Dice** button when it is their turn

## Move Rules (Enforced)

The move validator in `shared/src/getValidMoves.ts` enforces standard backgammon two-dice priority rules:

1. **Use both dice when possible.** If a first move exists that allows the second die to be played, only those first moves are offered.
2. **Play the higher die when only one can be played.** If each die is individually playable but not both together, only moves using the higher die are offered.
3. **Doubles** give four moves of the same value and are handled naturally — no special-casing needed.
4. **Bar entry is mandatory** — a player with checkers on the bar must enter them before making any other move.
5. **Over-roll bearing off** — a checker may bear off with a higher die than its exact distance only if no checker in the home board sits farther from the exit.

These rules run identically on client (for live highlighting) and server (for authoritative validation).

## Game Behaviour Notes

- If a player rolls and has **no legal moves** (e.g. all bar entry points are blocked), the dice are shown to both players for 2.5 seconds with a "No valid moves — turn passes" notice before the turn switches automatically.
- The server is **authoritative** for online games — all moves are re-validated server-side before being applied.
- Rooms are held **in memory**; they are cleaned up when both players disconnect.
- A **maximum of two players** can join a room. A third connection attempt receives an error.
