export const getApprovalEmail = (name, cardId, receiptUrl) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Tahniah! Permohonan Kad Alumni Lulus</h2>
            <p>Salam Sejahtera <strong>${name}</strong>,</p>
            <p>Permohonan kad alumni anda telah diluluskan.</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">No. Ahli Alumni:</p>
                <p style="margin: 5px 0 0 0; font-size: 1.2rem; color: #111827;">${cardId}</p>
            </div>

            <p>Anda boleh menyemak resit bayaran anda di pautan berikut:</p>
            <p><a href="${receiptUrl}" style="color: #2563eb; text-decoration: underline;">Lihat Resit Bayaran</a></p>

            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 0.9rem; color: #6b7280;">Ini adalah email automatik. Sila jangan balas email ini.</p>
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
