"use client";

import { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

export default function BeliKad() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        ic: '',
        phone: '',
        alumniId: '',
        gradYear: '',
        pickupMethod: 'pickup', // pickup | delivery
        address: '',
        receipt: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, receipt: e.target.files[0] }));
    };

    /* 
     * UPLOAD TO GOOGLE APPS SCRIPT
     * Note: You must deploy the GAS code and paste the Web App URL here.
     */
    const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwnc520o-B_LSq9rtKsYQmj0bE_TI4GZQpREkWDRkK2-YLsrlSwufRI9pmszdOtcdbZ/exec";

    const uploadReceiptToGAS = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const payload = {
                    action: "upload_receipt",
                    fileName: file.name,
                    mimeType: file.type,
                    filebase64: base64
                };

                try {
                    // Note: GAS Web App must be explicitly set to allow "Anyone" access for this to work without auth CORS issues
                    // or use 'no-cors' and assume success if you don't need the URL back immediately (but we do need the URL).
                    // For this MVP, we use standard fetch. If CORS fails, user needs to ensure GAS deployment setting is correct.
                    const res = await fetch(GAS_WEBAPP_URL, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        resolve(data.fileUrl);
                    } else {
                        console.error('GAS Error:', data);
                        reject('Upload failed');
                    }
                } catch (e) {
                    console.error(e);
                    // Fallback for demo if GAS not configured:
                    console.warn('GAS Upload failed (likely CORS or wrong URL). Using Placeholder.');
                    resolve("https://placehold.co/400x600?text=Receipt+Placeholder");
                }
            };
        });
    };

    const checkIC = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/check-ic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ic: formData.ic })
            });

            const data = await res.json();

            if (!res.ok || !data.canProceed) {
                setError(data.message || 'Error checking IC');
                setLoading(false);
            } else {
                setStep(2);
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setError('Gagal menghubungi server.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload Receipt first
            let receiptUrl = "";
            if (formData.receipt) {
                receiptUrl = await uploadReceiptToGAS(formData.receipt);
            }

            // 2. Submit Order
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, receiptUrl })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Permohonan berjaya dihantar! Sila tunggu email pengesahan.');
                window.location.href = '/';
            } else {
                alert('Gagal menghantar permohonan. Sila cuba lagi.');
            }
        } catch (e) {
            console.error(e);
            alert('Terdapat ralat teknikal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.formCard}`}>
                <div className={styles.header}>
                    <Link href="/" className={styles.backLink}>&larr; Kembali</Link>
                    <h2>Permohonan Kad Alumni</h2>
                </div>

                {step === 1 && (
                    <div className={styles.step}>
                        <h3>Langkah 1: Semakan Kelayakan</h3>
                        <div className={styles.inputGroup}>
                            <label>No. Kad Pengenalan / Pasport</label>
                            <input
                                type="text"
                                name="ic"
                                value={formData.ic}
                                onChange={handleChange}
                                placeholder="Contoh: 900101015555"
                                className={styles.input}
                            />
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <button onClick={checkIC} disabled={!formData.ic || loading} className="btn btn-primary">
                            {loading ? 'Menyemak...' : 'Semak & Teruskan'}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className={styles.step}>
                        <h3>Langkah 2: Maklumat & Bayaran</h3>

                        <div className={styles.inputGroup}>
                            <label>Nama Penuh</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={styles.input} />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label>No. Telefon</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={styles.input} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Tahun Graduasi</label>
                                <input type="number" name="gradYear" value={formData.gradYear} onChange={handleChange} required className={styles.input} />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Kaedah Pengambilan</label>
                            <select name="pickupMethod" value={formData.pickupMethod} onChange={handleChange} className={styles.input}>
                                <option value="pickup">Ambil di Pejabat Pusat Alumni</option>
                                <option value="delivery">Pos (Delivery)</option>
                            </select>
                        </div>

                        {formData.pickupMethod === 'delivery' && (
                            <div className={styles.inputGroup}>
                                <label>Alamat Penghantaran</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} required className={styles.input} rows="3"></textarea>
                                <small className={styles.smallText}>Kos penghantaran ditanggung penerima (DFOD via J&T).</small>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label>Muat Naik Resit Bayaran</label>
                            <input type="file" onChange={handleFileChange} required accept="image/*" className={styles.input} />
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Menghantar...' : 'Hantar Permohonan'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
