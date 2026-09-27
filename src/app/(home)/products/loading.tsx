export default function ProductsLoading() {
  return (
    <div className="bg-[#fcfcff] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar Skeleton (Desktop) */}
          <aside className="hidden lg:block w-80 lg:sticky lg:top-24">
            <div className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6 animate-pulse">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="h-5 w-24 bg-gray-200 rounded-lg" />
                <div className="h-4 w-12 bg-gray-100 rounded-md" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-20 bg-gray-200 rounded-md" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="h-4 w-20 bg-gray-200 rounded-md" />
                <div className="flex gap-2">
                  <div className="h-10 flex-1 bg-gray-100 rounded-xl" />
                  <div className="h-10 flex-1 bg-gray-100 rounded-xl" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <main className="flex-1 w-full space-y-8 animate-pulse">
            {/* Toolbar Skeleton */}
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="h-5 w-36 bg-gray-200 rounded-lg" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-36 bg-gray-100 rounded-xl" />
                <div className="h-10 w-24 bg-gray-100 rounded-xl" />
              </div>
            </div>

            {/* Product Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4"
                >
                  <div className="aspect-square w-full bg-gray-100 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded-md" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <div className="h-6 w-20 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-24 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
