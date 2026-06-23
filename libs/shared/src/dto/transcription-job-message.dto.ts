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
