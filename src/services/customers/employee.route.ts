// import express from 'express';
// import { authMiddleware } from "../../middlewares/authentication.middleware";
// import { authorizedRoles } from "../../middlewares/roles.middleware";
// import { deleteEmployeeProfile, getAllEmployees, getEmployeeById, updateEmployeeProfile } from './employee.controller';
//
//
// const router = express.Router();
//
// /**
//  * @swagger
//  * /api/v1/employee/{id}:
//  *   patch:
//  *     summary: Update or create an employee profile
//  *     description: HR Managers or Admins can update an employee profile. If the profile does not exist, it will be created (upsert).
//  *     tags:
//  *       - EmployeeProfile
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: User ID of the employee
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             example:
//  *               personalInfo:
//  *                 nationality: Ghanaian
//  *                 maritalStatus: Single
//  *                 personalPronouns: ["he/him"]
//  *               contactInfo:
//  *                 email: employee@example.com
//  *                 phoneNumber: "+233501234567"
//  *                 address: Ring Road Central
//  *                 city: Accra
//  *                 regionOrState: Greater Accra
//  *                 postalCode: GA-100-1234
//  *               emergencyContact:
//  *                 fullName: Jane Doe
//  *                 relationship: Sister
//  *                 phoneNumber: "+233509876543"
//  *                 altPhoneNumber: "+233209876543"
//  *                 address: Tema
//  *                 regionOrState: Greater Accra
//  *                 city: Tema
//  *               employmentDetails:
//  *                 jobTitle: Engineering Lead
//  *                 department: Engineering
//  *                 dateHired: 2024-05-10
//  *                 employmentType: Full-time
//  *                 workLocation: HQ Office
//  *                 supervisorName: John Smith
//  *                 employmentStatus: Active
//  *               qualifications:
//  *                 education:
//  *                   - level: BSc
//  *                     degree: Computer Science
//  *                     institution: University of Ghana
//  *                     fieldOfStudy: Software Engineering
//  *                     startDate: { month: September, year: 2017 }
//  *                     endDate: { month: June, year: 2021 }
//  *                     description: Graduated with honors
//  *                 skills: ["Node.js", "TypeScript", "MongoDB"]
//  *     responses:
//  *       200:
//  *         description: Employee profile created or updated successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               example:
//  *                 success: true
//  *                 message: Employee profile updated successfully
//  *                 data:
//  *                   _id: 64efc8d1c5a2a12345f0d9a7
//  *                   user: 64efc7a2c5a2a12345f0d9a6
//  *                   personalInfo:
//  *                     nationality: Ghanaian
//  *                     maritalStatus: Single
//  *                     personalPronouns: ["he", "him"]
//  *                   contactInfo:
//  *                     email: employee@example.com
//  *                     phoneNumber: "+233501234567"
//  *                     address: Ring Road Central
//  *                     city: Accra
//  *                     regionOrState: Greater Accra
//  *                     postalCode: GA-100-1234
//  *                   employmentDetails:
//  *                     jobTitle: Software Engineer
//  *                     department: Engineering
//  *                     employmentType: Full-time
//  *                     dateHired: 2024-05-10
//  *                     supervisorName: John Smith
//  *                     employmentStatus: Active
//  *                   qualifications:
//  *                     skills: ["Node.js", "TypeScript", "MongoDB"]
//  *                   documents:
//  *                     cvUrl: https://res.cloudinary.com/dxfq3iotg/
//  *                     nationalIdUrl: https://res.cloudinary.com/dxfq3iotg/
//  *                     ssnOrTaxId: https://res.cloudinary.com/dxfq3iotg/
//  *                     certificateUrls: [https://res.cloudinary.com/dxfq3iotg/]
//  *                     offerLetterUrl: https://res.cloudinary.com/dxfq3iotg/
//  *                     passportPhotoUrl: https://res.cloudinary.com/dxfq3iotg/
//  *                   healthInfo:
//  *                     medicalConditions: [Hypertension]
//  *                     insuranceProvider: GLICO
//  *                     companyHealthPolicy: This Company Health Policy sets out the framework for safeguarding the health...
//  *                   createdAt: 2024-08-25T12:00:00.000Z
//  *                   updatedAt: 2024-08-25T12:10:00.000Z
//  *       401:
//  *         description: Unauthorized – JWT token missing or invalid
//  *       403:
//  *         description: Forbidden – Only HR/Admin can update profiles
//  *       404:
//  *         description: Employee profile not found
//  *       500:
//  *         description: Server error
//  */
// //@route PATCH /api/v1/employee/:id
// //@desc  Update an employee data by HR and Admin
// //@access private
// router.patch('/:id', authMiddleware, authorizedRoles("Admin", "Human Resource Manager"), updateEmployeeProfile);
//
//
// /**
//  * @swagger
//  * /api/v1/employee/{id}:
//  *   delete:
//  *     summary: Delete an employee profile
//  *     description: HR Managers or Admins can delete an employee profile by user ID.
//  *     tags:
//  *       - EmployeeProfile
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: User ID of the employee
//  *     responses:
//  *       200:
//  *         description: Employee profile deleted successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               example:
//  *                 success: true
//  *                 message: Employee profile deleted successfully
//  *                 data:
//  *                   _id: 64efc8d1c5a2a12345f0d9a7
//  *                   user: 64efc7a2c5a2a12345f0d9a6
//  *                   personalInfo:
//  *                     nationality: Ghanaian
//  *                     maritalStatus: Single
//  *                     personalPronouns: [ "he/him" ]
//  *                   contactInfo:
//  *                     email: employee@example.com
//  *                     phoneNumber: "+233501234567"
//  *                     address: Ring Road Central
//  *                     city: Accra
//  *                     regionOrState: Greater Accra
//  *                     postalCode: GA-100-1234
//  *       401:
//  *         description: Unauthorized – JWT token missing or invalid
//  *       403:
//  *         description: Forbidden – Only HR/Admin can delete profiles
//  *       404:
//  *         description: Employee profile not found
//  *       500:
//  *         description: Server error
//  */
// //@route DELETE /api/v1/employee/:id
// //@desc  Delete an employee data by HR and Admin
// //@access private
// router.delete('/:id', authMiddleware, authorizedRoles("Admin", "Human Resource Manager"), deleteEmployeeProfile);
//
// /**
//  * @swagger
//  * /api/v1/employees/list:
//  *   get:
//  *     tags:
//  *       - Employee
//  *     summary: Fetch all employees
//  *     description: Returns a list of employees (excluding Admins & HRs) with details such as Full Name, Username, Role, Job Role, Status, Location Today, Attendance Status, Check-in Time, and Tasks Completed Today.
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Employees fetched successfully.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Employees fetched successfully
//  *                 TotalEmployees:
//  *                   type: integer
//  *                   example: 15
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       _id:
//  *                         type: string
//  *                         example: 64f8c8a1234abcd56789ef01
//  *                       firstName:
//  *                         type: string
//  *                         example: John
//  *                       lastName:
//  *                         type: string
//  *                         example: Doe
//  *                       username:
//  *                         type: string
//  *                         example: johndoe
//  *                       jobRole:
//  *                         type: string
//  *                         example: Software Engineer
//  *                       role:
//  *                         type: string
//  *                         example: Staff
//  *                       isLate:
//  *                          type: boolean
//  *                          example: false
//  *                       locationToday:
//  *                         type: string
//  *                         example: Office
//  *                       attendanceStatus:
//  *                         type: string
//  *                         example: In-active
//  *                       checkInTime:
//  *                         type: string
//  *                         example: "09:05 AM"
//  *                       tasksCompletedToday:
//  *                         type: integer
//  *                         example: 5
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: User not found
//  *       500:
//  *         description: Server Error
//  */
// //@route GET /api/v1/employees/list
// //@desc  Fetch all employee list
// //@access private
// router.get('/list', authMiddleware, authorizedRoles("Admin", "Human Resource Manager"), getAllEmployees);
//
// /**
//  * @swagger
//  * /api/v1/employees/{id}:
//  *   get:
//  *     tags:
//  *       - Employee
//  *     summary: Fetch full employee data (profile + attendance)
//  *     description: Fetches detailed employee data for a specific employee by ID, including profile, department, role, and today's attendance information.
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Employee ID (MongoDB ObjectId)
//  *     responses:
//  *       200:
//  *         description: Employee data fetched successfully.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Employee data fetched successfully
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     _id:
//  *                       type: string
//  *                       example: 64f8c8a1234abcd56789ef01
//  *                     avatar:
//  *                       type: string
//  *                       example: https://cdn.company.com/images/profile.jpg
//  *                     firstName:
//  *                       type: string
//  *                       example: Jane
//  *                     lastName:
//  *                       type: string
//  *                       example: Smith
//  *                     username:
//  *                       type: string
//  *                       example: janesmith
//  *                     email:
//  *                       type: string
//  *                       example: jane.smith@company.com
//  *                     department:
//  *                       type: string
//  *                       example: Human Resources
//  *                     jobRole:
//  *                       type: string
//  *                       example: HR Specialist
//  *                     role:
//  *                       type: string
//  *                       example: Human Resource Manager
//  *                     workStatus:
//  *                       type: string
//  *                       example: Remote
//  *                     profile:
//  *                       type: object
//  *                       description: Extended employee profile data
//  *                       properties:
//  *                         personalInfo:
//  *                           type: object
//  *                           properties:
//  *                             nationality:
//  *                               type: string
//  *                               example: Ghanaian
//  *                             maritalStatus:
//  *                               type: string
//  *                               example: Single
//  *                             personalPronouns:
//  *                               type: array
//  *                               items:
//  *                                 type: string
//  *                               example: ["she/her"]
//  *                         contactInfo:
//  *                           type: object
//  *                           properties:
//  *                             phoneNumber:
//  *                               type: string
//  *                               example: +233501234567
//  *                             email:
//  *                               type: string
//  *                               example: jane.smith@company.com
//  *                     isLate:
//  *                       type: boolean
//  *                       example: false
//  *                     locationToday:
//  *                       type: string
//  *                       example: Remote
//  *                     attendanceStatus:
//  *                       type: string
//  *                       example: Present
//  *                     checkInTime:
//  *                       type: string
//  *                       example: "09:05 AM"
//  *                     tasksCompletedToday:
//  *                       type: integer
//  *                       example: 3
//  *       400:
//  *         description: Invalid employee ID
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: Employee not found
//  *       500:
//  *         description: Server Error
//  */
// //@route GET /api/v1/employees/:id
// //@desc  Fetch an employee bio data or profile
// //@access private
// router.get('/:id', authMiddleware, authorizedRoles("Admin", "Human Resource Manager"), getEmployeeById);
//
// export default router;