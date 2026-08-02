export default function BookLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-[#1A1A1A]">
      <div className="h-16 border-b border-white/10 bg-black" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="mb-10 flex justify-center">
          <div className="h-11 w-64 rounded-full bg-white/5" />
        </div>
        <div className="mb-10 flex gap-4">
          <div className="h-8 flex-1 rounded bg-white/5" />
          <div className="h-8 flex-1 rounded bg-white/5" />
          <div className="h-8 flex-1 rounded bg-white/5" />
        </div>
        <div className="h-[420px] rounded-lg bg-white/5" />
      </div>
    </div>
  );
}
