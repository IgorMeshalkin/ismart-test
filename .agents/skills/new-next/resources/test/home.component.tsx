import React from 'react';
import styles from './test.module.scss'
import Link from 'next/link';

const HomeComponent = ({appName}: { appName: string }) => {
    return (
        <div className={styles.main}>
            <span className={styles.text}>{appName}</span>
            <Link className={styles.button} href="/healthcheck">Healthcheck</Link>
        </div>
    );
};

export default HomeComponent;
