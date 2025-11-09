import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../account/user.model';
import Attendance from '../models/attendance.model';
import { EmployeeProfile, IEmployeeProfile } from "./employee.model";
import { AuthRequest } from '../../types/authRequest';
import redisClient from '../../config/redis';

//Fetch all employee list ( Get all employees - return array of employees with each employee having Full Nane(First,Last Name), Username, Status(Active, In-active, Closed),
//role, Location Today (WorkLocation), Check-in time(clock in time), Tasks Completed Today(Complete, Incomplete, Low Input, On track, Number of completed tasks))
//Main Dashboard Metrics (Active Employees, Total Remote Workers Today, No Check-in Today, Employees Not Checked-in Today, Productivity Score/Index)
//Evaluation Management (Evaluations In Progress, Evaluations Completed, Overdue Evaluations, Create Evaluation, Evaluation History)
//Employee Management (Add Employee, Edit Employee, Delete Employee, View Employee Details, Search Employees, Filter Employees by Status, Role, Location, Employee Bio Data, Edit Employee KPI's, View Employee KPI's, Employee Performance Reviews, Employee Attendance Records, Employee Task History)
//Performance Management (Overview Trends - Overall Department Performance, Employee Turnover Rate accross 12m, 6m, 30d,7days, Performance Score/Index, Top Performers, Low Performers,
//Set Performance Goals, Track Goal Progress, Performance History)



//@route PATCH /api/v1/employee/:id
//@desc  Update an employee data by HR and Admin
//@access private
//@route PATCH /api/v1/employee/:id
//@desc  Update (or create) an employee profile by HR and Admin
//@access private
export const updateEmployeeProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    //Check if current user is HR or Admin
    const currentUser = await User.findById(userId);
    if (!currentUser || !["Admin", "Human Resource Manager"].includes(currentUser.role)) {
      res.status(403).json({ success: false, message: "Forbidden: Only HR/Admin can update employee profiles" });
      return;
    }

    //Ensure target user exists
    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: "Employee not found" });
      return;
    }

    //Update or create profile in one call
    const updatedProfile = await EmployeeProfile.findOneAndUpdate(
      { user: id },
      { $set: req.body, $setOnInsert: { user: id } },
      { new: true, upsert: true }
    );

    //Detect creation by checking if `upsertedId` exists
    const wasCreated = updatedProfile && updatedProfile.createdAt && updatedProfile.createdAt.getTime() === updatedProfile.updatedAt?.getTime();

    res.status(200).json({
      success: true,
      message: wasCreated
        ? "Employee profile created successfully"
        : "Employee profile updated successfully",
      data: updatedProfile,
    });
    return;

  } catch (error) {
    console.error("Error updating employee profile:", error);
    res.status(500).json({ success: false, message: "Server Error" });
    return;
  }
};


//@route DELETE /api/v1/employee/:id
//@desc  Delete an employee profile by HR/Admin
//@access Private
export const deleteEmployeeProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    //Check if current user is HR or Admin
    const currentUser = await User.findById(userId);
    if (!currentUser || !["Admin", "Human Resource Manager"].includes(currentUser.role)) {
      res.status(403).json({ success: false, message: "Forbidden: Only HR/Admin can delete employee profiles" });
      return;
    }

    //Find and delete employee profile
    const deletedProfile = await EmployeeProfile.findOneAndDelete({ user: id });

    if (!deletedProfile) {
      res.status(404).json({ success: false, message: "Employee profile not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Employee profile deleted successfully",
      data: deletedProfile
    });
    return;

  } catch (error) {
    console.error("Error deleting employee profile:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
    return;
  }
};


//@route GET /api/v1/employee/list
//@desc  Fetch all employee list
//@access private
export const getAllEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    //Cache key (per user, per day)
    const todayKey = new Date().toISOString().split("T")[0]; // e.g., 2025-08-30
    const cacheKey = `employees:${userId}:${todayKey}`;

    //Try Redis Cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const employees = JSON.parse(cachedData);
      res.status(200).json({
        success: true,
        message: "Employees fetched successfully (cache hit)",
        TotalEmployees: employees.length,
        data: employees
      });
      return;
    }

    //Check logged-in user
    const currentUser = await User.findById(userId).lean();
    if (!currentUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    //Exclude Admins & HRs
    let query: any = {
      role: { $nin: ["Admin", "Human Resource Manager"] }
    };

    if (["Admin", "Human Resource Manager"].includes(currentUser.role)) {
      query._id = { $ne: userId };
    }

    //Fetch employees (lean for speed)
    const employees = await User.find(
      query,
      "firstName lastName userName jobTitle role workStatus department email profileImage"
    )
      .lean()
      .exec();

    if (!employees.length) {
      res.status(200).json({ success: true, message: "No employees found", data: [] });
      return;
    }

    //Today’s date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    //Fetch all attendances for today in one query
    const attendances = await Attendance.find({
      userId: { $in: employees.map((e) => e._id) },
      date: { $gte: todayStart, $lte: todayEnd }
    })
      .lean()
      .exec();

    //Index attendance by userId for O(1) lookup
    const attendanceMap = new Map(
      attendances.map((att) => [att.userId.toString(), att])
    );

    //Merge employees + attendance
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
        checkInTime: todayAttendance?.clockInFormatted || "Not Checked In",
        tasksCompletedToday: 0
      };
    });

    //Cache in Redis for 60s
    await redisClient.setex(cacheKey, 60, JSON.stringify(employeeData));

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully (cache miss → MongoDB)",
      TotalEmployees: employeeData.length,
      data: employeeData
    });

  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error });
    return;
  }
};



//@route GET /api/v1/employee/:id
//@desc Fetch an employee bio data or profile
//@access private
export const getEmployeeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid employee ID" });
      return;
    }

    //Fetch user + profile in parallel (lean for speed)
    const [employee, profile] = await Promise.all([
      User.findById(id)
        .select("-password -__v -createdAt -updatedAt")
        .lean(),
      EmployeeProfile.findOne({ user: id }).lean()
    ]);

    if (!employee) {
      res.status(404).json({ success: false, message: "Employee not found" });
      return;
    }

    //Fetch today's attendance (time-bounded query)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.findOne({
      userId: id,
      date: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    //Merge everything into a single response
    const employeeData = {
      _id: employee._id,
      avatar: employee.profileImage,
      firstName: employee.firstName,
      lastName: employee.lastName,
      username: employee.userName,
      email: employee.email,
      department: employee.department,
      jobRole: employee.jobTitle,
      role: employee.role,
      workStatus: employee.workStatus,
      profile: profile || null,

      //Attendance-enriched fields
      isLate: todayAttendance?.isLate || false,
      locationToday: todayAttendance?.workingLocation || employee.workStatus,
      attendanceStatus: todayAttendance?.status || "Absent",
      checkInTime: todayAttendance?.clockInTime || "Not Checked In",
      //tasksCompletedToday: todayAttendance?.tasksCompleted || 0
      tasksCompletedToday: 0
    };

    res.status(200).json({
      success: true,
      message: "Employee data fetched successfully",
      data: employeeData
    });
    return;

  } catch (error) {
    console.error("Error fetching employee by ID:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
    return;
  }
};

//@route DELETE /api/v1/employee/:id
//@desc  Delete employee data by HR and Admin
//@access private