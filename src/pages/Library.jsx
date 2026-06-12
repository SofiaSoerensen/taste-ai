import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import ProfileBuilder from "../components/ProfileBuilder";

const CATEGORIES = ["all", "film", "tv", "book", "music"];
const FEEDBACK_SECTIONS = [
  { key: "loved", label: "👍 Loved it", color: "var(--teal)" },
  { key: "want_to_try", label: "🔖 Want to try", color: "var(--amber)" },
  { key: "seen", label: "✅ Seen it", color: "var(--text-muted)" },
  {
    key: "seen_meh",
    label: "😐 Watched — indifferent",
    color: "var(--text-muted)",
  },
  { key: "disliked", label: "👎 Didn't like it", color: "var(--text-muted)" },
  {
    key: "not_interested",
    label: "🚫 Not interested",
    color: "var(--text-muted)",
  },
];

export default function Library({ setPage }) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function updateFeedback(id, newFeedback) {
    await supabase
      .from("recommendations")
      .update({ feedback: newFeedback })
      .eq("id", id);
    setEditing(null);
    fetchItems();
  }

  useEffect(() => {
    fetchItems();
  }, [category]);

  async function fetchItems() {
    setLoading(true);
    let query = supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false });

    if (category !== "all") query = query.eq("category", category);

    const { data } = await query;

    // Deduplicate — keep only most recent rating per title
    const seen = new Set();
    const deduped = (data || []).filter((item) => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    });

    setItems(deduped);
    setLoading(false);
  }

  const grouped = FEEDBACK_SECTIONS.reduce((acc, section) => {
    acc[section.key] = items.filter((item) => item.feedback === section.key);
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <h2 style={{ marginBottom: 6 }}>My Library</h2>
      <button
        className="btn-primary"
        style={{
          width: "auto",
          padding: "8px 16px",
          marginBottom: 0,
          fontSize: 13,
        }}
        onClick={() => setPage("quickrate")}
      >
        ⚡ Quick Rate
      </button>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        Everything you've rated, all in one place.
      </p>
      <ProfileBuilder onAdded={fetchItems} />

      <div className="category-nav" style={{ marginBottom: 32 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`pill ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat === "all"
              ? "✨ All"
              : cat === "film"
              ? "🎬 Film"
              : cat === "tv"
              ? "📺 TV"
              : cat === "book"
              ? "📚 Book"
              : "🎵 Music"}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          Nothing here yet — start rating recommendations!
        </p>
      ) : (
        FEEDBACK_SECTIONS.map((section) => {
          const sectionItems = grouped[section.key];
          if (sectionItems.length === 0) return null;
          return (
            <div key={section.key} style={{ marginBottom: 36 }}>
              <h3
                style={{ fontSize: 16, marginBottom: 16, color: section.color }}
              >
                {section.label}{" "}
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: 400,
                  }}
                >
                  ({sectionItems.length})
                </span>
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {sectionItems.map((item, i) => (
                  <div key={i} className="library-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div className="library-card-cat">{item.category}</div>
                      <button
                        className="edit-btn"
                        onClick={() =>
                          setEditing(editing === item.id ? null : item.id)
                        }
                      >
                        ✎
                      </button>
                    </div>
                    <h4 className="library-card-title">{item.title}</h4>
                    <p className="library-card-creator">{item.creator}</p>
                    {editing === item.id && (
                      <div className="edit-options">
                        {FEEDBACK_SECTIONS.map((s) => (
                          <button
                            key={s.key}
                            className={`edit-option ${
                              item.feedback === s.key ? "active" : ""
                            }`}
                            onClick={() => updateFeedback(item.id, s.key)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
