import express from "express";
import authRouter from "../services/auth/authentication.route";
import userRouter from "../services/account/user.route";
import productRouter from "../services/products/product.route"
import settingsRouter from "../services/account/profile.route";
// import searchRouter from "../services/globals/search.routes";
// import inventoryRouter from "../services/inventory/inventory.route";
// import notificationRouter from "./notification.route";

const rootRouter = express.Router();


//Authentication routes
rootRouter.use('/auth',authRouter);

//User routes
rootRouter.use('/status',userRouter);

//Account routes
rootRouter.use('/account', settingsRouter);

//Customer routes
// rootRouter.use('/customers', customerRouter);

//Product routes
rootRouter.use('/', productRouter);

//Search routes
// rootRouter.use('/search', searchRouter);

//Notification routes
// rootRouter.use('/notifications', notificationRouter);


export default rootRouter;