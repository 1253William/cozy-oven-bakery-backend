import axios from "axios";

interface SMSPayload {
    recipient: string[]; // phone numbers, e.g. ['0241234567']
    message: string;
    sender?: string;
    is_schedule?: boolean;
    schedule_date?: string;
}

export const sendSMS = async ({
                                  recipient,
                                  message,
                                  sender = process.env.MNOTIFY_SENDER_ID || "Cozy Oven",
                                  is_schedule = false,
                                  schedule_date = "",
                              }: SMSPayload): Promise<void> => {
    try {
        const response = await axios.post(
            `https://api.mnotify.com/api/sms/quick?key=${process.env.MNOTIFY_API_KEY}`,
            {
                recipient,
                sender,
                message,
                is_schedule,
                schedule_date,
            },
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        if (response.data.status !== "success") {
            console.error("SMS not sent:", response.data);
        } else {
            console.log("SMS sent successfully:", response.data.summary);
        }
    } catch (error) {
        console.error("Error sending SMS:", error);
    }
};
