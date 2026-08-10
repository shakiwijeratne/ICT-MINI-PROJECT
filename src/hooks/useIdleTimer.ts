import { useEffect, useState, useCallback, useRef } from 'react';

const LAST_ACTIVE_KEY = 'app_last_active_timestamp';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes total
const WARNING_WINDOW_MS = 2 * 60 * 1000; // Show warning 2 mins before timeout

interface UseIdleTimerProps {
  onTimeout: () => void;
  isLoggedIn: boolean;
}

export function useIdleTimer({ onTimeout, isLoggedIn }: UseIdleTimerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Keep a ref synchronized with showWarning to prevent stale closure inside event listeners
  const showWarningRef = useRef(showWarning);
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // 2. EXPLICIT action: Called manually when clicking "Stay Logged In" button
  const extendSession = useCallback(() => {
    if (!isLoggedIn) return;
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    setShowWarning(false);
  }, [isLoggedIn]);

  // 3. PASSIVE action: Called automatically on mousemove, keydown, scroll, etc.
  const handleUserActivity = useCallback(() => {
    if (!isLoggedIn) return;

    // 🚨 FIX: If the warning modal is currently showing, IGNORE background mouse/keyboard activity!
    if (showWarningRef.current) return;

    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  }, [isLoggedIn]);

  // Main timer loop checking elapsed inactivity time
  useEffect(() => {
    if (!isLoggedIn) return;

    // --- Overnight / Initial Mount Check ---
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActiveStr) {
      const elapsedMs = Date.now() - Number(lastActiveStr);
      if (elapsedMs >= IDLE_TIMEOUT_MS) {
        console.warn("Session expired due to inactivity.");
        
        // 🚨 ADD THIS LINE to prevent the infinite logout loop!
        localStorage.removeItem(LAST_ACTIVE_KEY); 
        
        onTimeout();
        return;
      }
    } else {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }
    
    // --- Activity Listeners ---
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleUserActivity));

    // --- Interval Check (Runs every second) ---
    timerRef.current = setInterval(() => {
      const currentLastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY) || Date.now());
      const elapsed = Date.now() - currentLastActive;
      const remainingMs = IDLE_TIMEOUT_MS - elapsed;

      if (remainingMs <= 0) {
        setShowWarning(false);
        onTimeout();
      } else if (remainingMs <= WARNING_WINDOW_MS) {
        setShowWarning(true);
        setSecondsRemaining(Math.ceil(remainingMs / 1000));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoggedIn, onTimeout, handleUserActivity]);

  return { showWarning, secondsRemaining, extendSession };
}