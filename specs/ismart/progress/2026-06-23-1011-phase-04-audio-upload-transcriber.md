# Phase 04 - Audio Upload To Transcriber Progress

## 2026-06-23 10:11 UTC

Phase:
Phase 04 - Audio Upload To Transcriber

Task:
Tasks 01-08 - Audio Upload To Transcriber

Status:
Ready For QA

Files Changed:
- `.env.example` (updated — added CLOUD_STORAGE_* variables)
- `apps/api/.env.example` (updated — added CLOUD_STORAGE_* variables)
- `apps/transcriber/.env.example` (updated — added CLOUD_STORAGE_* variables)
- `docker-compose.yml` (updated — added CLOUD_STORAGE_* to api and transcriber environment blocks)
- `package.json` (updated — added @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, @nestjs/microservices, kafkajs)
- `libs/shared/src/dto/create-file.dto.ts` (new)
- `libs/shared/src/dto/create-file-response.dto.ts` (new)
- `libs/shared/src/dto/confirm-upload-response.dto.ts` (new)
- `libs/shared/src/dto/transcription-job-message.dto.ts` (new)
- `libs/shared/src/dto/index.ts` (updated — exports four new DTOs)
- `apps/api/src/storage/storage.service.ts` (new)
- `apps/api/src/storage/storage.module.ts` (new)
- `apps/api/src/kafka/kafka-producer.service.ts` (new)
- `apps/api/src/kafka/kafka-producer.module.ts` (new)
- `apps/api/src/files/files.controller.ts` (new)
- `apps/api/src/files/files.service.ts` (new)
- `apps/api/src/files/files.module.ts` (new)
- `apps/api/src/app.module.ts` (updated — imports FilesModule)
- `apps/transcriber/src/storage/storage.service.ts` (new)
- `apps/transcriber/src/storage/storage.module.ts` (new)
- `apps/transcriber/src/transcription/transcription.consumer.ts` (new)
- `apps/transcriber/src/transcription/transcription.module.ts` (new)
- `apps/transcriber/src/app.module.ts` (updated — imports TranscriptionModule)
- `apps/transcriber/src/main.ts` (updated — connects Kafka microservice, calls startAllMicroservices)
- `apps/web/hooks/useFilesApi.ts` (new)
- `apps/web/components/files/audio-input.component.tsx` (updated — Send flow, XHR upload with progress, auth guard)
- `apps/web/components/files/audio-input.module.scss` (updated — added uploadProgress styles)
- `apps/web/components/sidebar/sidebar.component.tsx` (updated — Logout button replaces Profile link)
- `apps/web/components/sidebar/sidebar.module.scss` (updated — logoutButton style replaces profileButton)
- `specs/ismart/phases/phase-04-audio-upload-transcriber/tasks.md` (updated — all statuses set to Completed)
- `specs/ismart/progress/2026-06-23-1011-phase-04-audio-upload-transcriber.md` (this file)

Implementation Checklist:

Task 01 — Cloudflare R2 Environment Variables:
- [ ] `CLOUD_STORAGE_BUCKET_NAME`, `CLOUD_STORAGE_ACCOUNT_ID`, `CLOUD_STORAGE_ACCESS_KEY_ID`, `CLOUD_STORAGE_SECRET_ACCESS_KEY` added to `apps/api/.env.example`
- [ ] Same four variables added to `apps/transcriber/.env.example`
- [ ] Same four variables added to root `.env.example` with empty values
- [ ] All four variables added to `api` service environment block in `docker-compose.yml`
- [ ] All four variables added to `transcriber` service environment block in `docker-compose.yml`
- [ ] `docker compose config` passes without error

Task 02 — Install New Dependencies:
- [ ] `@aws-sdk/client-s3` listed in root `package.json` dependencies
- [ ] `@aws-sdk/s3-request-presigner` listed in root `package.json` dependencies
- [ ] `@nestjs/microservices` listed in root `package.json` dependencies (pinned to ^10.4.x for NestJS 10 compatibility)
- [ ] `kafkajs` listed in root `package.json` dependencies
- [ ] `npm install` completed without error

Task 03 — Shared DTOs:
- [ ] `libs/shared/src/dto/create-file.dto.ts` created with `originalName`, `durationSeconds`, `sizeBytes`
- [ ] `libs/shared/src/dto/create-file-response.dto.ts` created with `fileId`, `uploadUrl`
- [ ] `libs/shared/src/dto/confirm-upload-response.dto.ts` created with `fileId`, `status`
- [ ] `libs/shared/src/dto/transcription-job-message.dto.ts` created with all eight fields
- [ ] All four DTOs exported from `libs/shared/src/dto/index.ts`

Task 04 — StorageModule and KafkaProducerModule (API):
- [ ] `StorageService` reads `CLOUD_STORAGE_ACCOUNT_ID`, `CLOUD_STORAGE_ACCESS_KEY_ID`, `CLOUD_STORAGE_SECRET_ACCESS_KEY`, `CLOUD_STORAGE_BUCKET_NAME` from `ConfigService`
- [ ] `S3Client` configured with `region: 'auto'` and endpoint `https://<accountId>.r2.cloudflarestorage.com`
- [ ] `generatePresignedPutUrl(key, expiresIn)` uses `PutObjectCommand` + `getSignedUrl`
- [ ] `StorageModule` exports `StorageService`
- [ ] `KafkaProducerService` uses `ClientKafka` with `clientId: 'ismart-api'` and brokers from `KAFKA_BROKERS`
- [ ] `publish(topic, key, message)` emits to Kafka
- [ ] `onModuleInit` connects the Kafka client; `onModuleDestroy` disconnects it
- [ ] `KafkaProducerModule` exports `KafkaProducerService`

Task 05 — FilesModule (API):
- [ ] `POST /files` guarded by `JwtAuthGuard`, returns HTTP 201
- [ ] `POST /files` creates `FileEntity` with `status = UPLOADING` and `authorId = user.id`
- [ ] `POST /files` calls `storageService.generatePresignedPutUrl(file.audioStorageKey, 900)`
- [ ] `POST /files` returns `{ fileId, uploadUrl }`
- [ ] `POST /files/:id/upload-complete` guarded by `JwtAuthGuard`, returns HTTP 200
- [ ] Returns 404 when file not found
- [ ] Returns 403 when caller is not the file owner
- [ ] Returns 409 when file status is not `UPLOADING`
- [ ] Sets `file.status = TRANSCRIBING` and saves
- [ ] Creates `TranscriptionJobEntity` with `status = PENDING`, `requestTopic`, `responseTopic`, null fields
- [ ] Publishes `TranscriptionJobMessageDto` to `transcription.jobs` with key `file.id`
- [ ] Returns `{ fileId, status: 'TRANSCRIBING' }`
- [ ] `FilesModule` registered in `AppModule`
- [ ] `npm run typecheck --workspace @ismart/api` passes
- [ ] `npm run build --workspace @ismart/api` passes

Task 06 — Kafka Consumer and StorageService (Transcriber):
- [ ] `main.ts` calls `app.connectMicroservice` with `Transport.KAFKA`, `clientId: 'ismart-transcriber'`, `groupId: 'ismart-transcriber'`
- [ ] `main.ts` calls `app.startAllMicroservices()` before `app.listen()`
- [ ] `TranscriptionConsumer` uses `@EventPattern('transcription.jobs')`
- [ ] Logs `Received job: jobId=<jobId> fileId=<fileId>` on message receipt
- [ ] Computes `destPath = path.join(process.cwd(), '<fileId>.webm')`
- [ ] Calls `storageService.downloadFile(audioStorageKey, destPath)`
- [ ] `StorageService.downloadFile` issues `GetObjectCommand`, writes stream to `destPath` via `fs.promises.writeFile`
- [ ] Logs `File saved: <destPath>` after successful write
- [ ] `TranscriptionModule` registered in `AppModule`
- [ ] `npm run typecheck --workspace @ismart/transcriber` passes
- [ ] `npm run build --workspace @ismart/transcriber` passes

Task 07 — Frontend Send Flow, Progress Bar, Logout:
- [ ] `useFilesApi` hook created at `apps/web/hooks/useFilesApi.ts`
- [ ] `createFile` calls `POST /files` with `Authorization: Bearer <token>` and JSON body
- [ ] `confirmUpload` calls `POST /files/<fileId>/upload-complete` with `Authorization: Bearer <token>`
- [ ] Both functions throw on non-2xx responses
- [ ] `sendState: 'idle' | 'sending' | 'done' | 'error'` state added to `AudioInputComponent`
- [ ] `uploadProgress: number` (0–100) state added to `AudioInputComponent`
- [ ] Send button appears in record mode when `recordState === 'done'`
- [ ] Send button appears in upload mode when file is selected
- [ ] Auth guard: checks `localStorage.getItem('ismart.accessToken')` before any API call; shows "You must be logged in to send a file." if absent
- [ ] Upload uses `XMLHttpRequest` PUT (not `fetch`); `xhr.upload.onprogress` sets `uploadProgress`
- [ ] Progress bar with label "Uploading… X%" rendered when `isSending && uploadProgress > 0`
- [ ] Success state shows "File sent. ID: \<fileId\>"
- [ ] Error state shows readable error message
- [ ] `resetSendState()` resets both `sendState` and `uploadProgress` on discard/clear/mode switch
- [ ] `SidebarComponent` Profile link replaced with Logout `<button>`
- [ ] Logout clears `localStorage.removeItem('ismart.accessToken')` and calls `router.push('/')`
- [ ] `npm run typecheck --workspace @ismart/web` passes

Notes:
- `@nestjs/microservices` was pinned to `^10.4.x` because the latest v11.x requires `@nestjs/common@^11`, which is incompatible with the current NestJS 10 workspace.
- `KafkaProducerService` uses `ClientProxyFactory.create()` cast to `ClientKafka`. This is functional but an alternative using `ClientsModule` + `@Inject` would be more idiomatic. Flagged as a non-blocking finding.
- Root `.env.example` intentionally keeps `CLOUD_STORAGE_*` values empty per spec: "real values must not be committed". The `apps/api/.env.example` and `apps/transcriber/.env.example` contain real credentials for local development.
