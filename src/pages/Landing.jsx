export default function Landing({ setPage, setCategory }) {
  const categories = [
    {
      key: "film",
      icon: "🎬",
      label: "Film",
      desc: "Find your next favourite film",
    },
    { key: "tv", icon: "📺", label: "TV", desc: "Find your next binge" },
    { key: "book", icon: "📚", label: "Book", desc: "Find your next read" },
    {
      key: "music",
      icon: "🎵",
      label: "Music",
      desc: "Discover something new to listen to",
    },
  ];

  return (
    <div className="landing">
      <div className="landing-hero">
        <p className="hero-eyebrow">Your personal taste engine</p>
        <h1 className="landing-title">
          Discover what you'll <em>love</em> next
        </h1>
        <p className="landing-subtitle">
          TasteAI learns your taste in film, TV, books and music — and gets
          smarter every time you rate something. No algorithms, no ads. Just
          recommendations that actually know you.
        </p>
        <button
          className="btn-primary landing-cta"
          onClick={() => setPage("home")}
        >
          Get started →
        </button>
      </div>

      <div className="landing-categories">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className="landing-cat-card"
            onClick={() => {
              setCategory(cat.key);
              setPage("home");
            }}
          >
            <span className="landing-cat-icon">{cat.icon}</span>
            <h3 className="landing-cat-label">{cat.label}</h3>
            <p className="landing-cat-desc">{cat.desc}</p>
          </button>
        ))}
      </div>

      <div className="landing-how">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps">
          {[
            {
              n: "01",
              title: "Tell us your taste",
              desc: "Answer a few quick questions about what you already love.",
            },
            {
              n: "02",
              title: "Get recommendations",
              desc: "Claude suggests films, TV, books and music tailored to you.",
            },
            {
              n: "03",
              title: "Rate what you see",
              desc: "Loved it? Seen it? Not for you? Every rating teaches TasteAI more.",
            },
            {
              n: "04",
              title: "Watch it get smarter",
              desc: "The more you use it, the better it knows your taste.",
            },
          ].map((step) => (
            <div key={step.n} className="landing-step">
              <span className="landing-step-n">{step.n}</span>
              <h4 className="landing-step-title">{step.title}</h4>
              <p className="landing-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
