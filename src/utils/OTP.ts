// Function to generate a secure 5-digit OTP
const generateOTP = () => {
    return String(Math.floor(Math.random() * 10000)).padStart(5, '0');
};

export default generateOTP;