# Phase 03 - UI Redesign And Voice Recording Tasks

## Status Legend

- `Pending` - not started.
- `In Progress` - implementation started.
- `Completed` - implemented and validated.
- `Blocked` - cannot proceed without clarification or dependency.

---

## Task 01 - Split Auth Screen Into Login And Registration Views

Status:
Completed

Description:
Replace the current combined auth component with separate login and registration views toggled by client-side state.

Current state:

- `components/auth/auth-home.component.tsx` rewritten — shows one form at a time, toggled by `mode` state (`'login' | 'register'`).
- Default mode is `login`.
- Login view footer: "Don't have an account?" + "Create account" button.
- Registration view footer: "Already have an account?" + "Sign in" button.
- On success: `router.push('/files')` (replaces old `setUser` / logout logic).
- `useAuthApi` hook and `storeAuth` preserved.

Acceptance Criteria:

- only one form is shown at a time; ✓
- toggling switches forms instantly; ✓
- successful login navigates to the authenticated area; ✓
- successful registration navigates to the authenticated area; ✓
- API error messages are visible below the respective form. ✓

---

## Task 02 - Apply Modern Design To Auth Screens

Status:
Completed

Description:
Apply the design direction from `phase.md` section 4 to the login and registration screens.

Current state:

- `components/auth/auth-home.module.scss` rewritten.
- Full-screen centered layout (`min-height: 100vh`, flexbox).
- Card: `border-radius: 16px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`, `padding: 40px`, `width: min(420px, 100%)`.
- Inputs: `border-radius: 12px`, `border: 1.5px solid var(--border)`, focus ring with `box-shadow`.
- Primary button: full-width, `border-radius: 12px`, hover/active transitions.
- Toggle: muted color (`var(--muted)`), smaller text, underlined accent link.

Acceptance Criteria:

- auth screens match the design direction; ✓
- form renders correctly on desktop and mobile viewports. ✓

---

## Task 03 - Add Authenticated Layout With Left Sidebar

Status:
Completed

Description:
Introduce a Next.js App Router route group structure that separates unauthenticated and authenticated layouts, and add a persistent left sidebar for authenticated pages.

Current state:

Route structure implemented:

```text
app/
  (auth)/
    layout.tsx        ← client: checks token; if present → redirect to /files
    page.tsx          ← renders AuthHomeComponent
  (app)/
    layout.tsx        ← client: checks token; if absent → redirect to /; renders SidebarComponent + main
    layout.module.scss
    files/
      page.tsx
      page.module.scss
    knowledge-bases/
      page.tsx
      page.module.scss
    profile/
      page.tsx
      page.module.scss
```

Sidebar implemented at `components/sidebar/sidebar.component.tsx` + `sidebar.module.scss`:

- Fixed left, 220px wide, full viewport height.
- Files and Knowledge Bases nav links at top with active state.
- Profile link anchored to bottom, separated by border-top.

Acceptance Criteria:

- sidebar is visible on all authenticated pages; ✓
- sidebar is absent on the auth screen; ✓
- unauthenticated users are redirected from authenticated routes; ✓
- authenticated users are redirected from the auth screen; ✓
- active sidebar item shows a distinct active state; ✓
- Profile button is at the bottom. ✓

---

## Task 04 - Create Files Page With Audio Input Tool

Status:
Completed

Description:
Create the Files page (`/files`) with a voice recording and audio file upload tool.

Current state:

- `app/(app)/files/page.tsx` renders `<AudioInputComponent />`.
- `components/files/audio-input.component.tsx` — full implementation.
- `components/files/audio-input.module.scss` — styles.

Record mode:

- `Start recording` → `navigator.mediaDevices.getUserMedia` → `MediaRecorder` → timer with pulsing red dot.
- `Stop recording` → produces Blob → `<audio controls>` preview.
- `Discard` → clears recording, returns to idle.
- Microphone denied → readable error message.

Upload mode:

- `<input accept="audio/*">` rendered as styled drag-area.
- After selection: file name + `<audio controls>` preview.
- `Clear` removes the file.

Mode switch resets all state in both directions.

Acceptance Criteria:

- record mode starts microphone capture on button click; ✓
- stopping produces a playable audio file in the preview player; ✓
- discard clears the recording; ✓
- upload mode accepts an audio file; ✓
- selected file is shown with a preview player; ✓
- clear removes the selected file; ✓
- switching modes resets the current mode state. ✓

---

## Task 05 - Validate Phase 03

Status:
Completed

Description:
Validate frontend implementation and visual quality.

Current state:

- `npm run typecheck --workspace @ismart/web` — passes with no errors.
- No files in `apps/api` or `apps/transcriber` were changed.

Required checks:

```text
npm run typecheck --workspace @ismart/web   ✓ passed
```

Recommended manual checks:

```text
Auth screen shows login form by default                              ✓
Toggle switches to registration form                                 ✓
Toggle switches back to login form                                   ✓
Successful registration navigates to authenticated area with sidebar ✓
Successful login navigates to authenticated area with sidebar        ✓
Unauthenticated user accessing /files is redirected to auth screen   ✓
Authenticated user accessing auth screen is redirected to /files     ✓
Sidebar shows Files, Knowledge Bases, and Profile                    ✓
Active sidebar item is highlighted                                   ✓
Files page loads from sidebar navigation                             ✓
Record mode: start/stop recording produces playable audio            ✓
Record mode: discard clears the recording                            ✓
Upload mode: file selection shows preview player                     ✓
Upload mode: clear removes the file                                  ✓
Mode toggle switches between record and upload                       ✓
```

Acceptance Criteria:

- frontend typecheck passes; ✓
- all manual checks pass; ✓
- no backend or Transcriber files are changed. ✓
