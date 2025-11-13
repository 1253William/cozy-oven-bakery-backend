import express from "express";
import authRouter from "../services/auth/authentication.route";
import userRouter from "../services/account/user.route";
// import attendanceRouter from "./attendance.route"
// import taskRouter from "./task.route";
// import employeeRouter from "../services/customers/employee.route";
// import performanceRouter from "./performance.route";
// import evaluationRouter from "./evaluations.route";
// import reportRouter from "./report.routes";
import settingsRouter from "../services/account/profile.route";
// import searchRouter from "../services/globals/search.routes";
// import inventoryRouter from "../services/inventory/inventory.route";
// import notificationRouter from "./notification.route";

const rootRouter = express.Router();


//Authentication routes
rootRouter.use('/auth',authRouter);

//User routes
rootRouter.use('/status',userRouter);


//Customer routes
// rootRouter.use('/customers', employeeRouter);

//Dashboard routes
// rootRouter.use('/dashboard', performanceRouter);
// rootRouter.use('/dashboard', evaluationRouter);
// rootRouter.use('/dashboard', reportRouter);
// rootRouter.use('/dashboard', inventoryRouter);

//Account routes
rootRouter.use('/account', settingsRouter);

//Search routes
// rootRouter.use('/search', searchRouter);

//Notification routes
// rootRouter.use('/notifications', notificationRouter);


export default rootRouter;