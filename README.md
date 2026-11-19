# Platform Payments Quest RPG

An interactive RPG-style training tool for Stripe AEs learning platform payments monetization.

## Quick Deploy to Vercel

### Option A: Via GitHub (Recommended)

1. **Create a new GitHub repo:**
   ```bash
   # In this project folder:
   git init
   git add .
   git commit -m "Platform Payments Quest RPG v11"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/platform-payments-quest.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Framework preset: **Vite**
   - Click **Deploy**
   - Done! You'll get a URL like `platform-payments-quest.vercel.app`

### Option B: Via Vercel CLI

```bash
npm install -g vercel
cd platform-payments-quest
npm install
vercel
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
├── App.tsx                      # Main game controller (journey + pricing badges, chapter flow)
├── main.tsx                     # React entry point
├── types.ts                     # All TypeScript interfaces
├── theme.ts                     # Colors, styles, CSS
├── components/
│   └── index.tsx                # All UI components (JourneySpine, DiscoveryList, dice, debrief)
├── data/
│   ├── constants.ts             # Journey, pricing models, discovery topics, allies, boons, platforms, chapters
│   ├── campaigns.ts             # v11 campaign order: new encounters + patched v10 encounters
│   ├── encounters-fitness.ts    # Base v10 FitStack encounters (patched in campaigns.ts)
│   ├── encounters-property.ts   # Base v10 RentFlow encounters
│   └── encounters-restaurant.ts # Base v10 OrderOS encounters
└── game/
    ├── gameLogic.ts             # Init, dice + discovery modifiers, journey, scoring
    ├── resolveChoice.ts         # Encounter ordering + v10 outcomes for unchanged encounters
    └── resolveV11.ts            # Outcomes for all new / redesigned v11 encounters
sim/
├── simulate.ts                  # Headless playthrough simulator (good / no-discovery / random)
└── sweep.ts                     # Legacy-term sweep (SMP, SaaS 1.0-3.0, Training Grounds...)
```

Run the simulator (optional): `npx tsx sim/simulate.ts`

## The Stripe Journey

**Launch → Facilitate → Monetize → Grow → Retain.** Pricing models (Subscription, Rev Share, Rev Share 2.0,
Buy Rate, Segmented, IC++) are levers *inside* Monetize and are shown separately from the journey phase.

| Platform | Starts at | Chapters | Story |
|---|---|---|---|
| 🏋️ FitStack | Launch | 7 | The Attach Win: discovery → attach campaign → Radar/SMR → Objective 4 → Adyen → renewal |
| 🏠 RentFlow | Monetize (Rev Share 2.0) | 6 | The Crossroads: debit/ACH economics → MSAP → Vault of Deposits (Obj 4) → The Adyen Gambit |
| 🍕 OrderOS | Monetize (blended buy rate) | 5 | The Empire: Platform Pricing Tool → allies → Radar Plus/Pro vs SMR → Terminal → Obj 4 → raid |

## Features

- **Discovery drives the dice:** 6 discovery topics (attach, economics, risk, merchant needs/Objective 4, competition,
  exec priorities). Each uncovered topic a roll depends on gives **+2**; each missing one is a **−2 Guessing** penalty.
  Discovery also reveals hidden signals 🔍 and unlocks hidden choices.
- **Allies:** SA (always), TAM, ProServ, Implementation Partner, Stripe Partner Ecosystem (SPE). Earn the **MSAP**
  (Mutual Success & Activation Plan) boon to protect activation, defense, and renewal.
- **Risk:** Radar Standard → Plus → Pro, or Stripe Managed Risk (SMR). The right answer depends on discovery, not maturity.
- **Objective 4:** monetize outside payments with Capital, Financial Accounts/Treasury, and Issuing.
- **Competitive defense:** Adyen appears on every platform; total-value narratives backed by discovery win.
- Signal Panel (🟢/🟡/🚩), d20 dice, Roads Not Taken counterfactuals, archetypes, letter grades.
- Score = revenue + relationship health, with bonuses for discovery (+4% per topic) and journey reached
  (Grow +7%, Retain +15%), minus mistakes (−8% each, capped).

See `CHANGELOG.md` for v11 changes.
