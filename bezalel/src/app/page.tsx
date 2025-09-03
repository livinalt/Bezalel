
"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();

  const createBoard = () => {
    const roomId = uuidv4();
    router.push(`/board/${roomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-900 text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      {/* Navbar */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border-b border-zinc-200/50 dark:border-zinc-700/50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-fuchsia-500 to-indigo-600 text-white font-bold animate-pulse-slow">
              BZ
            </span>
            <span className="font-semibold tracking-tight text-xl hover:scale-105 transition-transform duration-300">
              Bezalel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white px-5 py-2 text-sm font-medium hover:from-indigo-700 hover:to-fuchsia-600 transition-all duration-300 animate-pulse-slow"
              onClick={createBoard}
              aria-label="Create a new drawing board"
            >
              Create New Board
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden flex-grow">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(99,102,241,0.3),transparent),radial-gradient(40%_50%_at_80%_20%,rgba(236,72,153,0.3),transparent)] dark:bg-[radial-gradient(60%_70%_at_50%_0%,rgba(88,101,242,0.2),transparent),radial-gradient(40%_50%_at_80%_20%,rgba(245,101,101,0.2),transparent)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm animate-pulse">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Live & Fun
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">
              Draw, Enhance, Stream with Bezalel
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-prose">
              Create sketches, enhance them with AI, and stream your art live to viewers in real-time. Simple, fun, and browser-based.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={createBoard}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-6 py-3 text-white font-medium hover:from-indigo-700 hover:to-fuchsia-600 transition-all duration-300"
                aria-label="Start drawing now"
              >
                Start Drawing Now
              </button>
              <Link
                href="/view/demo"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 dark:border-zinc-700 px-6 py-3 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                aria-label="Watch a live demo"
              >
                Watch a Live Demo
              </Link>
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              No sign-up required. Works in your browser.
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md shadow-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 text-sm flex items-center gap-2 bg-zinc-50/60 dark:bg-zinc-900/50">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 opacity-60">Live Canvas</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-fuchsia-100 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                <div className="rounded-2xl bg-white/80 dark:bg-zinc-800/70 px-6 py-5 shadow-lg text-center">
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">Live Preview</div>
                  <div className="mt-2 text-xl font-semibold">Your canvas stream appears here</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}