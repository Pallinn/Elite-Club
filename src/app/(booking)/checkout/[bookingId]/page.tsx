import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "@/components/booking/checkout-client";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/checkout/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { items: { include: { zone: true, table: true } }, event: true },
  });

  if (!booking || booking.userId !== session.user.id) {
    redirect("/account/bookings");
  }

  return (
    <CheckoutClient
      booking={{
        id: booking.id,
        status: booking.status,
        holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null,
        totalSatang: booking.totalSatang,
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        items: booking.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          subtotalSatang: item.subtotalSatang,
          zone: { name: item.zone.name },
          table: item.table ? { label: item.table.label } : null,
        })),
        event: { name: booking.event.name },
      }}
    />
  );
}
