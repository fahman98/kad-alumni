import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, ic, phone, email, alumniId, gradYear, pickupMethod, address, receiptUrl } = body;

        // Basic Validation
        if (!name || !ic || !phone || !email || !gradYear || !receiptUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'orders'), {
            name,
            ic,
            phone,
            email, // Saved to DB
            alumniIdInput: alumniId || '',
            gradYear,
            pickupMethod,
            address: pickupMethod === 'delivery' ? address : '',
            receiptUrl,
            status: 'Pending',
            generatedId: '',
            trackingNo: '',
            dfodPrice: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Email Trigger REMOVED (Moved to Post-Approval)
        // const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL;
        // if (GAS_URL) { ... }

        return NextResponse.json({ success: true, id: docRef.id });

    } catch (error) {
        console.error('Error submitting order:', error);
        return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 });
    }
}
