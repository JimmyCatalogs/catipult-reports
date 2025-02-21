import { useEffect, useState } from "react";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Check localStorage and system preference
    const stored = localStorage.getItem("theme");
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    // Update data-theme attribute and localStorage
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <>
      <button 
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
      <Component {...pageProps} />
    </>
  );
}
