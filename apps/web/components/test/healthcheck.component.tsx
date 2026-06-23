'use client';

import { useHealthcheck } from '@/hooks/useHealthcheck';
import styles from './test.module.scss';

export function HealthcheckComponent() {
  const { data, error, isLoading } = useHealthcheck();

  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Healthcheck</p>
        <h1>{isLoading ? 'Checking' : error ? 'Unavailable' : 'Available'}</h1>
        <p className={styles.description}>{error ?? data ?? 'Waiting for API response.'}</p>
      </section>
    </main>
  );
}
