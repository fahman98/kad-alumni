'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import styles from './page.module.css';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardPage() {
    const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0, completed: 0 });
    const [chartData, setChartData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        const completed = data.filter(o => o.status === 'Ready' || o.status === 'Shipped').length;
        const paidOrders = data.filter(o => ['Approved', 'Printing', 'Ready', 'Shipped'].includes(o.status)).length;
        const revenue = paidOrders * 10;

        // Breakdown counts
        const pickupCount = data.filter(o => !o.pickupMethod || o.pickupMethod === 'pickup').length;
        const deliveryCount = data.filter(o => o.pickupMethod === 'delivery').length;

        setStats({ total, pending, revenue, completed, pickupCount, deliveryCount });

        // Process Data for Bar Chart (Sales by Month)
        const salesByMonth = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        data.forEach(order => {
            if (order.createdAt && ['Approved', 'Printing', 'Ready', 'Shipped'].includes(order.status)) {
                const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt.seconds * 1000);
                const month = months[date.getMonth()];
                salesByMonth[month] = (salesByMonth[month] || 0) + 10; // RM10 per order
            }
        });

        const barData = Object.keys(salesByMonth).map(month => ({
            name: month,
            jualan: salesByMonth[month]
        }));
        // Sort by month index if needed, simplistic approach:
        barData.sort((a, b) => months.indexOf(a.name) - months.indexOf(b.name));
        setChartData(barData);


        // Process Data for Pie Chart (Status Distribution)
        const statusCounts = {};
        data.forEach(order => {
            const s = order.status || 'Pending';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        const pieData = Object.keys(statusCounts).map(key => ({
            name: key,
            value: statusCounts[key]
        }));
        setStatusData(pieData);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

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

            {/* Charts Section */}
            <div className={styles.chartsRow}>
                {/* Bar Chart - Sales Trend */}
                <div className={styles.chartCard}>
                    <h3>📈 Trend Jualan Bulanan</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `RM${value}`} />
                                <RechartsTooltip
                                    formatter={(value) => [`RM ${value}`, 'Jualan']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="jualan" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Status Distribution */}
                <div className={styles.chartCard}>
                    <h3>📊 Pecahan Status</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Breakdown Stats */}
            <h3 style={{ margin: '1.5rem 0 1rem 0', color: '#4b5563', fontSize: '1.1rem' }}>Pecahan Kaedah Pengambilan</h3>
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
