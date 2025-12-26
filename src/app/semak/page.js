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
                        placeholder="Masukkan No. Kad Pengenalan"
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
                        {/* Horizontal Stepper */}
                        <div className={styles.progressContainer}>
                            {['Pending', 'Approved', 'Printing', 'Ready'].map((stepStatus, index) => {
                                const labels = {
                                    'Pending': 'Permohonan',
                                    'Approved': 'Kelulusan',
                                    'Printing': 'Cetakan',
                                    'Ready': 'Serahan'
                                };

                                // Determine State Logic
                                // 0: Pending, 1: Approved, 2: Printing, 3: Ready/Shipped
                                const currentStatus = result.status || 'Pending';
                                let currentLevel = 0;
                                if (currentStatus === 'Approved') currentLevel = 1;
                                else if (currentStatus === 'Printing') currentLevel = 2;
                                else if (['Ready', 'Shipped'].includes(currentStatus)) currentLevel = 3;

                                let stepClass = styles.progressStep;
                                if (index < currentLevel) stepClass += ` ${styles.completedStep}`;
                                else if (index === currentLevel) stepClass += ` ${styles.activeStep}`;

                                return (
                                    <div key={stepStatus} className={stepClass}>
                                        <div className={styles.stepCircle}>
                                            {index < currentLevel ? '✓' : index + 1}
                                        </div>
                                        <span className={styles.stepLabel}>{labels[stepStatus]}</span>
                                        <div className={styles.stepLine}></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Current Status Detail Box */}
                        <div className={styles.statusDetailBox}>
                            <h4 className={styles.statusDetailTitle}>
                                {result.status === 'Pending' && <><span>📝</span> Permohonan Diterima</>}
                                {result.status === 'Approved' && <><span>✅</span> Permohonan Diluluskan</>}
                                {result.status === 'Printing' && <><span>🖨️</span> Dalam Proses Cetakan</>}
                                {['Ready', 'Shipped'].includes(result.status) && <><span>📦</span> Sedia untuk Diambil/Dipos</>}
                                {result.status === 'Rejected' && <><span>❌</span> Permohonan Ditolak</>}
                            </h4>
                            <p className={styles.statusDetailDesc}>
                                {result.status === 'Pending' && 'Kami telah menerima tempahan anda. Sila tunggu kelulusan admin (1-3 hari bekerja).'}
                                {result.status === 'Approved' && 'Tempahan anda telah disahkan dan ID Alumni telah dijana.'}
                                {result.status === 'Printing' && 'Kad anda sedang dicetak. Proses ini mengambil masa 3-5 hari bekerja.'}
                                {['Ready', 'Shipped'].includes(result.status) && (result.status === 'Shipped' || result.details?.trackingNo ? 'Kad anda telah diserahkan kepada kurier.' : 'Kad anda telah siap dan sedia diambil.')}
                                {result.status === 'Rejected' && <span style={{ color: 'red' }}>Maaf, permohonan anda tidak lengkap atau ditolak. Sila hubungi admin.</span>}
                            </p>
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
