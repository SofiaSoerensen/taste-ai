import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Chat({ profile, category }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I know your taste pretty well by now. Ask me for recommendations, or tell me your mood and I'll suggest something perfect. 🎬📚🎵",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Switched to ${category}. Ask me for a recommendation or tell me your mood!`,
      },
    ]);
  }, [category]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data: recs } = await supabase
        .from("recommendations")
        .select("title, category, feedback")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: patterns } = await supabase
        .from("pattern_summaries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      const systemPrompt = `You are a personal taste-based recommendation assistant. You know this user very well.

Their initial preferences: ${JSON.stringify(profile.raw_preferences)}

Their taste patterns (learned from feedback): ${JSON.stringify(patterns)}

Their feedback history (liked/disliked/already_seen/want_to_try): ${JSON.stringify(
        recs
      )}

The user is currently browsing the ${category} category. When they ask for something without specifying a category, 
default to recommending ${category}s unless they say otherwise. Use this knowledge to make highly personalised recommendations. 
Be conversational and specific about WHY something matches their taste. Never recommend things they've already seen, rated, loved, disliked or marked as watched unless they explicitly ask. Already watched/rated titles: ${JSON.stringify(
        recs
          ?.filter((r) =>
            ["loved", "seen", "seen_meh", "disliked"].includes(r.feedback)
          )
          .map((r) => r.title)
      )}. Keep responses concise.`;

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
          system: systemPrompt,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const reply = data.content[0].text;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="chat-section">
      <h2>💬 Chat</h2>
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <span className={`bubble-inner ${m.role}`}>{m.content}</span>
          </div>
        ))}
        {loading && <div className="thinking">Thinking...</div>}
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask for a recommendation..."
        />
        <button className="chat-send" onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
