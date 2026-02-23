import UrlEditor from "./components/UrlEditor";

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-3xl px-6 py-20">
        <div className="mb-12 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            URL Explainer
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Paste a URL to break it down into its parts. Edit descriptions, add or remove segments, then share.
          </p>
        </div>
        <UrlEditor />
      </main>
    </div>
  );
}
