import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Environment Variables
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;
const STORAGE_TYPE = process.env.STORAGE_TYPE || "cloudinary"; // "local" or "cloudinary"

console.log("🔍 Checking Environment Variables:");
console.log("MONGO_URI:", MONGO_URI ? "✅ Loaded" : "❌ Missing");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "✅ Loaded" : "❌ Missing");

let db, musicCollection, songsCollection;
async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("musicDB");
        musicCollection = db.collection("music");
        songsCollection = db.collection("songs");
        console.log("✅ Connected to MongoDB!");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}

// ✅ Local Storage Setup
const SONGS_FOLDER = "./songs";
if (!fs.existsSync(SONGS_FOLDER)) fs.mkdirSync(SONGS_FOLDER, { recursive: true });

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, SONGS_FOLDER),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const localUpload = multer({ storage: localStorage });

// ✅ Cloudinary Setup
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("❌ Cloudinary environment variables are missing! Check your settings.");
    process.exit(1);
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

// ✅ File Upload Route
app.post("/upload-songs", (req, res) => {
    const upload = STORAGE_TYPE === "cloudinary" ? cloudUpload.array("files", 10) : localUpload.array("files", 10);

    upload(req, res, async (err) => {
        if (err) {
            console.error("❌ Upload Error:", err);
            return res.status(400).json({ error: `Upload failed: ${err.message}` });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "❌ No files uploaded!" });
        }

        const uploadedSongs = req.files.map((file) => ({
            title: file.originalname.replace(".mp3", ""),
            filePath: STORAGE_TYPE === "cloudinary" ? file.path || file.secure_url : `/songs/${file.filename}`,
            storageType: STORAGE_TYPE,
            createdAt: new Date(),
        }));

        await songsCollection.insertMany(uploadedSongs);

        console.log("✅ Songs Uploaded:", uploadedSongs);
        res.status(201).json({ message: "✅ Songs uploaded successfully!", songs: uploadedSongs });
    });
});

// ✅ Serving Songs for Localhost
if (STORAGE_TYPE === "local") {
    app.use("/songs", express.static(SONGS_FOLDER));
}

// ✅ Fetching Songs
app.get("/musics", async (req, res) => {
    try {
        const songs = await songsCollection.find().toArray();
        res.status(200).json(songs);
    } catch (error) {
        console.error("❌ Error fetching songs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Delete a Song
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
            await songsCollection.deleteOne({ _id: new ObjectId(id) });
        } else {
            const localFilePath = path.join(SONGS_FOLDER, path.basename(song.filePath));
            if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
            await songsCollection.deleteOne({ _id: new ObjectId(id) });
        }

        res.status(200).json({ message: "✅ Song deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting song:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Root Route
app.get("/", (req, res) => {
    res.send("🎵 Server is running. Use the API to upload and access music.");
});

// ✅ Debugging Middleware: Logs all incoming requests
app.use((req, res, next) => {
    console.log(`🔍 Received ${req.method} request on ${req.url}`);
    next();
});

// ✅ Start Server Once (Avoids `EADDRINUSE`)
connectToMongoDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    // ✅ Debugging: List All Routes
    app._router.stack.forEach(route => {
        if (route.route && route.route.path) {
            console.log(`📌 Registered Route: ${route.route.path}`);
        }
    });
});
