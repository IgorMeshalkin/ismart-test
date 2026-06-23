# Phase 03 - UI Redesign And Voice Recording

## 1. Purpose

Redesign the frontend user experience for iSmart.

This phase replaces the combined auth screen with separate login and registration views, adds a persistent left sidebar navigation for authenticated users, and introduces a Files page with a voice recording and audio upload tool.

No backend changes are made in this phase.

---

## 2. Scope

This phase includes:

- splitting the combined auth screen into two separate views: login and registration;
- adding a toggle link at the bottom of each auth view to switch to the other view;
- redesigning the auth screens with a modern, light, rounded visual style;
- adding a persistent left sidebar that appears only for authenticated users;
- placing Files and Knowledge Bases navigation items at the top of the sidebar;
- placing a Profile button at the bottom of the sidebar;
- creating a Files page accessible from the sidebar;
- adding a voice recording tool on the Files page;
- adding an audio file upload tool on the Files page;
- allowing the user to switch between recording and upload modes;
- producing a local audio file on the frontend from a voice recording using the browser MediaRecorder API;
- applying consistent modern, light, rounded visual style across all new and redesigned screens.

The backend API and the Transcriber service are not changed in this phase.

The produced audio file is not submitted to the backend in this phase.

---

## 3. Out Of Scope

This phase does not include:

- submitting or processing audio files on the backend;
- transcription workflows;
- knowledge base creation or management screens;
- profile page content;
- email verification, password reset, or refresh tokens;
- role-based or plan-based access control;
- Transcriber or API changes.

---

## 4. Design Direction

All new and redesigned screens must follow a unified visual style:

- light background, predominantly white or very light gray surface colors;
- rounded corners on cards, inputs, and buttons (border-radius 12–16 px minimum);
- subtle box shadows on elevated surfaces;
- clear visual hierarchy through font weight and size rather than heavy borders;
- smooth transitions on interactive elements (hover, focus, active states);
- consistent spacing scale;
- accessible color contrast on all text and interactive elements.

The design must feel clean and modern on both desktop and mobile viewports.

---

## 5. Auth Screens

### Current State

The current implementation renders login and registration forms side by side in a single component (`auth-home.component.tsx`).

### Required Behavior

The auth screen must show only one form at a time.

Two modes exist:

- `login` — shows the login form;
- `register` — shows the registration form.

The default mode is `login`.

Each mode must include a toggle at the bottom of the form:

- the login view shows: `Don't have an account?` + a button or link `Create account`;
- the registration view shows: `Already have an account?` + a button or link `Sign in`.

Clicking the toggle switches between modes. No page navigation occurs; the switch is client-side state.

### Login View

Fields:

```text
email (type=email, required)
password (type=password, required)
```

Behavior on submit:

- call `POST /auth/login`;
- on success: store access token and user, navigate to the authenticated area;
- on error: display a readable error message below the form.

### Registration View

Fields:

```text
firstName (required)
lastName (required)
email (type=email, required)
password (type=password, required)
```

Behavior on submit:

- call `POST /auth/register`;
- on success: store access token and user, navigate to the authenticated area;
- on error: display a readable error message below the form.

### Visual Requirements

- center the form vertically and horizontally on the screen;
- the form card must have rounded corners and a subtle shadow;
- inputs must have rounded corners and a clear focus ring;
- the primary action button must be full-width within the form;
- the toggle link must be visually secondary (muted color, smaller text).

---

## 6. Authenticated Layout With Sidebar

### Sidebar

The sidebar appears on all authenticated pages.

Structure:

```text
Sidebar
├── [top] Files
├── [top] Knowledge Bases
└── [bottom] Profile
```

Files and Knowledge Bases are navigation links.

Profile is a button at the bottom.

Active navigation item must have a visually distinct active state.

### Routing

Introduce Next.js App Router route structure for authenticated pages:

```text
app/
  (auth)/          ← unauthenticated layout (no sidebar)
    page.tsx       ← auth screen (login / register toggle)
  (app)/           ← authenticated layout (with sidebar)
    files/
      page.tsx
    knowledge-bases/
      page.tsx
    profile/
      page.tsx
```

Unauthenticated users who access authenticated routes must be redirected to the auth screen.

Authenticated users who access the auth screen must be redirected to `/files`.

### Sidebar Visual Requirements

- fixed left edge, full viewport height;
- collapsed label or icon-only variant is acceptable on small viewports;
- active item must be visually distinct from inactive items;
- Profile button must be visually separated from the navigation links (anchored to the bottom).

---

## 7. Files Page

### Purpose

The Files page is where users will eventually submit audio for transcription.
In this phase it provides the audio input tool only; submission to the backend is out of scope.

### Audio Input Tool

The tool supports two modes:

- `record` — capture voice from the microphone;
- `upload` — select an audio file from the file system.

The user can switch between modes using a toggle (tabs, segmented control, or equivalent).

The default mode is `record`.

#### Record Mode

Controls and behavior:

- `Start recording` button — requests microphone permission if not already granted, then begins capture using the browser `MediaRecorder` API;
- recording indicator — visible feedback that capture is active (animated icon or timer);
- `Stop recording` button — ends capture and produces a local audio file (WebM or other format supported by the browser);
- audio preview player — an HTML `<audio>` element with `controls` that lets the user listen to the recording before further action;
- `Discard` button — clears the current recording so the user can start again.

Microphone permission denial must show a readable message explaining that microphone access is required.

#### Upload Mode

Controls and behavior:

- file input that accepts audio files (`accept="audio/*"`);
- drag-and-drop area is acceptable as an enhancement but not required;
- after file selection, show the file name and an audio preview player;
- `Clear` button — removes the selected file.

### Visual Requirements

- the tool must be presented as a centered card with rounded corners and a subtle shadow;
- mode toggle must be visually clear and easy to tap on mobile;
- recording state must be unmistakable (color change, pulse animation, or timer);
- the audio preview player must appear only after a recording is produced or a file is selected.

---

## 8. Acceptance Criteria

- Auth screen shows only one form at a time.
- Login and registration forms toggle correctly with no page reload.
- Successful login navigates to the authenticated area (sidebar visible).
- Successful registration navigates to the authenticated area (sidebar visible).
- Unauthenticated users cannot access authenticated routes.
- Authenticated users are redirected away from the auth screen.
- Sidebar shows Files and Knowledge Bases links and a Profile button.
- Active sidebar item is visually distinct.
- Files page is accessible via sidebar navigation.
- Voice recording starts when the user clicks Start recording.
- Voice recording stops and produces a playable audio file when the user clicks Stop.
- The user can listen to the recording before discarding.
- The user can discard a recording and start again.
- The user can switch to upload mode and select an audio file.
- The selected file is shown with an audio preview player.
- All screens and components follow the modern, light, rounded design direction.
- Frontend typecheck passes after implementation.
- No backend or Transcriber files are changed.
