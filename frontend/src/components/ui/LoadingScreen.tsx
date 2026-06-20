export function LoadingScreen() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading TeamFlow...</p>
      </div>
    </div>
  );
}
