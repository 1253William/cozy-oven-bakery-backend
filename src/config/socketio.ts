import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { consumeEvaluationStreams } from "./evaluation.stream"

//uses socket.io, @socket.io/redis-adapter (socket.io-redis) to scale across instances.

// let io: Server;

// export const initSocket = (httpServer: any) => {
//   io = new Server(httpServer, {
//     cors: {
//       origin: "*", // later restrict to frontend domain
//       methods: ["GET", "POST"],
//     },
//   });

//   //Redis Pub/Sub setup
//   const pubClient = createClient({
//     socket: {
//       host: process.env.REDIS_HOST,
//       port: Number(process.env.REDIS_PORT),
//     },
//     password: process.env.REDIS_PASSWORD,
//   });

//   const subClient = pubClient.duplicate();

//   pubClient.connect();
//   subClient.connect();

//   io.adapter(createAdapter(pubClient, subClient));

//   io.on("connection", (socket) => {
//     console.log("⚡ New client connected:", socket.id);

//     socket.on("joinRole", (role: string) => {
//     if (["Admin", "Human Resource Manager", "Staff"].includes(role)) {
//         socket.join(role);
//         console.log(`User ${socket.id} joined ${role} room`);
//     }
//     });
//     socket.on("joinUser", (userId: string) => {
//     socket.join(userId);
//     console.log(`User ${socket.id} joined personal room ${userId}`);
//   });

//     socket.on("disconnect", () => {
//       console.log("Client disconnected:", socket.id);
//     });
//   });

//   return io;
// };

// export const getIO = () => {
//   if (!io) throw new Error("Socket.io not initialized");
//   return io;
// };
// socket/index.ts


let io: Server;

export const initSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    // cors: { origin: "*" },
    cors: {
     origin: [
      "http://localhost:5173",             // local dev
      "https://www.workplace.vire.agency", // production client
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  });

  // Redis pub/sub (notifications scaling)
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  pubClient.connect();
  subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    socket.on("joinRole", (role: string) => {
      if (["Admin", "Human Resource Manager", "Staff"].includes(role)) {
        socket.join(role);
      }
    });

    socket.on("joinUser", (userId: string) => {
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  // Attach evaluation stream consumers
  consumeEvaluationStreams(io);

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
