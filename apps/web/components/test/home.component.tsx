import styles from './test.module.scss';

type HomeComponentProps = {
  appName: string;
};

export function HomeComponent({ appName }: HomeComponentProps) {
  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>iSmart</p>
        <h1>{appName}</h1>
        <p className={styles.description}>Project foundation service is available.</p>
      </section>
    </main>
  );
}
