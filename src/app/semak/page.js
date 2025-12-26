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
                        {/* Timeline */}
                        <div className={styles.timeline}>
                            {['Pending', 'Approved', 'Printing', 'Ready'].map((stepStatus, index) => {
                                // Define Labels
                                const labels = {
                                    'Pending': 'Permohonan Diterima',
                                    'Approved': 'Permohonan Lulus',
                                    'Printing': 'Cetakan Kad',
                                    'Ready': result.status === 'Shipped' ? 'Dihantar (Pos)' : 'Sedia (Pickup/Pos)'
                                };

                                const descs = {
                                    'Pending': 'Kami telah menerima tempahan anda.',
                                    'Approved': 'Tempahan disahkan & ID dijana.',
                                    'Printing': 'Kad sedang dalam proses cetakan.',
                                    'Ready': result.status === 'Shipped' ? 'Kad telah dipos kepada anda.' : 'Kad boleh diambil atau dipos.'
                                };

                                // Determine State
                                let state = ''; // default, active, completed
                                const currentStatus = result.status || 'Pending';

                                const statusOrder = ['Pending', 'Approved', 'Printing', 'Ready', 'Shipped'];
                                const currentIndex = statusOrder.indexOf(currentStatus === 'Shipped' ? 'Ready' : currentStatus); // Treat Shipped as Ready level for timeline or higher?
                                // Actually, let's map strict levels.
                                // 0: Pending
                                // 1: Approved
                                // 2: Printing
                                // 3: Ready / Shipped

                                let myLevel = index;
                                let currentLevel = -1;
                                if (currentStatus === 'Pending') currentLevel = 0;
                                else if (currentStatus === 'Approved') currentLevel = 1;
                                else if (currentStatus === 'Printing') currentLevel = 2;
                                else if (currentStatus === 'Ready' || currentStatus === 'Shipped') currentLevel = 3;

                                if (myLevel < currentLevel) state = styles.completed;
                                else if (myLevel === currentLevel) state = styles.active;
                                else state = '';

                                // Rejected Case
                                if (result.status === 'Rejected') {
                                    if (index === 0) state = styles.completed;
                                    else return null; // Don't show future steps if rejected? Or show Rejected step?
                                    // For simplicity, if rejected, just show a big Red alert instead of timeline, handled below.
                                }

                                return (
                                    <div key={stepStatus} className={`${styles.timelineItem} ${state}`}>
                                        <div className={styles.timelineMarker}>
                                            <div className={styles.timelineDot}></div>
                                            <div className={styles.timelineLine}></div>
                                        </div>
                                        <div className={styles.timelineContent}>
                                            <h4 className={styles.timelineTitle}>{labels[stepStatus]}</h4>
                                            {state && <p className={styles.timelineDesc}>{descs[stepStatus]}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {result.status === 'Rejected' && (
                            <div className={styles.errorMsg} style={{ textAlign: 'center', background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                                <strong>Permohonan Ditolak.</strong><br />
                                Sila hubungi admin untuk maklumat lanjut.
                            </div>
                        )}

                        <div className={styles.details} style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                            <p><strong>Nama:</strong> {result.details.name}</p>
                            {result.details.alumniId && <p><strong>No. Kad Alumni:</strong> <span style={{ fontFamily: 'monospace', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>{result.details.alumniId}</span></p>}

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
