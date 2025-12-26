"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { db, auth } from '../../../lib/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedReceipt, setSelectedReceipt] = useState(null); // Modal state for receipt view

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Stats
    const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0, completed: 0 });

    // Helper to process Google Drive URLs for image tag
    const formatGoogleDriveUrl = (url) => {
        if (!url) return '';
        // Check if it's a google drive url
        if (url.includes('drive.google.com')) {
            // Try to extract ID from typical patterns
            // Pattern 1: /file/d/ID/view
            // Pattern 2: id=ID
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
                return `https://drive.google.com/uc?export=view&id=${id}`;
            }
        }
        return url;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/admin/login');
            } else {
                fetchOrders();
            }
        });

        return () => unsubscribe();
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
            calculateStats(ordersData);

        } catch (error) {
            console.error("Error fetching", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const pending = data.filter(o => o.status === 'Pending').length;
        const completed = data.filter(o => ['Shipped', 'Ready', 'Completed'].includes(o.status)).length;
        // Estimated Revenue: RM 10 per order (excluding rejected)
        const revenue = data.filter(o => o.status !== 'Rejected').length * 10;

        setStats({ total, pending, completed, revenue });
    };

    // --- Search & Filter Logic ---
    const getFilteredOrders = () => {
        return orders.filter(order => {
            const matchStatus = statusFilter === 'All' || order.status === statusFilter;
            const searchLower = searchTerm.toLowerCase();
            const matchSearch =
                (order.name && order.name.toLowerCase().includes(searchLower)) ||
                (order.ic && order.ic.includes(searchLower)) ||
                (order.alumniId && order.alumniId.toLowerCase().includes(searchLower));

            return matchStatus && matchSearch;
        });
    };

    const filteredOrders = getFilteredOrders();

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/admin/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    // --- Actions (Keep existing logic) ---
    const updateStatus = async (orderId, newStatus) => {
        let extraData = {};
        const order = orders.find(o => o.id === orderId);

        if (newStatus === 'Approved') {
            const gradYear = order.gradYear;
            if (!gradYear) { alert("Tahun Graduasi tiada!"); return; }
            const autoId = generateAlumniId(gradYear);
            const confirmedId = prompt(`Auto-Generated ID: ${autoId}`, autoId);
            if (!confirmedId) return;
            extraData = { alumniId: confirmedId };
        }

        if (newStatus === 'Shipped') {
            const trackingNo = prompt("Masukkan Tracking No:");
            if (!trackingNo) return;
            extraData = { trackingNo: trackingNo };
        }

        if (!confirm(`Tukar status ke ${newStatus}?`)) return;

        try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus, ...extraData });

            // Optimistic Update
            const updatedList = orders.map(o => o.id === orderId ? { ...o, status: newStatus, ...extraData } : o);
            setOrders(updatedList);
            calculateStats(updatedList); // Re-calc stats

            // Attempt email (Mock)
            // sendEmail(...) 

        } catch (e) {
            console.error(e);
            alert('Error updating status');
        }
    };

    const deleteOrder = async (orderId) => {
        if (!confirm("Padam KEKAL?")) return;
        try {
            await deleteDoc(doc(db, "orders", orderId));
            const updatedList = orders.filter(o => o.id !== orderId);
            setOrders(updatedList);
            calculateStats(updatedList);
        } catch (e) { alert("Error deleting"); }
    };

    const generateAlumniId = (gradYear) => {
        const prefix = `1922${gradYear}`;
        const existingIds = orders
            .filter(o => o.alumniId && o.alumniId.startsWith(prefix))
            .map(o => parseInt(o.alumniId.slice(-4)))
            .sort((a, b) => b - a);
        const nextRunningNo = existingIds.length > 0 ? existingIds[0] + 1 : 101;
        return `${prefix}${nextRunningNo.toString().padStart(4, '0')}`;
    };

    if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.brand}>🎓 Admin Panel</div>
                <nav className={styles.nav}>
                    <a href="#" className={`${styles.navLink} ${styles.activeLink}`}>Orders</a>
                    <a href="#" className={styles.navLink}>Settings</a>
                    <button onClick={handleLogout} className={styles.logoutBtn}>Log Keluar</button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.topbar}>
                    <div>
                        <h1>Dashboard</h1>
                        <p style={{ color: '#64748b' }}>Selamat kembali, Admin.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statTitle}>Total Order</div>
                        <div className={styles.statValue}>{stats.total}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statTitle}>Pending</div>
                        <div className={styles.statValue} style={{ color: '#d97706' }}>{stats.pending}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statTitle}>Completed</div>
                        <div className={styles.statValue} style={{ color: '#059669' }}>{stats.completed}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statTitle}>Est. Revenue</div>
                        <div className={styles.statValue} style={{ color: '#2563eb' }}>RM {stats.revenue}</div>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.searchBar}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Cari Nama, IC, atau Alumni ID..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
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
                        <button onClick={fetchOrders} className="btn btn-outline">Refresh</button>
                    </div>
                </div>

                {/* Table */}
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nama / Tel</th>
                                <th>IC & Graduan</th>
                                <th>Jenis</th>
                                <th>Status</th>
                                <th>Resit</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div className={styles.cellName}>{order.name}</div>
                                        <div className={styles.cellSub}>{order.phone}</div>
                                    </td>
                                    <td>
                                        <div>{order.ic}</div>
                                        <div className={styles.cellSub}>Grad: {order.gradYear}</div>
                                        {order.alumniId && <div className={styles.tagId}>{order.alumniId}</div>}
                                    </td>
                                    <td>
                                        <span className={order.pickupMethod === 'delivery' ? styles.badgeBlue : styles.badgeGray}>
                                            {order.pickupMethod === 'delivery' ? 'POS' : 'PICKUP'}
                                        </span>
                                        {order.pickupMethod === 'delivery' && order.trackingNo && (
                                            <div className={styles.cellSub} style={{ fontSize: '0.75rem' }}>No: {order.trackingNo}</div>
                                        )}
                                        {order.pickupMethod === 'pickup' && !order.appointmentDate && (
                                            <div className={styles.cellSub} style={{ color: '#d97706' }}>Pending Book</div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.statusBadge} data-status={order.status}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.receiptUrl ? (
                                            <button
                                                onClick={() => setSelectedReceipt(order.receiptUrl)}
                                                className={styles.linkButton}
                                                style={{ color: '#2563eb', fontWeight: 500, fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                                            >
                                                View
                                            </button>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {order.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => updateStatus(order.id, 'Approved')} className={`${styles.btnAction} ${styles.btnApprove}`}>Approve</button>
                                                    <button onClick={() => updateStatus(order.id, 'Rejected')} className={`${styles.btnAction} ${styles.btnReject}`}>Reject</button>
                                                </>
                                            )}
                                            {order.status === 'Approved' && (
                                                <button onClick={() => updateStatus(order.id, 'Printing')} className={`${styles.btnAction} ${styles.btnPrint}`}>Print</button>
                                            )}
                                            {order.status === 'Printing' && (
                                                <button onClick={() => updateStatus(order.id, 'Ready')} className={`${styles.btnAction} ${styles.btnReady}`}>Ready</button>
                                            )}
                                            {order.status === 'Ready' && order.pickupMethod === 'delivery' && (
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
            </main >
            {/* Receipt Modal */}
            {selectedReceipt && (
                <div className={styles.modalOverlay} onClick={() => setSelectedReceipt(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Bukti Pembayaran</h3>
                            <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <img
                            src={formatGoogleDriveUrl(selectedReceipt)}
                            alt="Receipt"
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid #eee', minHeight: '200px', objectFit: 'contain', background: '#f8fafc' }}
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Load+Error'; }}
                        />
                        <div style={{ marginTop: '15px', textAlign: 'right' }}>
                            <a href={selectedReceipt} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '8px 15px', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', background: '#2563eb', color: 'white', borderRadius: '6px' }}>
                                Download Original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
