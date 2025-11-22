import { useEffect, useRef } from "react";

import { useRouter } from "next/router";

const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in milliseconds

export function useAutoLogout() {
  const router = useRouter();
  const timer = useRef(null);

  console.log("Auto logout hook initialized");
  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Clear token or session info
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();
      router.push("/login");
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    // List of events that reset the timer
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer(); // Start the timer on load

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}
