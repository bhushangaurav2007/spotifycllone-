import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import multer from "multer";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing! Check your .env file.");
    process.exit(1);
}

let db, musicCollection;

// ✅ Connect to MongoDB
async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("musicDB");
        musicCollection = db.collection("music");
        console.log("✅ Connected to MongoDB!");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}

// ✅ Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// ✅ Multer Setup for Temporary File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ✅ API: Upload MP3 to Cloudinary
app.post("/upload-song", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "❌ No file uploaded!" });
        }

        // ✅ Upload File to Cloudinary
        const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
            resource_type: "video",
            folder: "songs",
        });

        // ✅ Save URL to MongoDB
        const song = {
            title: req.file.originalname.replace(".mp3", ""),
            fileUrl: uploadResult.secure_url,
            createdAt: new Date(),
        };

        await musicCollection.insertOne(song);

        // ✅ Delete Local File After Upload
        fs.unlinkSync(req.file.path);

        return res.status(201).json({ message: "✅ File uploaded successfully!", song });
    } catch (error) {
        console.error("❌ Error uploading file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ API: Get All Songs
app.get("/music", async (req, res) => {
    try {
        const songs = await musicCollection.find().toArray();
        res.status(200).json(songs);
    } catch (error) {
        console.error("❌ Error fetching music:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ API: Delete a Song
app.delete("/songs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const song = await musicCollection.findOne({ _id: new ObjectId(id) });

        if (!song) {
            return res.status(404).json({ error: "❌ Song not found!" });
        }

        // ✅ Delete from Cloudinary
        const publicId = song.fileUrl.split("/").pop().split(".")[0]; // Extract public_id from URL
        await cloudinary.v2.uploader.destroy(`songs/${publicId}`, { resource_type: "video" });

        // ✅ Delete from MongoDB
        await musicCollection.deleteOne({ _id: new ObjectId(id) });

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

// ✅ Start Server
app.listen(PORT, async () => {
    await connectToMongoDB();
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
