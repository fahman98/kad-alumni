'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import styles from './page.module.css';
import { sendEmail } from '@/lib/sendEmail';
import { getApprovalEmail, getReadyEmail, getShippedEmail } from '@/lib/emailTemplates';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]); // Bulk Selection

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
            inputs: null, // content for inputs
            type: 'info',
            onConfirm: async (data) => { // data param for inputs
                try {
                    const orderRef = doc(db, "orders", id);
                    const updates = { status: newStatus };

                    // If Approving, Generate Card ID if not exists
                    let loadingMsg = "Updating...";
                    const orderData = orders.find(o => o.id === id);

                    if (newStatus === 'Approved') {

                        // ID Generation: 1922 + GradYear + Running No (Start 0101)
                        const gradYear = orderData?.gradYear || new Date().getFullYear(); // Fallback to current year if missing
                        const prefix = `1922${gradYear}`;

                        // Find all existing IDs for this gradYear
                        const existingIds = orders
                            .filter(o => o.generatedId && o.generatedId.startsWith(prefix))
                            .map(o => parseInt(o.generatedId.replace(prefix, ''), 10))
                            .filter(num => !isNaN(num));

                        let nextSeq = 101; // Default start
                        if (existingIds.length > 0) {
                            nextSeq = Math.max(...existingIds) + 1;
                        }

                        const generatedCardId = `${prefix}${nextSeq.toString().padStart(4, '0')}`;

                        updates.generatedId = generatedCardId;

                        // Trigger Email Notification (Non-blocking usually, but lets await to ensure)
                        if (orderData) {
                            // Format ID for display (e.g. 1922 2023 0101)
                            const formattedCardId = generatedCardId.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');

                            // Date Approved
                            const approvedDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format

                            // SEND APPROVAL EMAIL
                            // Template signature: (name, ic, cardId, date)
                            const emailContent = getApprovalEmail(orderData.name, orderData.ic, formattedCardId, approvedDate);
                            sendEmail(orderData.email, "Keputusan Permohonan Kad Alumni UPSI", emailContent);
                        }
                    }

                    // Handling READY (Pickup)
                    if (newStatus === 'Ready' && orderData?.pickupMethod !== 'delivery') {
                        // SEND READY EMAIL
                        // TODO: Replace # with actual booking page link
                        const bookingLink = `${window.location.origin}/booking`;
                        const emailContent = getReadyEmail(orderData.name, bookingLink);
                        sendEmail(orderData.email, "Kad Alumni Anda Telah Siap! 🎓", emailContent);
                    }

                    // Handling SHIPPED (Delivery)
                    if (newStatus === 'Shipped' && orderData?.pickupMethod === 'delivery') {
                        // Save Tracking Info
                        if (data && data.trackingNo) {
                            updates.details = {
                                ...orderData.details,
                                trackingNo: data.trackingNo,
                                courierFee: data.courierFee || '0'
                            };

                            // SEND SHIPPED EMAIL
                            const trackingLink = `https://www.google.com/search?q=${data.trackingNo}`; // Generic google search or specific courier
                            const emailContent = getShippedEmail(orderData.name, data.trackingNo, data.courierFee, trackingLink);
                            sendEmail(orderData.email, "Kad Alumni Anda Telah Dipos! 🚚", emailContent);
                        }
                    }

                    await updateDoc(orderRef, updates);

                    setOrders(prev => prev.map(o =>
                        o.id === id ? { ...o, ...updates } : o
                    ));
                    if (newStatus === 'Approved') {
                        setConfirmation({
                            isOpen: true,
                            message: 'Permohonan Diluluskan',
                            subMessage: 'Email notifikasi dan butiran kad telah dihantar kepada pemohon.',
                            type: 'success',
                            onConfirm: () => closeConfirmation() // Just close
                        });
                    } else {
                        closeConfirmation();
                    }

                } catch (error) {
                    setConfirmation({
                        isOpen: true,
                        message: 'Ralat',
                        subMessage: error.message,
                        type: 'danger',
                        onConfirm: () => closeConfirmation()
                    });
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

    // Export to Excel
    const exportToExcel = () => {
        const headers = ["Nama,Email,No. IC/Matrik,Status,Tarikh,Alamat,Tracking No"];
        const rows = filteredOrders.map(o => {
            const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            const address = o.pickupMethod === 'delivery' ? `"${o.address}, ${o.postcode} ${o.city}"` : 'Self Pickup';
            return `"${o.name}",${o.email},'${o.ic || o.matricNo}',${o.status},${date},${address},${o.details?.trackingNo || ''}`;
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Alumni_Orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    // Bulk Actions
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginatedOrders.map(o => o.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleBulkStatus = async (status) => {
        if (!confirm(`Tukar status ${selectedIds.length} tempahan kepada '${status}'?`)) return;
        setLoading(true);
        try {
            const promises = selectedIds.map(id => updateDoc(doc(db, "orders", id), { status }));
            await Promise.all(promises);
            setOrders(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, status } : o));
            setSelectedIds([]);
            alert("Berjaya kemaskini status.");
        } catch (err) {
            alert("Ralat: " + err.message);
        } finally {
            setLoading(false);
        }
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

    // if (loading) return <div>Loading orders...</div>; // Removed simple loading

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
                <button onClick={exportToExcel} className={styles.btnAction} style={{ background: '#10b981', color: 'white', fontSize: '0.9rem', padding: '10px 16px' }}>
                    📊 Export Excel
                </button>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    onChange={handleSelectAll}
                                    checked={paginatedOrders.length > 0 && selectedIds.length === paginatedOrders.length}
                                />
                            </th>
                            <th>Alumni</th>
                            <th>Info Kad</th>
                            <th>Status</th>
                            <th>Bukti Bayaran</th>
                            <th>Pilihan</th>
                            <th>Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            // Skeleton Rows
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '120px', height: '16px' }}></div>
                                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '180px' }}></div>
                                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '100px' }}></div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={`${styles.skeleton} ${styles.skeletonBadge}`} style={{ margin: '0 auto 4px' }}></div>
                                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '100px', margin: '0 auto' }}></div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={`${styles.skeleton} ${styles.skeletonBadge}`} style={{ width: '20px' }}></div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={`${styles.skeleton} ${styles.skeletonBadge}`} style={{ width: '80px' }}></div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '40px', margin: '0 auto' }}></div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={`${styles.skeleton} ${styles.skeletonBadge}`} style={{ width: '90px', marginBottom: '4px' }}></div>
                                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '120px', margin: '0 auto' }}></div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            <div className={`${styles.skeleton} ${styles.skeletonBtn}`}></div>
                                            <div className={`${styles.skeleton} ${styles.skeletonBtn}`}></div>
                                            <div className={`${styles.skeleton} ${styles.skeletonBtn}`}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            paginatedOrders.map(order => (
                                <tr key={order.id} style={{ background: selectedIds.includes(order.id) ? '#eff6ff' : 'transparent' }}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={selectedIds.includes(order.id)}
                                            onChange={() => handleSelectOne(order.id)}
                                        />
                                    </td>
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
                                            {/* Matches value from src/app/beli/page.js: 'pickup' or 'delivery' */}
                                            {order.pickupMethod ?
                                                (order.pickupMethod === 'delivery' ? 'Pos' : 'Ambil Sendiri')
                                                : 'N/A'
                                            }
                                        </div>
                                        {order.pickupMethod === 'delivery' && (
                                            <div className={styles.cellSub} style={{ fontSize: '0.7rem', maxWidth: '150px', margin: '4px auto 0' }}>
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
                            ))
                        )}
                        {/* Close ternary */}
                        {!loading && paginatedOrders.length === 0 && (
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

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className={styles.bulkActionBar}>
                    <span className={styles.bulkCount}>{selectedIds.length} Selected</span>
                    <button onClick={() => handleBulkStatus('Approved')} className={styles.bulkBtn} style={{ color: '#4ade80' }}>✓ Approve</button>
                    <button onClick={() => handleBulkStatus('Printing')} className={styles.bulkBtn}>🖨️ Printing</button>
                    <button onClick={() => handleBulkStatus('Ready')} className={styles.bulkBtn}>📦 Ready</button>
                    <button onClick={() => handleBulkStatus('Shipped')} className={styles.bulkBtn}>🚚 Shipped</button>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }}></div>
                    <button onClick={() => setSelectedIds([])} className={styles.bulkBtn}>Cancel</button>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmation.isOpen && (
                <div className={styles.modalOverlay} onClick={closeConfirmation}>
                    <div className={styles.modalContent} style={{ maxWidth: '400px', textAlign: 'center', padding: '0 0 20px 0' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '24px 24px 12px 24px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px auto',
                                background: confirmation.type === 'danger' ? '#fee2e2' : confirmation.type === 'success' ? '#dcfce7' : '#e0f2fe',
                                color: confirmation.type === 'danger' ? '#dc2626' : confirmation.type === 'success' ? '#16a34a' : '#0284c7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                            }}>
                                {confirmation.type === 'danger' ? '⚠️' : confirmation.type === 'success' ? '✅' : 'ℹ️'}
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.125rem' }}>{confirmation.message}</h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>{confirmation.subMessage}</p>

                            {/* Input Fields for Shipping */}
                            {confirmation.inputs && (
                                <div style={{ marginTop: '15px', textAlign: 'left' }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px' }}>Tracking No</label>
                                        <input type="text" id="trackingNo" className={styles.searchInput} style={{ width: '100%' }} placeholder="Contoh: JNT123456" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px' }}>Cas DFOD (RM)</label>
                                        <input type="number" id="courierFee" className={styles.searchInput} style={{ width: '100%' }} placeholder="Contoh: 12.00" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '0 24px 8px 24px' }}>
                            {confirmation.type !== 'success' && (
                                <button
                                    onClick={closeConfirmation}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white',
                                        color: '#374151', fontWeight: '500', cursor: 'pointer', flex: '1'
                                    }}
                                >
                                    Batal
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (confirmation.inputs) {
                                        const tNo = document.getElementById('trackingNo').value;
                                        const fee = document.getElementById('courierFee').value;
                                        if (!tNo) return alert("Sila masukkan Tracking No.");
                                        confirmation.onConfirm({ trackingNo: tNo, courierFee: fee });
                                    } else {
                                        confirmation.onConfirm();
                                    }
                                }}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: confirmation.type === 'danger' ? '#dc2626' : confirmation.type === 'success' ? '#16a34a' : '#2563eb',
                                    color: 'white', fontWeight: '500', cursor: 'pointer', flex: '1'
                                }}
                            >
                                {confirmation.type === 'danger' ? 'Padam' : confirmation.type === 'success' ? 'Selesai' : 'Ya, Pasti'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
