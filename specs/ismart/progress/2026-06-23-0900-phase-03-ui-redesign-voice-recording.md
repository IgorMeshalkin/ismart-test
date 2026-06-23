# Phase 03 - UI Redesign And Voice Recording Progress

## 2026-06-23 09:00 UTC

Phase:
Phase 03 - UI Redesign And Voice Recording

Task:
Tasks 01-05 - UI Redesign And Voice Recording

Status:
Ready For QA

Files Changed:
- `apps/web/app/page.tsx` (deleted — replaced by `app/(auth)/page.tsx`)
- `apps/web/app/(auth)/layout.tsx` (new)
- `apps/web/app/(auth)/page.tsx` (new)
- `apps/web/app/(app)/layout.tsx` (new)
- `apps/web/app/(app)/layout.module.scss` (new)
- `apps/web/app/(app)/files/page.tsx` (new)
- `apps/web/app/(app)/files/page.module.scss` (new)
- `apps/web/app/(app)/knowledge-bases/page.tsx` (new)
- `apps/web/app/(app)/knowledge-bases/page.module.scss` (new)
- `apps/web/app/(app)/profile/page.tsx` (new)
- `apps/web/app/(app)/profile/page.module.scss` (new)
- `apps/web/components/auth/auth-home.component.tsx` (rewritten)
- `apps/web/components/auth/auth-home.module.scss` (rewritten)
- `apps/web/components/sidebar/sidebar.component.tsx` (new)
- `apps/web/components/sidebar/sidebar.module.scss` (new)
- `apps/web/components/files/audio-input.component.tsx` (new)
- `apps/web/components/files/audio-input.module.scss` (new)
- `specs/ismart/phases/phase-03-ui-redesign-voice-recording/tasks.md` (updated)
- `specs/ismart/progress/2026-06-23-0900-phase-03-ui-redesign-voice-recording.md` (this file)

Implementation Checklist:
- [ ] Deleted root `app/page.tsx` and replaced with `app/(auth)/page.tsx`.
- [ ] Created `app/(auth)/layout.tsx` — client component that redirects authenticated users to `/files`.
- [ ] Created `app/(app)/layout.tsx` — client component that redirects unauthenticated users to `/`, renders SidebarComponent + main content.
- [ ] Auth token check uses `localStorage.getItem('ismart.accessToken')` in both layout guards.
- [ ] Rewrote `AuthHomeComponent` to show one form at a time (`'login' | 'register'` mode state).
- [ ] Default mode is `login`.
- [ ] Login view footer shows "Don't have an account?" + "Create account" toggle button.
- [ ] Registration view footer shows "Already have an account?" + "Sign in" toggle button.
- [ ] On successful login: stores token + user in localStorage, calls `router.push('/files')`.
- [ ] On successful registration: stores token + user in localStorage, calls `router.push('/files')`.
- [ ] API error messages rendered below the respective form.
- [ ] `useAuthApi` hook preserved unchanged.
- [ ] `storeAuth` helper preserved unchanged.
- [ ] Auth card uses `border-radius: 16px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`, `width: min(420px, 100%)`.
- [ ] Inputs use `border-radius: 12px`, `border: 1.5px solid var(--border)`, focus ring with `box-shadow`.
- [ ] Primary action button is full-width with `border-radius: 12px` and hover/active transitions.
- [ ] Toggle link is muted color and smaller text.
- [ ] Created `SidebarComponent` with Files and Knowledge Bases links at top, Profile link at bottom.
- [ ] Sidebar is `position: fixed; left: 0; top: 0; width: 220px; height: 100vh`.
- [ ] Active sidebar item detected with `usePathname()` and styled with `background: rgba(15,118,110,0.08); color: var(--accent)`.
- [ ] Profile link is visually separated from nav items via `border-top`.
- [ ] Main content area has `margin-left: 220px` to clear sidebar.
- [ ] Created Files page at `app/(app)/files/page.tsx` rendering `AudioInputComponent`.
- [ ] Created Knowledge Bases placeholder page at `app/(app)/knowledge-bases/page.tsx`.
- [ ] Created Profile placeholder page at `app/(app)/profile/page.tsx`.
- [ ] `AudioInputComponent` supports `'record' | 'upload'` mode toggle.
- [ ] Default mode is `record`.
- [ ] Record mode: `Start recording` requests `navigator.mediaDevices.getUserMedia({ audio: true })` and starts `MediaRecorder`.
- [ ] Record mode: pulsing red dot and `mm:ss` timer visible during capture.
- [ ] Record mode: `Stop recording` ends capture, produces Blob, and creates object URL for `<audio controls>` player.
- [ ] Record mode: `Discard` clears the recording and returns to idle state.
- [ ] Record mode: microphone permission denied shows readable error message.
- [ ] Upload mode: `<input type="file" accept="audio/*">` rendered as styled area.
- [ ] Upload mode: after file selection shows file name and `<audio controls>` preview player.
- [ ] Upload mode: `Clear` removes the selected file.
- [ ] Switching modes resets all state (recording, audio URL, file, errors).
- [ ] Object URLs are revoked on component unmount.
- [ ] `npm run typecheck --workspace @ismart/web` passes.
- [ ] No files in `apps/api` or `apps/transcriber` were modified.

Notes:
- Stale `.next/types/app/page.ts` referenced the deleted `app/page.tsx` and caused typecheck errors; the `.next/types` directory was cleared to resolve this — it is auto-generated and not tracked in git.
- The `app/(auth)/layout.tsx` redirect uses `useEffect` + `useState` to avoid SSR access to `localStorage`, which is only available in the browser.
- `MediaRecorder` produces audio in the browser's native format (typically `audio/webm` on Chromium, `audio/mp4` on Safari); the MIME type is read from `recorder.mimeType` at stop time.
- Audio files are not submitted to the backend in this phase.
