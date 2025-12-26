'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import styles from './page.module.css';

export default function DashboardPage() {
    const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We can fetch stats here. Authentication is handled by Layout.
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const q = query(collection(db, "orders"));
            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map(doc => doc.data());

            calculateStats(ordersData);
        } catch (error) {
            console.error("Error fetching stats", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const pending = data.filter(o => o.status === 'Pending' || !o.status).length;

        // Completed includes Ready (for pickup) and Shipped (for delivery)
        const completed = data.filter(o => o.status === 'Ready' || o.status === 'Shipped').length;

        // Revenue: Only count paid/processed orders (Approved and beyond). Exclude Rejected/Pending.
        // Assuming every valid order is RM 10.
        const paidOrders = data.filter(o => ['Approved', 'Printing', 'Ready', 'Shipped'].includes(o.status)).length;
        const revenue = paidOrders * 10;

        // Breakdown
        const pickupCount = data.filter(o => !o.pickupMethod || o.pickupMethod === 'pickup').length; // specific logic if default is pickup
        const deliveryCount = data.filter(o => o.pickupMethod === 'delivery').length;

        setStats({ total, pending, revenue, completed, pickupCount, deliveryCount });
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '200px' }}>
            <div style={{
                width: '30px', height: '30px', border: '3px solid #e5e7eb',
                borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }}></div>
            <style jsx>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
        </div>
    );

    return (
        <div>
            {/* Main Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statTitle}>Total Orders</span>
                    <span className={styles.statValue} style={{ color: '#2563eb' }}>{stats.total}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statTitle}>Pending</span>
                    <span className={styles.statValue} style={{ color: '#f59e0b' }}>{stats.pending}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statTitle}>Completed</span>
                    <span className={styles.statValue} style={{ color: '#10b981' }}>{stats.completed}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '5px' }}>Ready / Shipped</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statTitle}>Est. Revenue</span>
                    <span className={styles.statValue}>RM {stats.revenue}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '5px' }}>Based on approved orders</span>
                </div>
            </div>

            {/* Breakdown Stats */}
            <h3 style={{ margin: '0 0 1rem 0', color: '#4b5563', fontSize: '1.1rem' }}>Pecahan Kaedah Pengambilan</h3>
            <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className={styles.statCard} style={{ borderLeft: '4px solid #8b5cf6' }}>
                    <span className={styles.statTitle}>Ambil Sendiri (Office)</span>
                    <span className={styles.statValue} style={{ color: '#8b5cf6' }}>{stats.pickupCount}</span>
                </div>
                <div className={styles.statCard} style={{ borderLeft: '4px solid #ec4899' }}>
                    <span className={styles.statTitle}>Pos (Delivery)</span>
                    <span className={styles.statValue} style={{ color: '#ec4899' }}>{stats.deliveryCount}</span>
                </div>
            </div>
        </div>
    );
}
