# Bug - Audio Recording Duration Shows 0:00 Before First Play

## Status

Resolved

## Created After Phase

Phase 03 - UI Redesign And Voice Recording

## Summary

After stopping a voice recording on the Files page, the `<audio>` preview player shows `0:00` as the total duration until the user plays the audio at least once. After the first play the correct duration appears.

## Observed Behavior

1. User clicks "Start recording".
2. User speaks and clicks "Stop recording".
3. The `<audio controls>` preview player appears.
4. The player displays `0:00 / 0:00` in the duration field immediately.
5. The user presses Play.
6. The player seeks to the end or plays through once.
7. The correct duration (e.g. `0:12`) is now shown.

## Expected Behavior

The audio player must show the correct total duration immediately when it appears after recording stops, without requiring the user to play the file first.

## Affected Component

`apps/web/components/files/audio-input.component.tsx`

The audio Blob is produced in the `MediaRecorder.onstop` handler and assigned via `URL.createObjectURL(blob)` to an `<audio controls>` element. The browser does not eagerly read duration metadata from a Blob object URL — it reports `0` until enough of the stream has been decoded.

## Likely Cause

Browsers do not always decode the full duration from a Blob-backed object URL when the `<audio>` element first loads. This is a known limitation with `MediaRecorder` output where the stream header may not contain a total duration field, so the browser reports `Infinity` or `0` until playback seeks to the end.

## Notes For Fix

Possible approaches to ensure correct duration is shown immediately:

- Set `audio.currentTime` to a large value (e.g. `1e100`) after the `loadedmetadata` event fires to force the browser to seek to the end and decode the full duration, then reset `currentTime` to `0`. This is the most common workaround for WebM blobs produced by `MediaRecorder`.
- Re-encode the Blob using the Web Audio API (`AudioContext.decodeAudioData`) to get the exact duration before rendering the player, then set `audio.duration` via a custom attribute or display it separately.
- Display the elapsed recording time (already tracked by the timer state) as the known duration label next to the player, independent of the `<audio>` element's own metadata.

The fix must not affect the upload mode audio player.
