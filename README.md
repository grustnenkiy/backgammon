# Backgammon

Monorepo for a real-time backgammon game.

## Project Structure

- `shared/`: Game rules engine and shared types.
- `server/`: Socket.IO game server and room management.
- `client/`: React app for local and online play.

## Quick Start

```bash
npm install
npm run dev
```

This starts:

- Client on Vite dev server
- Server with Socket.IO handlers

## Scripts

- `npm run dev`: Run client and server in parallel.
- `npm run build`: Build client and server.
- `npm run test`: Run shared + server tests.
- `npm run format`: Format source files.

## Move Rules (Enforced)

The move validator in `shared/src/getValidMoves.ts` enforces standard two-dice priority rules:

1. If both dice can be played during the turn, the first move must preserve a sequence that allows using both dice.
2. If both dice cannot be played, but each die is individually playable, the higher die must be used.
3. Doubles are handled naturally as repeated single-die moves.

These rules apply consistently to local and online gameplay because both use the shared rules engine.

## Notes

- The server is authoritative for online games.
- Client-side move highlighting also uses the same shared validator, so legal moves match server validation.
