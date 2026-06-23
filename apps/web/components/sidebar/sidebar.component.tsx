'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './sidebar.module.scss';

export function SidebarComponent() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.nav}>
        <Link
          href="/files"
          className={`${styles.navItem} ${pathname.startsWith('/files') ? styles.active : ''}`}
        >
          Files
        </Link>
        <Link
          href="/knowledge-bases"
          className={`${styles.navItem} ${pathname.startsWith('/knowledge-bases') ? styles.active : ''}`}
        >
          Knowledge Bases
        </Link>
      </div>
      <div className={styles.bottom}>
        <Link
          href="/profile"
          className={`${styles.profileButton} ${pathname.startsWith('/profile') ? styles.active : ''}`}
        >
          Profile
        </Link>
      </div>
    </nav>
  );
}
