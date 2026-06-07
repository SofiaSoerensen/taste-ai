import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";

function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [category, setCategory] = useState("film");
  const [page, setPage] = useState("landing");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    checkProfile();
  }, []);

  async function checkProfile() {
    const { data } = await supabase
      .from("profile")
      .select("*")
      .eq("onboarding_complete", true)
      .single();
    setProfile(data);
    setLoading(false);
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  if (loading)
    return (
      <p style={{ padding: 40, fontFamily: "DM Sans, sans-serif" }}>
        Loading...
      </p>
    );
  if (!profile) return <Onboarding onComplete={checkProfile} />;

  return (
    <>
      <Navbar
        category={category}
        setCategory={setCategory}
        theme={theme}
        toggleTheme={toggleTheme}
        page={page}
        setPage={setPage}
      />
      {page === "landing" ? (
        <Landing setPage={setPage} setCategory={setCategory} />
      ) : page === "library" ? (
        <Library />
      ) : (
        <Dashboard
          profile={profile}
          category={category}
          setCategory={setCategory}
          page={page}
          setPage={setPage}
        />
      )}
    </>
  );
}

export default App;
