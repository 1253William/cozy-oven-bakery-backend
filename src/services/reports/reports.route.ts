


/**
 * @swagger
 * /api/v1/dashboard/admin/finance-summary:
 *   get:
 *     summary: Get monthly profit and expense summary
 *     tags:
 *       - Finance (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         example: "January"
 *       - in: query
 *         name: year
 *         required: true
 *         example: "2025"
 *     responses:
 *       200:
 *         description: Monthly finance summary fetched
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 totalSales: 15000
 *                 totalExpenses: 9500
 *                 profit: 5500
 *                 profitMargin: "36.67%"
 */
