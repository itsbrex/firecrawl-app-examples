## Stock Market Agent Demo (Firecrawl)

A clean, single-page UI demo that runs a “stock market agent” powered by **Firecrawl Agent**.  
Pick an industry and generate **Buy** and **Avoid** ideas derived from live web/news sources.

> **Demo only. Not financial advice.**

### Getting started

#### 1) Install dependencies

```bash
npm install
```

#### 2) Configure Firecrawl

This demo uses the Firecrawl **Agent** endpoint:  
`https://docs.firecrawl.dev/features/agent`

Set your API key (server-side only):

```bash
export FIRECRAWL_API_KEY="fc-..."
```

Or create a `.env.local` file:

```bash
FIRECRAWL_API_KEY=fc-...
```

#### 3) Run the dev server

```bash
npm run dev
```

Then open `http://localhost:3000`.
