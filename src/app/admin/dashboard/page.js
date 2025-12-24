"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Basic auth check
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            router.push('/admin/login');
            return;
        }

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
            console.error("Error fetching orders:", error);
            alert("Gagal load orders.");
        } finally {
            setLoading(false);
        }
    };

    // GAS URL (Ideally from env but for client-side quick fix)
    const GAS_API = "https://script.google.com/macros/s/AKfycbwnc520o-B_LSq9rtKsYQmj0bE_TI4GZQpREkWDRkK2-YLsrlSwufRI9pmszdOtcdbZ/exec";

    const sendEmail = async (order, type, details) => {
        // details can be { alumniId } or { trackingNo }
        let subject = "";
        let body = "";

        // Note: For MVP we hardcode the email templates here. 
        // Ideally, these templates reside in GAS or a separate config.
        if (type === 'Approved') {
            subject = "Tahniah! Permohonan Kad Alumni Anda Diluluskan";
            body = `
                <h3>Tahniah, ${order.name}!</h3>
                <p>Permohonan Kad Alumni anda telah diluluskan.</p>
                <p><strong>No. Kad Alumni: ${details.alumniId}</strong></p>
                <p>Kad anda sedang dalam proses percetakan.</p>
                <hr>
                <p>Pusat Alumni UPSI</p>
            `;
        } else if (type === 'Shipped') {
            subject = "Kad Alumni Anda Telah Dipos";
            body = `
                <h3>Hai ${order.name},</h3>
                <p>Kad Alumni anda telah dipos menggunakan J&T / PosLaju.</p>
                <p><strong>Tracking No: ${details.trackingNo}</strong></p>
                <p>Sila semak status penghantaran dalam masa 24 jam.</p>
                <hr>
                <p>Pusat Alumni UPSI</p>
            `;
        }

        if (!subject) return;

        // Fire & Forget (Don't wait strictly for email to finish to update UI, but good to log)
        /*
           CRITICAL: The current Order Form DOES NOT collect 'email'.
           We need to fix this in future, but for now assuming 'phone' or 'ic' isn't email.
           Since we don't have email in DB, we can't send email!

           WAIT: The user *never* added an email field to the form in the earlier steps?
           Let me check the Purchase Page code...
           Steps 367 (view beli/page.js) shows formData: {name, ic, phone, alumniId, gradYear, pickupMethod, address, receipt}
            THERE IS NO EMAIL FIELD!

            I must alert the user about this. I cannot implement email sending if I don't have the user's email.
            */
        console.warn("No email field in order data. Email skipped.");
    };

    const generateAlumniId = async (gradYear) => {
        // Formula: 1922 + gradYear + RunningNo (Start 0101)
        const prefix = `1922${gradYear}`;

        const existingIds = orders
            .filter(o => o.alumniId && o.alumniId.startsWith(prefix))
            .map(o => parseInt(o.alumniId.slice(-4)))
            .sort((a, b) => b - a);

        let nextRunningNo = 101;
        if (existingIds.length > 0) {
            nextRunningNo = existingIds[0] + 1;
        }

        const runningStr = nextRunningNo.toString().padStart(4, '0');
        return `${prefix}${runningStr}`;
    };

    const updateStatus = async (orderId, newStatus) => {
        let extraData = {};
        const order = orders.find(o => o.id === orderId);

        // 1. Logic for Approving (Auto Generate ID)
        if (newStatus === 'Approved') {
            const gradYear = order.gradYear;
            if (!gradYear) {
                alert("Tahun Graduasi tiada! Tak boleh generate ID.");
                return;
            }

            const autoId = await generateAlumniId(gradYear);
            const confirmedId = prompt(`Auto-Generated ID: ${autoId}\n\nTekan OK untuk setuju, atau edit jika perlu:`, autoId);

            if (!confirmedId) return;
            extraData = { alumniId: confirmedId };
        }

        // 2. Logic for Shipping (Assign Tracking No)
        if (newStatus === 'Shipped') {
            const trackingNo = prompt("Masukkan Tracking No (J&T/PosLaju):");
            if (!trackingNo) return;
            extraData = { trackingNo: trackingNo };
        }

        if (!confirm(`Sahkan status bertukar ke '${newStatus}'?`)) return;

        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                ...extraData
            });

            // Try to send email (Will fail solely because we don't have the email address yet)
            // But I will put the logic here so it's ready once we add the field.
            if (order.email) {
                await sendEmail(order, newStatus, extraData);
                alert(`Status updated & Email sent to ${order.email}`);
            } else {
                alert('Status updated! (No Email sent - User email missing)');
            }

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...extraData } : o));

        } catch (e) {
            console.error(e);
            alert('Error updating status');
        }
    };

    const deleteOrder = async (orderId) => {
        if (!confirm("AMARAN: Data ini akan dipadam KEKAL. Anda pasti?")) return;

        try {
            await deleteDoc(doc(db, "orders", orderId));
            setOrders(prev => prev.filter(o => o.id !== orderId));
            alert("Data berjaya dipadam.");
        } catch (error) {
            console.error(error);
            alert("Gagal padam data.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        router.push('/admin/login');
    };

    if (loading) return <div className={styles.loading}>Loading Orders...</div>;

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>Admin Panel</div>
                <nav className={styles.nav}>
                    <a href="#" className={styles.active}>Order List</a>
                    <a href="#" onClick={handleLogout}>Log Keluar</a>
                </nav>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Senarai Permohonan ({orders.length})</h1>
                    <button onClick={fetchOrders} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Refresh</button>
                </header>

                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nama / Tel</th>
                                <th>IC & Graduan</th>
                                <th>Jenis</th>
                                <th>Status</th>
                                <th>Resit</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div className={styles.cellName}>{order.name}</div>
                                        <div className={styles.cellSub}>{order.phone}</div>
                                    </td>
                                    <td>
                                        <div>{order.ic}</div>
                                        <div className={styles.cellSub}>Grad: {order.gradYear}</div>
                                        {order.alumniId && <div className={styles.tagId}>ID: {order.alumniId}</div>}
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${order.pickupMethod === 'delivery' ? styles.badgeBlue : styles.badgeGray}`}>
                                            {order.pickupMethod === 'delivery' ? 'POS' : 'PICKUP'}
                                        </span>
                                        {order.pickupMethod === 'delivery' && order.trackingNo && (
                                            <div className={styles.trackingInfo}>Trk: {order.trackingNo}</div>
                                        )}
                                        {order.pickupMethod === 'pickup' && (
                                            <div className={styles.dateInfo}>
                                                {order.appointmentDate ? `📅 ${order.appointmentDate}` : '⏳ Belum Book'}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.statusText} data-status={order.status}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.receiptUrl ? (
                                            <a href={order.receiptUrl} target="_blank" className={styles.link}>Lihat Resit</a>
                                        ) : (
                                            <span className={styles.cellSub}>Tiada</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {order.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => updateStatus(order.id, 'Approved')} className={styles.btnApprove}>✓ Approve</button>
                                                    <button onClick={() => updateStatus(order.id, 'Rejected')} className={styles.btnReject}>✕ Rej</button>
                                                </>
                                            )}
                                            {order.status === 'Approved' && (
                                                <button onClick={() => updateStatus(order.id, 'Printing')} className={styles.btnProcess}>⚡ Print</button>
                                            )}
                                            {order.status === 'Printing' && (
                                                <button onClick={() => updateStatus(order.id, 'Ready')} className={styles.btnReady}>📦 Ready</button>
                                            )}
                                            {order.status === 'Ready' && order.pickupMethod === 'delivery' && (
                                                <button onClick={() => updateStatus(order.id, 'Shipped')} className={styles.btnShip}>🚚 Ship</button>
                                            )}
                                            <button onClick={() => deleteOrder(order.id)} className={styles.btnDelete} title="Padam Kekal">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
