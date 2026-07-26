"use client";

import { useState } from "react";
import { BookingShell } from "@/components/booking/booking-shell";
import { FloorPlanBooking } from "@/components/booking/floor-plan-booking";
import { JoinTableForm } from "@/components/account/join-table-form";
import type { FloorTable } from "@/components/booking/floor-plan-map";

export function BookPageTabs({
  eventId,
  eventName,
  venueName,
  startAt,
  tables,
}: {
  eventId: string;
  eventName: string;
  venueName: string | null;
  startAt: string;
  tables: FloorTable[];
}) {
  const [tab, setTab] = useState<"buy" | "join">("buy");

  const tabBar = (
    <div className="flex justify-center">
      <div className="inline-flex rounded-full border border-white/10 bg-neutral-900 p-1.5">
        <button
          onClick={() => setTab("buy")}
          className={`rounded-full px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${
            tab === "buy" ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          Buy Tickets / Table
        </button>
        <button
          onClick={() => setTab("join")}
          className={`rounded-full px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${
            tab === "join" ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          Add to My Table
        </button>
      </div>
    </div>
  );

  return (
    <BookingShell step="ticket" backHref="/" tabs={tabBar}>
      {tab === "buy" ? (
        <FloorPlanBooking
          eventId={eventId}
          eventName={eventName}
          venueName={venueName}
          startAt={startAt}
          tables={tables}
        />
      ) : (
        <div>
          <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Got a table code?
          </h1>
          <p className="mt-3 max-w-md text-sm text-neutral-400">
            Enter the 6-character code your friend shared with you to join their table and get
            your own e-ticket.
          </p>
          <div className="mt-6 max-w-md">
            <JoinTableForm />
          </div>
        </div>
      )}
    </BookingShell>
  );
}
