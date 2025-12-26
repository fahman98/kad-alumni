export const sendEmail = async (to, subject, htmlBody) => {
    // Official GAS URL
    const GAS_URL = "https://script.google.com/macros/s/AKfycbwnc520o-B_LSq9rtKsYQmj0bE_TI4GZQpREkWDRkK2-YLsrlSwufRI9pmszdOtcdbZ/exec";

    const payload = {
        action: "send_email",
        to: to,
        subject: subject,
        body: htmlBody
    };

    try {
        const res = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // GAS often replies with redirect which fetch doesn't like in cors mode sometimes, or use standard
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        // Since 'no-cors' returns opaque response, we assume success if no network error.
        // For critical apps, we might want to handle CORS properly on GAS side.
        console.log("Email request sent to GAS");
        return { success: true };
    } catch (error) {
        console.error("Failed to send email", error);
        return { success: false, error };
    }
};
