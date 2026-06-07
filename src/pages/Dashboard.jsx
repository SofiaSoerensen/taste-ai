import { useState } from "react";
import { supabase } from "../supabase";
import Chat from "../components/Chat";
import PatternSummariser from "../components/PatternSummariser";
import Hero from "../components/Hero";

const ICONS = { film: "🎬", tv: "📺", book: "📚", music: "🎵" };
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

async function fetchPoster(title, category) {
  if (category !== "film" && category !== "tv") return null;
  try {
    const type = category === "film" ? "movie" : "tv";
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_KEY}&query=${encodeURIComponent(
        title
      )}`
    );
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { image: null, rating: null };
    return {
      image: result.poster_path
        ? `https://image.tmdb.org/t/p/w300${result.poster_path}`
        : null,
      rating: result.vote_average
        ? Math.round(result.vote_average * 10) / 10
        : null,
      votes: result.vote_count || null,
    };
  } catch {
    return { image: null, rating: null };
  }
}

async function fetchBookCover(title) {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(
        title
      )}&limit=1`
    );
    const data = await res.json();
    const book = data.docs?.[0];
    const coverId = book?.cover_i;
    const rating = book?.ratings_average
      ? Math.round(book.ratings_average * 10) / 10
      : null;
    return {
      image: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : null,
      rating,
      votes: book?.ratings_count || null,
    };
  } catch {
    return { image: null, rating: null };
  }
}

export default function Dashboard({ profile, category, page, setPage }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  async function getRecommendations(surprise = false) {
    setLoading(true);
    try {
      const { data: seen } = await supabase
        .from("recommendations")
        .select("title")
        .eq("feedback", "already_seen");
      const seenTitles = seen?.map((r) => r.title) || [];

      const { data: patterns } = await supabase
        .from("pattern_summaries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a taste-based recommendation engine. Recommend exactly 3 ${category}s this user will love.

User preferences: ${JSON.stringify(profile.raw_preferences)}
Learned taste patterns: ${JSON.stringify(patterns)}
Already seen/read (DO NOT recommend these): ${JSON.stringify(seenTitles)}

${
  surprise
    ? `SURPRISE MODE: Recommend things deliberately OUTSIDE their usual taste — different genres, styles, or moods they haven't tried. Something that might pleasantly surprise them. Still avoid things they've already seen.`
    : `Recommend based on their established taste patterns.`
}

Return ONLY a JSON array with exactly 3 objects, each with:
- title (string)
- creator (director/author/artist)
- description (2 sentences max)
- reason (why this might work for them, 1 sentence)

No markdown, no explanation, just the JSON array.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text);

      const withImages = await Promise.all(
        parsed.map(async (rec) => {
          let image = null;
          let rating = null;
          let votes = null;
          if (category === "film" || category === "tv") {
            const result = await fetchPoster(rec.title, category);
            image = result?.image;
            rating = result?.rating;
            votes = result?.votes;
          } else if (category === "book") {
            const result = await fetchBookCover(rec.title);
            image = result?.image;
            rating = result?.rating;
            votes = result?.votes;
          }
          return { ...rec, image, rating, votes };
        })
      );
      setRecommendations(withImages);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function saveFeedback(rec, feedback) {
    await supabase.from("recommendations").insert({
      category,
      title: rec.title,
      creator: rec.creator,
      description: rec.description,
      reason: rec.reason,
      feedback,
    });
    setRecommendations((prev) =>
      prev.map((r) => (r.title === rec.title ? { ...r, saved: feedback } : r))
    );
  }

  if (page === "library") {
    return (
      <div className="app-shell">
        <h2 style={{ marginBottom: 24 }}>📚 My Library</h2>
        <p style={{ color: "var(--text-muted)" }}>Coming soon...</p>
      </div>
    );
  }

  return (
    <>
      <Hero
        category={category}
        setPage={setPage}
        onGetRecommendations={getRecommendations}
        onSurprise={() => getRecommendations(true)}
        loading={loading}
      />
      <div className="app-shell">
        <div>
          {recommendations.map((rec, i) => (
            <div key={i} className="rec-card">
              {rec.image ? (
                <img src={rec.image} alt={rec.title} />
              ) : (
                <div className="rec-card-placeholder">{ICONS[category]}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="rec-title">{rec.title}</h3>
                <p className="rec-creator">{rec.creator}</p>
                {rec.rating && (
                  <p
                    style={{
                      fontSize: 13,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "#C4841A", fontWeight: 500 }}>
                      ★ {rec.rating}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      /10
                    </span>
                    {rec.votes && (
                      <span
                        style={{ color: "var(--text-muted)", fontSize: 11 }}
                      >
                        ({rec.votes.toLocaleString()} ratings)
                      </span>
                    )}
                  </p>
                )}
                <p className="rec-desc">{rec.description}</p>
                <p className="rec-reason">✦ {rec.reason}</p>
                {rec.saved ? (
                  <p style={{ fontSize: 13, color: "var(--teal)" }}>
                    Saved as: {rec.saved}
                  </p>
                ) : (
                  <div className="feedback-btns">
                    <button
                      className="btn"
                      onClick={() => saveFeedback(rec, "loved")}
                    >
                      👍 Loved it
                    </button>
                    <button
                      className="btn"
                      onClick={() => saveFeedback(rec, "seen")}
                    >
                      ✅ Seen it
                    </button>
                    <button
                      className="btn"
                      onClick={() => saveFeedback(rec, "disliked")}
                    >
                      👎 Didn't like it
                    </button>
                    <button
                      className="btn"
                      onClick={() => saveFeedback(rec, "want_to_try")}
                    >
                      🔖 Want to try
                    </button>
                    <button
                      className="btn"
                      onClick={() => saveFeedback(rec, "not_interested")}
                    >
                      🚫 Not interested
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <hr className="section-divider" />
        <Chat profile={profile} category={category} />
        <PatternSummariser />
      </div>
    </>
  );
}
