import cron from "node-cron";
import ProductModel from "../services/products/product.model";
import OrderModel from "../services/orders/order.model";
import redisClient from "../config/redis";

// Refresh store cache every 2 minutes
export const startStoreCacheJob = () => {
  cron.schedule("*/2 * * * *", async () => {
    try {
      console.log("Running Cozy Oven store cache refresh...");

      const todayKey = new Date().toISOString().split("T")[0];
      const cacheKey = `store-cache:${todayKey}`;

      // Fetch all available products
      const products = await ProductModel.find(
          { isAvailable: true },
          "productName price stockQuantity productStatus productCategory rating"
      ).lean();

      if (!products.length) {
        console.warn("No active products found in inventory.");
        return;
      }

      // Derive store metrics
      const lowStockProducts = products.filter((p) => p.stockQuantity < 3);
      const outOfStockProducts = products.filter((p) => p.productStatus === "out of stock");

      // Today’s date range
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Fetch today’s orders
      const todayOrders = await OrderModel.find({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }).lean();

      const totalOrdersToday = todayOrders.length;
      const pendingOrders = todayOrders.filter((o) => o.orderStatus !== "delivered");
      const deliveredOrders = todayOrders.filter((o) => o.orderStatus === "delivered");

      // Summaries
      const storeData = {
        summary: {
          totalActiveProducts: products.length,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          totalOrdersToday,
          pendingDeliveries: pendingOrders.length,
          deliveredOrders: deliveredOrders.length,
          lastRefreshed: new Date().toISOString(),
        },
        products: products.map((p) => ({
          name: p.productName,
          category: p.productCategory,
          price: p.price,
          stock: p.stockQuantity,
          status: p.productStatus,
          rating: p.rating,
        })),
      };

      // Store in Redis cache (expires in 3 minutes)
      await redisClient.setex(cacheKey, 180, JSON.stringify(storeData));

      console.log(`Cozy Oven store cache updated: ${new Date().toISOString()}`);
    } catch (err) {
      console.error("Store cache job error:", err);
    }
  });
};
