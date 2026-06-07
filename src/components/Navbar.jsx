export default function Navbar({
  category,
  setCategory,
  theme,
  toggleTheme,
  page,
  setPage,
}) {
  const CATEGORIES = ["film", "tv", "book", "music"];
  const ICONS = { film: "🎬", tv: "📺", book: "📚", music: "🎵" };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span
          className="navbar-logo"
          onClick={() => setPage("landing")}
          style={{ cursor: "pointer" }}
        >
          TasteAI
        </span>

        <div className="navbar-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`pill ${
                category === cat && page === "home" ? "active" : ""
              }`}
              onClick={() => {
                setCategory(cat);
                setPage("home");
              }}
            >
              {ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="navbar-actions">
          <button
            className={`nav-btn ${page === "library" ? "nav-btn-active" : ""}`}
            onClick={() => setPage("library")}
          >
            📚 Library
          </button>
          <button className="nav-btn nav-btn-disabled" disabled>
            👤 Change User
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "☀" : "☾"}
          </button>
        </div>
      </div>
    </nav>
  );
}
