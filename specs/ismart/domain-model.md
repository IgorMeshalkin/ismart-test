# iSmart Domain Model

## 1. Назначение документа

Документ описывает основные доменные сущности iSmart, их поля и связи.
Этот файл фиксирует структуру данных на уровне доменной модели и базы данных.

Доменные сущности реализуются как runtime TypeORM entity classes с decorators.
Shared entity definitions в `libs/shared` должны быть пригодны для прямого подключения в TypeORM.

---

## 2. BaseEntity

Базовая сущность для всех доменных сущностей.

### Fields

```ts
type guid = string;

type BaseEntity = {
  id: guid;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
};
```

### Rules

```text
Строго все дальнейшие сущности должны наследовать BaseEntity.
Все названия таблиц и колонок в базе данных должны быть в snake_case.
```

Примеры соответствия полей доменной модели и колонок БД:

```text
createdDate -> created_date
updatedDate -> updated_date
isActive -> is_active
passwordHash -> password_hash
```

---

## 3. Entity: User

Пользователь системы.

### Fields

```ts
type User = BaseEntity & {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};
```

### Enum

```ts
enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN"
}
```

### Relations

```text
User has many UserPlans
User has many Files
User owns many KnowledgeBases
User has many KnowledgeBaseSubscribers
User has many Notifications
```

---

## 4. Entity: Plan

Тарифный план, доступный для покупки.

### Fields

```ts
type Plan = BaseEntity & {
  name: string;
  description: string;
  price: number; // decimal, scale = 2
  audioLimitSeconds: number;
  storageLimitBytes: number;
};

```

### Relations

```text
Plan has many UserPlans
```

---

## 5. Entity: UserPlan

Купленный пользователем тариф, его период действия и текущие лимиты.

### Fields

```ts
type UserPlan = BaseEntity & {
  userId: string;
  planId: string;
  startDate: Date;
  endDate: Date | null;
  remainingSeconds: number;
  reservedSeconds: number;
  remainingStorageBytes: number;
  reservedStorageBytes: number;
  status: UserPlanStatus;
};
```

### Enum

```ts
enum UserPlanStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED"
}
```

### Rules

```text
Пользователь может купить несколько UserPlan на будущие периоды.
В один момент времени у пользователя может быть только один UserPlan со статусом ACTIVE.
Новые купленные планы получают статус PENDING, если у пользователя уже есть активный план.
PENDING план активируется автоматически после окончания предыдущего ACTIVE плана.
В MVP не выполняется перенос неиспользованных лимитов между планами.
Доступные секунды считаются как remainingSeconds - reservedSeconds.
Доступное хранилище считается как remainingStorageBytes - reservedStorageBytes.
При создании File система резервирует лимиты в reservedSeconds и reservedStorageBytes.
После успешного завершения обработки резерв снимается и окончательно списывается из remainingSeconds и remainingStorageBytes.
При ошибке обработки резерв снимается без списания из remainingSeconds и remainingStorageBytes.
```

### Relations

```text
UserPlan belongs to User
UserPlan belongs to Plan
```

---

## 6. Entity: File

Аудиофайл пользователя и связанная с ним транскрипция.

### Fields

```ts
type File = BaseEntity & {
  originalName: string;
  durationSeconds: number;
  sizeBytes: number;
  status: FileStatus;
  authorId: string;
  isTextUploaded: boolean;
};
```

### Getters

```ts
File.audioStorageKey: string; // returns `audio-${this.id}`
File.textStorageKey: string; // returns `text-${this.id}`
```

Ключи объектов детерминированно вычисляются геттерами от `this.id` и не хранятся в базе данных.

### Enum

```ts
enum FileStatus {
  TRANSCRIBING = "TRANSCRIBING",
  UPLOADING = "UPLOADING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}
```

### Rules

```text
File создаётся после проверки активного UserPlan.
При создании File резервируются лимиты в `reservedSeconds` по `durationSeconds` и `reservedStorageBytes` по `sizeBytes`.
После создания File получает статус UPLOADING.
Статус UPLOADING означает, что система ожидает загрузку исходного аудио в Object Storage.
После подтверждения загрузки исходного аудио File получает статус TRANSCRIBING.
После успешной транскрибации Transcription Service загружает текстовый файл в Object Storage и уведомляет API через Kafka.
API устанавливает isTextUploaded = true после получения успешного результата из Kafka и подтверждения загрузки текста в Object Storage.
После успешной транскрибации и сохранения текстовой транскрипции File получает статус COMPLETED.
isTextUploaded = true только при статусе COMPLETED; при FAILED остаётся false.
После перехода File в COMPLETED резерв лимитов снимается и окончательно списывается из remainingSeconds и remainingStorageBytes.
При ошибке транскрибации или загрузки File получает статус FAILED.
При переходе File в FAILED резерв лимитов снимается без окончательного списания.
```

### Relations

```text
File belongs to User as author
File belongs to many KnowledgeBases through KnowledgeBaseFile
File has one TranscriptionJob
```

---

## 7. Entity: TranscriptionJob

Задание на транскрибацию файла.

### Fields

```ts
type TranscriptionJob = BaseEntity & {
  fileId: string;
  status: TranscriptionJobStatus;
  requestTopic: string;
  responseTopic: string;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
};
```

`audioStorageKey` и `textStorageKey` не являются persisted полями `TranscriptionJob`.
Если ключи нужны при публикации Kafka message, они вычисляются через `File.audioStorageKey` и `File.textStorageKey` от `File.id`.

### Enum

```ts
enum TranscriptionJobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}
```

### Rules

```text
TranscriptionJob создаётся API после подтверждения загрузки исходного аудио в Object Storage.
API публикует задание на транскрибацию в Kafka после создания TranscriptionJob.
Transcription Service получает задания только из Kafka.
Transcription Service возвращает успешный результат или ошибку только через Kafka.
API обновляет File, TranscriptionJob и лимиты пользователя после получения Kafka-ответа.
Kafka сообщения не должны содержать бинарные аудиоданные.
Kafka message для Transcription Service передаёт ключ исходного аудио в Object Storage.
Ключ вычисляется из `File.id` и не хранится отдельной колонкой.
```

### Relations

```text
TranscriptionJob belongs to File
```

---

## 8. Entity: KnowledgeBase

База знаний пользователя.

### Fields

```ts
type KnowledgeBase = BaseEntity & {
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
};
```

### Rules

```text
Публичная KnowledgeBase доступна всем пользователям для просмотра.
Приватная KnowledgeBase доступна только владельцу и пользователям из KnowledgeBaseSubscriber.
KnowledgeBaseSubscriber используется для выдачи доступа к приватным KnowledgeBase.
Владелец KnowledgeBase управляет её содержимым и доступами.
```

### Relations

```text
KnowledgeBase belongs to User as owner
KnowledgeBase has many Files through KnowledgeBaseFile
KnowledgeBase has many Subscribers through KnowledgeBaseSubscriber
```

---

## 9. Entity: KnowledgeBaseFile

Связующая таблица между KnowledgeBase и File.

### Fields

```ts
type KnowledgeBaseFile = BaseEntity & {
  knowledgeBaseId: string;
  fileId: string;
  addedAt: Date;
};
```

### Relations

```text
KnowledgeBaseFile belongs to KnowledgeBase
KnowledgeBaseFile belongs to File
```

### Constraints

```text
Unique pair: knowledgeBaseId + fileId
```

---

## 10. Entity: KnowledgeBaseSubscriber

Пользователь, которому предоставлен доступ к базе знаний.

### Fields

```ts
type KnowledgeBaseSubscriber = BaseEntity & {
  knowledgeBaseId: string;
  userId: string;
  role: KnowledgeBaseRole;
};
```

### Enum

```ts
enum KnowledgeBaseRole {
  VIEWER = "VIEWER",
  EDITOR = "EDITOR"
}
```

### Relations

```text
KnowledgeBaseSubscriber belongs to KnowledgeBase
KnowledgeBaseSubscriber belongs to User
```

### Constraints

```text
Unique pair: knowledgeBaseId + userId
```

---

## 11. Entity: Notification

Уведомление для пользователя.

### Fields

```ts
type Notification = BaseEntity & {
  userId: string;
  type: NotificationType;
  reason: NotificationReason;
  payload: Record<string, unknown>;
  isRead: boolean;
};
```

### Enums

```ts
enum NotificationType {
  EMAIL = "EMAIL",
  IN_APP = "IN_APP",
  SMS = "SMS",
  TELEGRAM = "TELEGRAM"
}

enum NotificationReason {
  TRANSCRIPTION_COMPLETE = "TRANSCRIPTION_COMPLETE",
  INVITE_TO_KB = "INVITE_TO_KB",
  PLAN_EXPIRING = "PLAN_EXPIRING"
}
```

### Rules

```text
В MVP используются только IN_APP и EMAIL уведомления.
SMS и TELEGRAM остаются в enum как будущие каналы, но в MVP не создаются.
```

### Relations

```text
Notification belongs to User
```

---

## 12. Основные связи

```text
User 1 ─── * File

User 1 ─── * UserPlan

Plan 1 ─── * UserPlan

User 1 ─── * KnowledgeBase

KnowledgeBase * ─── * File
via KnowledgeBaseFile

KnowledgeBase * ─── * User
via KnowledgeBaseSubscriber

User 1 ─── * Notification

File 1 ─── 1 TranscriptionJob
```

---

## 13. Правила хранения данных

### Audio Files

Аудиофайлы не хранятся в базе данных.

Ключ аудиофайла не хранится в базе данных и вычисляется от `this.id`:

```text
File.audioStorageKey -> audio-<file-id>
```

---

### Transcription Text

Текст транскрипции не хранится напрямую в базе данных.

Ключ текстовой транскрипции не хранится в базе данных и вычисляется от `this.id`:

```text
File.textStorageKey -> text-<file-id>
```

---

## 14. Минимальные индексы

```text
User.email unique
User.role index

File.authorId index

File.status index

UserPlan.userId index
UserPlan.status index

TranscriptionJob.fileId unique
TranscriptionJob.status index

KnowledgeBase.ownerId index

KnowledgeBaseFile.knowledgeBaseId index
KnowledgeBaseFile.fileId index

KnowledgeBaseSubscriber.knowledgeBaseId index
KnowledgeBaseSubscriber.userId index

Notification.userId index
Notification.isRead index
```

---

## 15. Notes

Все публичные идентификаторы должны быть UUID.

Все timestamp поля должны храниться в UTC.

Большие бинарные данные и большие текстовые данные не должны храниться в PostgreSQL.

Все новые сущности обязаны наследовать `BaseEntity`.

Все физические имена таблиц, колонок, индексов и constraints в PostgreSQL должны быть в `snake_case`.
