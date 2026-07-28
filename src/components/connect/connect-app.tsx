"use client";

import { useState } from "react";
import useSWR from "swr";
import { ProfileSetupForm } from "@/components/connect/profile-setup-form";
import { SwipeDeck } from "@/components/connect/swipe-deck";
import { MatchList } from "@/components/connect/match-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { ConnectProfile } from "@/generated/prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ConnectApp() {
  const { data, isLoading, mutate } = useSWR<{ eligible: boolean; profile: ConnectProfile | null }>(
    "/api/connect/profile",
    fetcher
  );
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-neutral-400">Loading...</p>;
  }

  if (!data?.profile || editing) {
    return (
      <ProfileSetupForm
        initialProfile={data?.profile}
        onSaved={() => {
          setEditing(false);
          mutate();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Connect</h1>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit profile
        </Button>
      </div>
      <Tabs defaultValue="discover">
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
        </TabsList>
        <TabsContent value="discover" className="pt-4">
          <SwipeDeck />
        </TabsContent>
        <TabsContent value="matches" className="pt-4">
          <MatchList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
