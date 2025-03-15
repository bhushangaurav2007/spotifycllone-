import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_URL = "http://localhost:3000"; // Change this if your backend runs on a different port

const App = () => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // ✅ Fetch songs from backend
  useEffect(() => {
    fetch(`${API_URL}/music`)
      .then((res) => res.json())
      .then((data) => setSongs(data))
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  // ✅ Play selected song
  const playSong = (index) => {
    if (index === currentIndex) {
      togglePlayPause(); // Toggle if clicking the same song
      return;
    }

    setCurrentIndex(index);
    setIsPlaying(true);
  };

  // ✅ Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ✅ Play next song
  const playNext = () => {
    if (currentIndex !== null && currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  // ✅ Play previous song
  const playPrev = () => {
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
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

      {/* 🔹 Song List */}
      <div className="page">
        <div className="hero">
          <h1>Best of NCS - No Copyright Sounds</h1>
          <div className="songList">
            {songs.length > 0 ? (
              songs.map((song, index) => (
                <div className="s1" key={index} onClick={() => playSong(index)}>
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
            onEnded={playNext} // Automatically play next song when current ends
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
