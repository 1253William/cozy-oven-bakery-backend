import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import SwaggerUi from 'swagger-ui-express';
import SwaggerSpec from './services/swagger';
import rootRouter from "./routes/index.route";
import connectDB from "./config/db";
import './workers/otpCleaner';
// import { startStoreCacheJob } from "./workers/storeCacheJob";
import http from 'http';


dotenv.config();

//Database Connection
connectDB()

const app = express();

//Create an HTTP server for Socket.IO
const server = http.createServer(app);


//Middlewares
app.use(express.json( { limit: '1mb' } )); 
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cors());
app.use(helmet(
    {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://apis.google.com"],
      "object-src": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
  crossOriginEmbedderPolicy: false, // allow cross-origin iframes if needed
})
);
app.use(morgan('dev'));
app.use('/api-docs', SwaggerUi.serve, SwaggerUi.setup(SwaggerSpec));
app.set("trust proxy", 1);

//CORS
app.use(
    cors({
        origin: (_origin, callback) => callback(null, true),
        credentials: true,
    })
);

const blockedPaths = [
  "/xmlrpc.php",
  "/wp-admin",
  "/wp-login.php",
  "/wlwmanifest.xml",
  "/wp-includes",
];

app.use((req, res, next) => {
  if (blockedPaths.some(path => req.originalUrl.includes(path))) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
});

//routes
app.use("/api/v1", rootRouter);
app.get('/', (_req, res) => {
    res.status(200).json({ 
        success: true,
        message: 'Cozy Oven API is running....',
        version: '1.0.0',
        year: new Date().getFullYear()
    });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

//start employee cache cron job
// startStoreCacheJob();

const PORT = parseInt(process.env.PORT as string, 10) || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
});