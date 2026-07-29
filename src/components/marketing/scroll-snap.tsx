"use client";

import { useEffect } from "react";

export function ScrollSnap() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("snap-scroll");

    // Mobile browsers (iOS Safari in particular) can silently refuse to jump
    // to a same-page hash link (e.g. the "Lineup" nav item) while
    // scroll-snap-type is "mandatory" - the snap logic treats the jump as an
    // interrupted snap and forces the page right back to its current
    // position, so the tap appears to do nothing. Work around it by
    // intercepting hash-link clicks: turn snapping off, do the scroll
    // ourselves, then turn it back on once the scroll settles.
    let reEnableTimer: number | undefined;

    function reEnableSnap() {
      window.clearTimeout(reEnableTimer);
      reEnableTimer = window.setTimeout(() => {
        html.classList.add("snap-scroll");
        window.removeEventListener("scroll", reEnableSnap);
      }, 150);
    }

    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement | null)?.closest("a[href*='#']");
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const path = href.slice(0, hashIndex) || "/";
      const hash = href.slice(hashIndex + 1);
      if (!hash || path !== window.location.pathname) return;

      const target = document.getElementById(hash);
      if (!target) return;

      // Capture phase, ahead of Next.js's own Link click handler - Link
      // checks event.defaultPrevented before doing its own routing/scroll,
      // so calling preventDefault this early skips its built-in same-page
      // hash scroll (which hits the same scroll-snap bug) while still
      // letting the link's own onClick (e.g. closing the mobile nav) run.
      e.preventDefault();
      html.classList.remove("snap-scroll");
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${hash}`);
      window.addEventListener("scroll", reEnableSnap, { passive: true });
      reEnableSnap();
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      html.classList.remove("snap-scroll");
      window.clearTimeout(reEnableTimer);
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("scroll", reEnableSnap);
    };
  }, []);

  return null;
}
