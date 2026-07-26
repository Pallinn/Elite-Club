"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/#lineup", label: "Lineup" },
  { href: "/book", label: "Book" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-m-2 flex h-10 w-10 items-center justify-center p-2 text-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-white/10 bg-black/95 backdrop-blur">
          <nav className="flex flex-col gap-1 p-4 font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded px-3 py-3 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <span className="flex cursor-not-allowed items-center gap-1.5 px-3 py-3 text-neutral-600">
              Connect
              <span className="rounded border border-white/10 px-1 py-0.5 text-[9px] text-neutral-500">
                Soon
              </span>
            </span>
          </nav>
        </div>
      )}
    </div>
  );
}
