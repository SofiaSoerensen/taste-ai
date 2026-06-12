import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { QUICK_RATE_LISTS } from "../data/quickRateLists";

const CATEGORIES = ["film", "tv", "book", "music"];
const ICONS = { film: "🎬", tv: "📺", book: "📚", music: "🎵" };

const FEEDBACK_OPTIONS = [
  { key: "loved", label: "❤️", title: "Loved it" },
  { key: "seen", label: "👍", title: "Liked it" },
  { key: "seen_meh", label: "😐", title: "Watched — indifferent" },
  { key: "disliked", label: "👎", title: "Disliked" },
  { key: "want_to_try", label: "🔖", title: "Want to try" },
  { key: "not_interested", label: "🚫", title: "Not interested" },
];

export default function QuickRate({ onDone }) {
  const [category, setCategory] = useState("film");
  const [ratings, setRatings] = useState({});
  const [existing, setExisting] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchExisting();
  }, [category]);

  async function fetchExisting() {
    const { data } = await supabase
      .from("recommendations")
      .select("title")
      .eq("category", category);
    setExisting(new Set((data || []).map((r) => r.title)));
  }

  function rate(title, feedback) {
    setRatings((prev) => {
      if (prev[title] === feedback) {
        const next = { ...prev };
        delete next[title];
        return next;
      }
      return { ...prev, [title]: feedback };
    });
  }

  async function saveRatings() {
    setSaving(true);
    const entries = Object.entries(ratings);
    if (entries.length > 0) {
      const rows = entries.map(([title, feedback]) => {
        const item = QUICK_RATE_LISTS[category].find((i) => i.title === title);
        return {
          category,
          title,
          creator: item?.creator || "",
          description: "",
          reason: "Added via Quick Rate",
          feedback,
        };
      });
      await supabase.from("recommendations").insert(rows);
    }
    setSaving(false);
    setSaved(true);
    setRatings({});
    fetchExisting();
    setTimeout(() => setSaved(false), 2000);
  }

  const list = QUICK_RATE_LISTS[category];
  const ratedCount = Object.keys(ratings).length + existing.size;
  const total = list.length;

  return (
    <div className="app-shell">
      <p className="hero-eyebrow">Quick Rate</p>
      <h2
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 26,
          fontWeight: 400,
          marginBottom: 6,
        }}
      >
        Rate what you already know
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
        Go through the most popular titles and rate them. Skip anything you
        haven't seen — don't guess!
      </p>

      <div className="category-nav" style={{ marginBottom: 20 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`pill ${category === cat ? "active" : ""}`}
            onClick={() => {
              setCategory(cat);
              setRatings({});
            }}
          >
            {ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--text-muted)",
            marginBottom: 6,
          }}
        >
          <span>{ratedCount} rated</span>
          <span>{total - ratedCount} remaining</span>
        </div>
        <div
          style={{ height: 4, background: "var(--border)", borderRadius: 2 }}
        >
          <div
            style={{
              height: 4,
              width: `${(ratedCount / total) * 100}%`,
              background: "var(--teal)",
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {list.map((item, i) => {
          const currentRating = ratings[item.title];
          const alreadyInLibrary = existing.has(item.title);

          return (
            <div
              key={i}
              className="qr-item"
              style={{
                opacity: alreadyInLibrary ? 0.4 : 1,
                borderColor: currentRating ? "var(--teal)" : "var(--border)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 2,
                    color: "var(--text)",
                  }}
                >
                  {item.title}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {item.creator} · {item.year}
                </p>
              </div>

              {alreadyInLibrary ? (
                <p
                  style={{ fontSize: 11, color: "var(--teal)", flexShrink: 0 }}
                >
                  ✓ In library
                </p>
              ) : currentRating ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--teal)",
                      marginRight: 4,
                    }}
                  >
                    {
                      FEEDBACK_OPTIONS.find((f) => f.key === currentRating)
                        ?.label
                    }
                  </span>
                  <button
                    className="btn"
                    style={{ fontSize: 11, padding: "3px 8px" }}
                    onClick={() => rate(item.title, currentRating)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {FEEDBACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      className="btn"
                      title={opt.title}
                      style={{ fontSize: 13, padding: "4px 8px" }}
                      onClick={() => rate(item.title, opt.key)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          bottom: 20,
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {Object.keys(ratings).length > 0
            ? `${Object.keys(ratings).length} new ratings to save`
            : "Rate titles above then save"}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={onDone}>
            ← Back
          </button>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "10px 24px", marginBottom: 0 }}
            onClick={saveRatings}
            disabled={saving || Object.keys(ratings).length === 0}
          >
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save ratings"}
          </button>
        </div>
      </div>
    </div>
  );
}
