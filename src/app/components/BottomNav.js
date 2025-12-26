"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on admin routes to prevent clutter
    if (pathname.startsWith('/admin')) return null;

    const navItems = [
        { label: 'Utama', href: '/', icon: '🏠' },
        { label: 'Mohon', href: '/beli', icon: '📝' },
        { label: 'Semak', href: '/semak', icon: '🔍' },
    ];

    return (
        <div className={styles.bottomNav}>
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.label}>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
