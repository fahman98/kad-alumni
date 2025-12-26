'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
    const [selectedDate, setSelectedDate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleDateChange = (e) => {
        const dateStr = e.target.value;
        const date = new Date(dateStr);
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday

        // Validate Weekend
        if (day === 0 || day === 6) {
            setError("Maaf, pejabat tutup pada hari Sabtu dan Ahad. Sila pilih hari bekerja.");
            setSelectedDate('');
        } else {
            setError('');
            setSelectedDate(dateStr);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedDate) {
            setError("Sila pilih tarikh.");
            return;
        }
        setSuccess(true);
        // Here we would ideally save to DB, but for MVP we just show success.
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '10px' }}>Tempahan Berjaya!</h1>
                    <p style={{ color: '#4b5563' }}>Tarikh pengambilan anda telah direkodkan. Sila hadir pada tarikh tersebut.</p>
                    <p style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '1.1rem' }}>{new Date(selectedDate).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px', textAlign: 'center' }}>📅 Pilih Tarikh Ambil</h1>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>Sila pilih tarikh untuk mengambil Kad Alumni anda di pejabat.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Tarikh Pilihan</label>
                        <input
                            type="date"
                            onChange={handleDateChange}
                            min={new Date().toISOString().split('T')[0]} // Disable past dates
                            className="input"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        />
                        {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '8px' }}>{error}</p>}
                    </div>

                    <button type="submit" disabled={!selectedDate} style={{ background: '#2563eb', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', opacity: !selectedDate ? 0.7 : 1 }}>
                        Sahkan Tarikh
                    </button>
                </form>
            </div>
        </div>
    );
}
