// services/notification.service.ts
import mongoose from "mongoose";
import Notification from "../../models/notifcation.model";
import { getIO } from "../../config/socketio";
import {sendEmail} from '../../utils/email.transporter';
import User from "../account/user.model";

interface NotificationPayload {
  recipients?: string[]; // userIds
  roles?: string[];
  title: string;
  message: string;
  priority?: "urgent" | "high" | "medium" | "low";
  type?: "System" | "Task" | "Performance" | "Message";
  channels?: ("socket" | "email" | "push")[];
  emails?: string[]; // fallback emails
}

export async function sendNotification(payload: NotificationPayload) {
  const {
    recipients = [],
    roles = [],
    title,
    message,
    priority = "medium",
    type = "System",
    channels = ["socket"], // default
    emails = [],
  } = payload;

  //Save to DB
  const notification = await Notification.create({
    recipients,
    roles,
    title,
    notificationMessage: message,
    priority,
    type,
    channels,
    delivered: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
  });

  const io = getIO();

  //Socket delivery
  if (channels.includes("socket")) {
    if (roles.length > 0) {
      roles.forEach((role) => {
        io.to(role).emit("notification", notification);
      });
    }
    if (recipients.length > 0) {
      recipients.forEach((userId) => {
        io.to(userId.toString()).emit("notification", notification);
      });
    }
  }

    //Email delivery
    if (channels.includes("email")) {
      let targetEmails = [...emails];

      //Recipients → emails
      if (recipients.length > 0) {
        const objectIds = recipients.map((id) => new mongoose.Types.ObjectId(id));
        const users = await User.find({ _id: { $in: objectIds } }, "email");
        targetEmails.push(...users.map((u) => u.email));
      }

      //Roles → emails
      if (roles.length > 0) {
        const roleUsers = await User.find({ role: { $in: roles } }, "email");
        targetEmails.push(...roleUsers.map((u) => u.email));
      }

      //Deduplicate
      targetEmails = [...new Set(targetEmails)];

      //Send emails
      for (const email of targetEmails) {
        await sendEmail({
          email,
          subject: title,
          text: message,
        });
      }
    }

  //Push (to be integrated later)
  if (channels.includes("push")) {
    console.log("Push notification placeholder:", { title, message, recipients, roles });
    // TODO: integrate Firebase / OneSignal
  }

  //Mark delivered
  notification.delivered = true;
  await notification.save();

  return notification;
}
