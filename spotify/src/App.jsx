import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // ✅ Font Awesome for icons

const API_URL = process.env.REACT_APP_API_URL || "https://spotifycllone.onrender.com";

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
      audioRef.current.play().catch((err) => {
        console.error("❌ Audio Playback Error:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [currentIndex, songs]);

  const playSong = (index) => {
    if (index === currentIndex) {
      togglePlayPause();
    } else {
      setCurrentIndex(index);
      setIsPlaying(true);
    }
  };

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

  const playNext = () => {
    if (currentIndex !== null && currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const playPrev = () => {
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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

          {/* ✅ Divide songs into rows of 10 */}
          {Array.from({ length: Math.ceil(songs.length / 10) }, (_, rowIndex) => (
            <div className="song-row" key={rowIndex}>
              {songs.slice(rowIndex * 10, rowIndex * 10 + 10).map((song, index) => {
                const globalIndex = rowIndex * 10 + index;
                return (
                  <div
                    className={`s1 ${globalIndex === currentIndex ? "active playing" : ""}`}
                    key={globalIndex}
                    onClick={() => playSong(globalIndex)}
                  >
                    <span>🎵 {song.title}</span>
                    {globalIndex === currentIndex && isPlaying && (
                      <div className="playing-effect"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
