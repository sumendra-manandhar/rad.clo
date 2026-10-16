// Tells the homepage intro loader when the hero's 3D shirt is on screen.
// Module state lives for the whole tab, so the intro only plays on the
// first full page load, not when navigating back to the homepage.

let heroReady = false;
let introPlayed = false;
const listeners = new Set<() => void>();

export function markHeroReady() {
  if (heroReady) return;
  heroReady = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}

/** Calls fn once the hero is ready (right away if it already is). Returns an unsubscribe. */
export function onHeroReady(fn: () => void) {
  if (heroReady) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const introHasPlayed = () => introPlayed;
export const setIntroPlayed = () => {
  introPlayed = true;
};
