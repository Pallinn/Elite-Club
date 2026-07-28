"use client";

import { CONNECT_MAX_TAGS, CONNECT_TAGS } from "@/lib/connect-tags";
import { cn } from "@/lib/utils";

export function TagPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
      return;
    }
    if (selected.length >= CONNECT_MAX_TAGS) return;
    onChange([...selected, tag]);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-400">
        {selected.length}/{CONNECT_MAX_TAGS} tags selected
      </p>
      <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-white/10 p-3">
        {CONNECT_TAGS.map((tag) => {
          const active = selected.includes(tag);
          const disabled = !active && selected.length >= CONNECT_MAX_TAGS;
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggle(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-orange-500 bg-orange-500/20 text-orange-300"
                  : "border-white/10 text-neutral-400 hover:border-white/30 hover:text-white",
                disabled && "cursor-not-allowed opacity-40"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
