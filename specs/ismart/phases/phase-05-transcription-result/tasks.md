# Phase 05 - Transcription Result Processing Tasks

## Skill Usage

Developer must use relevant local skills from `.agents/skills` when implementing tasks.

For Phase 05, applicable skills are:

- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md) for adding the `isTextUploaded` field to `FileEntity`;
- [`add-dto`](../../../../.agents/skills/add-dto/SKILL.md) as the DTO style pattern for the three new shared DTOs;
- [`add-module`](../../../../.agents/skills/add-module/SKILL.md) for `TranscriptionResultModule` in the API and `KafkaProducerModule` in the Transcriber;
- [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) for `uploadFile`, `generatePresignedGetUrl`, `transcribe`, `processResult`, `getFileStatus`, and `getTranscriptDownloadUrl`;
- [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md) for `GET /files/:id/status` and `GET /files/:id/transcript`;
- [`create-api-hook`](../../../../.agents/skills/create-api-hook/SKILL.md) for the `useFileStatusApi` hook.

Skills not applicable to Phase 05 unless the phase is explicitly expanded:

- [`new-nest`](../../../../.agents/skills/new-nest/SKILL.md) because applications already exist;
- [`new-next`](../../../../.agents/skills/new-next/SKILL.md) because the frontend application already exists;
- [`new-pg-typeorm`](../../../../.agents/skills/new-pg-typeorm/SKILL.md) because the database connection is already configured;
- [`add-swagger`](../../../../.agents/skills/add-swagger/SKILL.md) because Swagger is not required for the MVP;
- [`add-api-gen`](../../../../.agents/skills/add-api-gen/SKILL.md) because API generation is not required.

When a skill conflicts with the approved phase scope, `phase.md`, `tasks.md`, and `specs/ismart/domain-model.md` take precedence.

---

## Status Legend

- `Pending` - not started.
- `In Progress` - implementation started.
- `Completed` - implemented and validated.
- `Blocked` - cannot proceed without clarification or dependency.

---

## Task 01 - Add OPENAI_API_KEY Environment Variable

Status:
Pending

Description:
Add `OPENAI_API_KEY` to all relevant env files and `docker-compose.yml`.

Files to change:

- `apps/transcriber/.env.example` — append `OPENAI_API_KEY=` with an empty value.
- `.env.example` (root) — append `OPENAI_API_KEY=` with an empty value.
- `docker-compose.yml` — add `OPENAI_API_KEY: ${OPENAI_API_KEY}` to the `environment` block of the `transcriber` service.

Acceptance Criteria:

- `OPENAI_API_KEY=` appears in both `.env.example` files with empty values;
- `docker-compose.yml` passes `OPENAI_API_KEY` to the `transcriber` service;
- `docker compose config` passes without error.

---

## Task 02 - Install openai Package

Status:
Pending

Description:
Add the `openai` package to the root `package.json` and run `npm install`.

Add to `dependencies`:

- `openai`

Acceptance Criteria:

- `openai` is listed in root `package.json` `dependencies`;
- `npm install` completes without error.

---

## Task 03 - Add DB Migration: isTextUploaded Column

Skill: [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md) (for the new `isTextUploaded` field on `FileEntity`)

Status:
Pending

Description:
Add a TypeORM migration that adds `is_text_uploaded` to the `file` table, and update `FileEntity`.

### Migration

Create a new migration file in `apps/api/src/migrations/` (or wherever existing migrations live).

SQL equivalent:

```sql
ALTER TABLE "file" ADD COLUMN "is_text_uploaded" boolean NOT NULL DEFAULT false;
```

### FileEntity Change

Add to `apps/api/src/files/entities/file.entity.ts` (or wherever `FileEntity` is defined):

```ts
@Column({ name: 'is_text_uploaded', type: 'boolean', default: false })
isTextUploaded: boolean;
```

Acceptance Criteria:

- migration file exists and runs without error (`npm run migration:run --workspace @ismart/api` or equivalent);
- `FileEntity` has an `isTextUploaded` field mapped to `is_text_uploaded`;
- `npm run typecheck --workspace @ismart/api` passes.

---

## Task 04 - Add Shared DTOs for Phase 05

Skill: [`add-dto`](../../../../.agents/skills/add-dto/SKILL.md)

Status:
Pending

Description:
Create the three new shared DTOs and export them from the `@dto` barrel.

Files to create:

`libs/shared/src/dto/transcription-result-message.dto.ts`:

```ts
export class TranscriptionResultMessageDto {
  jobId!: string;
  fileId!: string;
  status!: 'COMPLETED' | 'FAILED';
  errorMessage?: string;
}
```

`libs/shared/src/dto/file-status-response.dto.ts`:

```ts
export class FileStatusResponseDto {
  fileId!: string;
  status!: string;
  isTextUploaded!: boolean;
}
```

`libs/shared/src/dto/transcript-response.dto.ts`:

```ts
export class TranscriptResponseDto {
  fileId!: string;
  downloadUrl!: string;
}
```

Update `libs/shared/src/dto/index.ts` to export all three new DTOs.

Acceptance Criteria:

- all three DTO files exist under `libs/shared/src/dto/`;
- all three are exported from the `@dto` barrel;
- `npm run typecheck --workspace @ismart/api` passes;
- `npm run typecheck --workspace @ismart/transcriber` passes.

---

## Task 05 - Extend StorageService in Transcriber (uploadFile)

Skill: [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) (for `uploadFile`)

Status:
Pending

Description:
Add `uploadFile(key, filePath)` to `apps/transcriber/src/storage/storage.service.ts`.

Method signature:

```ts
uploadFile(key: string, filePath: string): Promise<void>
```

Behavior:

1. Read file content from `filePath` with `fs.promises.readFile`.
2. Issue `PutObjectCommand` with `Key: key`, `Bucket: CLOUD_STORAGE_BUCKET_NAME`, `Body: content`.
3. Log `File uploaded: key=<key>`.

Acceptance Criteria:

- `uploadFile` compiles without errors;
- `npm run typecheck --workspace @ismart/transcriber` passes.

---

## Task 06 - Extend StorageService in API (generatePresignedGetUrl)

Skill: [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) (for `generatePresignedGetUrl`)

Status:
Pending

Description:
Add `generatePresignedGetUrl(key, expiresIn)` to `apps/api/src/storage/storage.service.ts`.

Method signature:

```ts
generatePresignedGetUrl(key: string, expiresIn: number): Promise<string>
```

Uses `GetObjectCommand` and `getSignedUrl` from `@aws-sdk/s3-request-presigner`.

Acceptance Criteria:

- `generatePresignedGetUrl` compiles without errors;
- `npm run typecheck --workspace @ismart/api` passes.

---

## Task 07 - Implement Transcription Logic in Transcriber

Skills: [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) (for `TranscriptionService.transcribe`), [`add-module`](../../../../.agents/skills/add-module/SKILL.md) (for `KafkaProducerModule` in Transcriber)

Status:
Pending

Description:
Add `TranscriptionService` and extend `TranscriptionConsumer` to perform the full transcription cycle.

### TranscriptionService

File: `apps/transcriber/src/transcription/transcription.service.ts`

Method:

```ts
transcribe(fileId: string, audioPath: string): Promise<string>
```

Behavior:

1. Create `OpenAI` client using `OPENAI_API_KEY` from `ConfigService`.
2. Open `audioPath` as `fs.createReadStream`.
3. Call `openai.audio.transcriptions.create({ file: stream, model: 'whisper-1' })`.
4. Compute `textPath = path.join(process.cwd(), '<fileId>.txt')`.
5. Write text to `textPath` with `fs.promises.writeFile`.
6. Call `storageService.uploadFile('text-<fileId>', textPath)`.
7. Log `Transcription complete: fileId=<fileId>`.
8. Return `textPath`.

### Kafka Producer in Transcriber

Register a `ClientKafka` in a `KafkaProducerModule` inside the Transcriber (same pattern as the API's `KafkaProducerModule`):

- `clientId: 'ismart-transcriber-producer'`
- `brokers`: `KAFKA_BROKERS` split by comma

Exposes:

```ts
publish(topic: string, key: string, message: unknown): Promise<void>
```

### TranscriptionConsumer Changes

After the file is downloaded (existing phase 04 code), add:

1. Call `transcriptionService.transcribe(fileId, destPath)`.
2. On success: publish `{ jobId, fileId, status: 'COMPLETED' }` to `transcription.results` with key `fileId`.
3. On error: log the error; publish `{ jobId, fileId, status: 'FAILED', errorMessage: error.message }` to `transcription.results` with key `fileId`.

Acceptance Criteria:

- Transcriber calls OpenAI Whisper API after downloading the audio;
- transcript text is saved to `<cwd>/<fileId>.txt`;
- `text-<fileId>` is uploaded to R2;
- Transcriber logs `Transcription complete: fileId=<fileId>`;
- Kafka message is published to `transcription.results` on success and on failure;
- `npm run typecheck --workspace @ismart/transcriber` passes;
- `npm run build --workspace @ismart/transcriber` passes.

---

## Task 08 - Add Kafka Consumer for transcription.results in API

Skills: [`add-module`](../../../../.agents/skills/add-module/SKILL.md) (for `TranscriptionResultModule`), [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) (for `processResult`)

Status:
Pending

Description:
Add a Kafka consumer in the API that listens to `transcription.results` and updates `FileEntity` and `TranscriptionJobEntity`.

### Kafka Microservice Transport in API

Connect the Kafka microservice to the API's `main.ts` (alongside the existing HTTP server) using `app.connectMicroservice()` and `app.startAllMicroservices()`.

Configuration:

```ts
{
  transport: Transport.KAFKA,
  options: {
    client: { clientId: 'ismart-api-consumer', brokers: kafkaBrokers },
    consumer: { groupId: 'ismart-api-consumer' },
  },
}
```

`kafkaBrokers` is read from `KAFKA_BROKERS` (split by comma).

### TranscriptionResultConsumer

File: `apps/api/src/transcription-result/transcription-result.consumer.ts`

Uses `@EventPattern('transcription.results')` with payload `TranscriptionResultMessageDto`.

On `COMPLETED`:

1. Load `TranscriptionJobEntity` by `jobId`; log a warning and return if not found.
2. Set `job.status = TranscriptionJobStatus.COMPLETED`, `job.completedAt = new Date()`.
3. Load `FileEntity` by `job.fileId`.
4. Set `file.status = FileStatus.COMPLETED`, `file.isTextUploaded = true`.
5. Save both.
6. Log `Transcription result processed: fileId=<fileId> status=COMPLETED`.

On `FAILED`:

1. Load `TranscriptionJobEntity` by `jobId`; log a warning and return if not found.
2. Set `job.status = TranscriptionJobStatus.FAILED`, `job.errorMessage = message.errorMessage ?? null`, `job.completedAt = new Date()`.
3. Load `FileEntity` by `job.fileId`.
4. Set `file.status = FileStatus.FAILED`.
5. Save both.
6. Log `Transcription result processed: fileId=<fileId> status=FAILED`.

File: `apps/api/src/transcription-result/transcription-result.module.ts` — imports `TypeOrmModule.forFeature([FileEntity, TranscriptionJobEntity])`, declares `TranscriptionResultConsumer`.

Register `TranscriptionResultModule` in `AppModule`.

Acceptance Criteria:

- API starts its Kafka consumer microservice without error;
- `file.status`, `file.isTextUploaded`, `job.status`, `job.completedAt` are updated correctly on `COMPLETED`;
- `file.status`, `job.status`, `job.errorMessage`, `job.completedAt` are updated correctly on `FAILED`;
- `npm run typecheck --workspace @ismart/api` passes;
- `npm run build --workspace @ismart/api` passes.

---

## Task 09 - Implement File Status and Transcript Endpoints in API

Skills: [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md) (for each route), [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) (for `getFileStatus` and `getTranscriptDownloadUrl`)

Status:
Pending

Description:
Add `GET /files/:id/status` and `GET /files/:id/transcript` to `FilesController` and `FilesService`.

### FilesController

Add to `apps/api/src/files/files.controller.ts`:

- `GET /files/:id/status` — guarded by `JwtAuthGuard`; returns `FileStatusResponseDto`; HTTP `200`.
- `GET /files/:id/transcript` — guarded by `JwtAuthGuard`; returns `TranscriptResponseDto`; HTTP `200`.

### FilesService

Add to `apps/api/src/files/files.service.ts`:

Method `getFileStatus(fileId: string, userId: string): Promise<FileStatusResponseDto>`:

1. Load `FileEntity` by `fileId`; throw `NotFoundException` if not found.
2. Verify `file.authorId === userId`; throw `ForbiddenException` if not.
3. Return `{ fileId: file.id, status: file.status, isTextUploaded: file.isTextUploaded }`.

Method `getTranscriptDownloadUrl(fileId: string, userId: string): Promise<TranscriptResponseDto>`:

1. Load `FileEntity` by `fileId`; throw `NotFoundException` if not found.
2. Verify `file.authorId === userId`; throw `ForbiddenException` if not.
3. Verify `file.isTextUploaded === true`; throw `ConflictException` if not.
4. Call `storageService.generatePresignedGetUrl(file.textStorageKey, 900)`.
5. Return `{ fileId: file.id, downloadUrl }`.

Acceptance Criteria:

- `GET /files/:id/status` returns `200` with `{ fileId, status, isTextUploaded }`;
- `GET /files/:id/status` returns `401` for unauthenticated requests;
- `GET /files/:id/status` returns `403` for non-owners;
- `GET /files/:id/status` returns `404` for non-existent files;
- `GET /files/:id/transcript` returns `200` with `{ fileId, downloadUrl }` when `isTextUploaded === true`;
- `GET /files/:id/transcript` returns `409` when `isTextUploaded === false`;
- `GET /files/:id/transcript` returns `403` and `404` as expected;
- `npm run typecheck --workspace @ismart/api` passes;
- `npm run build --workspace @ismart/api` passes.

---

## Task 10 - Add Polling and Transcript Display to Frontend

Skill: [`create-api-hook`](../../../../.agents/skills/create-api-hook/SKILL.md) (for `useFileStatusApi`)

Status:
Pending

Description:
Add `useFileStatusApi` hook and polling + transcript display logic to `AudioInputComponent`.

### useFileStatusApi Hook

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

export function useFileStatusApi(): {
  getFileStatus: (fileId: string) => Promise<FileStatusResult>;
  getTranscriptDownloadUrl: (fileId: string) => Promise<TranscriptResult>;
}
```

- Reads `NEXT_PUBLIC_API_URL` from `process.env`.
- Reads the access token from `localStorage.getItem('ismart.accessToken')`.
- `getFileStatus`: `GET /files/<fileId>/status` with `Authorization: Bearer <token>`.
- `getTranscriptDownloadUrl`: `GET /files/<fileId>/transcript` with `Authorization: Bearer <token>`.
- Both throw on non-2xx responses.

### AudioInputComponent Changes

Add to state:

- `transcriptState: 'idle' | 'polling' | 'done' | 'error'` (default `'idle'`);
- `transcriptText: string | null` (default `null`);
- `pollingFileId: string | null` (default `null`).

When `sendState` transitions to `'done'`:

1. Set `transcriptState = 'polling'`, `pollingFileId = sentFileId`.
2. Start `setInterval` every 2000 ms calling `getFileStatus(pollingFileId)`.

On each poll:

- If `isTextUploaded === true`:
  1. Clear the interval.
  2. Call `getTranscriptDownloadUrl(fileId)` → `{ downloadUrl }`.
  3. `const text = await fetch(downloadUrl).then(r => r.text())`.
  4. Set `transcriptText = text`, `transcriptState = 'done'`.
- If `status === 'FAILED'`:
  1. Clear the interval.
  2. Set `transcriptState = 'error'`.
- Otherwise: continue polling.

UI additions below the send result section:

- `transcriptState === 'polling'`: show "Processing… waiting for transcript."
- `transcriptState === 'done'`: render `transcriptText` inside a scrollable `<pre>` element.
- `transcriptState === 'error'`: show "Transcription failed."

On discard, clear, or mode switch: clear the interval; reset `transcriptState = 'idle'`, `transcriptText = null`, `pollingFileId = null`.

Acceptance Criteria:

- Frontend starts polling after `sendState = 'done'`;
- polling calls `GET /files/:id/status` every 2 seconds;
- transcript is displayed in a `<pre>` block when `isTextUploaded === true`;
- "Transcription failed." is shown when `status === 'FAILED'`;
- "Processing… waiting for transcript." is shown while polling;
- polling stops on success, failure, or component cleanup (discard/clear/mode switch);
- `npm run typecheck --workspace @ismart/web` passes.

---

## Task 11 - Validate Phase 05

Status:
Pending

Description:
Validate the complete phase 05 implementation.

Required commands:

```text
npm run typecheck --workspace @ismart/api
npm run typecheck --workspace @ismart/transcriber
npm run typecheck --workspace @ismart/web
npm run build --workspace @ismart/api
npm run build --workspace @ismart/transcriber
docker compose config
```

End-to-end validation (requires real credentials in `.env`):

1. Start services: `docker compose up`.
2. Open `http://localhost:3000`, log in, navigate to Files.
3. Record audio or upload an audio file.
4. Click Send; confirm success state with file ID.
5. Observe "Processing… waiting for transcript." below the result.
6. Wait for the Transcriber to process the audio.
7. Confirm the transcript text appears on screen inside the `<pre>` block.
8. Confirm Transcriber logs show `Transcription complete: fileId=...` and `File uploaded: key=text-...`.
9. Confirm API DB row for the file has `status = COMPLETED` and `is_text_uploaded = true`.

Acceptance Criteria:

- all typecheck commands pass with zero errors;
- both build commands pass;
- `docker compose config` passes;
- end-to-end flow produces visible transcript text in the frontend.
