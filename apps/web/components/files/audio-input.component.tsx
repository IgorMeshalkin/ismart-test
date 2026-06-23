'use client';

import { ChangeEvent, SyntheticEvent, useEffect, useRef, useState } from 'react';
import styles from './audio-input.module.scss';
import { useFilesApi } from '../../hooks/useFilesApi';

type Mode = 'record' | 'upload';
type RecordState = 'idle' | 'recording' | 'done';
type SendState = 'idle' | 'sending' | 'done' | 'error';

export function AudioInputComponent() {
  const [mode, setMode] = useState<Mode>('record');

  // Record state
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const durationFixAppliedRef = useRef(false);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  // Send state
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentFileId, setSentFileId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { createFile, confirmUpload } = useFilesApi();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    };
  }, [audioUrl, uploadUrl]);

  const resetSendState = () => {
    setSendState('idle');
    setSendError(null);
    setSentFileId(null);
    setUploadProgress(0);
  };

  const xhrPut = (url: string, blob: Blob, mimeType: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.send(blob);
    });

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    if (mediaRecorderRef.current && recordState === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordState('idle');
    setAudioUrl(null);
    setMicError(null);
    setSeconds(0);
    setUploadedFile(null);
    setUploadUrl(null);
    setAudioDuration(0);
    recordedBlobRef.current = null;
    durationFixAppliedRef.current = false;
    resetSendState();
    setMode(next);
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        recordedBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setRecordState('done');
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordState('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setMicError('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
      } else {
        setMicError('Could not access the microphone. Please check your device settings.');
      }
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordState('idle');
    setSeconds(0);
    setMicError(null);
    recordedBlobRef.current = null;
    durationFixAppliedRef.current = false;
    resetSendState();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    setUploadedFile(file);
    setUploadUrl(URL.createObjectURL(file));
    setAudioDuration(0);
    resetSendState();
  };

  const clearFile = () => {
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    setUploadedFile(null);
    setUploadUrl(null);
    setAudioDuration(0);
    resetSendState();
  };

  const handleRecordedAudioMetadata = (e: SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    if (!isFinite(audio.duration) || audio.duration === 0) {
      audio.currentTime = 1e100;
    }
  };

  const handleRecordedAudioTimeUpdate = (e: SyntheticEvent<HTMLAudioElement>) => {
    if (durationFixAppliedRef.current) return;
    const audio = e.currentTarget;
    if (isFinite(audio.duration) && audio.duration > 0) {
      durationFixAppliedRef.current = true;
      audio.currentTime = 0;
    }
  };

  const handleUploadAudioMetadata = (e: SyntheticEvent<HTMLAudioElement>) => {
    setAudioDuration(e.currentTarget.duration);
  };

  const handleSend = async () => {
    if (!localStorage.getItem('ismart.accessToken')) {
      setSendError('You must be logged in to send a file.');
      setSendState('error');
      return;
    }

    setSendState('sending');
    setSendError(null);
    setSentFileId(null);
    setUploadProgress(0);

    try {
      let blob: Blob;
      let metadata: { originalName: string; durationSeconds: number; sizeBytes: number };
      let mimeType: string;

      if (mode === 'record') {
        blob = recordedBlobRef.current!;
        mimeType = blob.type || 'audio/webm';
        metadata = {
          originalName: 'recording.webm',
          durationSeconds: seconds,
          sizeBytes: blob.size,
        };
      } else {
        blob = uploadedFile!;
        mimeType = blob.type || 'audio/webm';
        metadata = {
          originalName: uploadedFile!.name,
          durationSeconds: Math.round(audioDuration),
          sizeBytes: uploadedFile!.size,
        };
      }

      const { fileId, uploadUrl: presignedUrl } = await createFile(metadata);

      await xhrPut(presignedUrl, blob, mimeType);

      await confirmUpload(fileId);

      setSentFileId(fileId);
      setSendState('done');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSendState('error');
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isSending = sendState === 'sending';

  const progressBar = isSending && uploadProgress > 0 && (
    <div className={styles.uploadProgress}>
      <div className={styles.uploadProgressBar} style={{ width: `${uploadProgress}%` }} />
      <span className={styles.uploadProgressLabel}>Uploading… {uploadProgress}%</span>
    </div>
  );

  return (
    <div className={styles.card}>
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${mode === 'record' ? styles.modeActive : ''}`}
          type="button"
          onClick={() => switchMode('record')}
        >
          Record
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'upload' ? styles.modeActive : ''}`}
          type="button"
          onClick={() => switchMode('upload')}
        >
          Upload
        </button>
      </div>

      {mode === 'record' && (
        <div className={styles.section}>
          {recordState === 'idle' && (
            <>
              {micError && <p className={styles.error}>{micError}</p>}
              <button className={styles.primaryButton} type="button" onClick={startRecording}>
                Start recording
              </button>
            </>
          )}

          {recordState === 'recording' && (
            <div className={styles.recordingState}>
              <div className={styles.indicator}>
                <span className={styles.dot} />
                <span className={styles.timer}>{formatTime(seconds)}</span>
              </div>
              <button className={styles.stopButton} type="button" onClick={stopRecording}>
                Stop recording
              </button>
            </div>
          )}

          {recordState === 'done' && audioUrl && (
            <div className={styles.previewState}>
              <audio
                ref={audioRef}
                className={styles.player}
                controls
                src={audioUrl}
                onLoadedMetadata={handleRecordedAudioMetadata}
                onTimeUpdate={handleRecordedAudioTimeUpdate}
              />
              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
              {progressBar}
              {sendState === 'done' && sentFileId && (
                <p className={styles.success}>File sent. ID: {sentFileId}</p>
              )}
              {sendState === 'error' && sendError && (
                <p className={styles.error}>{sendError}</p>
              )}
              <button className={styles.secondaryButton} type="button" onClick={discardRecording}>
                Discard
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div className={styles.section}>
          {!uploadedFile ? (
            <label className={styles.fileLabel}>
              <input
                className={styles.fileInput}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
              />
              <span className={styles.filePrompt}>Choose an audio file</span>
            </label>
          ) : (
            <div className={styles.previewState}>
              <p className={styles.fileName}>{uploadedFile.name}</p>
              {uploadUrl && (
                <audio
                  className={styles.player}
                  controls
                  src={uploadUrl}
                  onLoadedMetadata={handleUploadAudioMetadata}
                />
              )}
              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
              {progressBar}
              {sendState === 'done' && sentFileId && (
                <p className={styles.success}>File sent. ID: {sentFileId}</p>
              )}
              {sendState === 'error' && sendError && (
                <p className={styles.error}>{sendError}</p>
              )}
              <button className={styles.secondaryButton} type="button" onClick={clearFile}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
