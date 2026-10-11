import { useSyncExternalStore } from 'react';

/** Mobile breakpoint query — single source of truth (`md`, < 768px = mobile). */
export const MOBILE_MEDIA_QUERY = '(max-width: 767.98px)';

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
  mql.addEventListener('change', callback);
  return () => {
    mql.removeEventListener('change', callback);
  };
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Single `md`-breakpoint hook shared by layout + bar + pages (E8a, reused by E8b).
 * Layout Tailwind `md:` classes and this hook never disagree (both flip at 768px).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
