import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    DashboardStats
} from "./overview.controller";

const router = express.Router();

//Admin Dashboard Overview routes

//@route GET /api/v1/dashboard/overview/
//desc Get data on daily sales, monthly sales and popular bread + number sold,
//@access Private (Admin only)
router.get("/overview", authMiddleware, authorizedRoles("Admin"), DashboardStats);


export default router;