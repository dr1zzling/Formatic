import { createContext, useContext, useEffect, useRef, useState } from "react";

const ThemeContext = createContext({ dark: false, toggle: () => {}, setFillFormActive: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("formatic-theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  const fillFormActiveRef = useRef(false);

  const applyTheme = (isDark) => {
    if (fillFormActiveRef.current) return; // jangan apply saat di halaman responden
    const html = document.documentElement;
    html.setAttribute("data-theme", isDark ? "dark" : "light");
  };

  useEffect(() => {
    localStorage.setItem("formatic-theme", dark ? "dark" : "light");
    applyTheme(dark);
  }, [dark]);

  const setFillFormActive = (active) => {
    fillFormActiveRef.current = active;
    if (!active) {
      // Restore tema saat keluar dari FillForm
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(v => !v), setFillFormActive }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
