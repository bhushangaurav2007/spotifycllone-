// import { useState, useEffect } from "react";

// const MusicPlayer = () => {
//   const [songs, setSongs] = useState([]);
//   const [currentSong, setCurrentSong] = useState(null);

//   // ✅ Fetch songs from backend
//   useEffect(() => {
//     fetch("http://localhost:3000/music")  
//       .then((res) => res.json())
//       .then((data) => setSongs(data))
//       .catch((error) => console.error("Error fetching songs:", error));
//   }, []);

//   return (
//     <div>
//       <h1>🎵 Music Player</h1>
//       <ul>
//         {songs.map((song) => (
//           <li key={song._id}>
//             <strong>{song.title}</strong> - {song.genre}
//             {song.type === "mp3" ? (
//               <button onClick={() => setCurrentSong(song.url)}>▶ Play</button>
//             ) : (
//               <a href={song.url} target="_blank" rel="noopener noreferrer">🎵 Open</a>
//             )}
//           </li>
//         ))}
//       </ul>

//       {/* 🎶 Show Audio Player if MP3 is Selected */}
//       {currentSong && (
//         <audio controls autoPlay>
//           <source src={`http://localhost:3000${currentSong}`} type="audio/mpeg" />
//           Your browser does not support the audio element.
//         </audio>
//       )}
//     </div>
//   );
// };

// export default MusicPlayer;
