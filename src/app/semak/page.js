"use client";

import { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

export default function SemakStatus() {
    const [id, setId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        // Simulate Check
        setTimeout(() => {
            // Mock Result
            setResult({
                status: 'Approved', // Pending, Approved, Rejected, Ready, Shipped
                details: {
                    name: 'Ahmad Albab',
                    alumniId: '192220230101',
                    trackingNo: 'JNT123456789'
                }
            });
            setLoading(false);
        }, 1500);
    };

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.card}`}>
                <div className={styles.header}>
                    <Link href="/" className={styles.backLink}>&larr; Utama</Link>
                    <h2>Semakan Status</h2>
                </div>

                <form onSubmit={handleCheck} className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Masukkan No. Kad Pengenalan / Alumni ID"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        required
                        className={styles.input}
                    />
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? '...' : 'Semak'}
                    </button>
                </form>

                {result && (
                    <div className={styles.result}>
                        <div className={styles.statusBadge} data-status={result.status}>
                            {result.status}
                        </div>

                        <div className={styles.details}>
                            <p><strong>Nama:</strong> {result.details.name}</p>
                            {result.details.alumniId && <p><strong>No. Kad Alumni:</strong> {result.details.alumniId}</p>}

                            {result.status === 'Shipped' && (
                                <div className={styles.tracking}>
                                    <p>Barang telah dipos.</p>
                                    <p>Tracking No: <code>{result.details.trackingNo}</code></p>
                                    <a href={`https://www.jtexpress.my/tracking/${result.details.trackingNo}`} target="_blank" className={styles.trackLink}>
                                        Track J&T
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
