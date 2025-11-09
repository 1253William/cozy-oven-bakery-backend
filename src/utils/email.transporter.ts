
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    email: string;
    subject: string;
    text: string;
}

export const sendEmail = async ({
                                    email,
                                    subject,
                                    text,
                                }: EmailOptions) => {
    try {
        const data = await resend.emails.send({
            from: "Vire Workplace Support Team <engage@vire.agency>",
            to: email,
            subject,
            text,
        });

        return data;
    } catch (error) {
        throw new Error(`Error sending email: ${error}`);
    }
};
