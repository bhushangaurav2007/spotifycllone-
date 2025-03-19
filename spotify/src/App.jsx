import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // ✅ Font Awesome for icons

const API_URL = process.env.REACT_APP_API_URL || "https://spotifycllone.onrender.com";
const DEFAULT_IMAGE = "/img/default-song.jpg";

const App = () => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const scrollRefs = useRef([]); // ✅ Array of refs for multiple rows

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

  // ✅ Scroll functions
  const scrollLeft = (index) => {
    if (scrollRefs.current[index]) {
      scrollRefs.current[index].scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = (index) => {
    if (scrollRefs.current[index]) {
      scrollRefs.current[index].scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // ✅ Chunk songs into groups of 5 for multiple rows
  const chunkSongs = (arr, chunkSize) => {
    let result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize));
    }
    return result;
  };

  const songGroups = chunkSongs(songs, 5); // ✅ Grouping songs into rows

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

      {/* 🔹 Multiple Horizontal Rows */}
      <div className="page">
        <div className="hero">
          <h1>Best of NCS - No Copyright Sounds</h1>

          {songGroups.map((group, rowIndex) => (
            <div className="scroll-container" key={rowIndex}>
              <button className="scroll-btn left" onClick={() => scrollLeft(rowIndex)}>◀</button>
              
              <div className="songList" ref={(el) => (scrollRefs.current[rowIndex] = el)}>
                {group.map((song, songIndex) => {
                  const absoluteIndex = rowIndex * 5 + songIndex; // ✅ Calculate absolute index
                  return (
                    <div
                      className={`s1 ${absoluteIndex === currentIndex ? "active playing" : ""}`}
                      key={absoluteIndex}
                      onClick={() => playSong(absoluteIndex)}
                    >
{/*                       <img src={DEFAULT_IMAGE} alt={song.title} className="song-img" /> */}
                      <span>🎵 {song.title}</span>
{/*                       <p>{song.artist || "Unknown Artist"}</p> */}
                      {absoluteIndex === currentIndex && isPlaying && <div className="playing-effect"></div>}
                    </div>
                  );
                })}
              </div>

              <button className="scroll-btn right" onClick={() => scrollRight(rowIndex)}>▶</button>
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
