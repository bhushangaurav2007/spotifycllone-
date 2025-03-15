import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import fs from "fs";
import multer from "multer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;
const SONG_FOLDER = process.env.SONG_FOLDER || "./songs";

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

// ✅ Ensure Songs Folder Exists
if (!fs.existsSync(SONG_FOLDER)) {
    fs.mkdirSync(SONG_FOLDER);
}

// ✅ Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, SONG_FOLDER),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ✅ API: Upload Local MP3 Files to MongoDB (Prevent Duplicates)
app.post("/upload-songs", async (req, res) => {
    try {
        const files = fs.readdirSync(SONG_FOLDER).filter(file => file.endsWith(".mp3"));

        if (files.length === 0) {
            return res.status(400).json({ error: "❌ No MP3 files found in the folder!" });
        }

        const existingSongs = await musicCollection.find({}, { projection: { filePath: 1 } }).toArray();
        const existingFilePaths = new Set(existingSongs.map(song => song.filePath));

        const newSongs = [];
        for (const file of files) {
            const filePath = path.join(SONG_FOLDER, file);

            if (!existingFilePaths.has(filePath)) {
                const song = {
                    title: file.replace(".mp3", ""),
                    filePath: filePath,
                    createdAt: new Date()
                };
                newSongs.push(song);
            }
        }

        if (newSongs.length > 0) {
            await musicCollection.insertMany(newSongs);
            return res.status(201).json({ message: "✅ New songs added successfully!", songs: newSongs });
        } else {
            return res.status(409).json({ message: "❌ No new songs found. All songs already exist in the database!" });
        }
    } catch (error) {
        console.error("❌ Error uploading songs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ API: Upload MP3 File via Postman (Prevent Duplicates)
app.post("/upload-file", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "❌ No file uploaded!" });
        }

        const filePath = path.join(SONG_FOLDER, file.filename);
        const existingSong = await musicCollection.findOne({ filePath });

        if (!existingSong) {
            const song = {
                title: file.filename.replace(".mp3", ""),
                filePath: filePath,
                createdAt: new Date()
            };

            await musicCollection.insertOne(song);
            return res.status(201).json({ message: "✅ File uploaded successfully!", song });
        } else {
            return res.status(409).json({ message: "❌ This file already exists in the database!" });
        }
    } catch (error) {
        console.error("❌ Error uploading file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ API: Get All Songs (Both YouTube & MP3)
app.get("/music", async (req, res) => {
    try {
        const songs = await musicCollection.find().toArray();

        const formattedSongs = songs.map(song => ({
            _id: song._id,
            title: song.title,
            url: song.filePath.startsWith("http") 
                ? song.filePath 
                : `http://localhost:${PORT}/songs/${path.basename(song.filePath)}`,
        }));

        res.status(200).json(formattedSongs);
    } catch (error) {
        console.error("❌ Error fetching music:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ API: Serve MP3 Files
app.use("/songs", express.static(SONG_FOLDER));

// ✅ API: Download a Song by Filename
app.get("/download/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(SONG_FOLDER, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: "❌ File not found!" });
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

        fs.unlinkSync(song.filePath);
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

