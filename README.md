# MTS Backend

Express + Prisma backend for MTS vendor, agent, user, admin, booking, reel, payout, and OTP APIs.

## Requirements

- Node.js 20 or newer
- PostgreSQL
- npm

## Environment

Create a `.env` file on the server from `.env.example`:

```bash
cp .env.example .env
```

Required values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
PORT=3000
NODE_ENV=production
JWT_SECRET="replace-with-a-strong-secret"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Do not commit `.env`. It is intentionally ignored.

## Deploy

From the backend project directory:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm start
```

The API health check is available at:

```text
GET /health
```

Expected response:

```json
{
  "status": "UP",
  "timestamp": "2026-05-02T00:00:00.000Z"
}
```

## Production With PM2

```bash
npm install -g pm2
pm2 start src/index.js --name mts-backend
pm2 save
pm2 startup
```

Useful commands:

```bash
pm2 logs mts-backend
pm2 restart mts-backend
pm2 status
```

## Self-Registration Flow

- `POST /api/auth/register-agent` creates a new agent with `approval_status: "pending"`.
- `POST /api/agents/register` is a public alias for agent self-registration.
- Pending agents can log in and view their status.
- Pending or rejected agent referral codes cannot onboard vendors.
- Admin must approve an agent using `PATCH /api/admin/agents/:id/status`.
- `POST /api/auth/register-vendor` works without `agent_code`; those vendors stay pending for admin review.

## Redeploy Checklist

1. Pull latest code.
2. Confirm `.env` exists on the server.
3. Run `npm install`.
4. Run `npx prisma migrate deploy`.
5. Run `npx prisma generate`.
6. Restart the Node process or PM2 app.
7. Open `/health`.
