import express from "express";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import user, { content, linkModel } from "./db.js";
import { userMiddleware } from "./middleware.js";
import { random } from "./utils.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

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
            userId: new mongoose.Types.ObjectId(req.userId),
            tags: []
        })

        return res.json({
            message: "content added"
        })
    })
    app.get("/api/v1/content", userMiddleware, async (req, res) => {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const contentOfUser = await content.find({
            userId
        }).populate("userId", "userName");
        console.log(contentOfUser);
        res.json({
            contentOfUser
        });
    });

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

    app.post("/api/v1/brain/share",userMiddleware, async (req, res) => {
        const share = req.body.share;
        if(share){
            const existingLink = await linkModel.findOne({
                userId: req.userId
            });

            if(existingLink){
                res.json({
                    hash : existingLink.hash
                })
                return;
            }

            const hash = random(10)
            await linkModel.create({
                userId: req.userId,
                hash: hash,
            })
            res.json({
            message: "updated sharable link = /share/" + hash 
        })

        } else {
            await linkModel.deleteOne({
                userId: req.userId
            });
            res.json({
            message: "removed sharable link"
        })
        }
    })

    app.get("/api/v1/brain/:sharelink", async (req, res) => {
        const hash = req.params.sharelink;

        const link = await linkModel.findOne({
            hash
        })
        console.log("link = ", link);

        if(!link){
            res.status(411).json({
                message: "Incorrect link input"
            })
            return
        } 
        const userContentBrain = await content.find({
            userId: link.userId
        })
        const userOfContent = await user.findOne({
            _id: link.userId
        })
        console.log("user deatils : ", userOfContent);

        res.json({
            username: userOfContent?.userName,
            content : userContentBrain
        })
    })

    app.listen(3333, () => console.log("Server started!!"));
}
start();