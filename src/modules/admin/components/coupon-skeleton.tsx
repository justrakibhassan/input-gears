export default function CouponSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-4"><div className="h-3 w-20 bg-gray-200 rounded" /></th>
              <th className="px-6 py-4"><div className="h-3 w-24 bg-gray-200 rounded" /></th>
              <th className="px-6 py-4"><div className="h-3 w-16 bg-gray-200 rounded" /></th>
              <th className="px-6 py-4"><div className="h-3 w-16 bg-gray-200 rounded" /></th>
              <th className="px-6 py-4"><div className="h-3 w-16 bg-gray-200 rounded" /></th>
              <th className="px-6 py-4 text-right"><div className="h-3 w-16 ml-auto bg-gray-200 rounded" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                    <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
                    <div className="h-4 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
                    <div className="w-20 h-1 bg-gray-50 dark:bg-gray-800/50 rounded-full" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
