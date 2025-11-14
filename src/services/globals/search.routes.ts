// import express from "express";
// import { authMiddleware } from "../../middlewares/authentication.middleware";
// import { authorizedRoles } from "../../middlewares/roles.middleware";
// import { contextSearch, globalSearch } from "./search.controller";
//
// const router = express.Router();
//
// /**
//  * @swagger
//  * /api/v1/search/global:
//  *   get:
//  *     summary: Global Search across the system (/api/v1/search/global?query=report)
//  *     description: Search across tasks, account, performance, and more in one request.
//  *     tags:
//  *       - Search
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: query
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The search keyword
//  *         example: report
//  *     responses:
//  *       200:
//  *         description: Global search results
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Global search results
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     tasks:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *                     account:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *                     performances:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *       400:
//  *         description: Missing or invalid query string
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Internal Server Error
//  */
// //@route GET /api/v1/search/global?query=report
// //@desc  Search across all entities in the system (tasks, account, etc.)
// //@access private
// router.get('/global', authMiddleware, authorizedRoles("Staff", "Admin", "Human Resource Manager"), globalSearch);
//
// /**
//  * @swagger
//  * /api/v1/search/context:
//  *   get:
//  *     summary: Contextual Search within a specific area (/api/v1/search/context?query=fiifi&context=employees)
//  *     description: Search within a specific context (employees, tasks, performance, etc.).
//  *     tags:
//  *       - Search
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: query
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The search keyword
//  *         example: fiifi
//  *       - in: query
//  *         name: context
//  *         schema:
//  *           type: string
//  *           enum: [employees, tasks, performance, evaluation, inventory, reports]
//  *         required: true
//  *         description: The context within which to search
//  *         example: employees
//  *     responses:
//  *       200:
//  *         description: Search results for the provided context
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Search results for context: employees"
//  *                 results:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *       400:
//  *         description: Missing query or context, or invalid context provided
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: No results found
//  *       500:
//  *         description: Internal Server Error
//  */
// //@route GET /api/v1/search/context?query=fiifi&context=employees
// //@desc  Search within a specific context (employees, tasks, etc.)
// //@access private
// router.get('/context', authMiddleware, authorizedRoles("Staff", "Admin", "Human Resource Manager"), contextSearch);
//
//
//
// export default router;