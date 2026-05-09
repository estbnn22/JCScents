export default function LoadingCatalogDetail() {
  return (
    <main className="bg-[var(--color-ivory)] text-[var(--color-ink)]">
      <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="panel-soft animate-pulse rounded-[2rem] p-6">
          <div className="h-5 w-40 rounded-full bg-[rgba(82,33,117,0.14)]" />
          <div className="mt-6 h-16 max-w-3xl rounded-[1.5rem] bg-[rgba(82,33,117,0.12)]" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-5">
              <div className="h-[30rem] rounded-[1.8rem] bg-[rgba(82,33,117,0.1)]" />
              <div className="h-28 rounded-[1.5rem] bg-[rgba(82,33,117,0.08)]" />
            </div>
            <div className="space-y-5">
              <div className="h-36 rounded-[1.8rem] bg-[rgba(82,33,117,0.08)]" />
              <div className="h-56 rounded-[1.8rem] bg-[rgba(82,33,117,0.08)]" />
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="h-40 rounded-[1.8rem] bg-[rgba(82,33,117,0.08)]" />
                <div className="h-40 rounded-[1.8rem] bg-[rgba(82,33,117,0.08)]" />
                <div className="h-40 rounded-[1.8rem] bg-[rgba(82,33,117,0.08)]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
