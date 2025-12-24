import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
    return (
        <main className={styles.main}>
            <div className={`${styles.hero} glass`}>
                <h1 className={styles.title}>KAD ALUMNI</h1>
                <p className={styles.tagline}>IDENTITI ALUMNI ANAK KANDUNG SULUH BUDIMAN</p>
                <p className={styles.subtitle}>
                    Dapatkan Kad Alumni anda sekarang dengan hanya <strong>RM10</strong>.
                </p>

                <div className={styles.ctaGrid}>
                    <div className={`${styles.card} glass`}>
                        <h2>Permohonan Baru &rarr;</h2>
                        <p>Belum ada kad? Mohon sekarang.</p>
                        <Link href="/beli" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            Mohon Sekarang
                        </Link>
                    </div>

                    <div className={`${styles.card} glass`}>
                        <h2>Semakan Status &rarr;</h2>
                        <p>Semak status permohonan kad anda.</p>
                        <Link href="/semak" className="btn btn-outline" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            Semak Status
                        </Link>
                    </div>
                </div>
            </div>

            <div className={styles.infoSection}>
                <h2 className={styles.sectionTitle}>Keistimewaan Kad Alumni</h2>
                <div className={styles.benefitsGrid}>
                    <div className={`${styles.benefitCard} glass`}>
                        <h3>5% - 20%</h3>
                        <p>Kadar sewaan penggunaan kemudahan fasiliti UPSI</p>
                    </div>
                    <div className={`${styles.benefitCard} glass`}>
                        <h3>15%</h3>
                        <p>Yuran Pengajian Pasca Siswazah (Local & International)</p>
                    </div>
                    <div className={`${styles.benefitCard} glass`}>
                        <h3>20%</h3>
                        <p>Pembelian Buku Terbitan Pejabat Karang Mengarang UPSI</p>
                    </div>
                    <div className={`${styles.benefitCard} glass`}>
                        <h3>RM1000</h3>
                        <p>Yuran Pengajian Pasca Siswazah melalui Program Pesisir</p>
                    </div>
                </div>

                <div className={styles.partnersSection}>
                    <h3>Potongan Harga Istimewa Bagi Produk:</h3>
                    <div className={styles.partnerList}>
                        <span>LG</span>
                        <span>AI Lab</span>
                        <span>Acer</span>
                        <span>Proton</span>
                        <span>CHN Network</span>
                    </div>
                    <p className={styles.smallNote}>Dan banyak lagi rakan strategik UPSI.</p>
                </div>
            </div>
        </main>
    );
}
