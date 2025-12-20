import axios from "axios";

//config/hubtel.ts

const hubtel = axios.create({
    baseURL: "https://payproxyapi.hubtel.com",
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Authorization:
            "Basic " +
            Buffer.from(
                `${process.env.HUBTEL_CLIENT_ID}:${process.env.HUBTEL_API_KEY}`
            ).toString("base64"),
    },
});


export default hubtel;
