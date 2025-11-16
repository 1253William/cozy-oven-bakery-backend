A Node.js + Express backend powering Cozy Oven’s bakery store.
It handles authentication, product management, orders, payments, offline order syncing,
and analytics for both web and event (POS) sales.

## Features

- User Authentication (Custom JWT)
- Product Management (CRUD)
- Payment Integration (Paystack / Hubtel / MoMo)
- Order Management
- Offline Sales Sync API
- Analytics Dashboard API: Track inventory, Input and track expenses, Product performance
- Image Storage with Cloudinary
- Realtime Notifications (via Firebase)
- Localization for Ghana


Products:


##  Folder Structure (sample)

cozy-oven-bakery-backend/
 ├── src/
 │ ├── config/
 │ │ ├── db.js
 │ │ └── cloudinary.js
 │ ├── controllers/
 │ │ ├── authController.js
 │ │ ├── productController.js
 │ │ ├── orderController.js
 │ │ └── syncController.js
 │ ├── middlewares/
 │ │ └── authMiddleware.js
 │ ├── models/
 │ │ ├── User.js
 │ │ ├── Product.js
 │ │ └── Order.js
 │ ├── routes/
 │ │ ├── authRoutes.js
 │ │ ├── productRoutes.js
 │ │ └── orderRoutes.js
 │ ├── utils/
 │ │ ├── email.js
 │ │ └── websocket.js
 │ ├── app.js
 │ └── server.js
 ├── .env.example
 ├── package.json
 └── README.md


## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/…/cozy-oven-bakery-backend.git
cd cozy-oven-bakery-backend
2. Install Dependencies
npm install
3. Configure Environment Variables

4. Run Locally
npm run dev
API runs on http://localhost:6000
Key Technical Components
1. JWT Authentication
import jwt from 'jsonwebtoken';
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

2. Offline Order Sync Endpoint
app.post('/api/orders/sync', authMiddleware, async (req, res) => {
  try {
    const { items, total, customer } = req.body;
    const order = new Order({
      items,
      total,
      customer,
      source: 'offline',
      syncedAt: new Date(),
      seller: req.user.id
    });
    await order.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

3. Cloudinary Image Upload
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'cozy-products' },
});

export const upload = multer({ storage });

4. Order Schema
const orderSchema = new mongoose.Schema({
  items: Array,
  total: Number,
  customer: Object,
  source: { type: String, default: 'online' },
  syncedAt: Date,
  createdAt: { type: Date, default: Date.now },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

Deployment Guide (Render)
Push to GitHub
Go to Render.com
Create “Web Service”
Connect repo → set npm run start as command
Add environment variables
Deploy 🎉


Integration with Frontend
Feature
Endpoint
Method
Description
Register
/api/v1/auth/register
POST
Create user
Login
/api/v1/auth/login
POST
Authenticate
Get Products
/api/v1/products
GET
Fetch all
Create Order
/api/v1/orders
POST
Place order
Sync Offline Orders
/api/v1/orders/sync
POST
Sync orders from fairs
Get Orders
/api/v1/orders
GET
Admin view


Tech Stack Summary
Category
Stack
Backend Framework
Node.js + Express
Database
MongoDB (Atlas)
Auth
JWT Custom
Image Hosting
Cloudinary
Payment
Paystack 
Notifications
Firebase
Deployment
Render

//Tests for concurrency, idempotency, and security

//Unit Test and E-2-E Test

//Add Prometheus and grafana for observability

//////Temporary
Folders:
00_Health
01_Auth (register, login, verify)
02_Products (upload, create, list, update, delete)
03_Orders (create, get, update status)
04_Offline_Sync (sync, idempotency tests)
05_Analytics
06_Webhooks
99_Utilities (seed DB, clear DB, generate JWT)
