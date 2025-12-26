export const getApprovalEmail = (name, ic, cardId, date) => {
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dfe4ea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background-color: #1e3a8a; padding: 30px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">KAD ALUMNI UPSI</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Pengesahan Permohonan & Resit Rasmi</p>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
                <p style="margin-top: 0; color: #374151;">Salam Sejahtera <strong>${name}</strong>,</p>
                
                <h2 style="color: #059669; font-size: 18px; margin: 20px 0;">Tahniah! Permohonan anda telah DILULUSKAN.</h2>
                
                <p style="color: #4b5563; margin-bottom: 20px;">Berikut adalah butiran kad alumni anda:</p>

                <!-- Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Nama</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right; text-transform: uppercase;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">No. Kad Pengenalan</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right;">${ic}</td>
                    </tr>
                    <tr style="background-color: #eff6ff;">
                        <td style="padding: 12px 10px; color: #1d4ed8; font-size: 14px; font-weight: 500;">No. Kad Alumni (ID)</td>
                        <td style="padding: 12px 10px; color: #1d4ed8; font-weight: bold; text-align: right; font-size: 16px;">${cardId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Tarikh Lulus</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right;">${date}</td>
                    </tr>
                </table>

                <!-- Info Box -->
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; font-size: 14px; color: #92400e; line-height: 1.5;">
                    <strong>Info:</strong> Kad fizikal anda sedang dalam proses cetakan/penghantaran mengikut kaedah pilihan anda.
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Ini adalah cetakan komputer. Tandatangan tidak diperlukan.</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Pusat Alumni UPSI</p>
            </div>
        </div>
    `;
};

export const getReadyEmail = (name, bookingLink) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #10b981;">Kad Anda Telah Siap Dicetak!</h2>
            <p>Salam Sejahtera <strong>${name}</strong>,</p>
            <p>Kad Alumni anda telah siap dicetak dan sedia untuk diambil di pejabat kami.</p>
            
            <p>Sila tetapkan tarikh pengambilan menerusi pautan di bawah. (Isnin - Jumaat SAHAJA).</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${bookingLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pilih Tarikh Pengambilan</a>
            </div>

            <p>Sila bawa kad pengenalan anda semasa pengambilan.</p>

            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 0.9rem; color: #6b7280;">Pusat Alumni UPSI</p>
        </div>
    `;
};

export const getShippedEmail = (name, trackingNo, courierFee, trackingLink) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #0d9488;">Kad Anda Telah Dipos 🚚</h2>
            <p>Salam Sejahtera <strong>${name}</strong>,</p>
            <p>Kad Alumni anda telah diserahkan kepada pihak kurier.</p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <p style="margin: 0;"><strong>Tracking No:</strong> ${trackingNo}</p>
                <p style="margin: 10px 0 0 0;"><strong>Kaedah Bayaran:</strong> DFOD (Delivery Fee on Delivery)</p>
                <p style="margin: 5px 0 0 0; color: #dc2626; font-weight: bold;">Sila sediakan wang tunai: RM ${courierFee}</p>
            </div>

            <p>Jejak status penghantaran anda di sini:</p>
            <p><a href="${trackingLink}" style="color: #2563eb; text-decoration: underline;">Klik Untuk Jejak</a></p>

            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 0.9rem; color: #6b7280;">Pusat Alumni UPSI</p>
        </div>
    `;
};
