# Phase 04 - Audio Upload To Transcriber

## 1. Purpose

Implement the end-to-end audio file delivery flow: from the frontend through the backend API and Cloudflare R2 object storage to the Transcriber service.

The success criterion for this phase is a saved audio file in the Transcriber working directory, confirming that the Transcriber successfully retrieved the file from R2 after the full upload-and-confirm cycle completed.

---

## 2. Scope

This phase includes:

- adding Cloudflare R2 environment variables to all `.env.example` files and to `docker-compose.yml`;
- installing `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@nestjs/microservices`, and `kafkajs` in the root workspace;
- adding shared DTOs: `CreateFileDto`, `CreateFileResponseDto`, `ConfirmUploadResponseDto`, and `TranscriptionJobMessageDto`;
- implementing `POST /files` in the API: creates a `FileEntity` with status `UPLOADING`, generates a presigned PUT URL for Cloudflare R2, and returns the file ID and presigned URL — no Kafka at this step;
- implementing `POST /files/:id/upload-complete` in the API: marks the file as `TRANSCRIBING`, creates a `TranscriptionJobEntity`, and publishes a Kafka message to `transcription.jobs`;
- adding a `StorageService` to the API that wraps `@aws-sdk/client-s3` and generates presigned PUT URLs;
- adding a Kafka producer (`ClientKafka`) to the API that publishes to `transcription.jobs`;
- implementing a Kafka consumer in the Transcriber that reads from `transcription.jobs`;
- downloading the audio file from Cloudflare R2 in the Transcriber after receiving the Kafka message and saving it to the Transcriber working directory (`process.cwd()`) as `<fileId>.webm`;
- logging "File saved: <path>" after successful download;
- adding a "Send" button to `AudioInputComponent` in the frontend that appears after a recording is complete or a file is selected;
- implementing the complete frontend send flow: call `POST /files` → PUT audio to presigned URL → call `POST /files/:id/upload-complete`;
- adding a `useFilesApi` hook to the frontend for the API calls.

---

## 3. Flow

```text
Frontend (record or upload audio)
    │
    ▼
Step 1 — POST /files
    { originalName, durationSeconds, sizeBytes }
    │
    ▼
API: Create FileEntity (status = UPLOADING)
     Generate presigned PUT URL for audio-<fileId>
    │
    ▼
Return { fileId, uploadUrl } to Frontend
    │
    ▼
Step 2 — Frontend: PUT audio blob to uploadUrl (Cloudflare R2)
    │
    ▼
Cloudflare R2: object audio-<fileId> stored
    │
    ▼
Step 3 — POST /files/:fileId/upload-complete
    │
    ▼
API: Set FileEntity status → TRANSCRIBING
     Create TranscriptionJobEntity (status = PENDING)
     Publish to Kafka topic: transcription.jobs
         { jobId, fileId, authorId, originalName,
           durationSeconds, sizeBytes,
           audioStorageKey, textStorageKey }
    │
    ▼
Return { fileId, status: 'TRANSCRIBING' } to Frontend
    │
    ▼
Frontend: show success state
    │
    ▼
Transcriber: Kafka consumer receives TranscriptionJobMessage
    │
    ▼
Download audio-<fileId> from R2 (GetObject)
    │
    ▼
Save to <cwd>/<fileId>.webm
    │
    ▼
Log "File saved: <path>"
```

---

## 4. Out Of Scope

This phase does not include:

- actual audio transcription;
- publishing to `transcription.results`;
- API consuming transcription results;
- setting file status to `COMPLETED` or `FAILED`;
- user plan limit checking and reservation;
- polling file status from the frontend;
- displaying transcription results;
- knowledge base management;
- profile page content;
- email verification, password reset, or refresh tokens;
- role-based or plan-based access control.

---

## 5. Environment Variables

The following Cloudflare R2 environment variables must be added to all relevant `.env.example` files and to the `api` and `transcriber` service definitions in `docker-compose.yml`:

```text
CLOUD_STORAGE_BUCKET_NAME=
CLOUD_STORAGE_ACCOUNT_ID=
CLOUD_STORAGE_ACCESS_KEY_ID=
CLOUD_STORAGE_SECRET_ACCESS_KEY=
```

Real values are secret and must be filled in manually by the developer in the actual `.env` files.
These variables must not be committed with real values.

The R2 endpoint is derived from `CLOUD_STORAGE_ACCOUNT_ID`:

```text
https://<CLOUD_STORAGE_ACCOUNT_ID>.r2.cloudflarestorage.com
```

The AWS SDK region for R2 must be set to `'auto'`.

---

## 6. API: POST /files

### Route

```http
POST /files
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body (`CreateFileDto`)

```ts
type CreateFileDto = {
  originalName: string;
  durationSeconds: number;
  sizeBytes: number;
};
```

### Behavior

1. Extract authenticated user from JWT (use existing `JwtAuthGuard` and `@CurrentUser` decorator).
2. Create and persist a `FileEntity` with:
   - `originalName`, `durationSeconds`, `sizeBytes` from request body;
   - `status = FileStatus.UPLOADING`;
   - `authorId = user.id`.
3. Generate a presigned PUT URL for `file.audioStorageKey` with expiry 15 minutes.
4. Return `{ fileId: file.id, uploadUrl }` with HTTP `201 Created`.

Kafka is **not** called at this step.

### Response DTO (`CreateFileResponseDto`)

```ts
type CreateFileResponseDto = {
  fileId: string;
  uploadUrl: string;
};
```

---

## 7. API: POST /files/:id/upload-complete

### Route

```http
POST /files/:id/upload-complete
Authorization: Bearer <token>
```

No request body.

### Behavior

1. Extract authenticated user from JWT.
2. Load the `FileEntity` by `id`; verify `authorId === user.id`; return `403` if not the owner, `404` if not found.
3. Verify `file.status === FileStatus.UPLOADING`; return `409 Conflict` if already past this state.
4. Set `file.status = FileStatus.TRANSCRIBING` and save.
5. Create and persist a `TranscriptionJobEntity` with:
   - `fileId = file.id`;
   - `status = TranscriptionJobStatus.PENDING`;
   - `requestTopic = 'transcription.jobs'`;
   - `responseTopic = 'transcription.results'`;
   - `errorMessage = null`, `startedAt = null`, `completedAt = null`.
6. Build the Kafka message:
   ```ts
   {
     jobId: job.id,
     fileId: file.id,
     authorId: file.authorId,
     originalName: file.originalName,
     durationSeconds: file.durationSeconds,
     sizeBytes: file.sizeBytes,
     audioStorageKey: file.audioStorageKey,
     textStorageKey: file.textStorageKey,
   }
   ```
7. Publish the message to Kafka topic `transcription.jobs` with key `file.id`.
8. Return `{ fileId: file.id, status: 'TRANSCRIBING' }` with HTTP `200 OK`.

### Response DTO (`ConfirmUploadResponseDto`)

```ts
type ConfirmUploadResponseDto = {
  fileId: string;
  status: string;
};
```

---

## 8. API: StorageService

`StorageService` wraps the S3 client configured for Cloudflare R2.

Configuration:

```ts
new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUD_STORAGE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUD_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: CLOUD_STORAGE_SECRET_ACCESS_KEY,
  },
})
```

Exposed method:

```ts
generatePresignedPutUrl(key: string, expiresIn: number): Promise<string>
```

Uses `PutObjectCommand` and `getSignedUrl` from `@aws-sdk/s3-request-presigner`.

---

## 9. API: Kafka Producer

The API publishes to `transcription.jobs` using a `ClientKafka` registered in a `KafkaProducerModule`.

- Kafka broker list: read from `KAFKA_BROKERS` env var (comma-separated).
- Client ID: `ismart-api`.
- Message key: `fileId`.

---

## 10. Shared DTO: TranscriptionJobMessageDto

Full message matching the architecture contract:

```ts
// libs/shared/src/dto/transcription-job-message.dto.ts
export class TranscriptionJobMessageDto {
  jobId!: string;
  fileId!: string;
  authorId!: string;
  originalName!: string;
  durationSeconds!: number;
  sizeBytes!: number;
  audioStorageKey!: string;
  textStorageKey!: string;
}
```

---

## 11. Transcriber: Kafka Consumer

The Transcriber registers a Kafka microservice transport alongside the existing HTTP server via `app.connectMicroservice()` and `app.startAllMicroservices()`.

- Client ID: `ismart-transcriber`.
- Consumer group ID: `ismart-transcriber`.
- Broker list: read from `KAFKA_BROKERS` env var.

The consumer uses `@EventPattern('transcription.jobs')` to receive `TranscriptionJobMessageDto` messages.

On receiving a message:

1. Log `Received job: jobId=<jobId> fileId=<fileId>`.
2. Compute `destPath = path.join(process.cwd(), '<fileId>.webm')`.
3. Call `storageService.downloadFile(audioStorageKey, destPath)`.

---

## 12. Transcriber: StorageService

`StorageService` in the Transcriber wraps the same S3 client configuration as the API.

Exposed method:

```ts
downloadFile(audioStorageKey: string, destPath: string): Promise<void>
```

Behavior:

1. Issue a `GetObjectCommand` for the key from `CLOUD_STORAGE_BUCKET_NAME`.
2. Read the response body stream and write to `destPath` using `fs.promises`.
3. After a successful write, log `File saved: <destPath>`.

The file is guaranteed to be in R2 by the time the Kafka message arrives because the frontend calls `POST /files/:id/upload-complete` only after the presigned PUT to R2 has succeeded.

---

## 13. Frontend: Send Flow

### Additions to `AudioInputComponent`

A "Send" button appears:

- in record mode when `recordState === 'done'`, below the audio player;
- in upload mode after a file is selected, below the audio player.

`sendState` type: `'idle' | 'sending' | 'done' | 'error'`.

`uploadProgress` type: `number` (0–100, default `0`). Tracks the byte-level progress of the presigned PUT to Cloudflare R2. Resets to `0` on discard, clear, mode switch, or new send attempt.

Clicking Send triggers the three-step flow:

1. Check `localStorage.getItem('ismart.accessToken')`; if null, set `sendState = 'error'` with message "You must be logged in to send a file." and return immediately — do not call any API.
2. Set `sendState = 'sending'`; show "Sending…"; disable the button.
3. Call `createFile(metadata)` → receive `{ fileId, uploadUrl }`:
   - record: `{ originalName: 'recording.webm', durationSeconds: seconds, sizeBytes: blob.size }`;
   - upload: `{ originalName: file.name, durationSeconds: Math.round(audioDuration), sizeBytes: file.size }`.
4. Upload the blob via `XMLHttpRequest` PUT to `uploadUrl` (not `fetch`) so that `xhr.upload.onprogress` can report byte-level progress:
   - On each `progress` event set `uploadProgress = Math.round(loaded / total * 100)`.
   - Resolve on 2xx, reject on non-2xx or network error.
   - While `uploadProgress > 0 && uploadProgress < 100` (or until the step completes), display a progress bar below the Send button showing "Uploading… X%".
5. Call `confirmUpload(fileId)` → receive `{ fileId, status }`.
6. Set `sendState = 'done'`; show "File sent. ID: <fileId>".
7. On any error in steps 3–5, set `sendState = 'error'`; show a readable error message.

`sendState` resets to `'idle'` on discard, clear, or mode switch.

### Sidebar: Logout Button

The Profile link in `SidebarComponent` is temporarily replaced with a Logout button.

- The button is rendered as a `<button>` element (not a `<Link>`).
- On click: remove `ismart.accessToken` from `localStorage`, then navigate to `/` using `useRouter` from `next/navigation`.
- The button is styled to match the existing sidebar item appearance.

---

### `useFilesApi` Hook

File: `apps/web/hooks/useFilesApi.ts`

```ts
type CreateFileParams = {
  originalName: string;
  durationSeconds: number;
  sizeBytes: number;
};

type CreateFileResult = {
  fileId: string;
  uploadUrl: string;
};

type ConfirmUploadResult = {
  fileId: string;
  status: string;
};

function useFilesApi(): {
  createFile: (params: CreateFileParams) => Promise<CreateFileResult>;
  confirmUpload: (fileId: string) => Promise<ConfirmUploadResult>;
}
```

- Reads `NEXT_PUBLIC_API_URL` from `process.env`.
- Reads the access token from `localStorage.getItem('ismart.accessToken')`.
- `createFile` calls `POST /files` with `Authorization: Bearer <token>`.
- `confirmUpload` calls `POST /files/:fileId/upload-complete` with `Authorization: Bearer <token>`.
- Both throw on non-2xx responses.

---

## 14. Acceptance Criteria

- `CLOUD_STORAGE_BUCKET_NAME`, `CLOUD_STORAGE_ACCOUNT_ID`, `CLOUD_STORAGE_ACCESS_KEY_ID`, and `CLOUD_STORAGE_SECRET_ACCESS_KEY` are present in `apps/api/.env.example`, `apps/transcriber/.env.example`, and the root `.env.example`.
- `docker-compose.yml` passes the four `CLOUD_STORAGE_*` variables to both `api` and `transcriber` services.
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@nestjs/microservices`, and `kafkajs` are listed in root `package.json`.
- `POST /files` creates a `FileEntity` with status `UPLOADING` and returns `{ fileId, uploadUrl }`. No Kafka message is sent.
- `POST /files` is protected by JWT; unauthenticated requests return `401`.
- `POST /files/:id/upload-complete` sets file status to `TRANSCRIBING`, creates a `TranscriptionJobEntity` with status `PENDING`, and publishes a `TranscriptionJobMessageDto` to Kafka topic `transcription.jobs`.
- `POST /files/:id/upload-complete` returns `403` when called by a user who is not the file owner.
- `POST /files/:id/upload-complete` returns `404` when the file does not exist.
- `POST /files/:id/upload-complete` returns `409` when the file is not in `UPLOADING` status.
- `TranscriptionJobMessageDto` is exported from `@dto`.
- Transcriber consumes the Kafka message and logs `Received job: jobId=<jobId> fileId=<fileId>`.
- Transcriber downloads `audio-<fileId>` from R2 and saves it to `<cwd>/<fileId>.webm`.
- Transcriber logs "File saved: <path>".
- The saved file is present in the Transcriber working directory after the flow completes.
- Frontend shows a "Send" button after recording or file selection.
- Frontend shows "You must be logged in to send a file." and does not call any API when the access token is absent.
- Frontend completes the three-step flow: create file → upload to presigned URL → confirm upload.
- Frontend shows a progress bar with "Uploading… X%" during the presigned PUT to Cloudflare R2.
- Frontend shows a success state with the file ID after step 3.
- `SidebarComponent` shows a Logout button instead of the Profile link; clicking it clears the token and navigates to `/`.
- `npm run typecheck --workspace @ismart/api` passes.
- `npm run typecheck --workspace @ismart/transcriber` passes.
- `npm run typecheck --workspace @ismart/web` passes.
- `npm run build --workspace @ismart/api` passes.
- `npm run build --workspace @ismart/transcriber` passes.
- `docker compose config` passes.
