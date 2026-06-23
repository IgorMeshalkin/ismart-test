# iSmart Test

Тестовое задание на понимание **spec-driven** подхода к разработке.

Реализован сервис транскрибации аудио: загрузка файла через веб-интерфейс → очередь Kafka → транскрибер → результат.

**Стек:** Next.js, NestJS, Kafka, MinIO, PostgreSQL, Whisper (OpenAI)

## Запуск

```bash
docker compose up --build
```

Веб-интерфейс: [http://localhost:3000](http://localhost:3000)

<br/><br/><img width="1905" height="926" alt="Screenshot from 2026-06-23 18-08-11" src="https://github.com/user-attachments/assets/cc9dfdbf-a987-4662-9557-b8ce83b4a617" />


<img width="1905" height="926" alt="Screenshot from 2026-06-23 18-05-41" src="https://github.com/user-attachments/assets/00a32815-383d-4f6e-9502-97700fb7585d" />
