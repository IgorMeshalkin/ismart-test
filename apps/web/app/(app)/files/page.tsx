import { AudioInputComponent } from '@/components/files/audio-input.component';
import styles from './page.module.scss';

export default function FilesPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Files</h1>
      <AudioInputComponent />
    </div>
  );
}
