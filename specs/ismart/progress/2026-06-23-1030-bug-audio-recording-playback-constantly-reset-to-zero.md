# Bug Fix Progress - audio-recording-playback-constantly-reset-to-zero

## 2026-06-23 10:30 UTC

Bug:
audio-recording-playback-constantly-reset-to-zero

Status:
Ready For QA

Files Changed:
- `apps/web/components/files/audio-input.component.tsx`

Root Cause:
The `handleRecordedAudioTimeUpdate` handler introduced in the previous bug fix had an insufficient guard condition. It reset `audio.currentTime = 0` whenever `duration` was finite and `currentTime > 0` — a condition that is true on every single `timeupdate` tick during normal user playback. This caused an infinite reset loop making the recorded audio unplayable.

Fix Applied:
Added a `durationFixAppliedRef = useRef(false)` boolean ref that tracks whether the one-time phantom-seek workaround has already been applied for the current recording blob.

- `handleRecordedAudioTimeUpdate` now returns immediately if `durationFixAppliedRef.current === true`.
- On the first invocation after the phantom seek, when `duration` becomes finite and `currentTime > 0`, the handler sets `durationFixAppliedRef.current = true` and resets `currentTime = 0` exactly once.
- All subsequent `timeupdate` events (including all normal playback ticks) are ignored via the early return.
- `durationFixAppliedRef.current` is reset to `false` in both `discardRecording` and `switchMode` so each new recording starts with a clean flag.
- The no-op `audio.removeEventListener('timeupdate', () => {})` call was removed from the handler to eliminate dead code.

Implementation Checklist:
- [x] Added `durationFixAppliedRef = useRef(false)` alongside other refs.
- [x] `handleRecordedAudioTimeUpdate` early-returns if `durationFixAppliedRef.current` is true.
- [x] Sets `durationFixAppliedRef.current = true` before resetting `currentTime = 0` to prevent re-entry.
- [x] Removed the no-op `audio.removeEventListener` line.
- [x] `durationFixAppliedRef.current = false` reset added to `discardRecording`.
- [x] `durationFixAppliedRef.current = false` reset added to `switchMode`.
- [x] `handleRecordedAudioMetadata` (duration-display workaround) is unchanged and still functional.
- [x] Upload-mode `<audio>` element is unaffected.
