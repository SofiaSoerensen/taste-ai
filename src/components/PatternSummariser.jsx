import { useState } from "react";
import { supabase } from "../supabase";

export default function PatternSummariser() {
  const [loading, setLoading] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);

  async function runSummariser() {
    setLoading(true);
    try {
      // Fetch all feedback so far
      const { data: recs } = await supabase
        .from("recommendations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!recs || recs.length === 0) {
        alert("No feedback yet to summarise!");
        setLoading(false);
        return;
      }

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
              content: `Analyse this user's feedback on recommendations and extract clear taste patterns.

Feedback data: ${JSON.stringify(recs)}

Return ONLY a JSON object with:
- general (string): overall taste summary
- film (string): film taste patterns
- tv (string): tv taste patterns  
- book (string): book taste patterns
- music (string): music taste patterns
- avoid (string): things they clearly don't enjoy

No markdown, no explanation, just the JSON object.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text);

      // Save each category summary
      for (const [category, summary] of Object.entries(parsed)) {
        await supabase.from("pattern_summaries").insert({
          category,
          summary,
          based_on_count: recs.length,
        });
      }

      // Update profile taste_summary
      await supabase
        .from("profile")
        .update({ taste_summary: JSON.stringify(parsed) })
        .eq("onboarding_complete", true);

      setLastSummary(parsed);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        marginTop: 40,
        padding: 20,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h3>🧠 Pattern Summariser</h3>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        Run this after giving feedback to help Claude learn your taste better.
      </p>
      <button className="btn-update" onClick={runSummariser} disabled={loading}>
        {loading ? "Analysing..." : "Update Taste Profile"}
      </button>

      {lastSummary && (
        <div style={{ marginTop: 16 }}>
          <h4>Updated taste profile:</h4>
          {Object.entries(lastSummary).map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong> {value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
