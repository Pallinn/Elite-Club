"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { connectPhotoSrc } from "@/lib/connect-tags";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Match = {
  id: string;
  nickname: string;
  age: number;
  photoUrl: string;
  instagram: string;
  description: string;
  matchedAt: string;
};

export function MatchList() {
  const { data, isLoading } = useSWR<{ matches: Match[] }>("/api/connect/matches", fetcher);

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-neutral-400">Loading matches...</p>;
  }

  const matches = data?.matches ?? [];

  if (matches.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-400">
        No matches yet. Keep swiping in Discover.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {matches.map((match) => (
        <div key={match.id} className="flex gap-3 rounded-xl border border-white/10 bg-neutral-950 p-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={connectPhotoSrc(match.photoUrl)} alt={match.nickname} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium text-white">
              {match.nickname}, {match.age}
            </p>
            <p className="line-clamp-2 text-xs text-neutral-400">{match.description}</p>
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={
                <a href={`https://instagram.com/${match.instagram}`} target="_blank" rel="noopener noreferrer" />
              }
            >
              @{match.instagram}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
