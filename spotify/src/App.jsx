import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // ✅ Font Awesome for icons

const API_URL = process.env.REACT_APP_API_URL || "https://spotifycllone.onrender.com"; // ✅ Dynamic API URL

const App = () => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null); // ✅ Handles API errors
  const audioRef = useRef(null);

  // ✅ Fetch songs from backend
  useEffect(() => {
    fetch(`${API_URL}/musics`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch songs");
        return res.json();
      })
      .then((data) => setSongs(data))
      .catch((err) => setError(err.message));
  }, []);

  // ✅ Play song when currentIndex changes
  useEffect(() => {
    if (audioRef.current && currentIndex !== null) {
      audioRef.current.src = songs[currentIndex]?.url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentIndex]);

  // ✅ Play selected song
  const playSong = (index) => {
    if (index === currentIndex) {
      togglePlayPause(); // Toggle if same song is clicked
    } else {
      setCurrentIndex(index);
    }
  };

  // ✅ Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      if (audioRef.current) {
        prev ? audioRef.current.pause() : audioRef.current.play();
      }
      return !prev;
    });
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

  return (
    <div>
      {/* 🔹 Navbar */}
      <nav>
        <ul className="g1">
          <li className="brand">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSd-eHyIHkbiQ428WtDUb7s6dFnDK3CQ7YQog&s"
              alt="spotify"
            />
            Spotify Clone
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
          <div className="songList">
            {songs.length > 0 ? (
              songs.map((song, index) => (
                <div
                  className={`s1 ${index === currentIndex ? "active" : ""}`} // ✅ Highlights playing song
                  key={index}
                  onClick={() => playSong(index)}
                >
                  <span>🎵 {song.title}</span>
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
        {currentIndex !== null && (
          <audio
            ref={audioRef}
            src={songs[currentIndex].url}
            controls
            autoPlay
            onEnded={playNext} // ✅ Auto-play next song when current ends
          ></audio>
        )}
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
      </div>
    </div>
  );
};

export default App;
