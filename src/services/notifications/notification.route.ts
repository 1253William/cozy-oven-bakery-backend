import express from 'express';
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    getAllNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "./notification.controller";


const router = express.Router();


/**
 * @swagger
 * /api/v1/dashboard/admin/notifications:
 *   get:
 *     tags:
 *       - Notifications (Admin)
 *     summary: Fetch all notifications
 *     description: Retrieves all admin notifications, including total and unread counts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All Notifications fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 12
 *                     unread:
 *                       type: number
 *                       example: 4
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Failed to fetch notifications.
 */
router.get("/admin/notifications", authMiddleware,authorizedRoles("Admin"), getAllNotifications);

/**
 * @swagger
 * /api/v1/dashboard/admin/notifications/unread:
 *   get:
 *     tags:
 *       - Notifications (Admin)
 *     summary: Fetch unread notifications
 *     description: Retrieves all unread admin notifications.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Unread Notifications fetched successfully
 *                 unread:
 *                   type: number
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       404:
 *         description: No unread notifications found.
 *       500:
 *         description: Failed to fetch unread notifications.
 */
router.get("/admin/notifications/unread",authMiddleware,authorizedRoles("Admin"), getUnreadNotifications);

/**
 * @swagger
 * /api/v1/dashboard/admin/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications (Admin)
 *     summary: Mark notification as read
 *     description: Marks a specific notification as read using its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notification ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *       400:
 *         description: Notification already marked as read.
 *       404:
 *         description: Notification not found.
 *       500:
 *         description: Failed to update notification.
 */
router.patch("/admin/notifications/read-all", authMiddleware,authorizedRoles("Admin"), markAllAsRead);

/**
 * @swagger
 * /api/v1/dashboard/admin/notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications (Admin)
 *     summary: Mark all notifications as read
 *     description: Marks all unread admin notifications as read.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *       400:
 *         description: All notifications already marked as read.
 *       500:
 *         description: Failed to update notifications.
 */
router.patch("/admin/notifications/:id/read", authMiddleware,authorizedRoles("Admin"), markAsRead);

/**
 * @swagger
 * /api/v1/dashboard/admin/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications (Admin)
 *     summary: Delete a notification
 *     description: Permanently deletes a specific admin notification by ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notification ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification deleted
 *       404:
 *         description: Notification not found or already deleted.
 *       500:
 *         description: Failed to delete notification.
 */
router.delete("/admin/notifications/:id", authMiddleware,authorizedRoles("Admin"), deleteNotification);


export default router;