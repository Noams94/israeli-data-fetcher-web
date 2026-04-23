# Israeli Data Fetcher — Web (Next.js)

A bilingual (Hebrew / English), RTL-first **Next.js 14** SPA for searching and
downloading open Israeli government data. Deploys as a subdomain of
`tools.noamkeshet.com`.

All calls go straight from the browser to [data.gov.il](https://data.gov.il)
(CKAN API, `Access-Control-Allow-Origin: *`). No backend, no server-side
storage, no API keys, no tracking.

---

## Features

| Feature | Description |
|---|---|
| Hebrew UI | Full RTL Hebrew; English toggle in the sidebar |
| Search | Free-text search with Hebrew support, URL-synced filters, pagination |
| Quick topics | Chips for population / budget / education / health / transport / environment / housing |
| Dataset view | Metadata, resource picker, table preview, in-page row filter |
| Export | CSV (UTF-8 BOM for Excel), XLSX with RTL direction + styled header, JSON |
| SQL query | Advanced SQL against DataStore with Hebrew examples |
| Popular datasets | Hand-picked shortcuts |
| Recent searches | Persisted to localStorage, sidebar list |
| Dark mode | Matches `tools.noamkeshet.com` — accent `#10a37f` on `#212121` |
| Zero backend | Fully static-compatible; deploys to Vercel / Cloudflare Pages free tier |

---

## Quick Start

```bash
cd israeli-data-fetcher-web
npm install
npm run dev
# → http://localhost:3000
```

### Tests

```bash
npm test
```

### Production build

```bash
npm run build && npm start
```

### Deploy to Vercel

```bash
# Option 1: dashboard — import the repo, done
# Option 2: CLI
vercel --prod
```

Hook it up as a subdomain under `tools.noamkeshet.com` in the Vercel dashboard.

---

## Project Structure

```
israeli-data-fetcher-web/
├── app/
│   ├── layout.tsx           # Root layout, RTL, metadata
│   ├── globals.css          # Tailwind + theme tokens
│   ├── providers.tsx        # TanStack Query + RTL dir sync
│   ├── page.tsx             # Home / search
│   ├── dataset/[id]/page.tsx
│   ├── sql/page.tsx
│   ├── popular/page.tsx
│   └── about/page.tsx
├── components/
│   ├── app-shell.tsx
│   ├── sidebar.tsx
│   ├── search-bar.tsx
│   ├── quick-topics.tsx
│   ├── filter-bar.tsx
│   ├── dataset-card.tsx
│   ├── resource-preview.tsx
│   ├── data-table.tsx
│   ├── export-buttons.tsx
│   ├── language-toggle.tsx
│   ├── loading.tsx
│   └── footer.tsx
├── lib/
│   ├── ckan.ts              # Fetch wrapper, timeouts, typed errors
│   ├── export.ts            # CSV (BOM) / XLSX (RTL + styled) / JSON
│   ├── i18n.ts              # Hebrew / English dictionary + t()
│   ├── store.ts             # Zustand (language, recent searches)
│   ├── types.ts
│   └── utils.ts
├── public/favicon.svg
├── tests/
│   ├── ckan.test.ts
│   └── export.test.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.mjs
├── vercel.json
├── vitest.config.ts
└── README.md
```

---

## API Reference — `lib/ckan.ts`

| Function | CKAN action | Notes |
|---|---|---|
| `searchDatasets({ query, org, tags, format, rows, start })` | `package_search` | Hebrew query, facet filters |
| `getDataset(id)` | `package_show` | Full metadata |
| `datastoreSearch({ resourceId, query, filters, limit, offset, sort })` | `datastore_search` | Row-level query |
| `datastoreSearchSql(sql)` | `datastore_search_sql` | Raw SQL |
| `listOrganizations()` | `organization_list` | Cached by React Query (1h) |
| `listTags()` | `tag_list` | Cached (1h) |
| `buildApiUrl(action, params)` | — | Build shareable URL for "copy API link" |

Timeout: 20s per request (AbortController). Errors surface as `CkanError`
with `kind ∈ { timeout | network | not_found | server | api }`.

---

## Encoding

- **CSV** — `\uFEFF` (UTF-8 BOM) prepended so Excel auto-detects Hebrew on open.
- **XLSX** — [`exceljs`](https://github.com/exceljs/exceljs) with `rightToLeft: true`,
  `#10a37f` header fill, frozen header row, auto-fit column widths.
- **JSON** — `JSON.stringify(rows, null, 2)`; no ASCII escaping needed.

---

## Theme

CSS tokens in [`tailwind.config.ts`](./tailwind.config.ts):

```
bg: #212121   |  bg-alt: #171717  |  card: #2f2f2f  |  card-border: #383838
text: #ececec |  muted: #9aa0a6   |  primary: #10a37f
```

Search bar `border-radius: 28px`, chips `20px`, cards `10px` with primary hover border.

---

## Deployment Notes

- CKAN base URL is controlled by `NEXT_PUBLIC_CKAN_BASE` (default `https://data.gov.il/api/3/action`).
- No server-side code — works identically on Vercel, Cloudflare Pages, Netlify, or `next start`.
- `vercel.json` adds security headers (`X-Content-Type-Options`, `Referrer-Policy`, etc).

---

## Credits

Built by Dr. Noam Keshet — [noamkeshet.com](https://noamkeshet.com) · keshet.noam@gmail.com.
Data from [data.gov.il](https://data.gov.il) (CKAN API). No affiliation with the Government of Israel.
