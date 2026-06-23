# Bug Fix Progress - audio-recording-duration-shows-zero-before-first-play

## 2026-06-23 10:00 UTC

Bug:
audio-recording-duration-shows-zero-before-first-play

Status:
Ready For QA

Files Changed:
- `apps/web/components/files/audio-input.component.tsx`

Root Cause:
`MediaRecorder` produces WebM blobs whose stream header does not contain a total-duration field. When the browser loads such a blob via a `URL.createObjectURL` object URL, it reports `duration = 0` (or `Infinity`) until enough of the stream has been decoded through playback. As a result the native `<audio controls>` player displays `0:00 / 0:00` immediately after recording stops.

Fix Applied:
Added two event handlers to the recorded-audio `<audio>` element only (upload mode player is unchanged):

1. `onLoadedMetadata` (`handleRecordedAudioMetadata`) — fires when the browser first parses the stream header. If `duration` is not finite or is zero, sets `audio.currentTime = 1e100`. This forces the browser to seek to the true end of the stream, causing it to decode the actual duration.

2. `onTimeUpdate` (`handleRecordedAudioTimeUpdate`) — fires after the phantom seek lands. At this point `duration` is finite and `currentTime` reflects the clamped real end. The handler immediately resets `currentTime = 0` so the player sits at the beginning, ready for normal playback.

Additionally, `SyntheticEvent` was imported from React, `audioRef` was added (unused directly by the workaround but kept for future imperative access needs), and the import line was updated accordingly.

Implementation Checklist:
- [x] Imported `SyntheticEvent` from React alongside existing imports.
- [x] Added `audioRef = useRef<HTMLAudioElement | null>(null)`.
- [x] Implemented `handleRecordedAudioMetadata` — seeks to `1e100` when `duration` is zero or non-finite.
- [x] Implemented `handleRecordedAudioTimeUpdate` — resets `currentTime` to `0` once a finite `duration` is available.
- [x] Attached `ref`, `onLoadedMetadata`, and `onTimeUpdate` to the recorded-audio `<audio>` element in JSX.
- [x] Upload-mode `<audio>` element is NOT modified — workaround is scoped to recorded audio only.
- [x] No changes to SCSS, API, or any other file.
