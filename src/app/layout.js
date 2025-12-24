import './globals.css'

export const metadata = {
    title: 'Sistem Kad Alumni',
    description: 'Permohonan dan Semakan Kad Alumni',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ms">
            <body>
                <div className="background">
                    <div className="blob"></div>
                    <div className="blob"></div>
                </div>
                {children}
            </body>
        </html>
    )
}
