# CarbControl v2

Multi-tenant fleet management platform with GPS tracking, fuel monitoring, maintenance scheduling, and document management.

Built with Next.js 14, Supabase, react-leaflet, and shadcn/ui. Supports French and Arabic (RTL).

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Environment Variables

Copy `.env.local` values into your deployment environment:

| Variable                       | Description                                         |
| ------------------------------ | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | Supabase project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Supabase anonymous key                              |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase service role key (bypasses RLS)            |
| `WIALON_API_URL`               | Wialon API base URL (e.g. `https://hst-api.wialon.com/wialon/ajax.html`) |
| `WIALON_TOKEN`                 | Wialon permanent token                              |
| `CRON_SECRET`                  | Shared secret for cron job authorization            |

---

## Deploy on Render

### 1. Create a New Web Service

- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Plan**: Free tier works for testing

### 2. Set Environment Variables

Add all variables from the table above in the Render dashboard under **Environment**.

### 3. Set Up the Cron Job (Wialon Sync)

Render uses external cron services. Add a **Cron Job** in the Render dashboard:

- **URL**: `https://your-app.onrender.com/api/cron/wialon-sync?secret=YOUR_CRON_SECRET`
- **Schedule**: `* * * * *` (every minute)
- **Plan**: Free tier includes one cron job

The endpoint authenticates via the `secret` query parameter (or `Authorization: Bearer <secret>` header).

### 4. Keep the Free Service Awake

Render's free services spin down after 15 minutes of inactivity. The cron job pings the app every minute, which keeps it awake automatically. No external uptime monitor needed.

### 5. Manual Test

```bash
curl "https://your-app.onrender.com/api/cron/wialon-sync?secret=YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "message": "Sync completed",
  "processed": 5,
  "failed": 0,
  "eventsDetected": 0,
  "alertsCreated": 0
}
```

If Wialon is not configured:
```json
{
  "message": "Wialon not configured (WIALON_API_URL or WIALON_TOKEN missing)",
  "processed": 0,
  "failed": 0,
  "error": null
}
```

---

## Health Check

Render will poll `/api/health` every 5 seconds. It returns:

```json
{ "status": "ok" }
```

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org)
- **Auth**: Supabase Auth + RLS
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **UI**: Tailwind CSS + shadcn/ui
- **i18n**: next-intl (French / Arabic)
- **Tracking**: Wialon API
