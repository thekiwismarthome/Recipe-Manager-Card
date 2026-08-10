/**
 * Shared Wake Lock coordinator.
 *
 * Multiple parts of the card can want the screen kept awake at once (a
 * global manual toggle, an automatic "while viewing a recipe" mode) — this
 * tracks each as a named "reason" over a single underlying
 * WakeLockSentinel, requesting it while any reason is active and releasing
 * it once none are.
 *
 * The browser force-releases a wake lock whenever the document becomes
 * hidden (screen lock, tab switch, app backgrounded) — that's expected.
 * What's easy to miss is re-requesting it once the document is visible
 * again; without that, a wake lock silently stops working after the very
 * first time the screen dims, which looks like "it doesn't work at all".
 * This module re-acquires automatically on visibilitychange as long as at
 * least one reason is still active.
 */

const reasons = new Set();
const listeners = new Set();
let sentinel = null;

export function isWakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

function notify() {
  const active = !!sentinel;
  listeners.forEach(fn => fn(active));
}

async function acquireSentinel() {
  if (!isWakeLockSupported() || sentinel) return;
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
      notify();
    });
    notify();
  } catch (err) {
    console.warn('[RM] Wake Lock request failed:', err);
  }
}

async function releaseSentinel() {
  if (!sentinel) return;
  try { await sentinel.release(); } catch { /* ignore */ }
  sentinel = null;
  notify();
}

async function sync() {
  if (reasons.size > 0) await acquireSentinel();
  else await releaseSentinel();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && reasons.size > 0) acquireSentinel();
  });
}

/** Add a reason to keep the screen awake. Idempotent per reason. */
export async function acquire(reason) {
  reasons.add(reason);
  await sync();
}

/** Remove a reason; the screen lock releases once no reasons remain. */
export async function release(reason) {
  reasons.delete(reason);
  await sync();
}

export function isActive() {
  return !!sentinel;
}

export function hasReason(reason) {
  return reasons.has(reason);
}

/** Subscribe to active/inactive changes; returns an unsubscribe function. */
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
