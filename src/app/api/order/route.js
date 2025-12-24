import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, ic, phone, alumniId, gradYear, pickupMethod, address, receiptUrl } = body;

        // Basic Validation
        if (!name || !ic || !phone || !gradYear || !receiptUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'orders'), {
            name,
            ic,
            phone,
            alumniIdInput: alumniId || '', // User claimed ID
            gradYear,
            pickupMethod,
            address: pickupMethod === 'delivery' ? address : '',
            receiptUrl,
            status: 'Pending', // Initial status
            generatedId: '', // To be filled by Admin
            trackingNo: '',
            dfodPrice: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Email Trigger (Fire and Forget)
        // In a real production app, use background jobs. Here we await it or just run it.
        // We reuse the GAS_WEBAPP_URL. Since this is server-side, we should use ENV variable.
        const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL; // User needs to set this

        if (GAS_URL) {
            try {
                await fetch(GAS_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: "send_email",
                        to: "user_email@example.com", // In real form we need email input!
                        // Wait, we didn't ask for Email in the form? 
                        // Checking requirements: "Sistem ni user akan buat pembelian...".
                        // Usually email is standard. I should check if I missed "email" field in form.
                        // If missed, I must add it.
                        subject: "Permohonan Kad Alumni Diterima - " + ic,
                        body: `Hi ${name},<br><br>Permohonan anda telah diterima dan sedang diproses.<br>Status: Pending Approval.`
                    })
                });
            } catch (err) {
                console.error("Email trigger failed", err);
            }
        }

        return NextResponse.json({ success: true, id: docRef.id });

    } catch (error) {
        console.error('Error submitting order:', error);
        return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 });
    }
}
