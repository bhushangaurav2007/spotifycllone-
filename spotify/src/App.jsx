import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // ✅ Font Awesome for icons

const API_URL = process.env.REACT_APP_API_URL || "https://spotifycllone.onrender.com"; // ✅ Dynamic API URL
const DEFAULT_IMAGE = "/img/default-song.jpg"; // ✅ Default song image

const App = () => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // ✅ Fetch songs from backend
  useEffect(() => {
    fetch(`${API_URL}/musics`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch songs");
        return res.json();
      })
      .then((data) => {
        const validSongs = data.filter((song) => song.filePath); // ✅ Ensure valid file paths
        setSongs(validSongs);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, []);

  // ✅ Play song when currentIndex changes
  useEffect(() => {
    if (audioRef.current && currentIndex !== null && songs[currentIndex]) {
      audioRef.current.src = songs[currentIndex].filePath;
      audioRef.current.play().catch((err) => {
        console.error("❌ Audio Playback Error:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [currentIndex, songs]);

  // ✅ Play selected song
  const playSong = (index) => {
    if (index === currentIndex) {
      togglePlayPause(); // Toggle if same song is clicked
    } else {
      setCurrentIndex(index);
      setIsPlaying(true);
    }
  };

  // ✅ Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.error("❌ Play Error:", err);
          setIsPlaying(false);
        });
      }
    }
    setIsPlaying((prev) => !prev);
  };

  // ✅ Play next song
  const playNext = () => {
    if (currentIndex !== null && currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // ✅ Play previous song
  const playPrev = () => {
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // ✅ Split songs into rows of 5
  const chunkSongs = (arr, chunkSize) => {
    let result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize));
    }
    return result;
  };

  const songGroups = chunkSongs(songs, 5);

  return (
    <div>
      {/* 🔹 Navbar */}
      <nav>
        <ul className="g1">
          <li className="brand">
            <img src="./2.png" alt="Spotify" />
            BGKK-SONGS
          </li>
          <li>Home</li>
          <li>About</li>
        </ul>
      </nav>

      {/* 🔹 Error Message */}
      {error && <p className="error">❌ {error}</p>}

      {/* 🔹 Song List in Rows (5 per row) */}
      <div className="page">
        <div className="hero">
          <h1>Best of NCS - No Copyright Sounds</h1>
          <div className="song-container">
            {songs.length > 0 ? (
              songGroups.map((group, rowIndex) => (
                <div className="song-row" key={rowIndex}>
                  {group.map((song, songIndex) => {
                    const absoluteIndex = rowIndex * 5 + songIndex; // ✅ Fix index mapping
                    return (
                      <div
                        className={`s1 ${absoluteIndex === currentIndex ? "active playing" : ""}`}
                        key={absoluteIndex}
                        onClick={() => playSong(absoluteIndex)}
                      >
                        <img src={DEFAULT_IMAGE} alt={song.title} className="song-img" />
                        <span>🎵 {song.title}</span>
                        <p>{song.artist || "Unknown Artist"}</p>
                        {absoluteIndex === currentIndex && isPlaying && <div className="playing-effect"></div>}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <p>Loading songs...</p>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Music Player */}
      <div className="bottom">
        {currentIndex !== null && songs[currentIndex] && (
          <>
            <audio
              ref={audioRef}
              src={songs[currentIndex].filePath}
              controls
              autoPlay
              onEnded={playNext} // ✅ Auto-play next song when current ends
            ></audio>

            <div className="icons">
              <i className="fa-solid fa-3x fa-backward-step" onClick={playPrev}></i>
              <i
                className={`fa-regular fa-3x ${
                  isPlaying ? "fa-circle-pause" : "fa-circle-play"
                }`}
                onClick={togglePlayPause}
              ></i>
              <i className="fa-solid fa-3x fa-forward-step" onClick={playNext}></i>
            </div>
            <div className="songInfo">
              {currentIndex !== null
                ? `Playing: ${songs[currentIndex].title}`
                : "Select a Song"}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
