import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, ic, cardId, date } = body;

        const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

        if (!GAS_URL) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        // Professional Receipt HTML
        const receiptHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1e3a8a; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">KAD ALUMNI UPSI</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Pengesahan Permohonan & Resit Rasmi</p>
                </div>
                
                <div style="padding: 30px;">
                    <p>Salam Sejahtera <strong>${name}</strong>,</p>
                    <p style="color: #059669; font-weight: bold; font-size: 16px;">Tahniah! Permohonan anda telah DILULUSKAN.</p>
                    <p>Berikut adalah butiran kad alumni anda:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 10px; color: #666;">Nama</td>
                            <td style="padding: 10px; font-weight: bold; text-align: right;">${name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 10px; color: #666;">No. Kad Pengenalan</td>
                            <td style="padding: 10px; font-weight: bold; text-align: right;">${ic}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0f0f0; background-color: #f0f9ff;">
                            <td style="padding: 10px; color: #1e40af;">No. Kad Alumni (ID)</td>
                            <td style="padding: 10px; font-weight: bold; text-align: right; color: #1e40af; font-size: 16px;">${cardId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; color: #666;">Tarikh Lulus</td>
                            <td style="padding: 10px; font-weight: bold; text-align: right;">${date}</td>
                        </tr>
                    </table>

                    <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 20px;">
                        <p style="margin: 0; font-size: 13px; color: #b45309;">
                            <strong>Info:</strong> Kad fizikal anda sedang dalam proses cetakan/penghantaran mengikut kaedah pilihan anda.
                        </p>
                    </div>

                    <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                        Ini adalah cetakan komputer. Tandatangan tidak diperlukan.<br>
                        © 2024 Pusat Alumni UPSI
                    </p>
                </div>
            </div>
        `;

        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "send_email",
                to: email,
                subject: `KAD ALUMNI: Permohonan Diluluskan (${cardId})`,
                body: receiptHtml
            })
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Email sending failed:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
