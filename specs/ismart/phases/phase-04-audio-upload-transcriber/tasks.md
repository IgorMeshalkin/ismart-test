# Phase 04 - Audio Upload To Transcriber Tasks

## Status Legend

- `Pending` - not started.
- `In Progress` - implementation started.
- `Completed` - implemented and validated.
- `Blocked` - cannot proceed without clarification or dependency.

---

## Task 01 - Add Cloudflare R2 Environment Variables

Status:
Completed

Description:
Add the four Cloudflare R2 environment variables to all `.env.example` files and to `docker-compose.yml`.

Files to change:

- `apps/api/.env.example` — append the four variables with empty values.
- `apps/transcriber/.env.example` — append the four variables with empty values.
- `.env.example` (root) — append the four variables with empty values.
- `docker-compose.yml` — add the four variables to the `environment` block of both `api` and `transcriber` services, sourced from `${CLOUD_STORAGE_*}`.

Variables to add:

```text
CLOUD_STORAGE_BUCKET_NAME=
CLOUD_STORAGE_ACCOUNT_ID=
CLOUD_STORAGE_ACCESS_KEY_ID=
CLOUD_STORAGE_SECRET_ACCESS_KEY=
```

Acceptance Criteria:

- all four variables appear in all three `.env.example` files with empty values;
- `docker-compose.yml` passes all four variables to both `api` and `transcriber`;
- `docker compose config` passes without error.

---

## Task 02 - Install New Dependencies

Status:
Completed

Description:
Add the required packages to the root `package.json` and run `npm install`.

Add to `dependencies`:

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `@nestjs/microservices`
- `kafkajs`

Acceptance Criteria:

- all four packages are listed in root `package.json` `dependencies`;
- `npm install` completes without error.

---

## Task 03 - Add Shared DTOs For Phase 04

Skill: `/add-dto`

Status:
Completed

Description:
Create the four new shared DTOs and export them from the `@dto` barrel.

Files to create:

`libs/shared/src/dto/create-file.dto.ts`:

```ts
export class CreateFileDto {
  originalName!: string;
  durationSeconds!: number;
  sizeBytes!: number;
}
```

`libs/shared/src/dto/create-file-response.dto.ts`:

```ts
export class CreateFileResponseDto {
  fileId!: string;
  uploadUrl!: string;
}
```

`libs/shared/src/dto/confirm-upload-response.dto.ts`:

```ts
export class ConfirmUploadResponseDto {
  fileId!: string;
  status!: string;
}
```

`libs/shared/src/dto/transcription-job-message.dto.ts`:

```ts
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

Update `libs/shared/src/dto/index.ts` to export all four new DTOs.

Acceptance Criteria:

- all four DTO files exist under `libs/shared/src/dto/`;
- all four are exported from the `@dto` barrel;
- `npm run typecheck --workspace @ismart/api` passes;
- `npm run typecheck --workspace @ismart/transcriber` passes.

---

## Task 04 - Implement StorageModule And KafkaProducerModule In API

Skills: `/add-module` (for each module), `/create-service-method` (for `generatePresignedPutUrl` and `publish`)

Status:
Completed

Description:
Add `StorageModule` with `StorageService` for R2 presigned URL generation, and `KafkaProducerModule` with `KafkaProducerService` for Kafka publishing.

### StorageService

File: `apps/api/src/storage/storage.service.ts`

Reads from `ConfigService`:

- `CLOUD_STORAGE_ACCOUNT_ID`
- `CLOUD_STORAGE_ACCESS_KEY_ID`
- `CLOUD_STORAGE_SECRET_ACCESS_KEY`
- `CLOUD_STORAGE_BUCKET_NAME`

Creates an `S3Client` with:

```ts
{
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
}
```

Exposes:

```ts
generatePresignedPutUrl(key: string, expiresIn: number): Promise<string>
```

Uses `PutObjectCommand` + `getSignedUrl` from `@aws-sdk/s3-request-presigner`.

File: `apps/api/src/storage/storage.module.ts` — exports `StorageService`.

### KafkaProducerService

File: `apps/api/src/kafka/kafka-producer.service.ts`

Registers a `ClientKafka` via `@nestjs/microservices` with:

- `clientId: 'ismart-api'`
- `brokers`: `KAFKA_BROKERS` split by comma

Exposes:

```ts
publish(topic: string, key: string, message: unknown): Promise<void>
```

Connects the client on module init (`onModuleInit`) and disconnects on module destroy (`onModuleDestroy`).

File: `apps/api/src/kafka/kafka-producer.module.ts` — exports `KafkaProducerService`.

Acceptance Criteria:

- `StorageService` and `KafkaProducerService` compile without errors;
- `npm run typecheck --workspace @ismart/api` passes.

---

## Task 05 - Implement FilesModule In API

Skills: `/add-module` (for `FilesModule`), `/create-endpoint` (for each route), `/create-service-method` (for `createFile` and `confirmUpload`)

Status:
Completed

Description:
Add `FilesModule` with `FilesController` and `FilesService` implementing both `POST /files` and `POST /files/:id/upload-complete`.

### FilesController

File: `apps/api/src/files/files.controller.ts`

Routes:

- `POST /files` — guarded by `JwtAuthGuard`; body `CreateFileDto`; returns `CreateFileResponseDto`; HTTP `201`.
- `POST /files/:id/upload-complete` — guarded by `JwtAuthGuard`; no body; returns `ConfirmUploadResponseDto`; HTTP `200`.

### FilesService

File: `apps/api/src/files/files.service.ts`

Method `createFile(dto: CreateFileDto, userId: string): Promise<CreateFileResponseDto>`:

1. Create and save `FileEntity` (`status = UPLOADING`, `authorId = userId`).
2. Call `storageService.generatePresignedPutUrl(file.audioStorageKey, 900)`.
3. Return `{ fileId: file.id, uploadUrl }`.

Method `confirmUpload(fileId: string, userId: string): Promise<ConfirmUploadResponseDto>`:

1. Load `FileEntity` by `fileId`; throw `NotFoundException` if not found.
2. Verify `file.authorId === userId`; throw `ForbiddenException` if not.
3. Verify `file.status === FileStatus.UPLOADING`; throw `ConflictException` if not.
4. Set `file.status = FileStatus.TRANSCRIBING`; save.
5. Create and save `TranscriptionJobEntity`:
   - `fileId = file.id`, `status = PENDING`;
   - `requestTopic = 'transcription.jobs'`, `responseTopic = 'transcription.results'`;
   - `errorMessage = null`, `startedAt = null`, `completedAt = null`.
6. Build `TranscriptionJobMessageDto` from file and job fields.
7. Call `kafkaProducerService.publish('transcription.jobs', file.id, message)`.
8. Return `{ fileId: file.id, status: 'TRANSCRIBING' }`.

File: `apps/api/src/files/files.module.ts` — imports `StorageModule`, `KafkaProducerModule`, `TypeOrmModule.forFeature([FileEntity, TranscriptionJobEntity])`.

Register `FilesModule` in `AppModule`.

Acceptance Criteria:

- `POST /files` returns `201` with `{ fileId, uploadUrl }` for an authenticated request;
- `POST /files` returns `401` for a request without a Bearer token;
- a `FileEntity` row with status `UPLOADING` is created;
- `POST /files/:id/upload-complete` returns `200` with `{ fileId, status: 'TRANSCRIBING' }`;
- `POST /files/:id/upload-complete` returns `403` when the caller is not the file owner;
- `POST /files/:id/upload-complete` returns `404` when the file does not exist;
- `POST /files/:id/upload-complete` returns `409` when file status is not `UPLOADING`;
- `TranscriptionJobEntity` row with status `PENDING` is created after a successful confirm;
- a `TranscriptionJobMessageDto` is published to Kafka `transcription.jobs` after a successful confirm;
- `npm run typecheck --workspace @ismart/api` passes;
- `npm run build --workspace @ismart/api` passes.

---

## Task 06 - Implement Kafka Consumer And File Download In Transcriber

Skills: `/add-module` (for `StorageModule` and `TranscriptionModule`), `/create-service-method` (for `downloadFile`)

Status:
Completed

Description:
Add `StorageModule`, Kafka microservice transport, and `TranscriptionConsumer` to the Transcriber.

### StorageService (Transcriber)

File: `apps/transcriber/src/storage/storage.service.ts`

Same S3 client configuration as the API `StorageService`.

Exposes:

```ts
downloadFile(audioStorageKey: string, destPath: string): Promise<void>
```

Behavior:

1. Issue `GetObjectCommand` for the key from `CLOUD_STORAGE_BUCKET_NAME`.
2. Read the response body stream and write to `destPath` using `fs.promises`.
3. Log `File saved: <destPath>`.

File: `apps/transcriber/src/storage/storage.module.ts` — exports `StorageService`.

### Kafka Consumer Setup

In `apps/transcriber/src/main.ts`, connect the Kafka microservice alongside the HTTP server:

```ts
app.connectMicroservice({
  transport: Transport.KAFKA,
  options: {
    client: { clientId: 'ismart-transcriber', brokers: kafkaBrokers },
    consumer: { groupId: 'ismart-transcriber' },
  },
});
await app.startAllMicroservices();
```

`kafkaBrokers` is read from `KAFKA_BROKERS` env var (split by comma).

### TranscriptionConsumer

File: `apps/transcriber/src/transcription/transcription.consumer.ts`

Uses `@EventPattern('transcription.jobs')` with payload type `TranscriptionJobMessageDto`.

On message received:

1. Log `Received job: jobId=<jobId> fileId=<fileId>`.
2. Compute `destPath = path.join(process.cwd(), '<fileId>.webm')`.
3. Call `storageService.downloadFile(audioStorageKey, destPath)`.

File: `apps/transcriber/src/transcription/transcription.module.ts` — imports `StorageModule`, declares `TranscriptionConsumer`.

Register `TranscriptionModule` in `AppModule`.

Acceptance Criteria:

- Transcriber starts without error when Kafka is available;
- Transcriber logs `Received job: jobId=<jobId> fileId=<fileId>` on message receipt;
- Transcriber downloads the file from R2 and saves it to `<cwd>/<fileId>.webm`;
- Transcriber logs `File saved: <path>`;
- the saved file is present in the Transcriber working directory after the flow completes;
- `npm run typecheck --workspace @ismart/transcriber` passes;
- `npm run build --workspace @ismart/transcriber` passes.

---

## Task 07 - Add Send Flow To Frontend

Skill: `/create-api-hook` (for `useFilesApi`)

Status:
Completed

Description:
Add `useFilesApi` hook and three-step send flow to `AudioInputComponent`.

### useFilesApi Hook

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

export function useFilesApi(): {
  createFile: (params: CreateFileParams) => Promise<CreateFileResult>;
  confirmUpload: (fileId: string) => Promise<ConfirmUploadResult>;
}
```

- Reads `NEXT_PUBLIC_API_URL` from `process.env`.
- Reads the access token from `localStorage.getItem('ismart.accessToken')`.
- `createFile`: `POST /files` with `Authorization: Bearer <token>` and JSON body.
- `confirmUpload`: `POST /files/<fileId>/upload-complete` with `Authorization: Bearer <token>`.
- Both throw on non-2xx responses.

### AudioInputComponent Changes

Add to state:

- `sendState: 'idle' | 'sending' | 'done' | 'error'` (default `'idle'`);
- `sentFileId: string | null` (default `null`);
- `uploadProgress: number` (default `0`, range 0–100).

Show "Send" button:

- record mode: when `recordState === 'done'`, below the audio player;
- upload mode: when file is selected, below the audio player.

On Send click:

1. Check that `localStorage.getItem('ismart.accessToken')` is non-null; if not, set `sendState = 'error'` with message "You must be logged in to send a file." and return.
2. Set `sendState = 'sending'`; show "Sending…"; disable button.
3. `const { fileId, uploadUrl } = await createFile(metadata)`.
4. Upload the blob via `XMLHttpRequest` PUT (not `fetch`) to `uploadUrl`; on each `progress` event set `uploadProgress = Math.round(loaded / total * 100)`; while in progress show a progress bar below the Send button with label "Uploading… X%".
5. `await confirmUpload(fileId)`.
6. Set `sendState = 'done'`; set `sentFileId = fileId`; show "File sent. ID: <fileId>".
7. On any error in steps 3–5: set `sendState = 'error'`; show a readable error message.

Metadata per mode:

- record: `{ originalName: 'recording.webm', durationSeconds: seconds, sizeBytes: recordedBlob.size }`.
- upload: `{ originalName: file.name, durationSeconds: Math.round(audioDuration), sizeBytes: file.size }`. `audioDuration` is read from the `<audio>` element after `onLoadedMetadata`.

Reset `sendState` to `'idle'` and `uploadProgress` to `0` on discard, clear, or mode switch.

### SidebarComponent: Logout Button

Replace the Profile `<Link>` in `SidebarComponent` with a `<button>` labeled "Logout".

On click:

1. `localStorage.removeItem('ismart.accessToken')`.
2. `router.push('/')` using `useRouter` from `next/navigation`.

Style the button to match the existing sidebar nav-item appearance.

Acceptance Criteria:

- Send button appears after recording completes;
- Send button appears after a file is selected in upload mode;
- clicking Send without a stored access token shows "You must be logged in to send a file." and does not call the API;
- clicking Send executes all three steps in order when authenticated;
- a progress bar with "Uploading… X%" appears during the presigned PUT step;
- success state shows the file ID;
- error state shows a readable message;
- the Logout button in the sidebar clears the token and navigates to `/`;
- `npm run typecheck --workspace @ismart/web` passes.

---

## Task 08 - Validate Phase 04

Status:
Completed

Description:
Validate the complete phase 04 implementation.

Required commands:

```text
npm run typecheck --workspace @ismart/api
npm run typecheck --workspace @ismart/transcriber
npm run typecheck --workspace @ismart/web
npm run build --workspace @ismart/api
npm run build --workspace @ismart/transcriber
docker compose config
```

End-to-end validation (requires real Cloudflare R2 credentials in `.env`):

1. Start services: `docker compose up`.
2. Open `http://localhost:3000`, log in, navigate to Files.
3. Record audio or upload an audio file.
4. Click Send.
5. Confirm the frontend shows the success state with a file ID.
6. Confirm the audio file exists at `<transcriber-cwd>/<fileId>.webm` inside the Transcriber container.
7. Confirm Transcriber logs show `Received job: jobId=... fileId=...` and `File saved: ...`.

Acceptance Criteria:

- all typecheck commands pass with zero errors;
- both build commands pass;
- `docker compose config` passes;
- end-to-end flow produces the file in the Transcriber working directory.
