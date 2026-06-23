# Bug - Audio Recording Playback Constantly Resets To Beginning

## Status

Resolved

## Created After Phase

Phase 03 - UI Redesign And Voice Recording

## Introduced By

Fix for bug `audio-recording-duration-shows-zero-before-first-play`

## Summary

After the fix for the 0:00 duration display issue, recorded audio cannot be played back normally. The player resets to `0:00` continuously during playback, making it impossible to listen to the recording.

## Observed Behavior

1. User records audio and stops recording.
2. The preview player appears with the correct duration (duration fix is working).
3. User presses Play.
4. The audio starts playing but immediately (or within fractions of a second) jumps back to `0:00`.
5. This reset loop repeats every time `currentTime` becomes greater than `0`.
6. The recording cannot be listened to.

## Expected Behavior

After the duration workaround has fired once (seeking to `1e100` and back to `0`), normal playback must work without interruption. The `onTimeUpdate` handler must not reset `currentTime` during user-initiated playback.

## Root Cause

The `handleRecordedAudioTimeUpdate` handler in `audio-input.component.tsx` contains:

```ts
if (isFinite(audio.duration) && audio.duration > 0 && audio.currentTime > 0) {
  audio.currentTime = 0;
}
```

This condition is true not only right after the `1e100` phantom seek but also during every tick of normal user playback (since `duration` is finite and `currentTime > 0` at all times during playback). As a result the handler fires on every `timeupdate` event and continuously resets `currentTime` to `0`.

## Affected Component

`apps/web/components/files/audio-input.component.tsx`

Specifically `handleRecordedAudioTimeUpdate` — the guard condition does not distinguish between the phantom seek state and normal playback.

## Notes For Fix

The workaround state (phantom seek in progress vs. normal playback) must be tracked with a ref flag so the reset only fires once:

- Add a `durationFixAppliedRef = useRef(false)` (reset to `false` whenever a new recording is created).
- In `handleRecordedAudioMetadata`: if the seek to `1e100` is needed, set `durationFixAppliedRef.current = false` (or leave it false — it is already false for a new blob).
- In `handleRecordedAudioTimeUpdate`: check `!durationFixAppliedRef.current` before resetting. After resetting `currentTime = 0`, set `durationFixAppliedRef.current = true` to prevent any further resets during normal playback.
- Reset `durationFixAppliedRef.current = false` in `discardRecording` and `switchMode` alongside the rest of the state resets.

This ensures `currentTime` is reset exactly once per recording, and subsequent `timeupdate` events during normal playback are ignored.
