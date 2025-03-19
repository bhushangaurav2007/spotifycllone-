import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // ✅ Font Awesome for icons

const API_URL = process.env.REACT_APP_API_URL || "https://spotifycllone.onrender.com"; // ✅ Dynamic API URL

const App = () => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const songListRef = useRef(null);

  // ✅ Fetch songs from backend
  useEffect(() => {
    fetch(`${API_URL}/musics`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch songs");
        return res.json();
      })
      .then((data) => {
        const validSongs = data.filter((song) => song.filePath);
        setSongs(validSongs);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, []);

  // ✅ Play song when currentIndex changes
  useEffect(() => {
    if (audioRef.current && currentIndex !== null && songs[currentIndex]) {
      audioRef.current.src = songs[currentIndex].filePath;
      audioRef.current
        .play()
        .catch((err) => {
          console.error("❌ Audio Playback Error:", err);
          setIsPlaying(false);
        });
      setIsPlaying(true);
    }
  }, [currentIndex, songs]);

  // ✅ Play selected song
  const playSong = (index) => {
    if (index === currentIndex) {
      togglePlayPause();
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
        audioRef.current
          .play()
          .catch((err) => {
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

  // ✅ Scroll Functions
  const scrollLeft = () => {
    if (songListRef.current) {
      songListRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (songListRef.current) {
      songListRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

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

      {/* 🔹 Song List */}
      <div className="page">
        <div className="hero">
          <h1>Best of NCS - No Copyright Sounds</h1>
          <div className="scroll-container">
            <button className="scroll-btn" onClick={scrollLeft}>
              &larr;
            </button>
            <div className="songList" ref={songListRef}>
              {songs.length > 0 ? (
                songs.map((song, index) => (
                  <div
                    className={`s1 ${index === currentIndex ? "active playing" : ""}`}
                    key={index}
                    onClick={() => playSong(index)}
                  >
                    <span>🎵 {song.title}</span>
                    {index === currentIndex && isPlaying && (
                      <div className="playing-effect"></div>
                    )}
                  </div>
                ))
              ) : (
                <p>Loading songs...</p>
              )}
            </div>
            <button className="scroll-btn" onClick={scrollRight}>
              &rarr;
            </button>
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
              onEnded={playNext}
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
