import cron from 'node-cron';
import OTPVerification from '../services/auth/OTPVerification.model';

// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await OTPVerification.deleteMany({
      expiresAt: { $lt: new Date(Date.now()) },
    });
    console.log(`[OTP Cleaner] Deleted ${result.deletedCount} expired OTPs`);
  } catch (err) {
    console.error('[OTP Cleaner] Error:', err);
  }
});
// This cron job will run daily at midnight to clean up expired OTPs from the database.