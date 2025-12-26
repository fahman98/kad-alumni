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
        const pending = data.filter(o => o.status === 'Pending').length;
        const completed = data.filter(o => o.status === 'Shipped').length;
        // As discussed, assume RM 50 per card for estimation
        const revenue = total * 50;

        setStats({ total, pending, revenue, completed });
    };

    if (loading) return <div>Loading statistics...</div>;

    return (
        <div>
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
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statTitle}>Est. Revenue</span>
                    <span className={styles.statValue}>RM {stats.revenue}</span>
                </div>
            </div>
        </div>
    );
}
