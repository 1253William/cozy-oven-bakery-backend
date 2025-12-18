import Notification from "./notification.model";

interface CreateNotificationPayload {
    title: string;
    message: string;
    type: "order" | "inventory" | "system";
    metadata?: Record<string, any>;
}

export const createNotification = async (
    payload: CreateNotificationPayload
) => {
    return await Notification.create(payload);
};
