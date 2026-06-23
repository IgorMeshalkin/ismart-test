'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import styles from './audio-input.module.scss';

type Mode = 'record' | 'upload';
type RecordState = 'idle' | 'recording' | 'done';

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

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    };
  }, [audioUrl, uploadUrl]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    // Stop any active recording
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
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    setUploadedFile(file);
    setUploadUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    setUploadedFile(null);
    setUploadUrl(null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
              <audio className={styles.player} controls src={audioUrl} />
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
              {uploadUrl && <audio className={styles.player} controls src={uploadUrl} />}
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
