import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import fs from "fs";
import path from "path";
import Sitemap from "express-sitemap";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

let db, songsCollection;
async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("musicDB");
        songsCollection = db.collection("songs");
        console.log("✅ Connected to MongoDB!");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "music",
        resource_type: "auto",
        allowed_formats: ["mp3"],
    },
});
const cloudUpload = multer({ storage: cloudinaryStorage });

app.post("/upload-songs", cloudUpload.array("files", 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "❌ No files uploaded!" });
    }

    const uploadedSongs = req.files.map((file) => ({
        title: file.originalname.replace(".mp3", ""),
        filePath: file.path || file.secure_url,
        storageType: "cloudinary",
        createdAt: new Date(),
    }));

    await songsCollection.insertMany(uploadedSongs);
    res.status(201).json({ message: "✅ Songs uploaded successfully!", songs: uploadedSongs });
});

app.get("/musics", async (req, res) => {
    try {
        const songs = await songsCollection.find().toArray();
        res.status(200).json(songs);
    } catch (error) {
        console.error("❌ Error fetching songs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete("/songs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const song = await songsCollection.findOne({ _id: new ObjectId(id) });

        if (!song) return res.status(404).json({ error: "❌ Song not found!" });

        if (song.storageType === "cloudinary") {
            const urlParts = song.filePath.split("/");
            const fileName = urlParts.pop();
            const publicId = fileName.split(".")[0];

            await cloudinary.uploader.destroy(`music/${publicId}`);
        }

        await songsCollection.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ message: "✅ Song deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting song:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Sitemap for Google Search
const sitemap = Sitemap({
    url: "https://spotifycllone.onrender.com",
    map: {
        "/": ["get"],
        "/musics": ["get"],
        "/upload-songs": ["post"]
    },
    route: {
        "/": { lastmod: "2024-03-17", changefreq: "weekly", priority: 1.0 },
        "/musics": { lastmod: "2024-03-17", changefreq: "daily", priority: 0.8 },
        "/upload-songs": { lastmod: "2024-03-17", changefreq: "weekly", priority: 0.7 }
    }
});

app.get("/sitemap.xml", (req, res) => {
    sitemap.XMLtoWeb(res);
});

app.get("/", (req, res) => {
    res.send("🎵 Server is running. Use the API to upload and access music.");
});

// ✅ Start Server
connectToMongoDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
});



// ✅ Debugging Middleware: Logs all incoming requests
app.use((req, res, next) => {
    console.log(`🔍 Received ${req.method} request on ${req.url}`);
    next();
});



    // ✅ Debugging: List All Routes
    app._router.stack.forEach(route => {
        if (route.route && route.route.path) {
            console.log(`📌 Registered Route: ${route.route.path}`);
        }
    });

