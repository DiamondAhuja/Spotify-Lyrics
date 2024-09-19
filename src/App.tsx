// src/App.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import queryString from "query-string";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const App = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [song, setSong] = useState<any>(null);
  const [lyricsUrl, setLyricsUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Get access token from the URL after Spotify login
  useEffect(() => {
    const hash = window.location.hash;
    if (!accessToken && hash) {
      const parsed = queryString.parse(hash);
      const token = parsed.access_token as string;
      setAccessToken(token);
      window.location.hash = ""; // Remove token from URL for cleaner look
    }
  }, [accessToken]);

  // Login to Spotify
  const loginToSpotify = () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID; // Stored in environment variables
    const redirectUri =
      process.env.SPOTIFY_REDIRECT_URI || "http://localhost:1234/callback";
    const scopes = ["user-read-playback-state", "user-read-currently-playing"];

    window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes.join(
      "%20"
    )}`;
  };

  // Fetch currently playing song
  const fetchCurrentlyPlayingTrack = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (data) {
        setSong(data.item);
        const trackName = data.item.name;
        const artistName = data.item.artists[0].name;
        fetchLyrics(trackName, artistName);
      } else {
        setSong(null); // No song is currently playing
        setLyricsUrl(null);
      }
    } catch (error) {
      console.error("Error fetching currently playing track:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lyrics using Genius API
  const fetchLyrics = async (trackName: string, artistName: string) => {
    const geniusApiKey = process.env.GENIUS_API_KEY; // Stored in environment variables
    try {
      const { data } = await axios.get(
        `https://cors-anywhere.herokuapp.com/https://api.genius.com/search?q=${encodeURIComponent(
          trackName
        )} ${encodeURIComponent(artistName)}`,
        {
          headers: {
            Authorization: `Bearer ${geniusApiKey}`,
          },
        }
      );
      console.log("Genius API response:", data);
      const lyricsPageUrl = data.response.hits[0]?.result.url;
      setLyricsUrl(lyricsPageUrl || null); // Store URL to the lyrics page
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      setLyricsUrl(null); // If no lyrics are found
    }
  };

  // Use useEffect to fetch the currently playing track after login
  useEffect(() => {
    if (accessToken) {
      fetchCurrentlyPlayingTrack();
    }
  }, [accessToken]);

  if (!accessToken) {
    return <button onClick={loginToSpotify}>Login with Spotify</button>;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Spotify Lyrics App</h1>
      {loading ? (
        <p>Loading currently playing track...</p>
      ) : song ? (
        <div>
          <h2>Now Playing: {song.name}</h2>
          <h3>Artist: {song.artists[0].name}</h3>
          {lyricsUrl ? (
            <p>
              <a href={lyricsUrl} target="_blank" rel="noopener noreferrer">
                View Lyrics
              </a>
            </p>
          ) : (
            <p>No lyrics found.</p>
          )}
        </div>
      ) : (
        <p>No song currently playing.</p>
      )}
      <button onClick={fetchCurrentlyPlayingTrack}>Refresh Song</button>
    </div>
  );
};

export default App;
