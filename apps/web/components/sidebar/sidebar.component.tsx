'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './sidebar.module.scss';

export function SidebarComponent() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('ismart.accessToken');
    router.push('/');
  };

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
        <button className={styles.logoutButton} type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
