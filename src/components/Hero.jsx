import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Hero({
  category,
  setPage,
  onGetRecommendations,
  onSurprise,
  loading,
}) {
  const [stats, setStats] = useState({ film: 0, tv: 0, book: 0, music: 0 });

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from("recommendations")
        .select("category");
      if (!data) return;
      const counts = { film: 0, tv: 0, book: 0, music: 0 };
      data.forEach((r) => {
        if (counts[r.category] !== undefined) counts[r.category]++;
      });
      setStats(counts);
    }
    fetchStats();
  }, []);

  const CATEGORY_CONTENT = {
    film: {
      title: "Let's find you something worth",
      em: "watching",
      subtitle:
        "Based on what you love, we'll find films that hit the right note.",
    },
    tv: {
      title: "Let's find your next",
      em: "binge",
      subtitle:
        "From slow burns to one-more-episode addictions — we know your type.",
    },
    book: {
      title: "Let's find your next",
      em: "read",
      subtitle:
        "Fiction, thrillers, sci-fi — whatever mood you're in, we've got a pick.",
    },
    music: {
      title: "Let's find something new to",
      em: "listen to",
      subtitle: "Discover artists, albums and tracks that match your taste.",
    },
  };

  const content = CATEGORY_CONTENT[category];

  return (
    <div className="hero-full">
      <div className="hero-inner">
        <p className="hero-eyebrow">Welcome back, Sofia</p>
        <h1 className="hero-title">
          {content.title} <em>{content.em}</em>
        </h1>
        <p className="hero-subtitle">{content.subtitle}</p>
        <div className="hero-stats">
          {[
            { key: "film", icon: "🎬", label: "Films" },
            { key: "tv", icon: "📺", label: "TV shows" },
            { key: "book", icon: "📚", label: "Books" },
            { key: "music", icon: "🎵", label: "Music" },
          ].map(({ key, icon, label }) => (
            <div key={key} className="hero-stat">
              <p className="hero-stat-number">{stats[key]}</p>
              <p className="hero-stat-label">
                {icon} {label}
              </p>
            </div>
          ))}
        </div>
        <div className="hero-ctas">
          <button
            className="btn-primary hero-cta-main"
            onClick={onGetRecommendations}
            disabled={loading}
          >
            {loading
              ? "Finding recommendations..."
              : `Get ${category} recommendations`}
          </button>
          <button
            className="btn hero-cta-secondary"
            onClick={() => setPage("library")}
          >
            📚 My Library
          </button>
        </div>
        <button
          className="btn surprise-btn"
          onClick={onSurprise}
          disabled={loading}
        >
          🎲 Surprise me — something outside my usual taste
        </button>
      </div>
    </div>
  );
}
