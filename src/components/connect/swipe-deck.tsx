"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { connectPhotoSrc } from "@/lib/connect-tags";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Candidate = {
  id: string;
  nickname: string;
  age: number;
  description: string;
  photoUrl: string;
  tags: string[];
};

type MatchInfo = { id: string; nickname: string; photoUrl: string; instagram: string };

export function SwipeDeck() {
  const { data, isLoading, mutate } = useSWR<{ candidates: Candidate[] } | { error: string }>(
    "/api/connect/deck",
    fetcher
  );
  const [deck, setDeck] = useState<Candidate[] | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const startX = useRef(0);
  const swiping = useRef(false);

  if (deck === null && data && "candidates" in data) {
    setDeck(data.candidates);
  }

  if (isLoading || deck === null) {
    return <p className="py-12 text-center text-sm text-neutral-400">Loading profiles...</p>;
  }

  if (data && "error" in data) {
    return <p className="py-12 text-center text-sm text-neutral-400">{data.error}</p>;
  }

  const current = deck[0];

  async function commitSwipe(direction: "LIKE" | "PASS") {
    if (!current || swiping.current) return;
    swiping.current = true;
    setDragX(direction === "LIKE" ? 600 : -600);

    try {
      const res = await fetch("/api/connect/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toProfileId: current.id, direction }),
      });
      const result = await res.json();
      if (res.ok && result.matched) {
        setMatchInfo(result.match);
      } else if (!res.ok) {
        toast.error(result.error ?? "Something went wrong");
      }
    } finally {
      setTimeout(() => {
        setDeck((prev) => (prev ? prev.slice(1) : prev));
        setDragX(0);
        swiping.current = false;
      }, 150);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (swiping.current) return;
    setDragging(true);
    startX.current = e.clientX;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dragX > 100) {
      commitSwipe("LIKE");
    } else if (dragX < -100) {
      commitSwipe("PASS");
    } else {
      setDragX(0);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="relative h-[520px]">
        {!current && (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 text-center text-sm text-neutral-400">
            <p>No more profiles right now.</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Check again
            </Button>
          </div>
        )}
        {current && (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)`,
              transition: dragging ? "none" : "transform 0.3s ease",
            }}
            className="absolute inset-0 flex touch-none flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 select-none"
          >
            <div className="relative h-72 w-full bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={connectPhotoSrc(current.photoUrl)} alt={current.nickname} className="h-full w-full object-cover" draggable={false} />
              {dragX > 40 && (
                <span className="absolute top-6 left-6 rotate-[-15deg] rounded border-4 border-green-500 px-3 py-1 text-xl font-bold text-green-500">
                  LIKE
                </span>
              )}
              {dragX < -40 && (
                <span className="absolute top-6 right-6 rotate-[15deg] rounded border-4 border-red-500 px-3 py-1 text-xl font-bold text-red-500">
                  PASS
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              <h2 className="text-lg font-semibold text-white">
                {current.nickname}, {current.age}
              </h2>
              <p className="text-sm text-neutral-300">{current.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {current.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-neutral-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {current && (
        <div className="mt-4 flex justify-center gap-6">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10"
            onClick={() => commitSwipe("PASS")}
          >
            <X className="size-6" />
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full border-green-500/40 text-green-400 hover:bg-green-500/10"
            onClick={() => commitSwipe("LIKE")}
          >
            <Heart className="size-6" />
          </Button>
        </div>
      )}

      <Dialog open={matchInfo !== null} onOpenChange={(open) => !open && setMatchInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>It&apos;s a match! 🎉</DialogTitle>
            <DialogDescription>
              You and {matchInfo?.nickname} both swiped right. Say hi on Instagram.
            </DialogDescription>
          </DialogHeader>
          {matchInfo && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={connectPhotoSrc(matchInfo.photoUrl)} alt={matchInfo.nickname} className="h-full w-full object-cover" />
              </div>
              <Button
                nativeButton={false}
                render={
                  <a
                    href={`https://instagram.com/${matchInfo.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                @{matchInfo.instagram} on Instagram
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
