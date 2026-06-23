# Phase 05 - Transcription Result Processing

## 1. Purpose

Close the full transcription cycle: the Transcriber transcribes the downloaded audio, uploads the resulting text file to Cloudflare R2, and notifies the API via Kafka. The API persists the result, and the Frontend polls until the text is ready, then downloads and displays it.

The success criterion for this phase is the user seeing the transcript text rendered on the screen after sending an audio file.

---

## 2. Scope

This phase includes:

- adding the `OPENAI_API_KEY` environment variable to the Transcriber `.env.example`, root `.env.example`, and `docker-compose.yml`;
- installing `openai` in the root workspace;
- extending `StorageService` in the Transcriber with `uploadFile(key, filePath)`;
- extending `StorageService` in the API with `generatePresignedGetUrl(key, expiresIn)`;
- adding transcription logic to `TranscriptionConsumer` in the Transcriber: call OpenAI Whisper API → save text to disk → upload to R2 → publish to `transcription.results`;
- adding a DB migration: new `is_text_uploaded` column (`boolean`, default `false`) on the `file` table;
- adding `isTextUploaded: boolean` field to `FileEntity`;
- adding a Kafka consumer in the API for `transcription.results`;
- on a `COMPLETED` result: set `file.status = COMPLETED`, `file.isTextUploaded = true`, `transcriptionJob.status = COMPLETED`, `transcriptionJob.completedAt = now()`;
- on a `FAILED` result: set `file.status = FAILED`, `transcriptionJob.status = FAILED`, `transcriptionJob.errorMessage`, `transcriptionJob.completedAt = now()`;
- adding shared DTOs: `TranscriptionResultMessageDto`, `FileStatusResponseDto`, `TranscriptResponseDto`;
- implementing `GET /files/:id/status` in the API;
- implementing `GET /files/:id/transcript` in the API (returns a presigned GET URL);
- adding a `useFileStatusApi` hook to the Frontend;
- after `sendState = 'done'`, starting a 2-second polling loop on `GET /files/:id/status`;
- when `isTextUploaded` is `true`, calling `GET /files/:id/transcript`, fetching the text via the returned `downloadUrl`, and displaying it below the audio player;
- stopping polling on success or error.

---

## 3. Flow

```text
Transcriber: audio file on disk (<fileId>.webm)
    │
    ▼
Call OpenAI Whisper API
    │
    ▼
Receive transcript text
    │
    ▼
Save text to disk as <fileId>.txt
    │
    ▼
Upload text-<fileId> to Cloudflare R2 (PutObject)
    │
    ▼
Publish to Kafka topic: transcription.results
    { jobId, fileId, status: 'COMPLETED' }
    │
    ▼
Transcriber logs "Transcription complete: fileId=<fileId>"
    │
    ▼
API: Kafka consumer receives TranscriptionResultMessage
    │
    ▼
Load FileEntity + TranscriptionJobEntity by fileId / jobId
    │
    ▼
Set file.status = COMPLETED
    file.isTextUploaded = true
    job.status = COMPLETED
    job.completedAt = now()
    │
    ▼
Frontend: polling GET /files/:id/status every 2 seconds
    │
    ▼
Response: { fileId, status: 'COMPLETED', isTextUploaded: true }
    │
    ▼
Frontend: call GET /files/:id/transcript
    │
    ▼
API: generate presigned GET URL for text-<fileId>  (15 min expiry)
    │
    ▼
Response: { downloadUrl }
    │
    ▼
Frontend: fetch text content from downloadUrl
    │
    ▼
Display transcript text on screen
```

---

## 4. Out Of Scope

This phase does not include:

- user plan limit deduction (reservedSeconds / reservedStorageBytes release);
- notifications for transcription completion;
- re-try logic for failed transcription jobs;
- displaying or handling the `FAILED` status in the frontend beyond stopping the poll;
- knowledge base management;
- profile page content;
- email verification, password reset, or refresh tokens;
- role-based or plan-based access control.

---

## 5. Environment Variables

The following variable must be added to `apps/transcriber/.env.example` and the root `.env.example`, and passed to the `transcriber` service in `docker-compose.yml`:

```text
OPENAI_API_KEY=
```

Real values must be filled in manually in actual `.env` files and must not be committed.

---

## 6. Domain Model Change: FileEntity

Add field `isTextUploaded: boolean` to `FileEntity` (default `false`).

TypeORM column: `is_text_uploaded`, type `boolean`, default `false`, `nullable: false`.

A DB migration must be created:

- table: `file`
- operation: `ADD COLUMN is_text_uploaded boolean NOT NULL DEFAULT false`

---

## 7. Transcriber: TranscriptionConsumer Changes

Extend the existing `TranscriptionConsumer` (`@EventPattern('transcription.jobs')`) to carry out the full transcription cycle after the file is downloaded:

1. Log `Received job: jobId=<jobId> fileId=<fileId>` (already done in phase 04).
2. Download `audio-<fileId>` from R2 to `<cwd>/<fileId>.webm` (already done in phase 04).
3. Log `File saved: <destPath>` (already done in phase 04).
4. Call `transcriptionService.transcribe(fileId, destPath)` — see section 8.
5. Publish result to `transcription.results` (see section 9).

On any error in steps 4–5:

- Log the error.
- Publish to `transcription.results` with `{ jobId, fileId, status: 'FAILED', errorMessage: error.message }`.

---

## 8. Transcriber: TranscriptionService

File: `apps/transcriber/src/transcription/transcription.service.ts`

Method:

```ts
transcribe(fileId: string, audioPath: string): Promise<string>
```

Behavior:

1. Create an `OpenAI` client using `OPENAI_API_KEY` from env.
2. Open `audioPath` as a `fs.createReadStream`.
3. Call `openai.audio.transcriptions.create({ file: stream, model: 'whisper-1' })`.
4. Receive the `text` string from the response.
5. Compute `textPath = path.join(process.cwd(), '<fileId>.txt')`.
6. Write `text` to `textPath` using `fs.promises.writeFile`.
7. Call `storageService.uploadFile('text-<fileId>', textPath)`.
8. Log `Transcription complete: fileId=<fileId>`.
9. Return `textPath`.

---

## 9. Transcriber: StorageService Extension

Add to `apps/transcriber/src/storage/storage.service.ts`:

```ts
uploadFile(key: string, filePath: string): Promise<void>
```

Behavior:

1. Read file content from `filePath` using `fs.promises.readFile`.
2. Issue a `PutObjectCommand` with `Key: key`, `Bucket: CLOUD_STORAGE_BUCKET_NAME`, `Body: content`.
3. Log `File uploaded: key=<key>`.

---

## 10. Transcriber: Kafka Result Publisher

After a successful transcription, publish to Kafka topic `transcription.results`:

```ts
{
  jobId: string;
  fileId: string;
  status: 'COMPLETED';
}
```

On error:

```ts
{
  jobId: string;
  fileId: string;
  status: 'FAILED';
  errorMessage: string;
}
```

The Transcriber registers a `ClientKafka` producer (same configuration as in the API) to publish to `transcription.results`. Publisher is initialized on module init and disconnected on module destroy.

---

## 11. Shared DTOs for Phase 05

### TranscriptionResultMessageDto

```ts
// libs/shared/src/dto/transcription-result-message.dto.ts
export class TranscriptionResultMessageDto {
  jobId!: string;
  fileId!: string;
  status!: 'COMPLETED' | 'FAILED';
  errorMessage?: string;
}
```

### FileStatusResponseDto

```ts
// libs/shared/src/dto/file-status-response.dto.ts
export class FileStatusResponseDto {
  fileId!: string;
  status!: string;
  isTextUploaded!: boolean;
}
```

### TranscriptResponseDto

```ts
// libs/shared/src/dto/transcript-response.dto.ts
export class TranscriptResponseDto {
  fileId!: string;
  downloadUrl!: string;
}
```

All three must be exported from the `@dto` barrel (`libs/shared/src/dto/index.ts`).

---

## 12. API: StorageService Extension

Add to `apps/api/src/storage/storage.service.ts`:

```ts
generatePresignedGetUrl(key: string, expiresIn: number): Promise<string>
```

Uses `GetObjectCommand` and `getSignedUrl` from `@aws-sdk/s3-request-presigner`.

---

## 13. API: Kafka Consumer for transcription.results

The API registers a Kafka microservice transport alongside its HTTP server, using the same `KAFKA_BROKERS` env var.

- Client ID: `ismart-api-consumer`.
- Consumer group ID: `ismart-api-consumer`.

A `TranscriptionResultConsumer` uses `@EventPattern('transcription.results')` with payload type `TranscriptionResultMessageDto`.

On `COMPLETED`:

1. Load `TranscriptionJobEntity` by `jobId`; log a warning and return if not found.
2. Set `job.status = TranscriptionJobStatus.COMPLETED`, `job.completedAt = new Date()`.
3. Load `FileEntity` by `job.fileId`.
4. Set `file.status = FileStatus.COMPLETED`, `file.isTextUploaded = true`.
5. Save both entities.
6. Log `Transcription result processed: fileId=<fileId> status=COMPLETED`.

On `FAILED`:

1. Load `TranscriptionJobEntity` by `jobId`; log a warning and return if not found.
2. Set `job.status = TranscriptionJobStatus.FAILED`, `job.errorMessage = message.errorMessage`, `job.completedAt = new Date()`.
3. Load `FileEntity` by `job.fileId`.
4. Set `file.status = FileStatus.FAILED`.
5. Save both entities.
6. Log `Transcription result processed: fileId=<fileId> status=FAILED`.

The consumer lives in a new `TranscriptionResultModule` that imports `TypeOrmModule.forFeature([FileEntity, TranscriptionJobEntity])`.

---

## 14. API: GET /files/:id/status

### Route

```http
GET /files/:id/status
Authorization: Bearer <token>
```

### Behavior

1. Extract authenticated user from JWT.
2. Load `FileEntity` by `id`; return `404` if not found.
3. Verify `file.authorId === user.id`; return `403` if not the owner.
4. Return `{ fileId: file.id, status: file.status, isTextUploaded: file.isTextUploaded }` with HTTP `200 OK`.

### Response DTO

`FileStatusResponseDto`

---

## 15. API: GET /files/:id/transcript

### Route

```http
GET /files/:id/transcript
Authorization: Bearer <token>
```

### Behavior

1. Extract authenticated user from JWT.
2. Load `FileEntity` by `id`; return `404` if not found.
3. Verify `file.authorId === user.id`; return `403` if not the owner.
4. Verify `file.isTextUploaded === true`; return `409 Conflict` if the text is not yet uploaded.
5. Call `storageService.generatePresignedGetUrl(file.textStorageKey, 900)`.
6. Return `{ fileId: file.id, downloadUrl }` with HTTP `200 OK`.

### Response DTO

`TranscriptResponseDto`

---

## 16. Frontend: Polling and Transcript Display

### `useFileStatusApi` Hook

File: `apps/web/hooks/useFileStatusApi.ts`

```ts
type FileStatusResult = {
  fileId: string;
  status: string;
  isTextUploaded: boolean;
};

type TranscriptResult = {
  fileId: string;
  downloadUrl: string;
};

function useFileStatusApi(): {
  getFileStatus: (fileId: string) => Promise<FileStatusResult>;
  getTranscriptDownloadUrl: (fileId: string) => Promise<TranscriptResult>;
}
```

- Reads `NEXT_PUBLIC_API_URL` from `process.env`.
- Reads the access token from `localStorage.getItem('ismart.accessToken')`.
- `getFileStatus`: `GET /files/<fileId>/status` with `Authorization: Bearer <token>`.
- `getTranscriptDownloadUrl`: `GET /files/<fileId>/transcript` with `Authorization: Bearer <token>`.
- Both throw on non-2xx responses.

### `AudioInputComponent` Changes

Add to state:

- `transcriptState: 'idle' | 'polling' | 'done' | 'error'` (default `'idle'`);
- `transcriptText: string | null` (default `null`);
- `pollingFileId: string | null` (default `null`).

After `sendState` transitions to `'done'`, set `transcriptState = 'polling'` and `pollingFileId = sentFileId`. Start polling `getFileStatus(pollingFileId)` every 2 seconds using `setInterval`.

On each poll response:

- If `isTextUploaded === true`:
  1. Clear the interval.
  2. Call `getTranscriptDownloadUrl(fileId)` → receive `{ downloadUrl }`.
  3. Fetch the text content: `const text = await fetch(downloadUrl).then(r => r.text())`.
  4. Set `transcriptText = text`, `transcriptState = 'done'`.
- If `status === 'FAILED'`:
  1. Clear the interval.
  2. Set `transcriptState = 'error'`.
- Otherwise, continue polling.

While `transcriptState === 'polling'`: show "Processing… waiting for transcript." below the send result.

When `transcriptState === 'done'`: render `transcriptText` in a scrollable `<pre>` block below the audio player.

When `transcriptState === 'error'`: show "Transcription failed." below the send result.

Clear the interval and reset `transcriptState`, `transcriptText`, `pollingFileId` on discard, clear, or mode switch.

---

## 17. Skill Usage

Developer must use relevant local skills from `.agents/skills` when implementing this phase.

Applicable skills:

- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md) for adding the `isTextUploaded` field to `FileEntity`;
- [`add-dto`](../../../../.agents/skills/add-dto/SKILL.md) as the DTO creation pattern for the three new shared DTOs;
- [`add-module`](../../../../.agents/skills/add-module/SKILL.md) for creating `TranscriptionResultModule` in the API and `KafkaProducerModule` in the Transcriber;
- [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) for `uploadFile`, `generatePresignedGetUrl`, `transcribe`, `processResult`, `getFileStatus`, and `getTranscriptDownloadUrl`;
- [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md) for `GET /files/:id/status` and `GET /files/:id/transcript`;
- [`create-api-hook`](../../../../.agents/skills/create-api-hook/SKILL.md) for the `useFileStatusApi` hook in the Frontend.

Skill adaptation notes:

- When a skill conflicts with this phase specification, this `phase.md` and `tasks.md` take precedence.
- Skills not applicable to this phase: `new-nest`, `new-next`, `new-pg-typeorm`, `add-swagger`, `add-api-gen`.

---

## 18. Acceptance Criteria

- `OPENAI_API_KEY` is present in `apps/transcriber/.env.example` and root `.env.example`.
- `docker-compose.yml` passes `OPENAI_API_KEY` to the `transcriber` service.
- `openai` is listed in root `package.json` `dependencies`.
- DB migration adds `is_text_uploaded boolean NOT NULL DEFAULT false` to the `file` table.
- `FileEntity` exposes `isTextUploaded: boolean` mapped to column `is_text_uploaded`.
- Transcriber calls OpenAI Whisper API after downloading the audio file.
- Transcriber saves the transcript text to `<cwd>/<fileId>.txt`.
- Transcriber uploads `text-<fileId>` to Cloudflare R2.
- Transcriber logs `Transcription complete: fileId=<fileId>`.
- Transcriber publishes `{ jobId, fileId, status: 'COMPLETED' }` to Kafka `transcription.results`.
- On transcription error the Transcriber publishes `{ jobId, fileId, status: 'FAILED', errorMessage }` to `transcription.results`.
- API Kafka consumer for `transcription.results` sets `file.status = COMPLETED`, `file.isTextUploaded = true`, `job.status = COMPLETED`, `job.completedAt` on a `COMPLETED` message.
- API Kafka consumer sets `file.status = FAILED`, `job.status = FAILED`, `job.errorMessage`, `job.completedAt` on a `FAILED` message.
- `GET /files/:id/status` returns `{ fileId, status, isTextUploaded }` for the file owner.
- `GET /files/:id/status` returns `401` for unauthenticated requests.
- `GET /files/:id/status` returns `403` for a non-owner.
- `GET /files/:id/status` returns `404` for a non-existent file.
- `GET /files/:id/transcript` returns `{ fileId, downloadUrl }` when `isTextUploaded === true`.
- `GET /files/:id/transcript` returns `409` when `isTextUploaded === false`.
- `GET /files/:id/transcript` returns `403` for a non-owner and `404` for a non-existent file.
- `TranscriptionResultMessageDto`, `FileStatusResponseDto`, `TranscriptResponseDto` are exported from `@dto`.
- Frontend starts polling `GET /files/:id/status` every 2 seconds after `sendState` becomes `'done'`.
- Frontend stops polling and displays the transcript when `isTextUploaded === true`.
- Frontend stops polling and shows an error when `status === 'FAILED'`.
- Transcript text is rendered in a scrollable `<pre>` block.
- Polling is cancelled on discard, clear, or mode switch.
- `npm run typecheck --workspace @ismart/api` passes.
- `npm run typecheck --workspace @ismart/transcriber` passes.
- `npm run typecheck --workspace @ismart/web` passes.
- `npm run build --workspace @ismart/api` passes.
- `npm run build --workspace @ismart/transcriber` passes.
- `docker compose config` passes.
