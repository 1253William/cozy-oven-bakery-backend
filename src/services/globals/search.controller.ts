// import { Response } from 'express';
// import PerformanceModel from '../models/performanceGoals.model';
// import User from '../account/user.model';
// import TaskModel from '../models/task.model';
// import { AuthRequest } from '../../types/authRequest';
//
// //Global Search API – searches across multiple collections/models in system (tasks, employees, etc.).
// //Context Search API – narrower search, restricted to a specific context (e.g., only employees, or only tasks, depending on context parameter).
//
// //@route GET /api/v1/search/global?query=report
// //@desc  Search across all entities in the system
// //@access private
// export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const userId = req.user?.userId;
//     if (!userId) {
//       res.status(401).json({ success: false, message: "Unauthorized" });
//       return;
//     }
//
//     const { query } = req.query;
//     if (!query || typeof query !== "string") {
//       res.status(400).json({ success: false, message: "Query string is required" });
//       return;
//     }
//
//     //search tasks + account
//     //Add evaluations, inventories, reports
//     const [tasks, users, performances] = await Promise.all([
//       TaskModel.find({ $text: { $search: query } }).limit(10),
//       User.find({
//         $or: [
//           { firstName: { $regex: query, $options: "i" } },
//           { lastName: { $regex: query, $options: "i" } },
//           { email: { $regex: query, $options: "i" } }
//         ]
//       }).limit(10),
//       PerformanceModel.find({ $text: { $search: query } }).limit(5),
//     //   EvaluationModel.find({ $text: { $search: query } }).limit(5),
//     //   InventoryModel.find({
//     //     $or: [
//     //       { itemName: { $regex: query, $options: "i" } },
//     //       { category: { $regex: query, $options: "i" } }
//     //     ]
//     //   }).limit(5),
//     //   ReportModel.find({ $text: { $search: query } }).limit(5),
//     ]);
//
//     res.status(200).json({
//       success: true,
//       message: "Global search results",
//       data: { tasks, users, performances /*, evaluations, inventories, reports */ }
//     });
//     return;
//
//   } catch (error) {
//     console.error("Error in globalSearch:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//     return;
//   }
// };
//
//
// // @route GET /api/v1/search/context?query=fiifi&context=employees
// // @desc  Search within a specific context (employees, tasks, etc.)
// // @access private
// export const contextSearch = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const { query, context } = req.query;
//
//     if (!query || typeof query !== "string") {
//       res.status(400).json({ success: false, message: "Query string is required" });
//       return;
//     }
//     if (!context || typeof context !== "string") {
//       res.status(400).json({ success: false, message: "Context is required" });
//       return;
//     }
//
//     let results: any = [];
//
//     switch (context.toLowerCase()) {
//       case "employees":
//         results = await User.find({
//           $or: [
//             { firstName: { $regex: query, $options: "i" } },
//             { lastName: { $regex: query, $options: "i" } },
//             { email: { $regex: query, $options: "i" } }
//           ]
//         }).limit(10);
//         break;
//
//       case "tasks":
//         results = await TaskModel.find({ $text: { $search: query } }).limit(10);
//         break;
//
//       case "performance":
//         results = await PerformanceModel.find({ $text: { $search: query } }).limit(10);
//         break;
//
//     //   case "evaluation":
//     //     results = await EvaluationModel.find({ $text: { $search: query } }).limit(10);
//     //     break;
//
//     //   case "inventory":
//     //     results = await InventoryModel.find({
//     //       $or: [
//     //         { itemName: { $regex: query, $options: "i" } },
//     //         { category: { $regex: query, $options: "i" } }
//     //       ]
//     //     }).limit(10);
//     //     break;
//
//     //   case "reports":
//     //     results = await ReportModel.find({ $text: { $search: query } }).limit(10);
//     //     break;
//
//       default:
//         res.status(400).json({ success: false, message: "Invalid context provided" });
//         return;
//     }
//
//     if (results.length === 0) {
//       res.status(404).json({ success: false, message: `No results found for context: ${context}` });
//       return;
//     }
//
//     res.status(200).json({
//       success: true,
//       message: `Search results for context: ${context}`,
//       results
//     });
//     return;
//
//   } catch (error) {
//     console.error("Error in contextSearch:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//     return;
//   }
// };
//
