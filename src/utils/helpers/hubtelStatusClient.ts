import axios from "axios";

export const hubtelStatusClient = axios.create({
    baseURL: process.env.HUBTEL_STATUS_BASE_URL,
    auth: {
        username: process.env.HUBTEL_CLIENT_ID!,
        password: process.env.HUBTEL_CLIENT_SECRET!,
    },
});
