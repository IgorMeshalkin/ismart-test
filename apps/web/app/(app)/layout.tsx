'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { SidebarComponent } from '@/components/sidebar/sidebar.component';
import styles from './layout.module.scss';

const ACCESS_TOKEN_KEY = 'ismart.accessToken';

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      router.replace('/');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className={styles.shell}>
      <SidebarComponent />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
