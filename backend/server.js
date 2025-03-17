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

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;
const STORAGE_TYPE = process.env.STORAGE_TYPE || "local"; // "local" or "cloudinary"

// ✅ Connect to MongoDB
let db, musicCollection;
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

// ✅ Local Storage Setup (For localhost)
const SONGS_FOLDER = "./songsFolder";
if (!fs.existsSync(SONGS_FOLDER)) fs.mkdirSync(SONGS_FOLDER, { recursive: true });

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, SONGS_FOLDER),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const localUpload = multer({ storage: localStorage });

// ✅ Cloudinary Setup (For Render)
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

// ✅ Upload Songs (Local for localhost, Cloudinary for Render)
app.post("/upload-songs", async (req, res) => {
    try {
        const upload = STORAGE_TYPE === "cloudinary" ? cloudUpload.array("files", 10) : localUpload.array("files", 10);

        upload(req, res, async (err) => {
            if (err) return res.status(500).json({ error: "❌ File upload failed!" });

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: "❌ No files uploaded!" });
            }

            const uploadedSongs = req.files.map((file) => ({
                title: file.originalname.replace(".mp3", ""),
                filePath: STORAGE_TYPE === "cloudinary" ? file.path : `/songs/${file.filename}`,
                storageType: STORAGE_TYPE,
                createdAt: new Date(),
            }));

            await musicCollection.insertMany(uploadedSongs);
            res.status(201).json({ message: "✅ Songs uploaded successfully!", songs: uploadedSongs });
        });
    } catch (error) {
        console.error("❌ Error uploading songs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Serve Songs (For localhost only)
if (STORAGE_TYPE === "local") {
    app.use("/songs", express.static(SONGS_FOLDER));
}

// ✅ Get All Songs
app.get("/music", async (req, res) => {
    try {
        const songs = await musicCollection.find().toArray();
        const formattedSongs = songs.map(song => ({
            _id: song._id,
            title: song.title,
            url: song.storageType === "cloudinary" ? song.filePath : `http://localhost:${PORT}${song.filePath}`,
        }));
        res.status(200).json(formattedSongs);
    } catch (error) {
        console.error("❌ Error fetching music:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Delete a Song
app.delete("/songs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const song = await musicCollection.findOne({ _id: new ObjectId(id) });

        if (!song) return res.status(404).json({ error: "❌ Song not found!" });

        if (song.storageType === "cloudinary") {
            const publicId = song.filePath.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`music/${publicId}`);
        } else {
            const localFilePath = path.join(SONGS_FOLDER, path.basename(song.filePath));
            if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        }

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
