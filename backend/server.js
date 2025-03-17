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

// ✅ Debug: Check if environment variables are loading correctly
console.log("🔍 Checking Environment Variables:");
console.log("MONGO_URI:", MONGO_URI ? "✅ Loaded" : "❌ Missing");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "✅ Loaded" : "❌ Missing");

// ✅ Connect to MongoDB
let db, musicCollection, songsCollection;
async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("musicDB");
        musicCollection = db.collection("music"); // Localhost songs
        songsCollection = db.collection("songs"); // Cloudinary songs
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

app.post("/upload-songs", (req, res) => {
    try {
        const upload = STORAGE_TYPE === "cloudinary" ? cloudUpload.array("files", 10) : localUpload.array("files", 10);

        upload(req, res, async (err) => {
            if (err) {
                console.error("❌ Upload Error:", err);
                return res.status(500).json({ error: "❌ File upload failed!" });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: "❌ No files uploaded!" });
            }

            // ✅ Fix Cloudinary URL Issue
            const uploadedSongs = req.files.map((file) => ({
                title: file.originalname.replace(".mp3", ""),
                filePath: STORAGE_TYPE === "cloudinary" ? file.path || file.secure_url : `/songs/${file.filename}`, // ✅ Cloudinary returns file.secure_url
                storageType: STORAGE_TYPE,
                createdAt: new Date(),
            }));

            await songsCollection.insertMany(uploadedSongs);

            console.log("✅ Songs Uploaded:", uploadedSongs);
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

// ✅ Get All Songs (For Localhost)
app.get("/music", async (req, res) => {
    try {
        const songs = await musicCollection.find().toArray();
        const formattedSongs = songs.map(song => ({
            _id: song._id,
            title: song.title,
            url: `http://localhost:${PORT}${song.filePath}`,
        }));
        res.status(200).json(formattedSongs);
    } catch (error) {
        console.error("❌ Error fetching music:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Get All Cloudinary Songs (For Render)
app.get("/musics", async (req, res) => {
    try {
        const songs = await songsCollection.find().toArray();
        const formattedSongs = songs.map(song => ({
            _id: song._id,
            title: song.title,
            url: song.filePath, // Cloudinary URL
        }));
        res.status(200).json(formattedSongs);
    } catch (error) {
        console.error("❌ Error fetching cloudinary songs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Delete a Song
app.delete("/songs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const song = await musicCollection.findOne({ _id: new ObjectId(id) }) || await songsCollection.findOne({ _id: new ObjectId(id) });

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
            await musicCollection.deleteOne({ _id: new ObjectId(id) });
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

// ✅ Debugging: List All Routes
app.use((req, res, next) => {
    console.log(`🔍 Received ${req.method} request on ${req.url}`);
    next();
});


app._router.stack.forEach(route => {
    if (route.route && route.route.path) {
        console.log(`📌 Registered Route: ${route.route.path}`);
    }
});


// ✅ Start Server
app.listen(PORT, async () => {
    await connectToMongoDB();
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
