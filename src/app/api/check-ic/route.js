import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { ic } = await request.json();

        if (!ic) {
            return NextResponse.json({ error: 'IC is required' }, { status: 400 });
        }

        // Uniqueness logic: Check orders collection for this IC
        const q = query(collection(db, 'orders'), where('ic', '==', ic));
        const querySnapshot = await getDocs(q);

        let activeApplication = false;
        let message = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Check date - logic: if created_at < 2 years ago
            // For MVP, just checking if any record exists is a good start, 
            // but let's assume we store 'createdAt' timestamp.

            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();

            if (createdAt > twoYearsAgo) {
                activeApplication = true;
                message = 'Anda mempunyai permohonan yang masih aktif (kurang 2 tahun).';
            }
        });

        if (activeApplication) {
            return NextResponse.json({ canProceed: false, message });
        }

        return NextResponse.json({ canProceed: true });

    } catch (error) {
        console.error('Error checking IC:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
