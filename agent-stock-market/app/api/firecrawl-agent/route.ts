import Firecrawl from "firecrawl";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StockIdea = {
  ticker: string;
  companyName: string;
  thesis: string;
  articles?: Article[];
};
type AgentResults = { buy: StockIdea[]; avoid: StockIdea[] };

type Article = { title: string; source: string; url?: string };

function isArticle(x: Article | null): x is Article {
  return x !== null;
}

const INDUSTRY_VALUES = [
  "Big Tech",
  "Semiconductors",
  "Fintech",
  "Energy",
  "AI Infrastructure",
] as const;

type Industry = (typeof INDUSTRY_VALUES)[number];

function isIndustry(x: unknown): x is Industry {
  return (
    typeof x === "string" && (INDUSTRY_VALUES as readonly string[]).includes(x)
  );
}

const RESULTS_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["buy", "avoid"],
  properties: {
    buy: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ticker", "companyName", "thesis"],
        properties: {
          ticker: {
            type: "string",
            description: "US stock ticker, uppercase, no $ prefix.",
          },
          companyName: {
            type: "string",
            description: "Company name for the ticker.",
          },
          thesis: {
            type: "string",
            description: "One-line reason based on latest news.",
          },
          articles: {
            type: "array",
            description: "Up to 2 supporting recent articles.",
            minItems: 1,
            maxItems: 2,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "source"],
              properties: {
                title: {
                  type: "string",
                  description: "Short article headline.",
                },
                source: { type: "string", description: "Publisher/site name." },
                url: { type: "string", description: "Optional URL." },
              },
            },
          },
        },
      },
    },
    avoid: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ticker", "companyName", "thesis"],
        properties: {
          ticker: {
            type: "string",
            description: "US stock ticker, uppercase, no $ prefix.",
          },
          companyName: {
            type: "string",
            description: "Company name for the ticker.",
          },
          thesis: {
            type: "string",
            description: "One-line risk based on latest news.",
          },
          articles: {
            type: "array",
            description: "Up to 2 supporting recent articles.",
            minItems: 1,
            maxItems: 2,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "source"],
              properties: {
                title: {
                  type: "string",
                  description: "Short article headline.",
                },
                source: { type: "string", description: "Publisher/site name." },
                url: { type: "string", description: "Optional URL." },
              },
            },
          },
        },
      },
    },
  },
};

function normalizeResults(data: unknown): AgentResults | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const buy = obj.buy;
  const avoid = obj.avoid;
  if (!Array.isArray(buy) || !Array.isArray(avoid)) return null;

  const toIdea = (x: unknown): StockIdea | null => {
    if (!x || typeof x !== "object") return null;
    const r = x as Record<string, unknown>;
    const ticker =
      typeof r.ticker === "string" ? r.ticker.trim().toUpperCase() : "";
    const companyName =
      typeof r.companyName === "string" ? r.companyName.trim() : "";
    const thesis = typeof r.thesis === "string" ? r.thesis.trim() : "";
    const articlesRaw = r.articles;

    const articles = Array.isArray(articlesRaw)
      ? articlesRaw
          .map((a) => {
            if (!a || typeof a !== "object") return null;
            const ar = a as Record<string, unknown>;
            let title = typeof ar.title === "string" ? ar.title.trim() : "";
            const source =
              typeof ar.source === "string" ? ar.source.trim() : "";
            const urlRaw = typeof ar.url === "string" ? ar.url.trim() : "";
            const url =
              urlRaw && /^https?:\/\//i.test(urlRaw) ? urlRaw : undefined;
            if (!title || !source) return null;
            if (title.length > 90) title = `${title.slice(0, 87)}…`;
            return { title, source, ...(url ? { url } : {}) };
          })
          .filter(isArticle)
          .slice(0, 2)
      : [];

    if (!ticker || !companyName || !thesis) return null;
    return { ticker, companyName, thesis, articles };
  };

  const buyIdeas = buy.map(toIdea).filter(Boolean) as StockIdea[];
  const avoidIdeas = avoid.map(toIdea).filter(Boolean) as StockIdea[];
  if (buyIdeas.length === 0 || avoidIdeas.length === 0) return null;

  return { buy: buyIdeas.slice(0, 4), avoid: avoidIdeas.slice(0, 4) };
}

export async function POST(req: Request) {
  const requestId = `agent_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
  const startedAt = Date.now();

  const logger = {
    info: (message: string) => {
      console.log(`[firecrawl-agent][${requestId}] ${message}`);
    },
    error: (message: string) => {
      console.error(`[firecrawl-agent][${requestId}] ${message}`);
    },
  };

  logger.info(`request: start`);

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    logger.error(`config: missing FIRECRAWL_API_KEY`);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing FIRECRAWL_API_KEY. Add it to your environment (e.g. .env.local) and restart the dev server.",
      },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    logger.error("request: invalid JSON body");
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const industry = (() => {
    if (!body || typeof body !== "object") return null;
    const industryValue = (body as Record<string, unknown>).industry;
    return isIndustry(industryValue) ? industryValue : null;
  })();

  if (!industry) {
    logger.error("request: invalid industry");
    return NextResponse.json(
      { ok: false, error: "Invalid industry." },
      { status: 400 }
    );
  }

  function buildPrompt(industry: string) {
    return [
      "You are a stock market agent demo.",
      "Use live news discovered on the web to propose stock ideas.",
      "",
      `Industry: ${industry}`,
      "",
      "Return EXACTLY:",
      "- 2 to 4 BUY ideas (best risk/reward based on latest news)",
      "- 2 to 4 AVOID ideas (material near-term risk based on latest news)",
      "",
      "Rules:",
      "- Use widely traded US equities where possible.",
      "- Ticker must be uppercase.",
      "- Include the company name.",
      "- Thesis must be ONE sentence (max ~120 characters).",
      "- Include 1–2 supporting recent articles per idea with (title, source). Keep titles short.",
      "- Article title should be compact (max ~80 characters).",
      "- Include an article URL when possible.",
      "- No disclaimers, no extra fields. Output must match the provided JSON schema.",
    ].join("\n");
  }

  try {
    const firecrawl = new Firecrawl({ apiKey });

    const status = await firecrawl.agent({
      prompt: buildPrompt(industry),
      schema: RESULTS_SCHEMA,
      pollInterval: 2,
      timeout: 180,
    });

    if (!status.success) {
      logger.error(`agent: failed: ${status.error || "unknown error"}`);
      return NextResponse.json(
        { ok: false, error: status.error || "Firecrawl Agent failed." },
        { status: 502 }
      );
    }
    if (status.status === "processing") {
      logger.error(`agent: still processing after timeout`);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Agent is still processing. Try again in a few seconds (or increase the server timeout).",
        },
        { status: 504 }
      );
    }
    if (status.status !== "completed") {
      logger.error(`agent: unexpected status=${status.status}`);
      return NextResponse.json(
        { ok: false, error: status.error || `Agent status: ${status.status}` },
        { status: 502 }
      );
    }

    const normalized = normalizeResults(status.data);
    if (!normalized) {
      logger.error(`normalize: failed (unexpected data shape)`);
      return NextResponse.json(
        { ok: false, error: "Agent returned unexpected data shape." },
        { status: 502 }
      );
    }

    logger.info(
      `[firecrawl-agent][${requestId}] response: ok (elapsedMs=${
        Date.now() - startedAt
      })`
    );
    return NextResponse.json({
      ok: true,
      results: normalized,
      creditsUsed: status.creditsUsed,
      expiresAt: status.expiresAt,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    logger.error(`exception (elapsedMs=${Date.now() - startedAt}): ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
