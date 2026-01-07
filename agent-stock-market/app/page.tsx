"use client";

import { useEffect, useRef, useState } from "react";

type Industry =
  | "Big Tech"
  | "Semiconductors"
  | "Fintech"
  | "Energy"
  | "AI Infrastructure";

type AgentStage = "idle" | "running" | "done" | "error";

type StockIdea = {
  ticker: string;
  companyName: string;
  thesis: string;
  articles?: Array<{ title: string; source: string; url?: string }>;
};

type AgentResults = {
  buy: StockIdea[];
  avoid: StockIdea[];
};

const INDUSTRIES: Industry[] = [
  "Big Tech",
  "Semiconductors",
  "Fintech",
  "Energy",
  "AI Infrastructure",
];

function Spinner({ tone }: { tone: "onLight" | "onDark" | "onBrand" }) {
  const cls =
    tone === "onBrand"
      ? "border-white/35 border-t-white"
      : tone === "onDark"
        ? "border-white/25 border-t-white"
        : "border-zinc-300 border-t-[#FF4C00]";
  return (
    <span
      aria-hidden="true"
      className={["inline-block h-3.5 w-3.5 animate-spin rounded-full border-2", cls].join(
        " ",
      )}
    />
  );
}

function StatusDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
      <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-[#FF4C00]/25" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4C00]" />
    </span>
  );
}

function TypeStatusLines({
  stage,
  error,
  hideDone,
}: {
  stage: AgentStage;
  error?: string | null;
  hideDone?: boolean;
}) {
  if (stage === "idle") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <p className="text-sm leading-6 text-zinc-600">
          Select an industry, then run the agent to generate buy &amp; avoid ideas.
        </p>
      </div>
    );
  }

  if (stage === "done") {
    if (hideDone) return null;
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <p className="text-sm leading-6 text-zinc-700">
          Done. Review ideas below and re-run to swap industries.
        </p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
        <p className="text-sm font-medium leading-6 text-rose-800">Agent failed</p>
        <p className="mt-1 text-sm leading-6 text-rose-700">
          {error || "Please try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <StatusDot />
        <p className="text-sm font-medium tracking-wide text-zinc-900">Agent running</p>
        <span className="ml-auto">
          <Spinner tone="onLight" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Gathering sources and generating ideas…
      </p>
    </div>
  );
}

function ResultCard({
  idea,
  accent,
  index,
}: {
  idea: StockIdea;
  accent: "green" | "red";
  index: number;
}) {
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => setMounted(true), 90 + index * 90);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [index]);

  const ring =
    accent === "green"
      ? "ring-emerald-500/20 hover:ring-emerald-500/30"
      : "ring-rose-500/20 hover:ring-rose-500/30";

  const kicker =
    accent === "green" ? "text-emerald-700" : "text-rose-700";

  return (
    <div
      className={[
        "rounded-2xl bg-white ring-1 transition-all duration-500 ease-out",
        ring,
        mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      ].join(" ")}
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <p className="text-2xl font-semibold leading-none tracking-tight text-zinc-950">
              {idea.ticker}
            </p>
            {idea.companyName ? (
              <p className="truncate text-sm font-medium text-zinc-500">
                <span className="px-1.5 text-zinc-300">·</span>
                {idea.companyName}
              </p>
            ) : null}
          </div>
          <p className={["text-xs font-medium uppercase tracking-widest", kicker].join(" ")}>
            {accent === "green" ? "Buy" : "Avoid"}
          </p>
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-700">{idea.thesis}</p>
        {idea.articles && idea.articles.length > 0 ? (
          <div className="mt-3 space-y-1">
            {idea.articles.slice(0, 2).map((a) => (
              <div
                key={`${idea.ticker}-${a.source}-${a.title}`}
                className="flex min-w-0 items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF4C00]/60" aria-hidden="true" />
                <div className="flex min-w-0 items-baseline gap-1.5 text-xs text-zinc-600">
                  <span className="shrink-0 font-medium text-zinc-800">{a.source}</span>
                  <span className="shrink-0 text-zinc-300">—</span>
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 truncate text-zinc-700 hover:text-[#FF4C00] hover:underline"
                      title={a.title}
                      aria-label={`Open article: ${a.title}`}
                    >
                      {a.title}
                    </a>
                  ) : (
                    <span className="min-w-0 truncate">{a.title}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Results({ results }: { results: AgentResults }) {
  return (
    <section className="mt-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              Buy
            </h2>
            <div className="h-1.5 w-16 rounded-full bg-emerald-400/60" />
          </div>
          <div className="mt-4 space-y-3">
            {results.buy.map((idea, idx) => (
              <ResultCard key={idea.ticker} idea={idea} accent="green" index={idx} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              Avoid
            </h2>
            <div className="h-1.5 w-16 rounded-full bg-rose-400/60" />
          </div>
          <div className="mt-4 space-y-3">
            {results.avoid.map((idea, idx) => (
              <ResultCard key={idea.ticker} idea={idea} accent="red" index={idx} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultsReveal({ results }: { results: AgentResults }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={[
        "transition-all duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      ].join(" ")}
    >
      <Results results={results} />
    </div>
  );
}

export default function Page() {
  const [industry, setIndustry] = useState<Industry>("Big Tech");
  const [stage, setStage] = useState<AgentStage>("idle");
  const [results, setResults] = useState<AgentResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function onRun() {
    if (stage === "running") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStage("running");
    setResults(null);
    setError(null);

    try {
      const res = await fetch("/api/firecrawl-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ industry }),
        signal: controller.signal,
      });

      const json = (await res.json()) as
        | { ok: true; results: AgentResults }
        | { ok: false; error: string };

      if (!res.ok || !json.ok) {
        throw new Error(!json.ok ? json.error : "Request failed.");
      }

      setResults(json.results);
      setStage("done");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      const message = e instanceof Error ? e.message : "Agent request failed.";
      setError(message);
      setStage("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#262626]">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F9F9F9] to-zinc-100/70" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(255,76,0,0.16),transparent_60%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-10">
        <header className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Stock Market Agent
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
            Pick an industry. Get buy &amp; avoid ideas from live news.
          </p>
        </header>

        <section className="mx-auto mt-10 w-full max-w-3xl">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="block text-sm font-medium text-zinc-800">
                  Industry
                </span>
                <div className="relative mt-2">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value as Industry)}
                    disabled={stage === "running"}
                    className={[
                      "w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 pr-10",
                      "text-base text-zinc-950 shadow-sm outline-none",
                      "focus:border-[#FF4C00] focus:ring-2 focus:ring-[#FF4C00]/25",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    ].join(" ")}
                    aria-label="Select industry"
                  >
                    {INDUSTRIES.map((opt) => (
                      <option key={opt} value={opt} className="bg-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 10l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </label>

              <button
                type="button"
                onClick={onRun}
                disabled={stage === "running"}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3",
                  "bg-[#FF4C00] text-white shadow-sm transition-all",
                  "hover:bg-[#E64500] active:translate-y-px",
                  "focus:outline-none focus:ring-2 focus:ring-[#FF4C00]/35 focus:ring-offset-2 focus:ring-offset-[#F9F9F9]",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#FF4C00]",
                  "sm:w-44",
                ].join(" ")}
              >
                {stage === "running" ? (
                  <>
                    <Spinner tone="onBrand" />
                    <span className="text-base font-semibold">Running…</span>
                  </>
                ) : (
                  <span className="text-base font-semibold">Run Agent</span>
                )}
              </button>
            </div>

            {!(stage === "done" && results) ? (
              <div className="mt-4">
                <TypeStatusLines stage={stage} error={error} hideDone={Boolean(results)} />
              </div>
            ) : null}
          </div>

          {stage === "done" && results ? <ResultsReveal results={results} /> : null}

          <footer className="mt-8 text-center">
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-[#FF4C00]">Powered by Firecrawl Agent</span>
              <span className="px-2 text-zinc-300">•</span>
              <span>Demo only. Not financial advice.</span>
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
