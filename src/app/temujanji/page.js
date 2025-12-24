"use client";

import { useState } from 'react';
import styles from './page.module.css';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function Temujanji() {
    const [step, setStep] = useState(1); // 1: Check IC, 2: Select Date
    const [ic, setIc] = useState('');
    const [orderData, setOrderData] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const LIMIT_PER_DAY = 15;

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const cleanId = ic.trim();
            const q = query(
                collection(db, "orders"),
                where("ic", "==", cleanId),
                where("pickupMethod", "==", "pickup") // Must be pickup
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const data = docSnap.data();

                // Check Status
                if (data.status !== 'Ready') {
                    setError(`Status anda ialah '${data.status}'. Anda hanya boleh booking bila status 'Ready'.`);
                    setLoading(false);
                    return;
                }

                if (data.appointmentDate) {
                    setError(`Anda sudah ada temujanji pada ${data.appointmentDate}.`);
                    setLoading(false);
                    return;
                }

                setOrderData({ id: docSnap.id, ...data });
                setStep(2);
            } else {
                setError("Tiada rekod 'Pickup' dijumpai atau IC salah.");
            }
        } catch (err) {
            console.error(err);
            setError("Ralat sistem.");
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!selectedDate) {
            setError("Sila pilih tarikh.");
            setLoading(false);
            return;
        }

        try {
            // Check Availability (Limit 15)
            // Note: In high traffic, this simple check might have race conditions, but for 15/day logic it's acceptable for MVP.
            const qCount = query(
                collection(db, "orders"),
                where("appointmentDate", "==", selectedDate)
            );
            const snapshot = await getDocs(qCount);

            if (snapshot.size >= LIMIT_PER_DAY) {
                setError(`Maaf, tarikh ${selectedDate} dah penuh (Limit ${LIMIT_PER_DAY} orang). Sila pilih tarikh lain.`);
                setLoading(false);
                return;
            }

            // Save Booking
            const orderRef = doc(db, "orders", orderData.id);
            await updateDoc(orderRef, {
                appointmentDate: selectedDate,
                updatedAt: serverTimestamp()
            });

            setSuccess(true);
            setStep(3); // Success View

        } catch (err) {
            console.error(err);
            setError("Gagal simpan temujanji.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get tomorrow's date string for min date
    const getMinDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.card}`}>
                <div className={styles.header}>
                    <Link href="/" className={styles.backLink}>&larr; Utama</Link>
                    <h2>Tempahan Slot Pickup</h2>
                    <p>Khusus untuk pemohon 'Self-Pickup' sahaja</p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleCheck} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>No. Kad Pengenalan</label>
                            <input
                                type="text"
                                value={ic}
                                onChange={(e) => setIc(e.target.value)}
                                placeholder="Example: 980101015555"
                                required
                                className={styles.input}
                            />
                        </div>
                        {error && <div className={styles.errorMsg}>{error}</div>}
                        <button type="submit" disabled={loading} className="btn btn-primary full-width">
                            {loading ? 'Semak...' : 'Seterusnya'}
                        </button>
                    </form>
                )}

                {step === 2 && orderData && (
                    <form onSubmit={handleBooking} className={styles.form}>
                        <div className={styles.infoBox}>
                            <p><strong>Nama:</strong> {orderData.name}</p>
                            <p><strong>Status:</strong> <span className={styles.statusReady}>Ready for Pickup</span></p>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Pilih Tarikh Pengambilan</label>
                            <input
                                type="date"
                                min={getMinDate()}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                                className={styles.input}
                            />
                            <small className={styles.hint}>*Isnin - Jumaat, 9:00 Pagi - 4:30 Petang sahaja</small>
                        </div>

                        {error && <div className={styles.errorMsg}>{error}</div>}

                        <button type="submit" disabled={loading} className="btn btn-primary full-width">
                            {loading ? 'Confirming...' : 'Sahkan Temujanji'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className={styles.successView}>
                        <div className={styles.iconCheck}>✅</div>
                        <h3>Temujanji Disahkan!</h3>
                        <p>Sila hadir ke Pusat Alumni UPSI pada:</p>
                        <div className={styles.dateDisplay}>{selectedDate}</div>
                        <p className={styles.note}>Tunjukkan paparan ini atau IC anda di kaunter.</p>
                        <Link href="/" className="btn btn-outline" style={{ marginTop: '20px', display: 'inline-block' }}>
                            Kembali ke Utama
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
