// Shown instantly when switching admin pages, while the page's data loads.
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 rounded-xl bg-line/70" />
      <div className="h-4 w-64 rounded-lg bg-line/50 mt-3" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-white border border-line" />
        ))}
      </div>
      <div className="mt-8 rounded-3xl bg-white border border-line p-6 space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 rounded-xl bg-line/40" />
        ))}
      </div>
    </div>
  );
}
