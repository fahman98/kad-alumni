'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './layout.module.css';
import Link from 'next/link';

export default function AdminPanelLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/admin/login');
            } else {
                setUser(currentUser);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Close sidebar on mobile route change automatically could be nice, but stick to simple logic first

    if (loading) return <div className={styles.loading}>Loading...</div>;

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Orders', path: '/admin/orders', icon: '📦' },
        { name: 'Settings', path: '/admin/settings', icon: '⚙️' },
    ];

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <nav className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
                <div className={styles.brand}>
                    <span>🎓 Admin Panel</span>
                </div>
                <div className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                            >
                                <span>{item.icon}</span> {item.name}
                            </Link>
                        );
                    })}

                    <button className={styles.logoutBtn} onClick={() => auth.signOut()}>
                        <span>🚪</span> Log Keluar
                    </button>
                </div>
            </nav>

            {/* Main Content Wrapper */}
            <div className={`${styles.mainWrapper} ${!isSidebarOpen ? styles.mainWrapperExpanded : ''}`}>
                {/* Topbar */}
                <header className={styles.topbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={styles.toggleBtn}
                        >
                            ☰
                        </button>
                        <div>
                            {/* Dynamic Title based on Path? Or just general Greeting? */}
                            {/* Let's show current section title based on route maybe? */}
                            <h1>
                                {navItems.find(i => i.path === pathname)?.name || 'Admin'}
                            </h1>
                            <p>Selamat kembali, Admin.</p>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className={styles.pageContent}>
                    {children}
                </div>
            </div>
        </div>
    );
}
