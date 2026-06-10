export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-3">
          {/* Title */}
          <div className="h-8 w-48 bg-gray-200/80 rounded-lg animate-pulse" />
          {/* Subtitle */}
          <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
        </div>
        {/* Action Button */}
        <div className="h-11 w-36 bg-gray-200/60 rounded-xl animate-pulse" />
      </div>

      {/* 2. Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none animate-pulse h-32 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              <div className="h-5 w-12 bg-gray-50 dark:bg-gray-800/50 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-24 bg-gray-200/70 rounded-lg" />
              <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Table / Content Skeleton */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-none overflow-hidden p-6">
        {/* Toolbar Area */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
          <div className="h-11 w-full max-w-sm bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="flex gap-2">
            <div className="h-11 w-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-11 w-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* List Rows */}
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-gray-50 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
            >
              {/* Avatar / Image */}
              <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 animate-pulse" />

              {/* Main Text Info */}
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-1/3 bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>

              {/* Badges / Status (Hidden on mobile) */}
              <div className="hidden sm:block h-7 w-20 bg-gray-50 dark:bg-gray-800/50 rounded-full animate-pulse" />

              {/* Actions */}
              <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
