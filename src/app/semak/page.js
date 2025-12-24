"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function SemakStatus() {
    const router = useRouter();
    const [id, setId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError('');

        try {
            // Trim whitespace from input
            const cleanId = id.trim();

            // Query by IC Number (Primary)
            const q = query(collection(db, "orders"), where("ic", "==", cleanId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Found!
                const data = querySnapshot.docs[0].data();
                setResult({
                    status: data.status,
                    details: {
                        name: data.name,
                        alumniId: data.alumniId || null, // Approved/Generated ID
                        trackingNo: data.trackingNo || null
                    }
                });
            } else {
                // Try Query by Alumni ID (Secondary) - Optional if we strictly want IC
                // For MVP let's stick to IC first to avoid complex multiple queries or just simple error
                setError("Tiada rekod ditemui. Sila pastikan No. KP betul.");
            }

        } catch (err) {
            console.error(err);
            setError("Ralat sistem. Sila cuba sebentar lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.card}`}>
                <div className={styles.header}>
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

                {error && <div className={styles.errorMsg}>{error}</div>}

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

                <div style={{ marginTop: '2rem' }}>
                    <button onClick={() => router.push('/')} className="btn btn-outline" style={{ width: '100%' }}>&larr; Kembali</button>
                </div>
            </div>
        </div>
    );
}
