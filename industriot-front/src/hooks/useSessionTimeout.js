import { useEffect, useRef, useCallback } from 'react';

const TIMEOUTS = {
  admin:     10 * 60 * 1000,
  chef:       15 * 60 * 1000,
  operateur: 20 * 60 * 1000,
};

const WARNING_BEFORE = 60 * 1000;
const THROTTLE_MS    = 10 * 1000; // Reset max toutes les 10s

export function useSessionTimeout({ role, onExpire, onWarning }) {
  const timerRef      = useRef(null);
  const warningRef    = useRef(null);
  const lastResetRef  = useRef(0);
  const onExpireRef   = useRef(onExpire);
  const onWarningRef  = useRef(onWarning);
  const timeout       = TIMEOUTS[role] || TIMEOUTS.operateur;

  useEffect(() => { onExpireRef.current  = onExpire;  }, [onExpire]);
  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);

  const scheduleTimers = useCallback(() => {
    if (timerRef.current)   clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Compte à rebours warning
    warningRef.current = setTimeout(() => {
      let secs = Math.floor(WARNING_BEFORE / 1000);
      onWarningRef.current?.(secs);

      // Décrémenter chaque seconde
      const interval = setInterval(() => {
        secs -= 1;
        if (secs > 0) {
          onWarningRef.current?.(secs);
        } else {
          clearInterval(interval);
        }
      }, 1000);

      // Stocker l'interval pour pouvoir le nettoyer
      warningRef.current = interval;
    }, timeout - WARNING_BEFORE);

    // Timer d'expiration
    timerRef.current = setTimeout(() => {
      onExpireRef.current?.();
    }, timeout);

    localStorage.setItem('lastActivity', Date.now().toString());
  }, [timeout]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    // Throttle — ignorer si reset fait il y a moins de 10s
    if (now - lastResetRef.current < THROTTLE_MS) return;
    lastResetRef.current = now;
    scheduleTimers();
  }, [scheduleTimers]);

  const forceReset = useCallback(() => {
    lastResetRef.current = 0;
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    // Vérifier si session déjà expirée
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
    if (lastActivity > 0 && Date.now() - lastActivity > timeout) {
      onExpireRef.current?.();
      return;
    }

    // Événements qui reset le timer — SANS mousemove ni scroll
    const events = ['mousedown', 'keydown', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    // Démarrer le timer
    scheduleTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current)   clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimer, scheduleTimers, timeout]);

  return { resetTimer: forceReset };
}