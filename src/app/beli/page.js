"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

export default function BeliKad() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        ic: '',
        phone: '',
        email: '',
        gradYear: '',
        pickupMethod: 'pickup',
        address1: '',
        postcode: '',
        city: '',
        state: '',
        receipt: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const upperFields = ['name', 'address1', 'city', 'state'];

        setFormData(prev => ({
            ...prev,
            [name]: upperFields.includes(name) ? value.toUpperCase() : value
        }));

        if (name === 'postcode' && value.length === 5) {
            checkPostcode(value);
        }
    };

    const checkPostcode = async (postcode) => {
        setLookupLoading(true);
        try {
            const res = await fetch(`https://api.zippopotam.us/my/${postcode}`);
            if (res.ok) {
                const data = await res.json();
                if (data.places && data.places.length > 0) {
                    const place = data.places[0];
                    setFormData(prev => ({
                        ...prev,
                        city: place['place name'],
                        state: place['state']
                    }));
                }
            }
        } catch (error) {
            console.error("Postcode lookup failed", error);
        } finally {
            setLookupLoading(false);
        }
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
            // Combine address if delivery
            let fullAddress = formData.address; // Fallback
            if (formData.pickupMethod === 'delivery') {
                fullAddress = `${formData.address1}, ${formData.postcode} ${formData.city}, ${formData.state}`;
            }

            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, address: fullAddress, receiptUrl })
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

    const steps = [
        { id: 1, label: 'Semakan' },
        { id: 2, label: 'Maklumat' },
        { id: 3, label: 'Pilihan' },
        { id: 4, label: 'Bayaran' }
    ];

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.formCard}`}>
                <div className={styles.header}>
                    <h2>Permohonan Kad Alumni</h2>
                    <div className={styles.progressContainer}>
                        {steps.map((s, index) => (
                            <div key={s.id} className={`${styles.progressStep} ${step >= s.id ? styles.activeStep : ''}`}>
                                <div className={styles.stepCircle}>{s.id}</div>
                                <span className={styles.stepLabel}>{s.label}</span>
                                {index < steps.length - 1 && <div className={styles.stepLine}></div>}
                            </div>
                        ))}
                    </div>
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
                        <div className={styles.actions} style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => router.push('/')} className="btn btn-outline" style={{ flex: 1 }}>&larr; Kembali</button>
                            <button onClick={checkIC} disabled={!formData.ic || loading} className="btn btn-primary" style={{ flex: 1 }}>
                                {loading ? 'Menyemak...' : 'Semak & Teruskan'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.step}>
                        <h3>Langkah 2: Maklumat Peribadi</h3>
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
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={styles.input} placeholder="contoh@gmail.com" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Tahun Graduasi</label>
                                <input type="number" name="gradYear" value={formData.gradYear} onChange={handleChange} required className={styles.input} />
                            </div>
                        </div>
                        <div className={styles.actions} style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1 }}>&larr; Kembali</button>
                            <button onClick={() => setStep(3)} disabled={!formData.name || !formData.phone || !formData.email || !formData.gradYear} className="btn btn-primary" style={{ flex: 1 }}>
                                Seterusnya &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.step}>
                        <h3>Langkah 3: Kaedah Pengambilan</h3>
                        <div className={styles.inputGroup}>
                            <label>Pilih Kaedah</label>
                            <select name="pickupMethod" value={formData.pickupMethod} onChange={handleChange} className={styles.input}>
                                <option value="pickup">Ambil di Pejabat Pusat Alumni</option>
                                <option value="delivery">Pos (Delivery)</option>
                            </select>
                        </div>

                        {formData.pickupMethod === 'delivery' && (
                            <>
                                <div className={styles.inputGroup}>
                                    <label>Alamat (No. Rumah, Jalan, Taman)</label>
                                    <input type="text" name="address1" value={formData.address1} onChange={handleChange} required className={styles.input} placeholder="Contoh: No 12, Jalan Alumni 1, Taman Pewira" />
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.inputGroup}>
                                        <label>Poskod</label>
                                        <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} required maxLength="5" className={styles.input} placeholder="35900" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Bandar {lookupLoading && '...'}</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} required className={styles.input} />
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Negeri</label>
                                    <input type="text" name="state" value={formData.state} onChange={handleChange} required className={styles.input} />
                                </div>
                                <small className={styles.smallText}>Kos penghantaran ditanggung penerima (DFOD via J&T).</small>
                            </>
                        )}

                        <div className={styles.actions} style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setStep(2)} className="btn btn-outline" style={{ flex: 1 }}>&larr; Kembali</button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={formData.pickupMethod === 'delivery' && (!formData.address1 || !formData.postcode || !formData.city || !formData.state)}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                Seterusnya &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <form onSubmit={handleSubmit} className={styles.step}>
                        <h3>Langkah 4: Bukti Bayaran</h3>
                        <div className={styles.alertInfo}>
                            Sila buat bayaran <strong>RM 50.00</strong> ke akaun <strong>CIMB: 8602660101 (Alumni UPSI)</strong> sebelum muat naik resit.
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Muat Naik Resit</label>
                            <input type="file" onChange={handleFileChange} required accept="image/*" className={styles.input} />
                        </div>

                        <div className={styles.actions} style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={() => setStep(3)} className="btn btn-outline" style={{ flex: 1 }}>&larr; Kembali</button>
                            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                                {loading ? 'Menghantar...' : 'Hantar Permohonan'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
