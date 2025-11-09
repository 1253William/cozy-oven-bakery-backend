import {Request, Response} from 'express';
import UserModel, { User } from './user.model'
import { AuthRequest } from '../../types/authRequest'
import redisClient from '../../config/redis';
require('dotenv').config();

//@route GET /api/v1/status/profile
//@desc Get Data/Profile/Details of Logged-in user
//@access Private
export const userData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const cacheKey = `profile:${userId}`;
    const cachedProfileStr = await redisClient.get(cacheKey);

    if (cachedProfileStr) {
      //Cache server hit
      const cachedProfile = JSON.parse(cachedProfileStr);
      res.status(200).json({
        success: true,
        message: "User profile fetched successfully (cache hit).",
        data: cachedProfile
      });
      return;
    }

    //Fallback to MongoDB if cache miss
    const user = await UserModel.findById(userId)
      .select("-password -__v -passwordChangedAt -createdAt -updatedAt")
      .populate("employeeProfile")
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    //Cache the result for future requests
    //Cache for 5 minutes (300 seconds)
    redisClient.setex(cacheKey, 300, JSON.stringify(user)).catch((err) =>
      console.error("Redis SET error:", err)
    );

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully.",
      data: user
    });
    return;

  } catch (error) {
    console.error({ message: "Error fetching user data", error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
    return;
  }
};
