import cron from "node-cron";
import  User  from "../services/account/user.model";
import Attendance  from "../models/attendance.model";
import redisClient from "../config/redis";

// Warm employee cache every 2 minutes
export const startEmployeeCacheJob = () => {
  cron.schedule("*/2 * * * *", async () => {
    try {
      console.log("🔄 Running employee cache warm-up...");

      const todayKey = new Date().toISOString().split("T")[0];
      const cacheKey = `employees:${todayKey}`;

      // Get all employees except Admins/HR
      const employees = await User.find(
        { role: { $nin: ["Admin", "Human Resource Manager"] } },
        "firstName lastName userName jobTitle role workStatus department email profileImage"
      ).lean();

      if (!employees.length) return;

      // Today’s date range
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Batch fetch all attendances for today
      const attendances = await Attendance.find({
        userId: { $in: employees.map((e) => e._id) },
        date: { $gte: todayStart, $lte: todayEnd }
      }).lean();

      const attendanceMap = new Map(
        attendances.map((att) => [att.userId.toString(), att])
      );

      // Merge into enriched data
      const employeeData = employees.map((emp) => {
        const todayAttendance = attendanceMap.get(emp._id.toString());
        return {
          _id: emp._id,
          avatar: emp.profileImage,
          firstName: emp.firstName,
          lastName: emp.lastName,
          username: emp.userName,
          email: emp.email,
          department: emp.department,
          jobRole: emp.jobTitle,
          role: emp.role,
          isLate: todayAttendance?.isLate || false,
          locationToday: todayAttendance?.workingLocation || emp.workStatus,
          attendanceStatus: todayAttendance?.status || "Absent",
          checkInTime: todayAttendance?.clockInTime || "Not Checked In",
          tasksCompletedToday: 0
        };
      });

      // Store in Redis (overwrite every 2 mins)
      await redisClient.setex(cacheKey, 180, JSON.stringify(employeeData));

      console.log(`✅ Employee cache refreshed at ${new Date().toISOString()}`);
    } catch (err) {
      console.error("Employee cache job error:", err);
    }
  });
};
