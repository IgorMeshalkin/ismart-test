# iSmart Test

Тестовое задание на понимание **spec-driven** подхода к разработке.

Реализован сервис транскрибации аудио: загрузка файла через веб-интерфейс → очередь Kafka → транскрибер → результат.

**Стек:** Next.js, NestJS, Kafka, MinIO, PostgreSQL, Whisper (OpenAI)

## Запуск

```bash
docker compose up --build
```

Веб-интерфейс: [http://localhost:3000](http://localhost:3000)
