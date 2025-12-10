import type { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";
import dotenv from "dotenv"
import { StatusCodes } from "http-status-codes";

dotenv.config();
const PASS_KEY = process.env.JWT_PASSWORD;

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.get("authorization");
    if (!header) {
        return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = header.startsWith("Bearer ")
        ? header.slice(7).trim()
        : header.trim();


    if (!PASS_KEY) {
    console.error("JWT_PASSWORD not set!");
    return res.status(500).json({ message: "Server configuration error" });
  }

    try {
        const decoded = Jwt.verify(token, PASS_KEY as string)
        if (typeof decoded === "object" && decoded) {
            // req.userId is declared in your global types (see below)
            req.userId = (decoded as any).userid;
        }

        return next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}