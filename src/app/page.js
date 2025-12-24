import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
    return (
        <main className={styles.main}>
            {/* Navbar Placeholder */}
            <nav className={styles.navbar}>
                <div className={styles.brand}>ALUMNI DIGITAL</div>
                <div className={styles.navLinks}>
                    <Link href="/semak">Semak Status &rarr;</Link>
                </div>
            </nav>

            <div className={styles.heroSection}>
                <div className={styles.heroText}>
                    <span className={styles.pillLabel}>RASMI & EKSKLUSIF</span>
                    <h1 className={styles.title}>Kad Alumni <br /><span className={styles.highlight}>Anak Kandung</span> <br />Suluh Budiman.</h1>
                    <p className={styles.desc}>
                        Identiti digital rasmi untuk alumni UPSI. Nikmati pelbagai keistimewaan eksklusif, kadar sewaan fasiliti istimewa, dan diskaun rakan strategik.
                    </p>
                    <div className={styles.heroButtons}>
                        <Link href="/beli" className={styles.primaryBtn}>
                            Mohon Sekarang <span className={styles.priceTag}>RM10</span>
                        </Link>
                        <Link href="/semak" className={styles.secondaryBtn}>
                            Semakan Status
                        </Link>
                    </div>
                    <div className={styles.statsRow}>
                        <div className={styles.stat}>
                            <strong>20k+</strong>
                            <span>Alumni Berdaftar</span>
                        </div>
                        <div className={styles.stat}>
                            <strong>15+</strong>
                            <span>Rakan Strategik</span>
                        </div>
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    <div className={styles.floatingCard}>
                        <div className={styles.cardFront}>
                            <div className={styles.cardHeader}>
                                <span>KAD ALUMNI</span>
                                <span className={styles.uniName}>UPSI</span>
                            </div>
                            <div className={styles.cardChip}></div>
                            <div className={styles.cardNumber}>1922 8849 2024 0001</div>
                            <div className={styles.cardDetails}>
                                <div>
                                    <span className={styles.label}>NAMA</span>
                                    <span className={styles.value}>AHMAD ALBAB</span>
                                </div>
                                <div>
                                    <span className={styles.label}>TAHUN</span>
                                    <span className={styles.value}>2023</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.cardGlow}></div>
                    </div>
                </div>
            </div>

            <div className={styles.featuresSection}>
                <div className={styles.featureHeader}>
                    <h2>Keistimewaan Eksklusif</h2>
                    <p>Lebih dari sekadar kad pengenalan.</p>
                </div>

                <div className={styles.bentoGrid}>
                    <div className={styles.bentoCard}>
                        <h3>5% - 20%</h3>
                        <p>Diskaun Sewaan Fasiliti UPSI</p>
                    </div>
                    <div className={`${styles.bentoCard} ${styles.highlightCard}`}>
                        <h3>RM1000</h3>
                        <p>Penjimatan Yuran Pasca Siswazah</p>
                    </div>
                    <div className={styles.bentoCard}>
                        <h3>20%</h3>
                        <p>Diskaun Pembelian Buku</p>
                    </div>
                    <div className={styles.bentoCard}>
                        <h3>Partner</h3>
                        <div className={styles.partnerLogos}>
                            <span>Acer</span>
                            <span>Proton</span>
                            <span>DirectD</span>
                        </div>
                    </div>
                </div>
            </div>

            <footer className={styles.footer}>
                <p>&copy; 2024 Pusat Alumni UPSI. Hak Cipta Terpelihara.</p>
                <div style={{ marginTop: '10px' }}>
                    <Link href="/admin/login" className={styles.adminLink}>Staff Login</Link>
                </div>
            </footer>
        </main>
    );
}
