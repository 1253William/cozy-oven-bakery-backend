import redisClient from "../config/redis";
import { Request, Response } from "express";


export const debugStreams = async (req: Request, res: Response) => {
  try {
    const evaluations = await redisClient.xrange("evaluations", "-", "+");
    const responses = await redisClient.xrange("evaluation-responses", "-", "+");

    res.json({ evaluations, responses });
  } catch (error) {
    res.status(500).json({ message: error});
  }
};
