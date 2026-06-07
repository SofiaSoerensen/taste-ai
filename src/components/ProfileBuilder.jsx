import { useState } from "react";
import { supabase } from "../supabase";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const LASTFM_KEY = import.meta.env.VITE_LASTFM_KEY;

async function searchLastFm(query, type) {
  const method =
    type === "artist"
      ? "artist.search"
      : type === "album"
      ? "album.search"
      : "track.search";
  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=${method}&${type}=${encodeURIComponent(
      query
    )}&api_key=${LASTFM_KEY}&format=json&limit=5`
  );
  const data = await res.json();

  if (type === "artist") {
    return (data.results?.artistmatches?.artist || []).map((a) => ({
      title: a.name,
      creator: "",
      image: null,
      rating: null,
      music_type: "artist",
    }));
  } else if (type === "album") {
    return (data.results?.albummatches?.album || []).map((a) => ({
      title: a.name,
      creator: a.artist,
      image: null,
      rating: null,
      music_type: "album",
    }));
  } else {
    return (data.results?.trackmatches?.track || []).map((t) => ({
      title: t.name,
      creator: t.artist,
      image: null,
      rating: null,
      music_type: "track",
    }));
  }
}

async function searchTMDB(query, type) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_KEY}&query=${encodeURIComponent(
      query
    )}`
  );
  const data = await res.json();
  return (data.results || []).slice(0, 5).map((r) => ({
    title: r.title || r.name,
    creator: r.release_date?.slice(0, 4) || r.first_air_date?.slice(0, 4) || "",
    image: r.poster_path
      ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
      : null,
    rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
    music_type: null,
  }));
}

async function searchBooks(query) {
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(
      query
    )}&limit=5`
  );
  const data = await res.json();
  return (data.docs || []).slice(0, 5).map((b) => ({
    title: b.title,
    creator: b.author_name?.[0] || "Unknown",
    image: b.cover_i
      ? `https://covers.openlibrary.org/b/id/${b.cover_i}-S.jpg`
      : null,
    rating: b.ratings_average ? Math.round(b.ratings_average * 10) / 10 : null,
    music_type: null,
  }));
}

const FEEDBACK_OPTIONS_MUSIC = [
  { key: "loved", label: "❤️ Favourite" },
  { key: "seen", label: "👍 Liked" },
  { key: "disliked", label: "👎 Disliked" },
  { key: "not_interested", label: "🚫 Don't recommend" },
];

const FEEDBACK_OPTIONS = [
  { key: "loved", label: "👍 Loved it" },
  { key: "seen", label: "✅ Seen it" },
  { key: "want_to_try", label: "🔖 Want to try" },
  { key: "disliked", label: "👎 Didn't like it" },
];

export default function ProfileBuilder({ onAdded }) {
  const [category, setCategory] = useState("film");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState({});
  const [musicType, setMusicType] = useState("artist");

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setAdded({});
    try {
      let res = [];
      if (category === "film") res = await searchTMDB(query, "movie");
      else if (category === "tv") res = await searchTMDB(query, "tv");
      else if (category === "book") res = await searchBooks(query);
      else res = await searchLastFm(query, musicType);
      setResults(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function addItem(item, feedback, index) {
    await supabase.from("recommendations").insert({
      category,
      title: item.title,
      creator: item.creator,
      description: "",
      reason: "Added manually via profile builder",
      feedback,
      music_type: item.music_type || null,
    });
    setAdded((prev) => ({ ...prev, [index]: feedback }));
    if (onAdded) onAdded();
  }

  return (
    <div className="profile-builder">
      <h3 style={{ marginBottom: 6 }}>⚡ Build your profile</h3>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
        Add things you've already seen or loved to help TasteAI learn your taste
        faster.
      </p>

      <div className="pb-controls">
        <div className="category-nav" style={{ marginBottom: 0 }}>
          {["film", "tv", "book", "music"].map((cat) => (
            <button
              key={cat}
              className={`pill ${category === cat ? "active" : ""}`}
              onClick={() => {
                setCategory(cat);
                setResults([]);
                setAdded({});
              }}
            >
              {cat === "film"
                ? "🎬"
                : cat === "tv"
                ? "📺"
                : cat === "book"
                ? "📚"
                : "🎵"}{" "}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {category === "music" && (
          <div style={{ display: "flex", gap: 6 }}>
            {["artist", "album", "track"].map((t) => (
              <button
                key={t}
                className={`pill ${musicType === t ? "active" : ""}`}
                style={{ fontSize: 12, padding: "4px 12px" }}
                onClick={() => setMusicType(t)}
              >
                {t === "artist" ? "👤" : t === "album" ? "💿" : "🎵"}{" "}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="pb-search-row">
          <input
            className="chat-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder={`Search for a ${category}...`}
          />
          <button className="chat-send" onClick={search} disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="pb-results">
          {results.map((item, i) => (
            <div key={i} className="pb-result">
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                {item.image && category !== "music" && (
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 4,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>
                    {item.title}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {item.creator}
                  </p>
                  {item.music_type && (
                    <p
                      style={{
                        color: "var(--teal)",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {item.music_type === "artist"
                        ? "👤"
                        : item.music_type === "album"
                        ? "💿"
                        : "🎵"}{" "}
                      {item.music_type}
                    </p>
                  )}
                  {item.rating && (
                    <p style={{ color: "var(--amber)", fontSize: 12 }}>
                      ★ {item.rating}
                    </p>
                  )}
                </div>
              </div>

              {added[i] ? (
                <p style={{ fontSize: 12, color: "var(--teal)" }}>
                  ✓ Added as {added[i]}
                </p>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(category === "music"
                    ? FEEDBACK_OPTIONS_MUSIC
                    : FEEDBACK_OPTIONS
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      className="btn"
                      style={{ fontSize: 11 }}
                      onClick={() => addItem(item, opt.key, i)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
