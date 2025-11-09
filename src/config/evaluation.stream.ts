import Redis from "ioredis";
import { Server } from "socket.io";
import { sendNotification } from "../services/notifications/notificationMain.service";

//Stream Consumer to push evaluation events (newEvaluation, evaluationResponse) into socketio rooms
export async function consumeEvaluationStreams(io: Server) {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL environment variable not set");
  }

  const redis = new Redis(process.env.REDIS_URL);

  async function consume(stream: string, eventName: string) {
    const group = `${stream}-group`;
    const consumer = `consumer-${Math.random().toString(36).slice(2)}`;

    //Create consumer group if not exists
    try {
      await redis.xgroup("CREATE", stream, group, "0", "MKSTREAM");
    } catch (err: any) {
      if (!err.message.includes("BUSYGROUP")) {
        console.error(`Error creating group for ${stream}:`, err);
      }
    }

    while (true) {
      try {
        const data = await redis.xreadgroup(
          "GROUP",
          group,
          consumer,
          "BLOCK",
          5000,
          "STREAMS",
          stream,
          ">"
        )as [string, [string, string[]][]][] | null;

        if (data) {
          for (const [, messages] of data) {
            for (const [id, fields] of messages) {
              try {
                const eventIndex = fields.findIndex((f: string) => f === "event");
                const rawEvent = fields[eventIndex + 1];
                const parsed = JSON.parse(rawEvent);

                //Broadcast to socket rooms
                if (parsed.recipients?.length) {
                  parsed.recipients.forEach((userId: string) => {
                    io.to(userId).emit(eventName, parsed);
                  });
                }

                //Notifications
                if (stream === "evaluations") {
                  await sendNotification({
                    recipients: parsed.recipients,
                    title: "📋 New Evaluation Assigned",
                    message: `Hello Staff,

A new performance evaluation form **"${parsed.formName}"** has been assigned to you.  
Please log in to your Staff Dashboard to complete it before the deadline.

👉 Action Required: Complete the evaluation form as soon as possible.

Thank you,  
Vire Workplace Team`,
                    type: "Performance",
                    priority: "high",
                    channels: ["socket", "email"],
                  });
                }

                if (stream === "evaluation-responses") {
                  await sendNotification({
                    roles: ["Human Resource Manager"],
                    title: "✅ Evaluation Response Submitted",
                    message: `Hello HR Team,

You have received a new submitted response for an employee evaluation.  
Please log in to your HR Dashboard to review the submission.

👉 Action Required: Review and provide feedback on the submitted evaluation.

Best regards,  
Vire Workplace Team`,
                    type: "Performance",
                    priority: "medium",
                    channels: ["socket", "email"],
                  });
                }

                //Acknowledge message so it's not reprocessed
                await redis.xack(stream, group, id);
              } catch (err) {
                console.error(`Error processing message ${id} in ${stream}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error consuming ${stream}:`, err);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // backoff
      }
    }
  }

  //Start consumers
  consume("evaluations", "newEvaluation");
  consume("evaluation-responses", "evaluationResponse");
}
