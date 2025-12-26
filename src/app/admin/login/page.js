"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import styles from './page.module.css';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            localStorage.setItem('isAdmin', 'true');
            router.push('/admin/dashboard');
        } catch (err) {
            console.error(err);
            setError('Login Gagal. Sila semak email & password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h2>Admin Portal</h2>
                    <p>Sistem Kad Alumni UPSI</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@upsi.edu.my"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masuk password"
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className="btn btn-primary full-width">Log Masuk</button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <Link href="/" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none' }}>
                        &larr; Kembali ke Utama
                    </Link>
                </div>
            </div>
        </div>
    );
}
