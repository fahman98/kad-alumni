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
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dfe4ea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background-color: #1e3a8a; padding: 30px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">KAD ALUMNI UPSI</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Notifikasi Siap Cetak</p>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
                <p style="margin-top: 0; color: #374151;">Salam Sejahtera <strong>${name}</strong>,</p>
                
                <h2 style="color: #10b981; font-size: 18px; margin: 20px 0;">Tahniah! Kad Alumni anda telah SIAP DICETAK.</h2>
                
                <p style="color: #4b5563; margin-bottom: 20px;">Sila tetapkan tarikh pengambilan kad anda:</p>

                <!-- Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Nama</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right; text-transform: uppercase;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Kaedah</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right;">Ambil Sendiri (Pickup)</td>
                    </tr>
                    <tr style="background-color: #f0fdf4;">
                        <td style="padding: 12px 10px; color: #15803d; font-size: 14px; font-weight: 500;">Status</td>
                        <td style="padding: 12px 10px; color: #15803d; font-weight: bold; text-align: right; font-size: 14px;">SEDIA DIAMBIL</td>
                    </tr>
                </table>

                <!-- Action Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${bookingLink}" style="background-color: #1e3a8a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">📅 Pilih Tarikh Pengambilan</a>
                </div>

                <!-- Info Box -->
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; font-size: 14px; color: #92400e; line-height: 1.5;">
                    <strong>Peringatan:</strong> Sila bawa Kad Pengenalan anda semasa pengambilan. Pejabat dibuka Isnin - Jumaat SAHAJA.
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

export const getShippedEmail = (name, trackingNo, courierFee, trackingLink) => {
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dfe4ea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background-color: #1e3a8a; padding: 30px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">KAD ALUMNI UPSI</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Makluman Penghantaran Kad</p>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
                <p style="margin-top: 0; color: #374151;">Salam Sejahtera <strong>${name}</strong>,</p>
                
                <h2 style="color: #0d9488; font-size: 18px; margin: 20px 0;">Tahniah! Kad Alumni anda telah DIPOS. 🚚</h2>
                
                <p style="color: #4b5563; margin-bottom: 20px;">Berikut adalah status penghantaran kad anda:</p>

                <!-- Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Nama</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right; text-transform: uppercase;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Tracking No</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right;">${trackingNo}</td>
                    </tr>
                     <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Kaedah Bayaran</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold; text-align: right;">DFOD (Bayar Waktu Terima)</td>
                    </tr>
                    <tr style="background-color: #ecfdf5;">
                        <td style="padding: 12px 10px; color: #047857; font-size: 14px; font-weight: 500;">Jumlah Perlu Dibayar</td>
                        <td style="padding: 12px 10px; color: #047857; font-weight: bold; text-align: right; font-size: 16px;">RM ${courierFee}</td>
                    </tr>
                </table>

                <!-- Action Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${trackingLink}" style="background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">🔍 Jejak Penghantaran</a>
                </div>

                <!-- Info Box -->
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; font-size: 14px; color: #92400e; line-height: 1.5;">
                    <strong>Peringatan:</strong> Sila sediakan wang tunai secukupnya untuk bayaran kepada pihak kurier semasa penerimaan.
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
