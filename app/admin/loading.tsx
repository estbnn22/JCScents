export default function AdminLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
      <section className="panel-soft overflow-hidden rounded-[2rem]">
        <div className="flex animate-pulse flex-col gap-6 border-b border-[rgba(82,33,117,0.12)] px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="h-10 w-40 rounded-full bg-[rgba(82,33,117,0.1)]" />
            <div className="h-4 w-20 rounded-full bg-[rgba(220,176,103,0.18)]" />
            <div className="h-14 w-72 max-w-full rounded-[1.4rem] bg-[rgba(82,33,117,0.12)]" />
            <div className="h-20 w-[34rem] max-w-full rounded-[1.6rem] bg-[rgba(82,33,117,0.08)]" />
          </div>

          <div className="h-12 w-40 rounded-full bg-[rgba(82,33,117,0.1)]" />
        </div>

        <div className="grid gap-4 px-6 py-8 sm:grid-cols-3 sm:px-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`stat-${index}`}
              className="panel-card animate-pulse rounded-[1.6rem] p-5 sm:p-6"
            >
              <div className="h-4 w-20 rounded-full bg-[rgba(220,176,103,0.18)]" />
              <div className="mt-4 h-10 w-16 rounded-[1rem] bg-[rgba(82,33,117,0.12)]" />
              <div className="mt-4 h-16 rounded-[1.2rem] bg-[rgba(82,33,117,0.08)]" />
            </div>
          ))}
        </div>

        <div className="px-6 pb-8 pt-4 sm:px-8">
          <div className="panel-card animate-pulse rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="h-4 w-24 rounded-full bg-[rgba(220,176,103,0.18)]" />
                <div className="h-12 w-80 max-w-full rounded-[1.4rem] bg-[rgba(82,33,117,0.12)]" />
                <div className="h-7 w-64 max-w-full rounded-full bg-[rgba(82,33,117,0.08)]" />
              </div>

              <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
                <div className="h-[3.8rem] flex-1 rounded-full bg-[rgba(82,33,117,0.08)]" />
                <div className="h-[3.2rem] w-32 rounded-full bg-[rgba(220,176,103,0.24)]" />
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`item-${index}`}
                className="panel-card animate-pulse rounded-[1.75rem] p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2.5">
                      <div className="h-8 w-24 rounded-full bg-[rgba(220,176,103,0.18)]" />
                      <div className="h-8 w-32 rounded-full bg-[rgba(82,33,117,0.08)]" />
                    </div>
                    <div className="mt-4 h-12 w-80 max-w-full rounded-[1.3rem] bg-[rgba(82,33,117,0.12)]" />
                    <div className="mt-3 h-16 max-w-2xl rounded-[1.2rem] bg-[rgba(82,33,117,0.08)]" />
                  </div>

                  <div className="h-20 w-full max-w-xl rounded-[1.4rem] bg-[rgba(82,33,117,0.08)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
