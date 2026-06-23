'use client'

import React, {useEffect} from 'react';
import styles from "@/src/test/test.module.scss";
import Link from 'next/link';

const HealthckeckComponent = () => {
    const [text, setText] = React.useState('Wait please');

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/healthcheck`)
            .then(res => res.text())
            .then(text => setText(text))
            .catch(() => setText('Error'))
    }, [])

    return (
        <div className={styles.main}>
            <span className={styles.text}>{text}</span>
            <Link className={styles.button} href="/">Go to home</Link>
        </div>
    );
};

export default HealthckeckComponent;
