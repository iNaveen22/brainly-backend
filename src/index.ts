import express from "express";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import user, { content } from "./db.js";
import { userMiddleware } from "./middleware.js";

dotenv.config();

const app = express();
app.use(express.json());

const PASS_KEY = process.env.JWT_PASSWORD;
const MONGO_URI = process.env.MONGO_URL;

async function start() {
    try {
        await mongoose.connect(MONGO_URI as any);
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    }

    app.post("/api/v1/signup", async (req, res) => {
        try {
            const userName = req.body.userName ?? req.body.username;
            const password = req.body.password;
            console.log("signup started...", userName);
            console.log("signup started...", { reqBody: req.body });
            const exists = await user.findOne({ userName });
            if (exists) {
                return res.status(409).json({ message: "User already exists" });
            }
            await user.create({
                userName,
                password
            })
            res.json({
                message: "user signed up!"
            })
        }
        catch (err: any) {
            console.log("signup error", err);
            if (err && err.code === 11000) {
                // duplecate user
                return res.status(409).json({ message: "User already exists" });
            }
            return res.status(500).json({ message: "Signup failed" });
        }
    })
    app.post("/api/v1/signin", async (req, res) => {
        const userName = req.body.userName;
        const password = req.body.password;
        const existingUser = await user.findOne({
            userName,
            password
        })

        if (existingUser) {
            if (!PASS_KEY) {
                console.error("JWT_PASSWORD not set!");
                return res.status(500).json({ message: "Server configuration error" });
            }

            const token = Jwt.sign({
                userid: existingUser._id.toString(),
            }, PASS_KEY as string)

            res.json({
                token
            })
        } else {
            res.status(403).json({
                message: "Invalid Credentials"
            })
        }
    })
    app.post("/api/v1/content", userMiddleware, async (req, res) => {
        const link = req.body.link;
        const type = req.body.type;
        await content.create({
            link,
            type,
            userId: req.userId,
            tags: []
        })

        return res.json({
            message: "content added"
        })
    })
    app.get("/api/v1/content", userMiddleware, async (req, res) => {
        const userId = req.body.userId;
        const contentOfUser = await content.find({
            userId: userId
        }).populate("userId", "userName");
        res.json({
            contentOfUser
        })
    })

    app.delete("/api/v1/content",userMiddleware, async (req, res) => {
        const contentId = req.body.contentId;

        await content.deleteMany({
            contentId,
            userId: req.userId
        })
        res.json({
            message: "deleted!"
        })
    })

    app.delete("/api/v1/content", (req, res) => {

    })
    app.delete("/api/v1/content", (req, res) => {

    })

    app.listen(3333, () => console.log("Server started!!"));
}
start();