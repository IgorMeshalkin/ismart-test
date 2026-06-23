# Phase 03 - UI Redesign And Voice Recording Tasks

## Status Legend

- `Pending` - not started.
- `In Progress` - implementation started.
- `Completed` - implemented and validated.
- `Blocked` - cannot proceed without clarification or dependency.

---

## Task 01 - Split Auth Screen Into Login And Registration Views

Status:
Pending

Description:
Replace the current combined auth component with separate login and registration views toggled by client-side state.

Current state:

- `components/auth/auth-home.component.tsx` renders both forms side by side.

Required behavior:

- only one form is visible at a time;
- default view is login;
- login view has a toggle at the bottom: `Don't have an account?` + `Create account` action;
- registration view has a toggle at the bottom: `Already have an account?` + `Sign in` action;
- clicking the toggle switches views without page navigation.

The existing auth API calls (`useAuthApi`) and token storage logic must be preserved.

Acceptance Criteria:

- only one form is shown at a time;
- toggling switches forms instantly;
- successful login navigates to the authenticated area;
- successful registration navigates to the authenticated area;
- API error messages are visible below the respective form.

---

## Task 02 - Apply Modern Design To Auth Screens

Status:
Pending

Description:
Apply the design direction from `phase.md` section 4 to the login and registration screens.

Requirements:

- vertically and horizontally centered form card;
- rounded corners on the card (border-radius 12–16 px minimum);
- subtle box shadow on the card;
- rounded inputs with clear focus rings;
- primary action button is full-width within the form;
- toggle link is visually secondary (muted color, smaller text);
- consistent spacing and typography hierarchy.

This task may be done together with Task 01 or as a follow-up styling pass.

Acceptance Criteria:

- auth screens match the design direction;
- form renders correctly on desktop and mobile viewports.

---

## Task 03 - Add Authenticated Layout With Left Sidebar

Status:
Pending

Description:
Introduce a Next.js App Router route group structure that separates unauthenticated and authenticated layouts, and add a persistent left sidebar for authenticated pages.

Required route structure:

```text
app/
  (auth)/
    page.tsx          ← auth screen (login / register toggle)
    layout.tsx        ← no sidebar
  (app)/
    layout.tsx        ← sidebar included
    files/
      page.tsx
    knowledge-bases/
      page.tsx
    profile/
      page.tsx
```

Sidebar structure:

```text
[top]   Files link
[top]   Knowledge Bases link
[bottom] Profile button
```

Redirect rules:

- unauthenticated access to any `(app)` route redirects to the auth screen;
- authenticated access to the auth screen redirects to `/files`.

Auth state must be read from the stored access token (same storage key used in phase 02: `ismart.accessToken`).

Sidebar visual requirements:

- fixed to the left edge, full viewport height;
- active link is visually distinct;
- Profile button is anchored to the bottom and visually separated from navigation links.

Acceptance Criteria:

- sidebar is visible on all authenticated pages;
- sidebar is absent on the auth screen;
- unauthenticated users are redirected from authenticated routes;
- authenticated users are redirected from the auth screen;
- active sidebar item shows a distinct active state;
- Profile button is at the bottom.

---

## Task 04 - Create Files Page With Audio Input Tool

Status:
Pending

Description:
Create the Files page (`/files`) with a voice recording and audio file upload tool.

The tool has two modes: `record` and `upload`. The user can switch between them.

### Record Mode

Controls:

- `Start recording` button — requests microphone permission and begins `MediaRecorder` capture;
- recording indicator — visible while capture is active;
- `Stop recording` button — ends capture and produces a local audio Blob;
- `<audio controls>` preview player — appears after capture completes;
- `Discard` button — clears the recording.

Microphone permission denied must display a readable error message.

### Upload Mode

Controls:

- file input with `accept="audio/*"`;
- after selection: show file name and `<audio controls>` preview player;
- `Clear` button — removes the selected file.

Visual requirements:

- tool presented as a centered card with rounded corners and subtle shadow;
- mode toggle is clearly visible;
- recording active state is unmistakable (color, animation, or timer);
- audio preview appears only after a recording or file selection.

Note: the produced audio file or selected file is not submitted to the backend in this phase.

Acceptance Criteria:

- record mode starts microphone capture on button click;
- stopping produces a playable audio file in the preview player;
- discard clears the recording;
- upload mode accepts an audio file;
- selected file is shown with a preview player;
- clear removes the selected file;
- switching modes resets the current mode state.

---

## Task 05 - Validate Phase 03

Status:
Pending

Description:
Validate frontend implementation and visual quality.

Required checks:

```text
npm run typecheck --workspace @ismart/web
```

Recommended manual checks:

```text
Auth screen shows login form by default
Toggle switches to registration form
Toggle switches back to login form
Successful registration navigates to authenticated area with sidebar
Successful login navigates to authenticated area with sidebar
Unauthenticated user accessing /files is redirected to auth screen
Authenticated user accessing auth screen is redirected to /files
Sidebar shows Files, Knowledge Bases, and Profile
Active sidebar item is highlighted
Files page loads from sidebar navigation
Record mode: start/stop recording produces playable audio
Record mode: discard clears the recording
Upload mode: file selection shows preview player
Upload mode: clear removes the file
Mode toggle switches between record and upload
```

Acceptance Criteria:

- frontend typecheck passes;
- all manual checks pass;
- no backend or Transcriber files are changed.
