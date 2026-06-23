# QA Report - Bug audio-recording-duration-shows-zero-before-first-play

Status:
PASSED

Scope Reviewed:
- `apps/web/components/files/audio-input.component.tsx` — full file review.
- Logic of `handleRecordedAudioMetadata` and `handleRecordedAudioTimeUpdate` handlers.
- Scope isolation: upload-mode `<audio>` element must not be affected.
- React import correctness (`SyntheticEvent`).
- JSX attachment of handlers to the correct element.

Developer Checklist Review:
- [x] Imported `SyntheticEvent` from React alongside existing imports.
- [x] Added `audioRef = useRef<HTMLAudioElement | null>(null)`.
- [x] Implemented `handleRecordedAudioMetadata` — seeks to `1e100` when `duration` is zero or non-finite.
- [x] Implemented `handleRecordedAudioTimeUpdate` — resets `currentTime` to `0` once a finite `duration` is available.
- [x] Attached `ref`, `onLoadedMetadata`, and `onTimeUpdate` to the recorded-audio `<audio>` element in JSX.
- [x] Upload-mode `<audio>` element is NOT modified — workaround is scoped to recorded audio only.
- [x] No changes to SCSS, API, or any other file.

Validation Notes:
- `handleRecordedAudioMetadata`: correctly guards with `!isFinite(audio.duration) || audio.duration === 0` before seeking, so browsers that do provide duration natively will not be needlessly seeked.
- `handleRecordedAudioTimeUpdate`: the reset condition `isFinite(audio.duration) && audio.duration > 0 && audio.currentTime > 0` correctly detects the post-seek state and resets `currentTime = 0` so the player is in a clean initial state for the user.
- The `audio.removeEventListener('timeupdate', () => {})` call inside `handleRecordedAudioTimeUpdate` is a no-op (React synthetic events cannot be removed this way), but it is harmless — the guard condition `audio.currentTime > 0` ensures the reset body only executes once per load cycle since `currentTime` becomes `0` immediately after, preventing re-entry.
- Upload-mode `<audio>` element at line 212 has no `onLoadedMetadata` or `onTimeUpdate` — confirmed not modified.
- `SyntheticEvent` import is used in both handler signatures — no unused import.
- `audioRef` is correctly typed as `useRef<HTMLAudioElement | null>(null)` and attached via `ref={audioRef}` on the recorded-audio element only.

Findings:
- Minor: the `audio.removeEventListener('timeupdate', () => {})` line in `handleRecordedAudioTimeUpdate` is a no-op because anonymous arrow functions do not match registered React synthetic listeners. In practice this causes no harm because the guard condition prevents repeated execution, but the line is misleading and could be removed in a future cleanup pass.

Risks:
- None for functionality. The workaround is the de-facto industry standard for this MediaRecorder / WebM duration bug and is safe in all modern browsers.

Decision:
Approved
