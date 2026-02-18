## VoxNote 2.0 — Decision Intelligence Dashboard (Frontend Demo)

VoxNote 2.0 is a **frontend‑only, demo‑ready decision intelligence dashboard**. It simulates live meeting transcription, structured minutes of meeting, a decision graph, risk analytics, and cross‑meeting memory, all powered by **mock JSON data**.

Built with:

- **Next.js 14 (App Router, TypeScript)**
- **Tailwind CSS v4 + shadcn/ui**
- **Framer Motion**
- **React Flow** (decision graph)
- **Recharts** (analytics)
- **Lucide icons**

Dark theme is enabled by default and the UI is tuned to feel like a funded SaaS product.

---

### Getting started

From the `web` directory:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

There is **no backend** and **no real meeting data**. Everything you see is rendered on the client from mock data in `src/data/mock.ts`.

---

### App structure

- `src/app/layout.tsx` – Root layout, dark theme, animated app shell and sidebar
- `src/app/page.tsx` – **Dashboard** (decision density, sentiment, key stats)
- `src/app/live/page.tsx` – **Live Meeting** (streaming transcript + structured MoM)
- `src/app/graph/page.tsx` – **Decision Graph** (React Flow, side panel)
- `src/app/risk/page.tsx` – **Risk Analytics** (risk meter, breakdown, high‑risk list)
- `src/app/history/page.tsx` – **History** (past meetings + MoM modal, cross‑meeting memory)
- `src/app/settings/page.tsx` – **Settings** (local demo toggles, privacy explanation)
- `src/components/layout/*` – App shell and sidebar
- `src/components/pages/*` – Page‑level React components
- `src/components/ui/*` – shadcn/ui primitives
- `src/data/mock.ts` – Centralized mock meetings, transcript, decisions and tasks

---

### Pages overview

- **Dashboard**
  - Total meetings, active tasks, overdue tasks, average risk
  - Animated decision density chart and sentiment micro‑visual
- **Live Meeting**
  - Simulated real‑time transcript stream
  - Structured MoM: summary, decisions, action items, deadlines & risk
- **Decision Graph**
  - Meeting → Decision → Task → Person → Deadline, visualized in React Flow
  - Click nodes to inspect details in a right‑hand panel
- **Risk Analytics**
  - Animated circular risk meter with breakdown and high‑risk task list
  - Confidence indicator and qualitative guardrails
- **History**
  - List of past meetings with risk and overdue badges
  - Modal view for structured MoM
  - Cross‑meeting memory section aggregating per‑person load and risk
- **Settings**
  - Local toggles for meeting defaults and keyboard hints
  - Privacy and “simulated intelligence” explanation

---

### Environment variables

No environment configuration is required for this demo, but an `.env.example` file is provided as a starting point if you decide to hook VoxNote up to a real backend later.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
