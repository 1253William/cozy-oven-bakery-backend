import { Response } from 'express';
import { AuthRequest } from "../../types/authRequest";
import Notification from "./notification.model";

/**
 * GET /api/v1/dashboard/admin/notifications
 * Fetch all notifications
 */
export const getAllNotifications = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 });

        const total = await Notification.countDocuments();
        const unread = await Notification.countDocuments({ isRead: false });

        res.status(200).json({
            success: true,
            message: "All Notifications fetched successfully",
            data: {
                total,
                unread,
                notifications
            }
        });
        return;

    } catch {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
        return;
    }
};


/**
 * GET /api/v1/dashboard/admin/notifications/unread
 */
export const getUnreadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notifications = await Notification.find({ isRead: false })
            .sort({ createdAt: -1 });

        if(notifications.length === 0){
            res.status(4040).json({
                success: true,
                message: "No unread notifications",
            });
            return;
        }


        const unread = await Notification.countDocuments({ isRead: false });

        res.status(200).json({
            success: true,
            message: "Unread Notifications fetched successfully",
            unread,
            data: notifications
        });
        return;

    } catch {
        res.status(500).json({
            success: false,
            message: "Failed to fetch unread notifications"
        });
        return;
    }
};


/**
 * PATCH /api/v1/dashboard/admin/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {

        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({
                success: false,
                message: "Notification not found"
            });
            return;
        }

        //If already mark as read bounce
        if(notification.isRead === true) {
            res.status(400).json({
                success: true,
                message: "Notification already marked as read"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
        return;

    } catch {
        res.status(500).json({
            success: false,
            message: "Failed to update notification"
        });
        return;
    }
};


/**
 * PATCH /api/v1/dashboard/admin/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response):Promise<void> => {
    try {

        await Notification.updateMany(
            { isRead: false },
            { isRead: true }
        );

        if(await Notification.countDocuments({ isRead: false }) === 0){
            res.status(400).json({
                success: true,
                message: "All notifications already marked as read"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
        return;

    } catch {
        res.status(500).json({
            success: false,
            message: "Failed to update notifications"
        });
        return;
    }
};


/**
 * DELETE /api/v1/dashboard/admin/notifications/:id
 */
export const deleteNotification = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if(!notification){
            res.status(404).json({
                success: false,
                message: "Notification already deleted"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted"
        });
        return;

    } catch {
        res.status(500).json({
            success: false,
            message: "Failed to delete notification"
        });
        return;
    }
};
