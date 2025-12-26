import './globals.css'
import BottomNav from './components/BottomNav';
import WhatsAppWidget from './components/WhatsAppWidget';

export const metadata = {
    title: 'Sistem Kad Alumni',
    description: 'Permohonan dan Semakan Kad Alumni',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ms">
            <body>
                {children}
                <BottomNav />
                <WhatsAppWidget />
            </body>
        </html>
    )
}
