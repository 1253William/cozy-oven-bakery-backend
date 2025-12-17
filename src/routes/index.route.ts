import express from "express";
import { authMiddleware } from "../middlewares/authentication.middleware";
import authRouter from "../services/auth/authentication.route";
import userRouter from "../services/account/user.route";
import productRouter from "../services/products/product.route"
import orderRouter from "../services/orders/order.route";
import settingsRouter from "../services/account/profile.route";
import dashboardRouter from "../services/dashboard overview/overview.route";
import customerRouter from "../services/customers/customers.route";
import reportRouter from "../services/reports/reports.route";
// import searchRouter from "../services/globals/search.routes";
import inventoryRouter from "../services/inventory/inventory.route";
// import notificationRouter from "./notification.route";

const rootRouter = express.Router();


//Authentication routes
rootRouter.use('/auth',authRouter);

//User routes
rootRouter.use('/status',userRouter);

//Account routes
rootRouter.use('/account', settingsRouter);

//Product routes
rootRouter.use('/', productRouter);

//Order & Payment routes
rootRouter.use('/', orderRouter);

//Admin Dashboard Overview
rootRouter.use('/dashboard',dashboardRouter, inventoryRouter, reportRouter);

//Admin Customer routes
rootRouter.use('/dashboard', customerRouter);

//Search routes
// rootRouter.use('/search', searchRouter);

//Notification routes
// rootRouter.use('/notifications', notificationRouter);

rootRouter.get("/auth-test", authMiddleware, (req, res) => {
    res.json({ ok: true, user: (req as any).user });
});

rootRouter.get("/products-test", authMiddleware, (req, res) => {
    console.log("[product-test] hit");
    res.json({ ok: true });
});




export default rootRouter;