"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';
import ReCAPTCHA from "react-google-recaptcha";
import CardPreview from '../components/CardPreview';

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
        city: '',
        state: '',
        receipt: null
    });
    const [captchaToken, setCaptchaToken] = useState(null);
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

    // Live Preview State extracted from Form
    const [previewMatric, setPreviewMatric] = useState('');

    useEffect(() => {
        // Logik Agak-Agak Matric No dari IC (Demo Purpose)
        // Kalau user ada letak matricNo nanti kita guna tu, kalau tak kita agak je.
        const year = formData.gradYear || new Date().getFullYear();
        setPreviewMatric(`D${year}1${formData.ic.slice(0, 4)}...`);
    }, [formData.ic, formData.gradYear]);

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

    const [previewUrl, setPreviewUrl] = useState(null);

    // Image Compression Helper
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024; // Resize to max 1024px
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        const newFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    }, 'image/jpeg', 0.8); // 80% quality
                };
            };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Compress if image
            if (file.type.startsWith('image/')) {
                try {
                    const compressedFile = await compressImage(file);
                    setFormData(prev => ({ ...prev, receipt: compressedFile }));

                    // Create preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPreviewUrl(reader.result);
                    };
                    reader.readAsDataURL(compressedFile);
                } catch (err) {
                    console.error("Compression error", err);
                    // Fallback to original
                    setFormData(prev => ({ ...prev, receipt: file }));
                }
            } else {
                setFormData(prev => ({ ...prev, receipt: file }));
            }
        }
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

        if (!captchaToken) {
            setAlertType('error');
            setAlertMessage('Sila sahkan bahawa anda bukan robot (reCAPTCHA).');
            setShowAlert(true);
            return;
        }

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
                setAlertType('success');
                setAlertMessage('Permohonan berjaya dihantar! Sila tunggu email pengesahan.');
                setShowAlert(true);
                // Redirect happens in handleCloseAlert
            } else {
                setAlertType('error');
                setAlertMessage('Gagal menghantar permohonan. Sila cuba lagi.');
                setShowAlert(true);
            }
        } catch (e) {
            console.error(e);
            setAlertType('error');
            setAlertMessage('Terdapat ralat teknikal semasa menghantar borang.');
            setShowAlert(true);
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

    // Custom Alert State
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error'); // 'error' | 'success'

    // Validation State
    const [errors, setErrors] = useState({});

    const handleNextStep2 = () => {
        const newErrors = {};

        // Name Validation
        if (!formData.name || formData.name.length < 3) {
            newErrors.name = true;
            setAlertMessage("Nama mestilah lebih daripada 3 huruf.");
        }

        // Phone Validation (011-1234567 or 0123456789)
        const phoneRegex = /^(\+?6?0)[0-9]{9,11}$/;
        const cleanPhone = formData.phone.replace(/-/g, '').replace(/\s/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            newErrors.phone = true;
            setAlertMessage("Nombor telefon tidak sah. Sila masukkan nombor yang betul (Contoh: 0123456789).");
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = true;
            setAlertMessage("Alamat email tidak sah.");
        }

        // Grad Year Validation
        if (!formData.gradYear || formData.gradYear < 1922 || formData.gradYear > new Date().getFullYear()) {
            newErrors.gradYear = true;
            setAlertMessage("Tahun graduasi tidak sah.");
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setAlertType('error');
            setShowAlert(true);
            return;
        }

        setErrors({}); // Clear errors
        setStep(3);
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
        if (alertType === 'success') {
            window.location.href = '/';
        }
    };

    // Countdown Timer Logic
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds

    useEffect(() => {
        let interval = null;
        if (step === 4 && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [step, timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.container}>
            {/* Custom Modal */}
            {showAlert && (
                <div className={styles.modalOverlay} onClick={handleCloseAlert}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div
                            className={styles.modalIcon}
                            style={{
                                background: alertType === 'success' ? '#ecfdf5' : '#fef2f2',
                                color: alertType === 'success' ? '#10b981' : '#ef4444'
                            }}
                        >
                            {alertType === 'success' ? '✅' : '⚠️'}
                        </div>
                        <h3 className={styles.modalTitle}>
                            {alertType === 'success' ? 'Berjaya!' : 'Perhatian'}
                        </h3>
                        <p className={styles.modalMessage}>{alertMessage}</p>
                        <button
                            className={styles.modalButton}
                            onClick={handleCloseAlert}
                            style={{ background: alertType === 'success' ? '#10b981' : '#ef4444' }}
                        >
                            {alertType === 'success' ? 'Kembali ke Utama' : 'Semak Semula'}
                        </button>
                    </div>
                </div>
            )}

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
                            <label>No. Kad Pengenalan / Pasport <span style={{ color: 'red' }}>*</span></label>
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
                        <div style={{ marginBottom: '30px' }}>
                            <CardPreview
                                name={formData.name}
                                matricNo={previewMatric}
                                program="ALUMNI UPSI"
                            />
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', marginTop: '-10px' }}>
                                *Pratonton kad digital anda (Rekaan sebenar mungkin berbeza)
                            </p>
                        </div>

                        <h3>Langkah 2: Maklumat Peribadi</h3>
                        <div className={styles.inputGroup}>
                            <label>Nama Penuh <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                                placeholder="Nama Penuh Mengikut IC"
                            />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label>No. Telefon <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                                    placeholder="0123456789"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Email <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                    placeholder="contoh@gmail.com"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Tahun Graduasi <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="number"
                                    name="gradYear"
                                    value={formData.gradYear}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.gradYear ? styles.inputError : ''}`}
                                    placeholder="2023"
                                />
                            </div>
                        </div>
                        <div className={styles.actions} style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1 }}>&larr; Kembali</button>
                            <button
                                onClick={handleNextStep2}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                Seterusnya &rarr;
                            </button>
                        </div>
                    </div>
                )
                }

                {
                    step === 3 && (
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
                                        <label>Alamat (No. Rumah, Jalan, Taman) <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" name="address1" value={formData.address1} onChange={handleChange} required className={styles.input} placeholder="Contoh: No 12, Jalan Alumni 1, Taman Pewira" />
                                    </div>
                                    <div className={styles.row}>
                                        <div className={styles.inputGroup}>
                                            <label>Poskod <span style={{ color: 'red' }}>*</span></label>
                                            <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} required maxLength="5" className={styles.input} placeholder="35900" />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Bandar {lookupLoading && '...'} <span style={{ color: 'red' }}>*</span></label>
                                            <input type="text" name="city" value={formData.city} onChange={handleChange} required className={styles.input} />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Negeri <span style={{ color: 'red' }}>*</span></label>
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
                    )
                }

                {
                    step === 4 && (
                        <form onSubmit={handleSubmit} className={styles.step}>
                            <h3>Langkah 4: Bukti Bayaran</h3>

                            <div className={styles.alertInfo}>
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <p style={{ marginBottom: '10px' }}>Sila buat bayaran <strong>RM 10.00</strong> ke akaun:</p>

                                    {/* QR Code Section */}
                                    <div style={{ marginBottom: '15px' }}>
                                        <img
                                            src="/qr-pay.jpg"
                                            alt="QR Pay"
                                            style={{ maxWidth: '280px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        />

                                        {/* Countdown Timer */}
                                        <div className={styles.timerContainer}>
                                            <span className={styles.timerIcon}>⏳</span>
                                            <span className={styles.timerText}>
                                                Sila lakukan pembayaran dalam masa: <strong>{formatTime(timeLeft)}</strong>
                                            </span>
                                        </div>

                                        <div style={{ marginTop: '15px' }}>
                                            <a
                                                href="/qr-pay.jpg"
                                                download="QR-Pay-UPSI.jpg"
                                                className="btn btn-primary"
                                                style={{ display: 'block', width: '100%', textDecoration: 'none', textAlign: 'center' }}
                                            >
                                                📥 Download QR
                                            </a>
                                        </div>
                                    </div>

                                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', color: '#1e40af', marginBottom: '15px', textAlign: 'left' }}>
                                        <strong>💡 Tips Bayaran Pantas:</strong>
                                        <ol style={{ margin: '5px 0 0 1.2rem', padding: 0 }}>
                                            <li>Download gambar QR di atas.</li>
                                            <li>Buka Apps Bank anda (Maybank/CIMB/TnG dll).</li>
                                            <li>Pilih <strong>Scan QR</strong> &gt; <strong>Select from Gallery</strong>.</li>
                                        </ol>
                                    </div>
                                </div>
                                <small className={styles.smallText} style={{ textAlign: 'center' }}>
                                    *Sila simpan resit pembayaran untuk dimuat naik di bawah.
                                </small>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Muat Naik Resit <span style={{ color: 'red' }}>*</span></label>
                                <input type="file" onChange={handleFileChange} required accept="image/*" className={styles.input} />
                                {previewUrl && (
                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>Preview Resit:</p>
                                        <img
                                            src={previewUrl}
                                            alt="Preview Resit"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '300px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* ReCAPTCHA */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <ReCAPTCHA
                                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfYWzcsAAAAAAnGDiUWPt6_2-n0s0E4cy3vVXSq"}
                                    onChange={(token) => setCaptchaToken(token)}
                                />
                            </div>

                            <div className={styles.actions} style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setStep(3)} className="btn btn-outline" style={{ flex: 1 }}>&larr; Kembali</button>
                                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                                    {loading ? 'Menghantar...' : 'Hantar Permohonan'}
                                </button>
                            </div>
                        </form>
                    )
                }
            </div >
        </div >
    );
}
