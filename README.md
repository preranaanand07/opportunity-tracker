# OpportunityTracker

**Never miss a deadline, never walk into an interview unprepared.**

OpportunityTracker is a background agent that detects job/course/competition deadlines as you browse, logs them in seconds, and reminds you at the right time — paired with an ML-powered prep engine that turns a job description into a study schedule and a day-of briefing.

> **Status: 🟡 Early build — core loop working, extension + ML in progress.**
> The dashboard + backend below are live and functional. The browser extension and ML prep engine are the current focus — see [Roadmap](#roadmap) for what's built vs. planned, and [Contributing](#contributing) if you want to help build them.

---

## The problem

- Deadlines get missed because reminders come too late, or never
- Applications, deadlines, and prep material end up scattered across emails, browser tabs, and notes apps
- Zero structured prep time before interviews or assessments — cramming happens, if at all

## The approach — two modules

**1. Opportunity Tracker (background agent)**
Detects deadline-related keywords while you browse ("apply now," "last date," "register"), pops up a lightweight 3-field form, and fires progressive reminders (7 days → 2 days → 1 day → 3 hours → 30 minutes before deadline).

**2. Smart Prep Engine (ML-powered)**
Paste a job description → it extracts key topics, estimates time to prepare each one based on your level, builds a reverse-engineered study schedule from your deadline backward, and generates a quick briefing an hour before your interview.

---

## Current status

| Piece | Status |
|---|---|
| Dashboard (add/edit/delete opportunities, live countdown) | ✅ Working |
| Backend API (REST, persistent storage) | ✅ Working |
| Progressive reminder scheduling | 🚧 In progress |
| Browser extension (keyword detection + popup) | 🚧 In progress |
| JD analyzer (topic extraction via LLM) | 🚧 In progress |
| Reverse prep scheduler | ⏳ Planned |
| Day-of flash brief | ⏳ Planned |
| Auth (multi-user support) | ⏳ Planned |
| Platform-specific scrapers (LinkedIn, Unstop, etc.) | ⏳ Planned |

---

## Tech stack

| Layer | Tech |
|---|---|
| Extension | Chrome (Manifest V3), React + Vite |
| Dashboard | HTML/CSS/JS (moving toward Next.js) |
| Backend | Node.js |
| Database | Postgres + Prisma (currently JSON file in prototype) |
| ML | OpenAI GPT-4o, spaCy for lightweight NER |
| Notifications | Resend (email), Chrome Notifications API |
| Hosting | Render |

Full architecture and tech decisions are in [`/docs`](./docs) *(coming soon)*.

---

## Getting started

```bash
git clone https://github.com/preranaanand07/opportunity-tracker.git
cd opportunity-tracker
node server.js
```

Then open **http://localhost:3000**. No `npm install` required for the current backend — it's dependency-free by design while the core loop stabilizes.

---

## Roadmap

**Phase 1 — Core loop** *(current focus)*
- [x] Dashboard: log, edit, delete opportunities
- [x] Live countdown + urgency indicators
- [ ] Reminders actually firing (email)
- [ ] Browser extension: keyword detection + popup logging

**Phase 2 — Intelligence**
- [ ] JD paste → topic extraction
- [ ] Time estimation per topic
- [ ] Reverse prep schedule generation

**Phase 3 — Polish**
- [ ] Platform-specific detection (LinkedIn, Internshala, Unstop)
- [ ] Day-of flash brief
- [ ] Mobile push notifications
- [ ] Progress tracking on prep

**Phase 4 — Advanced**
- [ ] Learns your patterns (roles you apply to most)
- [ ] Auto-suggested prep resources
- [ ] Calendar sync
- [ ] Team/friend prep mode

---

## Contributing

This project is actively looking for contributors, especially on:
- 🧩 **Browser extension** (Manifest V3, content scripts, MutationObserver-based detection)
- 🤖 **ML/prompt engineering** (topic extraction, prep scheduling logic)
- 🎨 **Frontend** (dashboard polish, Next.js migration)

Check [open issues](../../issues) — issues tagged `good first issue` are a good starting point. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) *(coming soon)* for setup details and PR guidelines.

Not sure where to start? Open an issue or start a discussion — happy to point you at something matching what you're interested in.

---

## License

MIT — see [`LICENSE`](./LICENSE).
