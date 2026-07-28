import { prisma } from "@/lib/prisma";

export { CONNECT_TAGS, CONNECT_MAX_TAGS, CONNECT_MIN_AGE } from "@/lib/connect-tags";

/**
 * Connect is an event-attendee perk: only users holding a ticket (as buyer or
 * as a table join-code redeemer) may create a profile or swipe.
 */
export async function isEligibleForConnect(userId: string): Promise<boolean> {
  const ticket = await prisma.ticket.findFirst({
    where: { holderUserId: userId, status: { in: ["VALID", "USED"] } },
    select: { id: true },
  });
  return ticket !== null;
}

// A match's two profile ids are always stored sorted so a pair can only ever
// match once, regardless of who swiped first.
export function sortProfilePair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

export function genderMatchesShowMe(showMe: "MALE" | "FEMALE" | "EVERYONE", candidateGender: "MALE" | "FEMALE" | "OTHER") {
  if (showMe === "EVERYONE") return true;
  return showMe === candidateGender;
}
