import Link from "next/link";
import { SignalListForm } from "@/components/marketing/signal-list-form";

export function FooterSection() {
  return (
    <footer className="border-t border-white/10 px-4 pt-16">
      <div className="mx-auto grid max-w-6xl gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-lg font-bold tracking-widest text-white">
            <span className="text-orange-500">NO</span>SIGNAL
          </p>
          <p className="mt-3 max-w-xs text-sm text-neutral-400">
            Underground events collective broadcasting from the fringes. Where the signal
            dies, the party starts.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-500">Channels</p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-400">
            <li>
              <Link href="/#events" className="hover:text-white">
                Events
              </Link>
            </li>
            <li>
              <Link href="/#lineup" className="hover:text-white">
                Artists
              </Link>
            </li>
            <li>
              <Link href="/book" className="hover:text-white">
                Venue
              </Link>
            </li>
            <li>
              <span className="cursor-default text-neutral-600">Press</span>
            </li>
            <li>
              <span className="cursor-default text-neutral-600">Contact</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Broadcast</p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-400">
            <li>
              <span className="cursor-default text-neutral-600">Instagram</span>
            </li>
            <li>
              <span className="cursor-default text-neutral-600">Spotify</span>
            </li>
            <li>
              <span className="cursor-default text-neutral-600">Resident Advisor</span>
            </li>
            <li>
              <span className="cursor-default text-neutral-600">Bandcamp</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-500">
            Signal list
          </p>
          <p className="mt-4 text-sm text-neutral-400">
            Get early access and exclusive drops.
          </p>
          <div className="mt-4">
            <SignalListForm />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-white/10 py-6 font-mono text-xs text-neutral-600 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} No Signal Collective. All frequencies reserved.</p>
        <p>
          Signal lost
          <span className="animate-blink-cursor">_</span>
        </p>
      </div>
    </footer>
  );
}
