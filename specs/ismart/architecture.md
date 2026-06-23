# iSmart Architecture

## 1. Общая архитектура

iSmart построен как веб-приложение с разделением на frontend, backend, объектное хранилище и асинхронные фоновые процессы.

Архитектура должна поддерживать:

- горизонтальное масштабирование;
- управляемую обработку аудио до загрузки объектов в хранилище;
- независимое развитие компонентов;
- замену внешних провайдеров без изменения бизнес-логики.

---

## 2. Технологический стек

### Frontend

- Next.js
- React
- TypeScript

### Backend

- NestJS
- TypeScript

### Database

- PostgreSQL

### ORM

- TypeORM

### Object Storage

- Cloudflare R2

### Messaging

- Apache Kafka

### Containerization

- Docker

---

## 3. Структура монорепозитория

```text
/apps
├── api
├── transcriber
└── web

/libs
└── shared

/specs
└── ismart
    ├── spec.md
    ├── architecture.md
    ├── domain-model.md
    ├── execution-rules.md
    ├── current-state
    ├── progress
    ├── phases
    └── reports

```

### apps/api

Основной backend сервис.

Отвечает за:

- авторизацию;
- работу с пользователями;
- управление тарифами;
- управление файлами;
- проверку и резервирование лимитов при создании файлов;
- финальное списание или освобождение резерва после результата транскрибации;
- базы знаний;
- уведомления;
- публикацию событий.

### apps/transcriber

Сервис асинхронной транскрибации.

Отвечает за:

- получение заданий на транскрибацию из Kafka;
- чтение исходного аудио из Object Storage;
- выполнение транскрибации;
- публикацию результата или ошибки обработки в Kafka.

### apps/web

Frontend приложение.

Отвечает за:

- пользовательский интерфейс;
- запись аудио;
- загрузку файлов;
- отображение транскрипций;
- управление базами знаний.

### libs/shared

Общие типы и контракты.

Содержит:

- DTO;
- enums;
- shared types;
- API contracts.

---

## 4. Компоненты системы

### API Service

Основной backend.

Предоставляет REST API для:

- пользователей;
- файлов;
- подписок;
- баз знаний;
- уведомлений.

---

### Object Storage

Используется для хранения:

- аудиофайлов;
- текстовых транскрипций.

База данных хранит только метаданные файлов без ключей объектов.

Ключи объектов детерминированно вычисляются от `File.id` и отдельно в базе данных не хранятся:

- `audio-<file-id>` — исходный аудиофайл;
- `text-<file-id>` — текстовая транскрипция в формате `.txt`.

Ключи вычисляются на ходу через геттеры `File.audioStorageKey` и `File.textStorageKey`.
В PostgreSQL хранится только `File.id`; отдельные поля для object storage key не создаются.

Kafka сообщения не содержат бинарные аудиоданные.
Transcription Service получает доступ к исходному аудио через ключ объекта `audio-<file-id>`.

---

### Transcription Service

Сервис обработки аудио.

Отвечает за:

- получение заданий на транскрибацию из Kafka;
- выполнение транскрибации;
- публикацию успешного результата транскрибации в Kafka;
- публикацию ошибки обработки в Kafka.

Transcription Service не вызывается напрямую через REST из API.
Взаимодействие между API Service и Transcription Service выполняется строго через Kafka.

---

### Notification Service

Отвечает за доставку уведомлений.

Получает события из Kafka и отправляет уведомления через доступные каналы.

---

## 5. Поток загрузки аудио

```text
Frontend
    │
    ▼
API
    │
    ▼
Check And Reserve User Limits
    │
    ▼
Create File Record
    │
    ▼
Set File Status: UPLOADING
    │
    ▼
Generate Audio Presigned URL
    │
    ▼
Frontend Uploads Audio
    │
    ▼
Object Storage
    │
    └── audio-<file-id>
    │
    ▼
Upload Confirmation
    │
    ▼
Set File Status: TRANSCRIBING
    │
    ▼
Create TranscriptionJob
    │
    ▼
Publish TranscriptionJob To Kafka
    │
    ▼
Kafka Topic: transcription.jobs
    │
    ▼
Transcription Service
    │
    ▼
Kafka Topic: transcription.results
    │
    ▼
API Consumes Transcription Result
    │
    ▼
Store Text Transcript
    │
    └── text-<file-id>
    │
    ▼
Set File Status: COMPLETED And Deduct Reserved Limits
    │
    ▼
Notification Event
```

Порядок выполнения:

1. Frontend передаёт в API метаданные аудио для создания файла и запуска транскрибации.
2. API проверяет активный UserPlan и доступные лимиты пользователя.
3. API резервирует `reservedSeconds` по длительности аудио и `reservedStorageBytes` по размеру файла.
4. API создаёт запись File в базе данных со статусом `UPLOADING`.
5. API вычисляет ключ `audio-<file-id>` от `File.id`.
6. API генерирует Presigned URL для загрузки исходного аудио.
7. API возвращает на Frontend `fileId`, текущий статус File и Presigned URL для аудио.
8. Frontend загружает исходное аудио по ключу `audio-<file-id>`.
9. Frontend подтверждает успешную загрузку исходного аудио.
10. API обновляет статус File на `TRANSCRIBING`.
11. API создаёт TranscriptionJob со статусом `PENDING`.
12. API публикует задание в Kafka topic `transcription.jobs`.
13. Transcription Service получает задание из Kafka и выполняет транскрибацию, читая исходное аудио из Object Storage.
14. Transcription Service публикует результат или ошибку в Kafka topic `transcription.results`.
15. API получает результат транскрибации из Kafka.
16. После получения текста API сохраняет текстовую транскрипцию в Object Storage по ключу `text-<file-id>`.
17. API обновляет статус File на `COMPLETED`, TranscriptionJob на `COMPLETED`, снимает резерв лимитов и окончательно списывает `remainingSeconds` и `remainingStorageBytes`.
18. API создаёт событие уведомления.

Если Transcription Service возвращает ошибку, API обновляет File и TranscriptionJob на `FAILED` и снимает резерв лимитов без окончательного списания.

Frontend не получает текст транскрипции в ответ на создание File.
В MVP Frontend отслеживает статус обработки через polling API.
После перехода File в `COMPLETED` Frontend запрашивает текст транскрипции через API.

---

## 6. Поток обработки транскрипции

```text
Frontend Requests File Creation
    │
    ▼
Check And Reserve User Limits
    │
    ▼
Create File With UPLOADING Status
    │
    ▼
Generate Audio Presigned URL
    │
    ▼
Frontend Uploads Audio
    │
    ▼
Confirm Audio Upload
    │
    ▼
Set File Status To TRANSCRIBING
    │
    ▼
Create TranscriptionJob
    │
    ▼
Publish Job To Kafka
    │
    ▼
Transcription Service Consumes Job
    │
    ▼
Audio Transcription
    │
    ▼
Publish Result To Kafka
    │
    ▼
API Consumes Result
    │
    ▼
Store Text Transcript In Object Storage
    │
    ▼
Set File Status To COMPLETED
    │
    ▼
Deduct Reserved Limits
    │
    ▼
Create Notification
```

---

## 7. Polling MVP

В MVP Frontend получает состояние обработки через периодический polling API.

Минимальные endpoints:

```http
GET /files/:id/status
GET /files/:id/transcript
```

`GET /files/:id/status` возвращает текущий статус File.

`GET /files/:id/transcript` доступен только после перехода File в `COMPLETED`.
API читает текстовую транскрипцию из Object Storage по ключу `text-<file-id>` и возвращает текст Frontend.

WebSocket, Server-Sent Events и push-обновления не входят в MVP.

---

## 8. Kafka Topics

```text
transcription.jobs
transcription.results
notifications.events
```

### transcription.jobs

API Service publishes transcription jobs.

Transcription Service consumes transcription jobs.

Minimal message fields:

```ts
type TranscriptionJobMessage = {
  jobId: string;
  fileId: string;
  authorId: string;
  originalName: string;
  durationSeconds: number;
  sizeBytes: number;
  audioStorageKey: string;
  textStorageKey: string;
};
```

### transcription.results

Transcription Service publishes transcription results.

API Service consumes transcription results.

Minimal message fields:

```ts
type TranscriptionResultMessage = {
  jobId: string;
  fileId: string;
  status: "COMPLETED" | "FAILED";
  transcriptText?: string;
  errorMessage?: string;
};
```

---

## 9. Поток уведомлений

```text
Business Event
    │
    ▼
Notification Created
    │
    ▼
Kafka Topic
    │
    ▼
Notification Consumer
    │
    ▼
Delivery Channel
```

Поддерживаемые каналы:

- In-App
- Email

Будущие:

- Telegram
- SMS

---

## 10. Авторизация

Для MVP используется JWT.

Система должна поддерживать возможность последующей замены на:

- Keycloak;
- OAuth Providers;
- SSO.

Бизнес-модули не должны зависеть от конкретного механизма авторизации.

---

## 11. Управление доступом

Пользователь может получать доступ:

- к собственным файлам;
- к собственным базам знаний;
- к публичным базам знаний;
- к базам знаний, в которые он приглашён.

Все проверки доступа выполняются на стороне backend.

---

## 12. Хранение данных

### PostgreSQL

Хранит:

- пользователей;
- тарифы;
- подписки;
- метаданные файлов;
- базы знаний;
- уведомления.

### Object Storage

Хранит:

- аудиофайлы;
- текстовые транскрипции.

Запрещено хранить большие бинарные данные в PostgreSQL.

---

## 13. Масштабирование

Система должна поддерживать независимое масштабирование:

- API Service;
- Transcription Service;
- Notification Service.

Transcription Service масштабируется отдельно от API Service.
Запуск транскрибации выполняется асинхронно через Kafka.
API Service не вызывает Transcription Service напрямую.

---

## 14. Мониторинг

Каждый сервис должен предоставлять:

- Health Check Endpoint
- Structured Logging
- Error Tracking

Минимальный endpoint:

```http
GET /healthcheck
```

Минимальный ответ для Phase 01 API:

```text
This is a api
```
