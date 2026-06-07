import { useState } from "react";
import { supabase } from "../supabase";

const questions = [
  { key: "films", label: "🎬 Name 3 films you love" },
  { key: "tv", label: "📺 Name 3 TV shows you love" },
  { key: "books", label: "📚 Name 3 books you love" },
  { key: "music", label: "🎵 Name 3 artists or albums you love" },
  {
    key: "moods",
    label:
      "🌙 What moods or themes do you gravitate toward? (e.g. dark, funny, romantic, thought-provoking)",
  },
  { key: "avoid", label: "🚫 Anything you always avoid?" },
];

export default function Onboarding({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const current = questions[step];

  async function handleFinish() {
    setLoading(true);
    const { error } = await supabase.from("profile").insert({
      raw_preferences: answers,
      onboarding_complete: true,
      taste_summary: JSON.stringify(answers),
    });
    if (!error) onComplete();
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
      <h1>Welcome to TasteAI 👋</h1>
      <p>
        Let's get to know your taste. {step + 1} of {questions.length}
      </p>

      <div style={{ margin: "40px 0" }}>
        <label style={{ fontSize: 18, display: "block", marginBottom: 12 }}>
          {current.label}
        </label>
        <textarea
          rows={3}
          style={{ width: "100%", fontSize: 16, padding: 10 }}
          value={answers[current.key] || ""}
          onChange={(e) =>
            setAnswers({ ...answers, [current.key]: e.target.value })
          }
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {step > 0 && <button onClick={() => setStep(step - 1)}>← Back</button>}
        {step < questions.length - 1 ? (
          <button onClick={() => setStep(step + 1)}>Next →</button>
        ) : (
          <button onClick={handleFinish} disabled={loading}>
            {loading ? "Saving..." : "Finish Setup ✓"}
          </button>
        )}
      </div>
    </div>
  );
}
