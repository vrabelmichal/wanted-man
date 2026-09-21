# Wanted Man

A deliberately over-serious, song-synchronized fugitive tracking dashboard inspired by Johnny Cash's **Wanted Man**.

As the song plays, the site progressively:

- highlights states where Johnny is wanted;
- drops city markers for specific wanted locations;
- distinguishes possible whereabouts from confirmed wanted jurisdictions;
- adds named people to a "Who wants Johnny" case list;
- accumulates tongue-in-cheek operational intelligence;
- traces the Shreveport → Abilene mystery and marks the unknown halfway town;
- reconstructs the entire UI from the current playback time, so seeking backwards works correctly.

The default embedded recording is the official Johnny Cash YouTube upload of the *Little Fauss and Big Halsy* studio version.

## Development

```bash
npm install
npm run dev
```

Run checks with:

```bash
npm test
npm run build
```

## Synchronization

Cue times live in `src/timeline.ts`. The first pass is intentionally easy to calibrate because tiny timing differences can occur between releases or YouTube prerolls.

At runtime, use **Sync a little off? Calibrate** below the player to adjust the cue offset. A positive offset makes visual cues happen earlier relative to the audio; a negative offset makes them happen later.

You can also override defaults when building:

```bash
VITE_YOUTUBE_VIDEO_ID=O6JWXqE8W9E VITE_CUE_OFFSET_SECONDS=0 npm run build
```

## Implementation notes

The UI never relies on one-shot timers. It derives visible state from the YouTube player's current playback time. That makes pause, seek, replay, and refresh behavior deterministic.

The project does not render the song's lyrics. YouTube supplies the audio/video while the app renders its own geographic and comedic interpretation.
