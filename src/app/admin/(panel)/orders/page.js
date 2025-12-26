'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setOrders(ordersData);

        } catch (error) {
            console.error("Error fetching", error);
        } finally {
            setLoading(false);
        }
    };

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        message: '',
        subMessage: '',
        type: 'info', // info, danger
        onConfirm: () => { }
    });

    const updateStatus = (id, newStatus) => {
        setConfirmation({
            isOpen: true,
            message: `Tukar status kepada ${newStatus}?`,
            subMessage: 'Adakah anda pasti mahu mengubah status tempahan ini?',
            type: 'info',
            onConfirm: async () => {
                try {
                    const orderRef = doc(db, "orders", id);
                    const updates = { status: newStatus };

                    // If Approving, Generate Card ID if not exists
                    let loadingMsg = "Updating...";

                    if (newStatus === 'Approved') {
                        // Simple ID Generation: KM (Kad Matrik/Member) - Year - 4 Random Digits
                        // Ideally checking for duplicates, but for MVP random is ok.
                        const currentYear = new Date().getFullYear();
                        const randomSeq = Math.floor(1000 + Math.random() * 9000); // 1000 - 9999
                        const generatedCardId = `KM${currentYear}${randomSeq}`;

                        updates.generatedId = generatedCardId; // Save to DB

                        // Trigger Email Notification (Non-blocking usually, but lets await to ensure)
                        const orderData = orders.find(o => o.id === id);
                        if (orderData) {
                            fetch('/api/notify/approve', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: orderData.name,
                                    email: orderData.email,
                                    ic: orderData.ic,
                                    cardId: generatedCardId,
                                    date: new Date().toLocaleDateString('ms-MY')
                                })
                            }).catch(err => console.error("Email API failed", err));
                        }
                    }

                    await updateDoc(orderRef, updates);

                    setOrders(prev => prev.map(o =>
                        o.id === id ? { ...o, ...updates } : o
                    ));
                    closeConfirmation();

                    if (newStatus === 'Approved') alert("Permohonan diluluskan & Email telah dihantar.");

                } catch (error) {
                    alert("Error updating status: " + error.message);
                }
            }
        });
    };

    const deleteOrder = (id) => {
        setConfirmation({
            isOpen: true,
            message: 'Padam Tempahan?',
            subMessage: 'Tindakan ini tidak boleh dikembalikan. Adakah anda pasti?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, "orders", id));
                    setOrders(prev => prev.filter(o => o.id !== id));
                    closeConfirmation();
                } catch (error) {
                    alert("Error deleting: " + error.message);
                }
            }
        });
    };

    const closeConfirmation = () => {
        setConfirmation({ ...confirmation, isOpen: false });
    };

    // Helper to process Google Drive URLs for image tag
    const formatGoogleDriveUrl = (url) => {
        if (!url) return '';
        if (url.includes('drive.google.com')) {
            let id = '';
            const parts = url.split('/');
            const dIndex = parts.indexOf('d');
            if (dIndex !== -1 && parts.length > dIndex + 1) {
                id = parts[dIndex + 1];
            } else {
                const match = url.match(/id=([^&]+)/);
                if (match) id = match[1];
            }

            if (id) {
                // Use lh3.googleusercontent.com which is more reliable for embedding images
                return `https://lh3.googleusercontent.com/d/${id}=s1000?authuser=0`;
            }
        }
        return url;
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.ic?.includes(searchTerm) ||
            order.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <div>Loading orders...</div>;

    return (
        <div>
            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <i className={styles.searchIcon}>🔍</i>
                    <input
                        type="text"
                        placeholder="Cari Nama, IC, atau Email..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={styles.filterSelect}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">Semua Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Printing">Printing</option>
                    <option value="Ready">Ready</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Pelajar</th>
                            <th>Info Kad</th>
                            <th>Status</th>
                            <th>Bukti Bayaran</th>
                            <th>Pilihan</th>
                            <th>Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(order => (
                            <tr key={order.id}>
                                <td>
                                    <div className={styles.cellName}>{order.name}</div>
                                    <div className={styles.cellSub}>{order.email}</div>
                                    <div className={styles.cellSub}>{order.phone}</div>
                                </td>
                                <td>
                                    {order.cardType && (
                                        <div className={styles.badgeBlue}>{order.cardType}</div>
                                    )}
                                    <div className={styles.tagId}>{order.matricNo || order.ic}</div>
                                </td>
                                <td>
                                    <span className={styles.statusBadge} data-status={order.status || 'Pending'}>
                                        {order.status || 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    {order.receiptUrl ? (
                                        <button
                                            onClick={() => setSelectedReceipt(order.receiptUrl)}
                                            className={styles.linkButton}
                                        >
                                            View
                                        </button>
                                    ) : '-'}
                                </td>
                                <td>
                                    <div className={styles.badgeGray}>
                                        {/* Assuming pickupMethod was meant here but handling safely if missing */}
                                        {order.pickupMethod ?
                                            (order.pickupMethod === 'shipping' ? 'Pos' : 'Ambil Sendiri')
                                            : 'N/A'
                                        }
                                    </div>
                                    {order.pickupMethod === 'shipping' && (
                                        <div className={styles.cellSub} style={{ fontSize: '0.7rem', maxWidth: '150px' }}>
                                            {order.address}, {order.postcode} {order.city}, {order.state}
                                        </div>
                                    )}
                                </td>

                                <td>
                                    <div className={styles.actions}>
                                        {(order.status === 'Pending' || !order.status) && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'Approved')} className={`${styles.btnAction} ${styles.btnApprove}`} title="Approve">✓</button>
                                                <button onClick={() => updateStatus(order.id, 'Rejected')} className={`${styles.btnAction} ${styles.btnReject}`} title="Reject">✕</button>
                                            </>
                                        )}
                                        {order.status === 'Approved' && (
                                            <button onClick={() => updateStatus(order.id, 'Printing')} className={`${styles.btnAction} ${styles.btnPrint}`}>Print</button>
                                        )}
                                        {order.status === 'Printing' && (
                                            <button onClick={() => updateStatus(order.id, 'Ready')} className={`${styles.btnAction} ${styles.btnReady}`}>Ready</button>
                                        )}
                                        {order.status === 'Ready' && order.pickupMethod === 'shipping' && (
                                            <button onClick={() => updateStatus(order.id, 'Shipped')} className={`${styles.btnAction} ${styles.btnShip}`}>Ship</button>
                                        )}
                                        <button onClick={() => deleteOrder(order.id)} className={`${styles.btnAction} ${styles.btnDelete}`}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedOrders.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    Tiada rekod ditemui.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className={styles.pagination}>
                <button
                    className={styles.pageBtn}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                >
                    Previous
                </button>
                <span style={{ color: '#64748b' }}>Page {currentPage} of {totalPages || 1}</span>
                <button
                    className={styles.pageBtn}
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(p => p + 1)}
                >
                    Next
                </button>
            </div>

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div className={styles.modalOverlay} onClick={() => setSelectedReceipt(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 10px 20px' }}>
                            <h3 style={{ margin: 0 }}>Bukti Pembayaran</h3>
                            <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ padding: '0 20px' }}>
                            <img
                                src={formatGoogleDriveUrl(selectedReceipt)}
                                alt="Receipt"
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid #eee', minHeight: '200px', objectFit: 'contain', background: '#f8fafc' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Load+Error'; }}
                            />
                        </div>
                        <div style={{ padding: '20px', textAlign: 'right', background: '#f9fafb', marginTop: '15px' }}>
                            <a href={selectedReceipt} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '10px 20px', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', background: '#2563eb', color: 'white', borderRadius: '8px' }}>
                                Download Original
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmation.isOpen && (
                <div className={styles.modalOverlay} onClick={closeConfirmation}>
                    <div className={styles.modalContent} style={{ maxWidth: '400px', textAlign: 'center', padding: '0 0 20px 0' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '24px 24px 12px 24px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px auto',
                                background: confirmation.type === 'danger' ? '#fee2e2' : '#e0f2fe',
                                color: confirmation.type === 'danger' ? '#dc2626' : '#0284c7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                            }}>
                                {confirmation.type === 'danger' ? '⚠️' : 'ℹ️'}
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.125rem' }}>{confirmation.message}</h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>{confirmation.subMessage}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '0 24px 8px 24px' }}>
                            <button
                                onClick={closeConfirmation}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white',
                                    color: '#374151', fontWeight: '500', cursor: 'pointer', flex: '1'
                                }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmation.onConfirm}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: confirmation.type === 'danger' ? '#dc2626' : '#2563eb',
                                    color: 'white', fontWeight: '500', cursor: 'pointer', flex: '1'
                                }}
                            >
                                {confirmation.type === 'danger' ? 'Padam' : 'Ya, Pasti'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
