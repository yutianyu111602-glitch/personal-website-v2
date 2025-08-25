# Integration Notes — djmix compatibility

This module is **logic-only** and aligns with your current djmix flow:

- Primary contract: `technique` is a string included in the body of `POST /api/aidjmix/autoplaylist`. Your backend already accepts it, or can safely ignore it.
- Secondary (optional): `hint` is an advisory object (`TechniqueHint`) with beats/EQ/filter/FX/loop/actions. Backend can ignore if not supported.

## How to wire

1) Extend `TechniqueName` (see `PATCH_TYPES.md`).
2) Import the selector and use it **before** calling `AidjPlaylistClient.requestAutoPlaylist`:

```ts
import { chooseTechnique } from './console/techniqueSelector';
import { AidjPlaylistClient } from './clients/AidjPlaylistClient';

const t = chooseTechnique({
  bpmFrom: nowA.bpm, bpmTo: nowB.bpm,
  keyFrom: nowA.keyCamelot, keyTo: nowB.keyCamelot,
  segment: now.segment, vocality: nowA.vocality ?? 0,
  simpleHeadTail, dropoutRate: radio.dropoutRate, recentErrors: 0
});

await client.requestAutoPlaylist(tracks, {
  minutes: 60, beamWidth: 24,
  preset, simpleHeadTail, technique: t.technique
});
// If you want to pass `hint`, you may add a non-breaking field to body: { techniqueHint: t.hint }
// The server can ignore it safely.
```

3) UI (Cursor): show `t.technique`, and list `t.reason[]` as the explanation; optionally visualize `hint.beats` as bars.

## Safety order

`simpleHeadTail` > network/errors conservative > key/vocal constraints > others.

- Double-drop only if compatible Camelot and fast tempo.
- Backspin/Brake are loud effects → hide behind an “Advanced” toggle if desired.
