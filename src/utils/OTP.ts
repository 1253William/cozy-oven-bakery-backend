// Function to generate a secure 6-digit OTP
const generateOTP = () => {
    return String(Math.floor(Math.random() * 10000)).padStart(6, '0');
};

export default generateOTP;