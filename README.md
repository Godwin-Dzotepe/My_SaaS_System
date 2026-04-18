# My School SaaS — FutureLink

A multi-tenant school management SaaS built with Next.js 16, Prisma, and MySQL. Supports super admins, school admins, teachers, secretaries, parents, and finance admins.

---

## Requirements

- **Node.js** v18 or higher
- **MySQL** 8.0+ (or MariaDB 10.6+)
- **npm** v9+
- **PM2** (for persistent production deployment)

---

## 1. Clone the Repository

```bash
git clone https://github.com/Godwin-Dzotepe/My_SaaS_System.git
cd My_SaaS_System
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env   # if .env.example exists, otherwise create manually
```

Then fill in the values:

```env
# Database (MySQL)
DATABASE_URL="mysql://root:your_password@localhost:3306/school_management_mysql"

# Auth
JWT_SECRET="a_very_secure_random_secret_change_this"

# App URL
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Prisma engine (use "binary" for most servers)
PRISMA_CLIENT_ENGINE_TYPE="binary"

# ── SMS (Lead Notifications) ──────────────────────────────
LEADS_NOTIFICATION_SMS=+233240000000
SMS_API_KEY=your_sms_api_key
SMS_USERNAME=YourAppName
SMS_DEFAULT_COUNTRY_CODE=233

# ── AI (Gemini or OpenAI-compatible) ─────────────────────
AI_API_KEY=your_ai_api_key
AI_MODEL=gemini-2.0-flash
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_REPORT_INTERVAL_HOURS=10
AI_CRON_SECRET=your_random_cron_secret
AI_MAX_RETRIES=2
AI_RETRY_BASE_MS=1200
AI_INTER_REPORT_DELAY_MS=900

# ── Telegram ──────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
TELEGRAM_SUPER_ADMIN_CHAT_IDS=comma_separated_chat_ids
TELEGRAM_WEBHOOK_SECRET=your_random_webhook_secret
TELEGRAM_WEBHOOK_BASE_URL=https://your-public-domain
```

> **Note:** Never commit your real `.env` file to git. It is already in `.gitignore`.

---

## 4. Set Up the Database

### 4a. Create the MySQL Database

Log into MySQL and create the database:

```sql
CREATE DATABASE school_management_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4b. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables in your database based on `prisma/schema.prisma`.

For **production** (applies migrations without prompting):

```bash
npx prisma migrate deploy
```

### 4c. Generate the Prisma Client

```bash
npx prisma generate
```

### 4d. (Optional) Seed Initial Data

```bash
node scripts/seed-data.js
```

Or create a super admin manually:

```bash
node scripts/create-super-admin.js
```

---

## 5. Build the Application

```bash
npm run build
```

---

## 6. Run in Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Run in Production with PM2

### 7a. Install PM2 globally

```bash
npm install -g pm2
```

### 7b. Start the app with PM2

```bash
pm2 start npm --name "school-saas" -- start
```

### 7c. Save the PM2 process list (auto-restart on reboot)

```bash
pm2 save
pm2 startup
```

> Run the command that `pm2 startup` outputs to register PM2 as a system service.

### Common PM2 Commands

```bash
pm2 status                  # View running processes
pm2 logs school-saas        # Stream live logs
pm2 restart school-saas     # Restart the app
pm2 stop school-saas        # Stop the app
pm2 delete school-saas      # Remove from PM2
```

---

## 8. Run on a Custom Port

```bash
PORT=3001 pm2 start npm --name "school-saas" -- start
```

Or set `PORT` in your `.env` file:

```env
PORT=3001
```

---

## Full Setup Summary (Quick Reference)

```bash
# 1. Clone & install
git clone https://github.com/Godwin-Dzotepe/My_SaaS_System.git
cd My_SaaS_System
npm install

# 2. Configure environment
cp .env.example .env   # then edit .env with your values

# 3. Database setup
npx prisma migrate deploy
npx prisma generate

# 4. (Optional) Seed data
node scripts/seed-data.js

# 5. Build
npm run build

# 6. Start with PM2
pm2 start npm --name "school-saas" -- start
pm2 save
pm2 startup
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `NEXT_PUBLIC_API_URL` | Yes | Public base URL for API calls |
| `PRISMA_CLIENT_ENGINE_TYPE` | Yes | Set to `binary` for most servers |
| `AI_API_KEY` | For AI features | API key for AI provider (Gemini etc.) |
| `AI_MODEL` | For AI features | Model name e.g. `gemini-2.0-flash` |
| `AI_CRON_SECRET` | For AI cron | Secret to authenticate cron endpoints |
| `TELEGRAM_BOT_TOKEN` | For Telegram | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | For Telegram | Chat/group ID to send reports to |
| `SMS_API_KEY` | For SMS | MNotify/Nmolify API key |
| `LEADS_NOTIFICATION_SMS` | For SMS leads | Phone number to receive lead alerts |

---

## AI & Telegram Features

- Super admin can generate AI school reports via the dashboard or `POST /api/super-admin/ai/report`
- AI assistant appears as a floating icon for super admin and enabled school admins
- To automate reports every 10 hours, schedule a cron call:
  ```
  POST /api/cron/ai/reports
  Header: x-cron-secret: <AI_CRON_SECRET>
  ```
- To register the Telegram webhook:
  ```
  POST /api/telegram/webhook/register
  Header: x-cron-secret: <AI_CRON_SECRET>
  ```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** MySQL 8 via Prisma ORM
- **Auth:** JWT (custom) + 2FA (TOTP)
- **AI:** OpenAI-compatible API (Gemini)
- **Notifications:** Telegram Bot, SMS (MNotify)
- **PDF:** jsPDF + html2canvas
- **UI:** Tailwind CSS v4, Framer Motion, Recharts
- **Process Manager:** PM2
