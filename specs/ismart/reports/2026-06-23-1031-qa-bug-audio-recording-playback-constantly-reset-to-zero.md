# QA Report - Bug audio-recording-playback-constantly-reset-to-zero

Status:
PASSED

Scope Reviewed:
- `apps/web/components/files/audio-input.component.tsx` — full file review.
- `durationFixAppliedRef` initialization and reset points.
- `handleRecordedAudioTimeUpdate` guard logic.
- `handleRecordedAudioMetadata` unchanged correctness.
- Upload-mode player isolation.
- Removal of the previously identified no-op `removeEventListener` call.

Developer Checklist Review:
- [x] Added `durationFixAppliedRef = useRef(false)` alongside other refs.
- [x] `handleRecordedAudioTimeUpdate` early-returns if `durationFixAppliedRef.current` is true.
- [x] Sets `durationFixAppliedRef.current = true` before resetting `currentTime = 0` to prevent re-entry.
- [x] Removed the no-op `audio.removeEventListener` line.
- [x] `durationFixAppliedRef.current = false` reset added to `discardRecording`.
- [x] `durationFixAppliedRef.current = false` reset added to `switchMode`.
- [x] `handleRecordedAudioMetadata` (duration-display workaround) is unchanged and still functional.
- [x] Upload-mode `<audio>` element is unaffected.

Validation Notes:
- Line 20: `audioRef` present. Line 21: `durationFixAppliedRef = useRef(false)` confirmed.
- `handleRecordedAudioTimeUpdate` (lines 124–133): first line is `if (durationFixAppliedRef.current) return;` — correctly prevents all re-entry after the first fix application.
- The flag is set to `true` at line 130 before resetting `currentTime` at line 131 — order is correct, prevents any race where a re-render might fire another `timeupdate` before the assignment.
- `discardRecording` (line 95): `durationFixAppliedRef.current = false` confirmed.
- `switchMode` (line 48): `durationFixAppliedRef.current = false` confirmed.
- No `removeEventListener` no-op present — removed as planned.
- `startRecording` does not need an explicit reset of `durationFixAppliedRef` because `discardRecording` or `switchMode` must always precede a new recording; however, `recorder.onstop` triggers `setRecordState('done')` which remounts the `<audio>` element, causing `onLoadedMetadata` to fire fresh — the flag being false at that point is guaranteed by the prior discard/switch reset.
- Upload-mode `<audio>` at line 216: no `onLoadedMetadata`, `onTimeUpdate`, or `ref` attached — confirmed unaffected.

Findings:
- None.

Risks:
- None. The fix is minimal, scoped to a single ref and two guard checks, and does not touch recording, upload, or any other concern.

Decision:
Approved
