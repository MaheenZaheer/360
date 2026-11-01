# Feedback360 — AI-Powered Customer Review Analysis System

**Feedback360** is a modern, production-ready SaaS web application built from scratch to help businesses collect authentic customer reviews, visualize sentiment and rating trends, and harness secure server-side AI to surface recurring complaints, customer satisfaction drivers, and actionable recommendations.

---

## 🌟 Key Features

### 1. Business Dashboard
- **Real-Time KPIs**: Total reviews count, average rating, positive sentiment percentage, and customer satisfaction index.
- **Interactive Visualizations**: 
  - Dynamic 14-day review volume and rating trends (Recharts Area Chart).
  - Donut chart for sentiment distribution (Positive, Neutral, Critical).
  - Horizontal bar breakdown across 5-star rating tiers.
- **AI Highlight Card**: Immediate access to key concerns and high-priority action items.
- **Recent Reviews**: Instant feed of the latest submissions with star ratings and sentiment badges.
- **Empty States**: Helpful zero-state onboarding guiding new businesses to share their public link.

### 2. Frictionless Review Collection & QR Codes
- **Direct Review URL**: Each business receives a unique, branded public link (`/r/[slug]`).
- **One-Click Link Copy**: Instant clipboard copy with visual confirmation.
- **Dynamic In-Person QR Code**: Generated on-the-fly via canvas, downloadable as high-resolution PNG for checkout counters, tables, and receipts.
- **Business Profile Editor**: Customize business name, industry, website, and customer greetings shown on the review form.

### 3. Public Customer Review Page (`/r/[slug]`)
- **Safe Public Route**: Queries only public-safe business information without leaking internal owner IDs or credentials.
- **Interactive Rating Interface**: Five-star rating selector with responsive hover effects.
- **Optional Identification**: Customers can leave their name or submit anonymously.
- **Submission Feedback**: Inline validation, character counters, loading states, and a clean thank-you confirmation.

### 4. Comprehensive Review Management (`/reviews`)
- **Multi-Dimension Filtering**: Filter by sentiment (Positive, Neutral, Negative) and star rating (1 to 5 stars).
- **Instant Search**: Search through customer names or review text.
- **Flexible Sorting**: Sort by newest, oldest, highest rating, or lowest rating.
- **Expandable Comments**: Read full feedback with expand/collapse toggle.
- **CSV Data Export**: One-click download of filtered reviews formatted with date, customer, rating, sentiment, and comments.

### 5. Server-Side AI Intelligence (`/analysis`)
- **Configurable Multi-Provider Engine**: Supports **OpenAI** (`gpt-4o-mini`), **Anthropic** (`claude-3-haiku`), or **Google Gemini** (`gemini-1.5-flash`).
- **100% Genuine AI Execution**: No fake or simulated AI data. When API keys are not configured, the system provides a clear status notice with exact configuration steps.
- **Structured Intelligence Extraction**:
  - Executive sentiment summary.
  - Frequently mentioned topics with mention counts and sentiment tags.
  - What customers love (strengths and delights).
  - Recurring complaints and service friction points.
  - Actionable business recommendations.
- **Analysis Snapshots**: Historical log of past AI analyses saved in PostgreSQL.

### 6. Performance Reports (`/reports`)
- **Custom Date Ranges**: Flexible start and end date pickers with quick presets (7, 30, and 90 days).
- **Time Aggregations**: Group reviews by Daily, Weekly, or Monthly intervals.
- **Stacked Sentiment Evolution**: Visualizes positive, neutral, and critical feedback distribution over time.
- **Report CSV Export**: Export date-filtered metrics and reviews for executive reporting.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict type safety)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with a clean white/light slate background and tasteful indigo accent scheme
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **QR Generation**: [qrcode](https://www.npmjs.com/package/qrcode)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security and SSR cookie sessions)

---

## 📁 Project Structure

```
feedback360-new/
├── public/                 # Static assets
├── supabase/
│   └── schema.sql          # Complete PostgreSQL schema with RLS and triggers
├── src/
│   ├── app/
│   │   ├── (auth)/         # Public auth routes (login, signup, reset-password)
│   │   ├── (dashboard)/    # Protected SaaS dashboard
│   │   │   ├── dashboard/  # Analytics dashboard
│   │   │   ├── collect/    # Review link, QR code, and business profile
│   │   │   ├── reviews/    # Reviews list, filtering, search & export
│   │   │   ├── analysis/   # AI review intelligence & recommendations
│   │   │   ├── reports/    # Date-range reports & sentiment evolution
│   │   │   └── layout.tsx  # Auth guard & business context provider
│   │   ├── api/
│   │   │   ├── reviews/    # Public endpoint for review submissions & sentiment
│   │   │   └── analyze/    # Authenticated server-side AI analysis
│   │   ├── auth/callback/  # Supabase email confirmation code exchange
│   │   ├── r/[slug]/       # Public customer review submission page
│   │   ├── layout.tsx      # Root HTML layout with Inter font
│   │   └── page.tsx        # Root router (redirects to /dashboard or /login)
│   ├── components/
│   │   ├── charts/         # Recharts components (Trend, Sentiment, Rating)
│   │   ├── dashboard/      # KPI cards, review items
│   │   ├── layout/         # Sidebar, topbar, dashboard shell
│   │   ├── reviews/        # Customer review submission form
│   │   └── ui/             # Reusable UI primitives (Button, Card, Badge, Input, etc.)
│   ├── lib/
│   │   ├── ai/
│   │   │   └── provider.ts # Server-side AI provider (OpenAI / Anthropic / Google)
│   │   ├── hooks/
│   │   │   └── use-business.tsx # React context for active business
│   │   ├── supabase/       # SSR browser, server, and middleware clients
│   │   ├── types.ts        # TypeScript schemas & entity models
│   │   └── utils.ts        # Utility helpers, slug generator, CSV exporter
│   └── middleware.ts       # Route protection and session refresh middleware
├── .env.example            # Environment variables template
├── next.config.ts          # Turbopack Next.js configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A free [Supabase](https://supabase.com/) project
- An API key for your preferred AI provider (OpenAI, Anthropic, or Google AI) — *optional for core review collection*

### 2. Installation
Navigate into the project directory and install dependencies:

```bash
cd feedback360-new
npm install
```

### 3. Database Setup (Supabase)
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open the file `supabase/schema.sql` located in this project.
3. Paste the entire SQL content and run it.

This script sets up:
- `profiles`: User accounts linked to Supabase Auth with auto-provisioning triggers.
- `businesses`: Businesses owned by users with unique public slugs.
- `reviews`: Customer reviews with ratings (1-5), comments, and sentiments.
- `analysis_results`: Historical AI analysis snapshots stored as structured JSONB.
- **Row Level Security (RLS)**: Enforces strict data ownership — business owners can only read/manage their own business data, while customers can safely submit reviews without accessing private tables.

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# Supabase (Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# AI Provider Configuration (Choose one: openai, anthropic, or google)
AI_PROVIDER=openai
AI_API_KEY=sk-proj-your-actual-api-key-here
AI_MODEL=gpt-4o-mini

# Base URL for public links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Supported AI Providers:
| Provider | `AI_PROVIDER` | Default `AI_MODEL` | Where to get Key |
| :--- | :--- | :--- | :--- |
| **OpenAI** | `openai` | `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com) |
| **Anthropic** | `anthropic` | `claude-3-haiku-20240307` | [console.anthropic.com](https://console.anthropic.com) |
| **Google Gemini** | `google` | `gemini-1.5-flash` | [aistudio.google.com](https://aistudio.google.com) |

> ℹ️ **Notice**: If `AI_API_KEY` is omitted, the app will continue to run and collect reviews normally, using rule-based sentiment classification. The AI Analysis page will clearly indicate that AI is unconfigured and instruct you on how to activate it.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing User Flows

1. **Sign Up & Account Setup**:
   - Navigate to `/signup`.
   - Enter your name, email, and password.
   - Upon logging in, a default business ("My Business") is automatically provisioned for you.

2. **Customize Your Business & Grab Review Link**:
   - Go to **Collect** (`/collect`).
   - Update your business name and description, then click **Save Changes**.
   - Copy your public review URL or click **Download High-Res PNG** to save your QR code.

3. **Submit a Customer Review**:
   - Open your review link (e.g., `/r/my-business-xxxxxx`) in an incognito window or on your mobile device.
   - Select a 1-5 star rating, enter feedback, and submit.
   - Observe the instant confirmation screen.

4. **Review Analytics & Management**:
   - Return to your dashboard at `/dashboard` to see your new metrics, trends, and review items.
   - Visit `/reviews` to test searching, star-filtering, sentiment-filtering, and CSV export.
   - Visit `/reports` to test custom date ranges, daily/weekly/monthly aggregations, and sentiment evolution charts.

5. **AI Review Intelligence**:
   - Navigate to `/analysis`.
   - Click **Run AI Analysis** to synthesize common customer themes, recurring complaints, strengths, and actionable recommendations.

---

## 🚢 Production Build & Deployment

To verify and produce a production build locally:

```bash
npm run build
npm run start
```

### Deploying to Vercel
1. Push `feedback360-new` to GitHub, GitLab, or Bitbucket.
2. Import the project into [Vercel](https://vercel.com/).
3. Add the environment variables from `.env.local` into the Vercel Project Settings.
4. Deploy!
