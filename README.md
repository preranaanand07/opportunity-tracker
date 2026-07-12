# OpportunityTracker — Prototype

A working slice of Module 1 (Opportunity Tracker) from the OpportunityTracker plan:
a dynamic dashboard backed by a real API, with progressive-reminder deadlines,
add/edit/delete, and a live countdown to your nearest deadline.

This is a **zero-dependency** Node.js app — no `npm install` required to run it,
no external services to configure. That makes it trivial to deploy anywhere Node
runs, and easy to read end-to-end before you decide what to swap in for scale.

## Run it locally

```bash
node server.js
```

Then open **http://localhost:3000**. That's it — no build step, no `.env` needed
for the prototype.

(`PORT` env var is respected if you need a different port, e.g. `PORT=8080 node server.js`.)

## What's actually here

```
server.js         → REST API + static file server (pure Node http/fs, no Express)
data.json          → your data, stored as JSON (see "swapping storage" below)
public/
  index.html       → dashboard shell
  style.css        → design system
  app.js           → fetches the API, renders the countdown + cards, handles the modal
```

### API

| Method | Route                     | Does                          |
|--------|----------------------------|--------------------------------|
| GET    | `/api/opportunities`       | List all, sorted by deadline  |
| POST   | `/api/opportunities`       | Create one                    |
| PUT    | `/api/opportunities/:id`   | Replace fields                |
| PATCH  | `/api/opportunities/:id`   | Partial update (e.g. status)  |
| DELETE | `/api/opportunities/:id`   | Delete                        |
| GET    | `/api/health`              | Liveness check                |

Opportunity shape:

```json
{
  "id": "uuid",
  "name": "SDE Intern — Example Corp",
  "type": "Job",
  "deadline": "2026-07-20T18:30:00.000Z",
  "notes": "Referral from Priya",
  "remindBefore": [168, 48, 24, 3, 0.5],
  "status": "active"
}
```

## What's deliberately simplified vs. the full tech-stack doc

This is scoped as a **prototype you can deploy and click through today**, not the
final architecture. Specifically:

- **Storage is a JSON file, not Postgres.** All reads/writes go through a small
  set of functions at the top of `server.js` (`readDb`, `createOpportunity`, etc.).
  When you're ready for Postgres + Prisma, swap just that block — the API routes
  and frontend don't need to change.
- **No actual reminder delivery yet** (email/push). The countdown and urgency
  color-coding are live and real; wiring `remindBefore` to Resend/FCM per the
  tech-stack doc is the natural next slice — the data model already stores the
  reminder offsets, it just isn't firing them.
- **No browser extension / keyword detection yet.** This is the dashboard +
  backend that the extension would eventually POST into. You can already log
  opportunities manually to use it today.
- **No auth.** Single-user prototype. Add Clerk/Firebase before sharing this
  with more than one person, since right now anyone with the URL can read/write
  all data.

## Deploying it

Because it's plain Node with no build step, any of these work with almost no config:

### Render / Railway (recommended — matches your tech-stack doc)
1. Push this folder to a GitHub repo.
2. Create a new **Web Service**, connect the repo.
3. Build command: *(leave blank — nothing to build)*
4. Start command: `node server.js`
5. Done. Render/Railway sets `PORT` automatically; the app already reads it.

**One caveat:** the JSON file store writes to the local filesystem. Render and
Railway's filesystems are ephemeral on redeploy — fine for demoing, but you'll
lose data on redeploy until you move to Postgres. If you want persistence sooner
without a full Postgres migration, both platforms offer a small persistent disk
you can mount and point `DB_FILE` at.

### Fly.io
Same idea — `fly launch`, no Dockerfile needed if you accept its Node buildpack,
start command `node server.js`.

### Any VPS
```bash
git clone <your repo>
cd opportunity-tracker
node server.js   # or run it under pm2 / systemd for restarts
```

## Next slice to build

Given reminders were flagged as the top priority: wire `remindBefore` to an
actual scheduler (node-cron polling `data.json` every minute is enough to
prototype the *feel* of progressive reminders before introducing Bull + Redis).
