import styles from './CardPreview.module.css';

export default function CardPreview({ name, matricNo, program }) {
    // Fallbacks
    const dispName = name || "NAMA ALUMNI";
    const dispMatric = matricNo || "D20231012345";
    const dispProgram = program || "SARJANA MUDA PENDIDIKAN (KOMPUTER)";

    return (
        <div className={styles.cardContainer}>
            {/* Front Card */}
            <div className={styles.card}>
                <div className={styles.cardBackground}></div>

                {/* Header / Logo Area */}
                <div className={styles.cardHeader}>
                    <div className={styles.logoPlaceholder}>
                        {/* Replace with actual UPSI Logo image if available, else text */}
                        <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>UPSI</span>
                    </div>
                    <div className={styles.headerText}>
                        <h2 className={styles.uniName}>UNIVERSITI PENDIDIKAN SULTAN IDRIS</h2>
                        <p className={styles.cardTitle}>KAD KEAHLIAN ALUMNI</p>
                    </div>
                </div>

                {/* Chip Image Simulation */}
                <div className={styles.chip}></div>

                {/* Content */}
                <div className={styles.cardContent}>
                    <div className={styles.fieldGroup}>
                        <label>NAMA</label>
                        <div className={styles.valueName}>{dispName.toUpperCase()}</div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.fieldGroup}>
                            <label>NO. MATRIK</label>
                            <div className={styles.value}>{dispMatric.toUpperCase()}</div>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>TAHUN</label>
                            <div className={styles.value}>2024</div>
                        </div>
                    </div>
                </div>

                {/* Footer decoration */}
                <div className={styles.cardFooter}>
                    <p className={styles.motto}>PENERAJU PENDIDIKAN NEGARA</p>
                </div>
            </div>
        </div>
    );
}
