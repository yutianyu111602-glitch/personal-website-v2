# aidjmix-techniques-v1

- **What**: 20 transition techniques for Techno, logic-only selector returning a `{ technique, hint, reason }`
- **Why**: Front-end can choose a technique compatible with your current djmix flow without changing any port.
- **How**: Extend `TechniqueName`, call `chooseTechnique(ctx)` before `requestAutoPlaylist`, pass `technique` string.

Updated: 2025-08-24 20:09:17

Files:
- `src/console/techniqueSelector.ts` — full selector + hint factories
- `PATCH_TYPES.md` — copy-paste patch for `TechniqueName`
- `INTEGRATION_NOTES.md` — how to wire with djmix
- `dev/techniqueSelector.test.ts` — quick smoke tests
