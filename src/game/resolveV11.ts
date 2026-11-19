import { GameState, ChoiceOutcome, CounterfactualSet, Encounter } from '../types';

/* ============================================================================
 * v11 outcome resolver. Handles every NEW or REPLACED encounter.
 * Returns null to fall through to the v10 resolver for unchanged encounters
 * (and for unchanged choice indices on lightly patched encounters).
 * ========================================================================== */

type Result = { outcome: ChoiceOutcome; counterfactuals: CounterfactualSet };
type Ext = Partial<ChoiceOutcome>;

function O(msg: string, learn: string, rev: number, stats: ChoiceOutcome['stats'], ext: Ext = {}): ChoiceOutcome {
  return { msg, learn, rev, stats, ...ext };
}

/** Renewal multiplier: rewards the behaviors v11 teaches. Returns [multiplier, explanation]. */
function renewalBoost(gs: GameState): [number, string] {
  const parts: [string, number][] = [];
  const f = (x: string) => gs.flags.includes(x);
  if (f('value_case')) parts.push(['value case built', 0.2]);
  if (gs.boons.includes('msap')) parts.push(['MSAP in place', 0.1]);
  if (f('attach_win')) parts.push(['attach win', 0.15]);
  if ((gs.journey || 0) >= 4) parts.push(['Objective 4 live', 0.15]);
  if (f('defended')) parts.push(['competitor defeated', 0.1]);
  if (f('dual_process')) parts.push(['volume lost to a rival', -0.25]);
  if (f('churned_partial')) parts.push(['partial churn', -0.3]);
  const m = parts.reduce((s, p) => s + p[1], 1);
  const txt = parts.length ? ' Renewal modifiers: ' + parts.map(p => p[0] + ' ' + (p[1] > 0 ? '+' : '') + Math.round(p[1] * 100) + '%').join(', ') + '.' : '';
  return [Math.max(0.4, m), txt];
}

export function resolveV11(gs: GameState, enc: Encounter, i: number, ok: boolean, rv: (r: number) => number): Result | null {
  const cf: CounterfactualSet = {};
  const has = (x: string) => gs.flags.includes(x);
  const hasB = (x: string) => gs.boons.includes(x);
  const R = (o: ChoiceOutcome): Result => ({ outcome: o, counterfactuals: cf });

  switch (enc.id) {
    /* ---------------------------- DISCOVERY PREP (all platforms) ---------------------------- */
    case 'f_scout': case 'p_scout': case 'r_scout': {
      cf[0] = 'Economics prep: you\'d walk in fluent in the payment mix \u2014 and +2 on every roll that depends on payments economics.';
      cf[1] = 'Court mapping: you\'d know what each executive is measured on \u2014 and +2 on executive rolls.';
      cf[2] = 'Rival scouting: you\'d know who else is pitching \u2014 and +2 when the competitor shows up.';
      if (i === 0) return R(O('You arrive fluent in the payment mix and interchange economics. Every pricing conversation ahead starts from facts.', 'Preparation turns a pitch into a diagnosis. Discovery flag uncovered: Payments Economics (+2 on dependent rolls).', 0, { techCred: 12, productMastery: 10 }, { addFlag: 'disc_economics' }));
      if (i === 1) return R(O('You know who decides, who influences, and what each executive is measured on.', 'Stakeholder mapping is discovery too. Discovery flag uncovered: Exec Priorities (+2 on dependent rolls).', 0, { execAccess: 12, trust: 6 }, { addFlag: 'disc_exec' }));
      return R(O('You know which rivals are circling and what they\'re offering.', 'Know the rival before the rival knows you. Discovery flag uncovered: Competitive Landscape (+2 when the competitor appears).', 0, { productMastery: 8, techCred: 4 }, { addFlag: 'disc_competition' }));
    }

    /* ------------------------------------- FITSTACK ------------------------------------- */
    case 'f_attach_q':
      cf[0] = 'The attach question reveals FitStack\'s real starting line: almost no gyms process on-platform.';
      cf[1] = 'Merchant-pain discovery maps future Capital, Instant Payouts, and Radar plays.';
      cf[2] = 'Pitching buy rate first wins the CEO\'s smile and loses the discovery window.';
      if (i === 0) return R(O('Silence. Then the CFO: "Honestly? Almost none. Gyms use six different processors. We\'ve never measured whether they\'d switch." You\'ve found the real starting line: payments attach.', 'Payments attach rate is the first number to discover on any platform deal. Monetization math is meaningless until you know how much volume will actually flow through the platform.', 0, { trust: 8, productMastery: 6 }, { addFlag: 'disc_attach' }));
      if (i === 1) return R(O('Cash flow between membership cycles, failed recurring payments, and chargebacks from members who "forgot to cancel." You\'ve just mapped future Capital, Instant Payouts, and Radar plays.', 'Merchant-pain discovery uncovers Objective 4 and risk opportunities the platform hasn\'t put into words yet.', 0, { trust: 10, productMastery: 4 }, { addFlag: 'disc_obj4,disc_risk' }));
      return R(O('The CEO loves the buy rate vision. The CFO checks out. You leave with enthusiasm and no facts.', 'Answering the question the customer asked isn\'t discovery. Redirect to the problem before presenting a solution.', 0, { execAccess: 3, productMastery: 3, trust: -6 }, { mistake: 'Pitched buy rate before discovery' }));

    case 'f_council':
      cf[0] = 'A facilitated workshop with your SA can uncover economics, risk, and attach in one session.';
      cf[1] = 'A questionnaire gets you facts on paper, but not the "why" behind them.';
      cf[2] = 'A demo in a discovery slot shows products before you understand problems.';
      if (i === 0) {
        if (ok) return R(O('The workshop lands. The CTO admits there\'s no payments owner, the CFO shares the dispute numbers, and the CEO finally says what the board measures: retention and ARR. Your SA earns instant credibility.', 'Structured, multi-stakeholder discovery is the highest-leverage meeting in the cycle. Discovery flags uncovered: Economics, Risk Profile, Attach.', 0, { trust: 8, techCred: 6, execAccess: 6 }, { addFlag: 'disc_economics,disc_risk,disc_attach', unlockBoon: 'sa_rapport' }));
        return R(O('The CTO dominates the session with integration questions. You still learn the critical gap: no payments team and no P&L owner.', 'Even imperfect discovery beats none. Discovery flag uncovered: Payments Economics.', 0, { trust: 3, techCred: 4 }, { addFlag: 'disc_economics' }));
      }
      if (i === 1) return R(O('The questionnaire comes back with useful facts on team and readiness. Some answers are vague.', 'Async discovery is efficient but shallow. Discovery flag uncovered: Payments Economics.', 0, { trust: 4, productMastery: 3 }, { addFlag: 'disc_economics' }));
      return R(O('The demo is slick. The executives nod politely and leave early. You learned nothing new.', 'A demo in a discovery slot is a missed opportunity. Every roll ahead that needed these facts will be a guess.', 0, { productMastery: 4, execAccess: -5 }, { mistake: 'Skipped executive discovery for a demo' }));

    case 'f_decree':
      if (i !== 3) return null;
      cf[3] = 'Partner gateway: payments embedded with zero pricing risk \u2014 and zero payments revenue.';
      return R(O('Gyms can now bring their own gateway through a partner integration. Payments live inside FitStack \u2014 but FitStack earns nothing on it. A partner guild joins your cause.', 'Facilitate is a legitimate step on the journey: it gets payments into the product. But it monetizes nothing. Use it as a bridge to Monetize, not a destination.', rv(10000), { trust: 5, execAccess: -3 }, { advanceJourney: 1, addFlag: 'facilitate_only', unlockCompanion: 'partner' }));

    case 'f_convert':
      cf[0] = 'Standard Connect rev share turns on revenue with zero pricing risk.';
      cf[1] = 'Staying on the partner gateway leaves $12M of volume unmonetized.';
      cf[2] = 'Jumping to buy rate from Facilitate skips every readiness step.';
      if (i === 0) return R(O('Standard Connect rev share live. Same embedded experience, now with revenue.', 'Facilitate \u2192 Monetize is the natural next step once payments are embedded. Rev share monetizes with zero pricing risk.', rv(45000), { trust: 8, productMastery: 5 }, { advanceStage: 1, advanceJourney: 2 }));
      if (i === 1) return R(O('The gateway hums along. FitStack still earns nothing on payments. The CFO stops asking you to meetings.', 'Facilitation without monetization leaves the platform\'s biggest revenue line on the table.', 0, { execAccess: -8, trust: -3 }, { mistake: 'Left the platform in Facilitate with no payments revenue' }));
      return R(O('Buy rate with no team, no cost model, and a debit-heavy mix. Losses start within 60 days.', 'Skipping from Facilitate to buy rate is the fastest route to a margin crisis.', rv(-30000), { trust: -15, techCred: -8 }, { advanceStage: 2, advanceJourney: 2, addFlag: 'on_buyrate,premature_buyrate', mistake: 'Jumped from partner gateway straight to buy rate' }));

    case 'f_msap': case 'p_msap': case 'r_msap': {
      cf[0] = 'Co-built MSAP + ProServ: shared owners and dates, with a builder team de-risking the launch.';
      cf[1] = 'A solo MSAP gives you structure, but less customer ownership.';
      cf[2] = 'No plan: signed deals stall before revenue activates.';
      if (i === 0) return R(O('The customer co-owns every milestone. ProServ joins to de-risk the build. Go-live dates are real now.', 'An MSAP (Mutual Success & Activation Plan) aligns both sides on owners, milestones, and dates. Co-building it creates customer ownership; ProServ de-risks complex launches. Pact of Mutual Success: +2 on activation, defend, and renewal rolls.', rv(20000), { trust: 8, techCred: 6 }, { unlockBoon: 'msap', unlockCompanion: 'proserv' }));
      if (i === 1) return R(O('Your MSAP is thorough. The customer skims it and says "looks great."', 'A plan the customer didn\'t help write is a plan they don\'t own \u2014 but it\'s far better than none.', rv(10000), { trust: 4, productMastery: 3 }, { unlockBoon: 'msap' }));
      return R(O('Three months later, activation is a fraction of plan. The revenue you forecast is still "pending go-live."', 'Signed is not live. Without an activation plan, revenue slips and trust erodes.', -15000, { trust: -6, execAccess: -3 }, { mistake: 'No activation plan after signature' }));
    }

    case 'f_attach_campaign':
      cf[0] = 'SPE growth workshop + embedded onboarding: the fastest way to lift payments attach.';
      cf[1] = 'Fee waivers buy short-term attach that often churns back.';
      cf[2] = 'Mandating payments without onboarding drives gym owners to leave.';
      if (i === 0) {
        if (ok) return R(O('Attach climbs from ~15% to 58% in two quarters. The SPE growth workshop gives FitStack a merchant-facing playbook, and embedded onboarding makes switching painless. The board calls it "the payments win."', 'Payments attach is the key win for SaaS platforms. SPE growth workshops, embedded onboarding, and a clear merchant value proposition move attach faster than any pricing change.', rv(90000), { trust: 8, productMastery: 8, execAccess: 4 }, { unlockCompanion: 'spe', addFlag: 'attach_win', advanceJourney: 3 }));
        return R(O('Attach rises to 32%. The workshop helps, but onboarding friction slows gym owners down.', 'Attach campaigns need both a value proposition and a frictionless switching path.', rv(40000), { trust: 3, productMastery: 4 }, { unlockCompanion: 'spe', advanceJourney: 3 }));
      }
      if (i === 1) return R(O('Fee waivers spike attach to 35% \u2014 and a third of those gyms drift back when the waiver ends.', 'Incentives buy short-term attach. Without onboarding and value, the volume doesn\'t stick.', rv(35000), { trust: 4 }, { advanceJourney: 3 }));
      return R(O('Gym owners revolt. 120 locations cancel FitStack entirely rather than switch processors.', 'Mandates can work at renewal with a strong value proposition \u2014 forcing them without onboarding drives churn.', -20000, { trust: -12, execAccess: -4 }, { mistake: 'Forced a payments mandate on SMB merchants' }));

    case 'f_risk':
      cf[0] = 'Radar Plus: custom rules and dynamic thresholds \u2014 works if someone at FitStack owns the rules.';
      cf[1] = 'Stripe Managed Risk: Stripe owns decisioning and liability. Ideal when the platform has no risk team.';
      cf[2] = 'Radar Pro: account- and customer-abuse prevention. Powerful, but FitStack\'s problem is transaction disputes.';
      cf[3] = 'Staying on Standard while disputes escalate invites network monitoring programs.';
      if (i === 0) {
        if (ok) return R(O('Radar Plus rules tuned with your SA and TAM. Card testing blocked, "forgot to cancel" disputes down 40%.', 'Radar Plus fits platforms that want control \u2014 custom rules and dynamic thresholds \u2014 and can manage account risk themselves.', rv(30000), { techCred: 8, trust: 5 }, { unlockBoon: 'fraud_shield', advanceJourney: 3 }));
        return R(O('Radar Plus is live, but nobody at FitStack owns the rules. Disputes dip, then creep back.', 'Plus needs an owner. Without a risk team, Managed Risk is often the better fit.', rv(10000), { techCred: 3 }, { unlockBoon: 'fraud_shield', advanceJourney: 3 }));
      }
      if (i === 1) return R(O('Stripe Managed Risk live. Stripe takes on decisioning and liability for FitStack\'s gyms. Dispute losses stop being FitStack\'s problem.', 'SMR is a strategic choice, not a maturity reward: Stripe takes decisioning and liability for a higher fee. For a platform with zero risk headcount, it\'s often the right trade.', rv(40000), { trust: 10, execAccess: 4 }, { unlockBoon: 'smr_aegis', addFlag: 'managed_risk', advanceJourney: 3 }));
      if (i === 2) return R(O('Radar Pro is live. Its account-abuse features go mostly unused \u2014 gyms don\'t face signup abuse.', 'Radar Pro adds account- and customer-abuse prevention (signup, free-trial, bot abuse). Match the plan to the fraud pattern: FitStack\'s problem was transaction disputes.', rv(15000), { productMastery: 3, trust: -2 }, { unlockBoon: 'fraud_shield', advanceJourney: 3 }));
      return R(O('Disputes keep climbing. Two gyms hit network monitoring thresholds; FitStack takes the blame.', 'Radar Standard is a baseline, not a strategy. When fraud escalates, choose Plus, Pro, or Managed Risk deliberately.', -25000, { trust: -8, techCred: -4 }, { mistake: 'Ignored escalating dispute risk' }));

    case 'f_obj4': case 'r_obj4': {
      const isR = enc.id === 'r_obj4';
      cf[0] = 'Full embedded finance bundle: three new revenue lines that don\'t depend on interchange.';
      cf[1] = 'Capital alone: the easiest Objective 4 entry point, with room to expand.';
      cf[2] = 'Skipping Objective 4 leaves the platform dependent on payments margin alone.';
      if (i === 0) {
        if (ok) return R(O(isR ? 'Capital funds slow seasons, Issuing cards run supplier purchasing, and Financial Accounts hold tips and payroll. OrderOS now earns on money that never touches interchange.' : 'Capital for gym owners, Financial Accounts to hold funds, and Issuing cards for equipment and supplies. FitStack has three new revenue lines.', 'Objective 4 \u2014 monetize outside of payments. Capital, Treasury/Financial Accounts, and Issuing create new revenue lines and make the platform far stickier. Lead with the merchant pain you discovered.', rv(isR ? 200000 : 110000), { productMastery: 10, trust: 8, execAccess: 6 }, { unlockBoon: 'treasury_key', addFlag: 'obj4_bundle', advanceJourney: 4 }));
        return R(O('Only Capital launches this year \u2014 the bundle pitch didn\'t connect to a clear merchant pain.', 'Objective 4 pitches land when they start from the merchant problem, not the product list.', rv(isR ? 80000 : 45000), { productMastery: 4, trust: 3 }, { unlockBoon: 'merchant_loyalty', advanceJourney: 4 }));
      }
      if (i === 1) return R(O(hasB('merchant_loyalty') ? 'Capital expands to more merchants. Solid, incremental revenue.' : 'Capital launches. Zero credit risk for the platform, revenue from day one.', 'Capital is the easiest Objective 4 entry point. Treasury and Issuing are the next step.', rv(isR ? 90000 : 50000), { trust: 5, productMastery: 3 }, { unlockBoon: 'merchant_loyalty', advanceJourney: 4 }));
      return R(O('The board asks again next quarter: "What\'s our next revenue line?" You don\'t have an answer.', 'Platforms that only monetize payments leave retention and valuation upside on the table. Objective 4 is a core part of the journey.', 0, { productMastery: -3, execAccess: -4 }, { mistake: 'Skipped Objective 4: no revenue outside payments' }));
    }

    case 'f_renewal_prep':
      cf[0] = 'A quantified value case \u2014 attach, revenue, products live \u2014 makes renewal a formality.';
      cf[1] = 'A technical health review proves stability, not business value.';
      cf[2] = 'Walking in without a value case invites a price-only negotiation.';
      if (i === 0) {
        if (ok) return R(O('Your war map lands: attach %, payments revenue, products live, and MSAP milestones hit. The CFO forwards it to the board unedited.', 'Quantify value delivered before you ask for anything. Value case built: +20% at renewal.', 0, { execAccess: 10, trust: 8 }, { addFlag: 'value_case' }));
        return R(O('The value case is solid but the numbers have gaps. Still, the board sees the trajectory.', 'Even an imperfect value case beats none. Value case built: +20% at renewal.', 0, { execAccess: 4, trust: 3 }, { addFlag: 'value_case' }));
      }
      if (i === 1) return R(O('Uptime, integration health, and support stats look great. The CFO asks: "And the business impact?"', 'Technical health matters, but renewals are won on business value.', 0, { techCred: 8, trust: 4 }));
      return R(O('The board opens with "Why shouldn\'t we just ask Adyen for a quote?" You don\'t have numbers ready.', 'Without a value case, renewal becomes a price negotiation.', 0, { execAccess: -6 }, { mistake: 'Walked into renewal without a value case' }));

    case 'f_renewal': {
      const [m, txt] = renewalBoost(gs);
      cf[0] = 'Rev Share 2.0 + Objective 4 bundle: the sustainable, sticky outcome for a platform still building payments capability.';
      cf[1] = 'Buy rate + products: the ideal package \u2014 but only when readiness was proven.';
      cf[2] = 'Risk expansion: the new Radar plans plus Managed Risk as an expansion lever.';
      cf[3] = 'Rev share increase only: simple, but leaves the product opportunity on the table.';
      if (i === 0) return R(O('Rev Share 2.0 + Objective 4 bundle signed. FitStack earns on payments AND beyond payments.' + txt, 'For a platform still building payments capability, optimized rev share plus embedded finance often beats a premature buy rate.', Math.round(rv(90000) * m), { trust: 15, productMastery: 10 }));
      if (i === 1) return R(O('Buy rate + product bundle signed. FitStack earned its readiness \u2014 team, P&L owner, and cost model in place.' + txt, 'Buy rate works when readiness is proven, not assumed.', Math.round(rv(110000) * m), { trust: 12, techCred: 10, execAccess: 8 }));
      if (i === 2) return R(O('Risk expansion signed: Radar Plus for most gyms, Pro where account abuse appears, and Managed Risk for the highest-risk segment.' + txt, 'The new Radar plans (Standard \u2192 Plus \u2192 Pro) and Stripe Managed Risk are expansion levers. Position Plus vs. Pro vs. SMR from the risk discovery you did.', Math.round(rv(100000) * m), { trust: 12, techCred: 10, productMastery: 8 }));
      return R(O('Rev share increase signed. Simple. Forgettable.' + txt, 'A rate-only renewal leaves product value on the table.', Math.round(rv(30000) * m), { trust: 3 }, { mistake: 'Rate-only renewal' }));
    }

    /* ------------------------------------- RENTFLOW ------------------------------------- */
    case 'p_ledger':
      cf[0] = 'Real payment-mix data shows the investor\'s 180 bps benchmark doesn\'t apply.';
      cf[1] = 'Property-manager interviews reveal attach gaps and the Objective 4 prize.';
      cf[2] = 'Modeling someone else\'s payment mix is how margin crises start.';
      if (i === 0) return R(O('60% debit, ~40% ACH, under 10% credit. The investor\'s 180 bps benchmark comes from credit-heavy e-commerce. Buy rate spread here would be a fraction of that.', 'Build the economics on the platform\'s own payment mix. Discovery flag uncovered: Payments Economics.', 0, { techCred: 8, productMastery: 6 }, { addFlag: 'disc_economics' }));
      if (i === 1) return R(O('Security deposits sit in a dozen bank accounts. Owner payouts are manual. Maintenance runs on personal cards. And 30% of tenants still pay rent off-platform.', 'Merchant interviews uncover attach gaps and Objective 4 opportunities. Discovery flags uncovered: Merchant Needs, Payments Attach.', 0, { trust: 10, productMastery: 4 }, { addFlag: 'disc_obj4,disc_attach' }));
      return R(O('Your model mirrors the investor\'s deck. It looks great until someone checks the debit mix.', 'Never model a platform on someone else\'s payment mix.', 0, { execAccess: 4, trust: -5 }, { mistake: 'Modeled buy rate on someone else\'s payment mix' }));

    case 'p_council':
      cf[0] = 'A joint session with your SA can surface economics, risk, and the competitive picture at once.';
      cf[1] = 'One sharp question reveals the competitor \u2014 but nothing else.';
      cf[2] = 'Letting the investor define the problem means every roll ahead is a guess.';
      if (i === 0) {
        if (ok) return R(O('The session opens up. The CFO admits Adyen offered a migration incentive; the Head of Ops describes fraud on new-tenant signups; the CTO confirms nobody owns payments.', 'Multi-stakeholder discovery surfaces what no single executive will volunteer. Discovery flags uncovered: Economics, Risk Profile, Competitive Landscape.', 0, { trust: 8, techCred: 5, execAccess: 6 }, { addFlag: 'disc_economics,disc_risk,disc_competition', unlockBoon: 'sa_rapport' }));
        return R(O('The CFO keeps the session high-level. You confirm the readiness gap, but the competitor stays hidden.', 'Partial discovery still beats none. Discovery flag uncovered: Payments Economics.', 0, { trust: 3, techCred: 3 }, { addFlag: 'disc_economics' }));
      }
      if (i === 1) return R(O('"Adyen. They offered a migration incentive." Now you know what you\'re up against.', 'Ask who else is in the deal. Discovery flag uncovered: Competitive Landscape.', 0, { trust: 3, execAccess: 4 }, { addFlag: 'disc_competition' }));
      return R(O('You run with the investor\'s framing. Everyone feels aligned \u2014 on the wrong problem.', 'Letting someone else define the problem is the most expensive discovery shortcut.', 0, { execAccess: 3, trust: -5 }, { mistake: 'Skipped discovery and accepted the investor\'s framing' }));

    case 'p_obj4':
      cf[0] = 'Financial Accounts + Issuing + Capital: revenue on money that never touches card interchange.';
      cf[1] = 'Capital alone: a solid start on Objective 4.';
      cf[2] = 'Squeezing ACH pricing chases pennies while the deposit vault sits untouched.';
      if (i === 0) {
        if (ok) return R(O('Deposits move into Financial Accounts, maintenance runs on Issuing cards, and Capital funds property managers. RentFlow earns on money that never touches card interchange.', 'For debit- and ACH-heavy platforms, Objective 4 is often bigger than buy rate. Monetize outside of payments where the Durbin cap doesn\'t apply.', rv(120000), { productMastery: 10, trust: 8, execAccess: 5 }, { unlockBoon: 'treasury_key', addFlag: 'obj4_bundle', advanceJourney: 4 }));
        return R(O('Financial Accounts launch for deposits, but compliance reviews delay Issuing and Capital.', 'Objective 4 in multi-country platforms needs compliance planning up front.', rv(50000), { productMastery: 4, trust: 3 }, { unlockBoon: 'treasury_key', advanceJourney: 4 }));
      }
      if (i === 1) return R(O('Capital launches for property managers. Revenue from day one, zero credit risk.', 'Capital is a strong Objective 4 entry point. Deposits and spend are the bigger prize.', rv(45000), { trust: 5, productMastery: 3 }, { unlockBoon: 'merchant_loyalty', advanceJourney: 4 }));
      return R(O('ACH pricing nudged up a few cents. Merchants grumble. The deposit vault sits untouched.', 'On a debit/ACH platform, payment-margin optimization has a hard ceiling. Objective 4 doesn\'t.', rv(15000), { trust: -4 }, { mistake: 'Chased thin ACH margin instead of Objective 4' }));

    case 'p_adyen':
      cf[0] = 'Value narrative grounded in discovery: real mix economics, switching cost, and Objective 4 lock-in.';
      cf[1] = 'Partner + ProServ switching-cost analysis: strong defense, but defensive rather than value-led.';
      cf[2] = 'Matching price trains the customer that every renewal is a rate negotiation.';
      cf[3] = 'Dismissing a live competitive threat is how platforms lose volume.';
      if (i === 0) {
        if (ok) return R(O('You walk the CFO through the real math: on RentFlow\'s debit/ACH mix, Adyen\'s spread is thinner than today\'s rev share, and Adyen\'s offer hands RentFlow risk, onboarding, and compliance it isn\'t staffed for. Objective 4 products and the MSAP seal it. RentFlow stays.', 'Defend against Adyen with total value: payment-mix economics, switching cost, Objective 4 products, and the activation plan. Discovery is your weapon \u2014 generic value pitches lose to a migration incentive.', rv(80000), { trust: 12, execAccess: 8, productMastery: 5 }, { addFlag: 'defended' }));
        return R(O('Your narrative is solid but generic. RentFlow moves 30% of volume to Adyen "as a test."', 'Without discovery-backed specifics, value narratives lose to a migration incentive.', -40000, { trust: -4, execAccess: -3 }, { addFlag: 'dual_process' }));
      }
      if (i === 1) return R(O('The Guildmaster and ProServ price the migration: 9 months of engineering and new risk and compliance obligations. The CFO pauses the Adyen evaluation.', 'Switching-cost analysis with partners is a powerful defense. Pair it with a value story to win, not just delay.', rv(30000), { techCred: 6, trust: 5 }, { unlockCompanion: 'partner', addFlag: 'defended_partial' }));
      if (i === 2) return R(O('You match Adyen\'s rate. RentFlow stays \u2014 at a margin that wipes out a year of growth.', 'Never compete on price alone. Matching teaches the customer that every renewal is a rate negotiation.', -60000, { trust: 2, execAccess: -4 }, { mistake: 'Panic-matched competitor pricing' }));
      return R(O('Six weeks later, RentFlow migrates its two largest countries to Adyen.', 'A live competitive threat is never "nothing." Engage early with discovery-backed value.', -120000, { trust: -15, execAccess: -10 }, { addFlag: 'churned_partial', mistake: 'Ignored a live competitive threat' }));

    case 'p_renewal': {
      const [m, txt] = renewalBoost(gs);
      cf[0] = 'Buy rate + dual-rail pricing + Objective 4: the ideal package if RentFlow mastered its payment mix.';
      cf[1] = 'Rev Share 2.0 + Objective 4 suite: often outperforms thin buy rate on a debit-heavy mix.';
      cf[2] = 'Risk expansion: the new Radar plans plus Managed Risk as an expansion lever.';
      cf[3] = 'Rev share increase only: leaves the Objective 4 opportunity on the table.';
      if (i === 0) return R(O('Buy rate with separate card and ACH economics, plus Objective 4 products. RentFlow owns its payments business.' + txt, 'Dual-rail pricing respects the debit/ACH mix; Objective 4 products carry the margin.', Math.round(rv(100000) * m), { trust: 12, techCred: 10, productMastery: 8 }));
      if (i === 1) return R(O('Rev Share 2.0 + Objective 4 suite signed. Stripe manages the card mix; RentFlow earns on deposits, spend, and lending.' + txt, 'On a debit- and ACH-heavy mix, optimized rev share plus Objective 4 often beats buy rate.', Math.round(rv(105000) * m), { trust: 15, productMastery: 10 }));
      if (i === 2) return R(O('Risk expansion signed: Radar Plus across the portfolio and Managed Risk for the properties with the highest fraud exposure.' + txt, 'Platforms usually weigh Radar Plus vs. Pro vs. SMR. Position from the risk discovery you did.', Math.round(rv(95000) * m), { trust: 12, techCred: 10, productMastery: 6 }));
      return R(O('Rev share increase signed. The deposit vault stays untouched.' + txt, 'A rate-only renewal ignores the biggest prize on this platform.', Math.round(rv(30000) * m), { trust: 3 }, { mistake: 'Rate-only renewal' }));
    }

    /* ------------------------------------- ORDEROS ------------------------------------- */
    case 'r_audit':
      cf[0] = 'Shadowing the risk team reveals the real scaling problem.';
      cf[1] = 'Measuring attach reveals how much in-store volume leaks to a legacy acquirer.';
      cf[2] = 'Owner interviews reveal the Objective 4 opportunity.';
      cf[3] = 'Skipping the audit turns 18 months of knowledge into 18 months of assumptions.';
      if (i === 0) return R(O('They\'re manually reviewing 400 disputes a week. No appetite to build more \u2014 the COO wants scale without headcount.', 'See the problem firsthand. Discovery flag uncovered: Risk Profile.', 0, { techCred: 6, trust: 8 }, { addFlag: 'disc_risk' }));
      if (i === 1) return R(O('Online ordering attach is ~85% \u2014 but only 40% of locations run OrderOS payments in-store. The rest use a legacy acquirer at the counter.', 'Attach is per channel. Discovery flag uncovered: Payments Attach.', 0, { productMastery: 8, techCred: 3 }, { addFlag: 'disc_attach' }));
      if (i === 2) return R(O('Slow-season cash crunches, supplier purchasing on personal cards, tip and payroll funds scattered across banks.', 'Merchant pain points to Objective 4. Discovery flag uncovered: Merchant Needs.', 0, { trust: 8, productMastery: 4 }, { addFlag: 'disc_obj4' }));
      return R(O('You skip the audit. The QBR goes fine \u2014 and you miss what changed in the last six months.', 'Account tenure is not discovery. Empires change.', 0, { execAccess: 2, trust: -5 }, { mistake: 'Assumed account knowledge replaces discovery' }));

    case 'r_council':
      cf[0] = 'A facilitated exec session can surface risk, Objective 4, and attach priorities at once.';
      cf[1] = 'One stakes question reveals the risk urgency.';
      cf[2] = 'Presenting before listening wastes the executive slot.';
      if (i === 0) {
        if (ok) return R(O('The executives rank their own priorities: margin repair, risk scale, in-store attach, and new revenue lines. You now know what every roll ahead depends on.', 'Executive-ranked priorities beat your assumptions. Discovery flags uncovered: Risk Profile, Merchant Needs, Payments Attach.', 0, { execAccess: 8, trust: 6, techCred: 4 }, { addFlag: 'disc_risk,disc_obj4,disc_attach', unlockBoon: 'sa_rapport' }));
        return R(O('The meeting runs over on margin repair. You still learn the risk urgency.', 'Partial discovery still pays off. Discovery flag uncovered: Risk Profile.', 0, { execAccess: 3, trust: 3 }, { addFlag: 'disc_risk' }));
      }
      if (i === 1) return R(O('"We hit network monitoring thresholds and lose our biggest groups." The stakes are clear.', 'Stakes questions reveal priority. Discovery flag uncovered: Risk Profile.', 0, { execAccess: 5, trust: 3 }, { addFlag: 'disc_risk' }));
      return R(O('Your roadmap is polished. The COO checks their phone.', 'Listening first earns the right to present.', 0, { productMastery: 3, execAccess: -5 }, { mistake: 'Presented a roadmap instead of running discovery' }));

    case 'r_burden':
      if (i === 1 || i === 2) return null; // unchanged v10 outcomes
      cf[0] = 'Platform Pricing Tool: segmented pricing by tier, payment method, and geography \u2014 no engineering build.';
      cf[1] = 'Card-mix investigation: understand the cost drivers before acting.';
      cf[2] = 'Blanket 20 bps increase: fast margin, but it pushes away your best merchants first.';
      cf[3] = 'Hand-built application fees: full control, two quarters of engineering, and margin bleeding the whole time.';
      if (i === 0) {
        if (ok) return R(O('Card-mix analysis feeds straight into the Platform Pricing Tool: pricing schemes by tier, payment method, and geography, with connected accounts assigned to pricing groups. Live in three weeks. Margin stabilized.', 'The Platform Pricing Tool is a no-code editor for application-fee logic: default and conditional schemes, pricing groups for connected accounts, payments and Instant Payouts. It saves platforms months of engineering. Pricing Forge: +2 on pricing decisions.', rv(150000), { techCred: 10, trust: 8 }, { unlockBoon: 'pricing_forge', addFlag: 'pricing_tool', advanceStage: 2.5 }));
        return R(O('Pricing Tool schemes live for the top tiers; data gaps slow the long tail. Margin partially recovered.', 'Even partial segmentation through the Pricing Tool beats blanket pricing at this scale.', rv(70000), { techCred: 6, productMastery: 5 }, { unlockBoon: 'pricing_forge', addFlag: 'pricing_tool', advanceStage: 2.5 }));
      }
      return R(O('Engineering ships custom application-fee logic two quarters later. Margin bled the entire time.', 'The Platform Pricing Tool exists so platforms don\'t spend months hard-coding application_fee_amount logic.', rv(40000), { techCred: 2, trust: -3 }, { advanceStage: 2.5, mistake: 'Hand-built pricing logic instead of using the Platform Pricing Tool' }));

    case 'r_tam_recruit':
      cf[0] = 'TAM: crisis response and margin monitoring at scale.';
      cf[1] = 'ProServ: the master builders for IC++ statements and billing.';
      cf[2] = 'Implementation Partner: capacity and restaurant-POS expertise.';
      cf[3] = 'Going alone on a $950M transformation is a single point of failure.';
      if (i === 0) return R(O('The TAM joins the cause. Monitoring, escalation paths, and crisis response are in place.', 'A TAM is a relationship-building investment: proactive monitoring and faster crisis response.', 0, { trust: 8, techCred: 6 }, { unlockCompanion: 'tam' }));
      if (i === 1) return R(O('ProServ joins to build IC++ statement generation and reconciliation.', 'ProServ de-risks complex pricing moves and migrations. +3 on big pricing rolls.', 0, { techCred: 10, productMastery: 4 }, { unlockCompanion: 'proserv' }));
      if (i === 2) return R(O('The Guildmaster joins: an SI with restaurant-POS expertise and spare capacity.', 'Implementation partners add capacity and bring partner-sourced opportunities. +2 on integration and defend rolls.', 0, { techCred: 6, trust: 5 }, { unlockCompanion: 'partner' }));
      return R(O('You go it alone. Your instincts sharpen \u2014 and so does your calendar.', 'At $950M, allies aren\'t a luxury. Know when to bring in the TAM, ProServ, partners, or SPE.', 0, { productMastery: 6, techCred: 3 }, { mistake: 'Went it alone on a $950M transformation' }));

    case 'r_fraud':
      cf[0] = 'Radar Plus: custom rules and dynamic thresholds \u2014 but 3 people tuning rules for 45,000 restaurants is a stretch.';
      cf[1] = 'Radar Pro: Plus + account- and customer-abuse prevention \u2014 strong against fake accounts and promo abuse.';
      cf[2] = 'Stripe Managed Risk: Stripe owns decisioning and liability. Frees the risk team entirely.';
      cf[3] = 'More tooling for a drowning 3-person team doesn\'t change the math.';
      if (i === 0) {
        if (ok) return R(O('Radar Plus rules, tuned with your TAM and SA, cut disputes 30%. The risk team breathes \u2014 a little.', 'Radar Plus fits platforms that want control and can staff the rules. At 45,000 merchants, watch whether the team can keep up.', rv(90000), { techCred: 8, trust: 5 }, { unlockBoon: 'fraud_shield', advanceJourney: 3 }));
        return R(O('Rules help, but 3 people can\'t tune them for 45,000 merchants. Disputes plateau.', 'Plus needs ownership and capacity. Consider Managed Risk when the team can\'t scale.', rv(30000), { techCred: 3 }, { unlockBoon: 'fraud_shield', advanceJourney: 3 }));
      }
      if (i === 1) {
        if (ok) return R(O('Radar Pro catches the fake-account rings exploiting online-ordering promos and ghost-kitchen signups. Disputes down 35%.', 'Radar Pro adds account- and customer-abuse prevention on top of Plus \u2014 strong for platforms with signup and promo abuse.', rv(110000), { techCred: 10, productMastery: 5 }, { unlockBoon: 'fraud_shield', addFlag: 'radar_pro', advanceJourney: 3 }));
        return R(O('Radar Pro is live, but the team hasn\'t configured the account-abuse features. Partial impact.', 'Pro is powerful when it\'s configured. Pair it with SA and TAM support.', rv(40000), { techCred: 4 }, { unlockBoon: 'fraud_shield', addFlag: 'radar_pro', advanceJourney: 3 }));
      }
      if (i === 2) return R(O('Stripe Managed Risk live. Stripe owns decisioning and liability for OrderOS\'s connected accounts. The risk team shifts to merchant success.', 'SMR is a strategic choice, not a maturity reward: Stripe takes decisioning and liability for a higher fee. When the platform doesn\'t want to scale a risk operation, it\'s the right answer.', rv(130000), { trust: 10, execAccess: 6 }, { unlockBoon: 'smr_aegis', addFlag: 'managed_risk', advanceJourney: 3 }));
      return R(O('New tooling arrives. The 3-person team is still drowning \u2014 now with more dashboards.', 'Tooling doesn\'t fix a capacity problem. Choose Plus, Pro, or SMR deliberately.', -50000, { trust: 3, techCred: -5 }, { mistake: 'Asked a 3-person team to absorb risk for 45,000 merchants' }));

    case 'r_scale':
      cf[0] = 'Platform-wide Managed Risk: scale without headcount.';
      cf[1] = 'Radar Pro + 5 FTEs: in-house control at $750K/year.';
      cf[2] = 'Next-day settlement alone doesn\'t solve the scaling problem.';
      if (i === 0) {
        const already = has('managed_risk');
        if (ok) return R(O(already ? 'Managed Risk expands from the pilot to the entire platform. Headcount flat, volume up 40%.' : 'Stripe Managed Risk rolls out platform-wide. Headcount flat, volume up 40%. The COO calls it "the smartest hire we never made."', 'At scale, SMR turns risk from a cost center into a Stripe-owned service. A strategic choice for platforms that don\'t want to build a risk operation.', rv(already ? 70000 : 120000), { trust: 12, execAccess: 8 }, { unlockBoon: 'smr_aegis', addFlag: 'managed_risk' }));
        return R(O('The COO hesitates. Managed Risk pilots on 20% of merchants first.', 'Ceding control is a big decision. Pilots build confidence.', rv(40000), { trust: 4 }, { addFlag: 'managed_risk' }));
      }
      if (i === 1) {
        if (ok) return R(O('Radar Pro plus a dedicated 5-person team. In-house control, $750K/year, and it works.', 'Keeping risk in-house is valid with the right Radar plan and the team to run it. Know the cost.', rv(50000), { execAccess: 6, techCred: 6 }, { unlockBoon: 'fraud_shield', addFlag: 'dedicated_ops_team' }));
        return R(O('Hiring stalls at 2 of 5. Radar Pro is under-configured.', 'Hiring plans slip. Factor execution risk into in-house risk strategies.', -20000, { execAccess: -3 }, { unlockBoon: 'fraud_shield', addFlag: 'dedicated_ops_team' }));
      }
      return R(O('Next-day settlement keeps merchants happy for a quarter. The risk queue keeps growing.', 'Treating symptoms leaves the scaling problem unsolved.', rv(10000), { trust: 2, execAccess: -4 }, { mistake: 'Ignored the risk scaling problem' }));

    case 'r_omni':
      cf[0] = 'Terminal consolidation + Instant Payouts: in-store volume onto the platform, plus payout revenue.';
      cf[1] = 'Instant Payouts only: fast revenue, but in-store volume still leaks.';
      cf[2] = 'Leaving in-store to a legacy acquirer forfeits unified commerce.';
      if (i === 0) {
        if (ok) return R(O('Terminal rolls out with the partner\'s installers. In-store attach jumps from 40% to 75%, and Instant Payouts monetize faster cash.', 'For IRL-heavy platforms, Terminal is a front-door Grow product: unified online + in-store data, plus volume that used to leak.', rv(140000), { productMastery: 8, techCred: 6, trust: 5 }, { unlockBoon: 'speed_talisman', addFlag: 'terminal_attach', advanceJourney: 3 }));
        return R(O('Hardware logistics slow the rollout. In-store attach reaches 52%.', 'Terminal rollouts need installation partners and a plan.', rv(50000), { productMastery: 4 }, { unlockBoon: 'speed_talisman', advanceJourney: 3 }));
      }
      if (i === 1) return R(O('Instant Payouts at 1% \u2014 restaurants love same-day cash.', 'Payout monetization is a fast Grow lever.', rv(50000), { trust: 5 }, { unlockBoon: 'speed_talisman', advanceJourney: 3 }));
      return R(O('In-store volume stays with the legacy acquirer. Restaurant groups keep asking for unified reporting.', 'Leaving channel volume off-platform caps growth.', 0, { productMastery: -3 }, { mistake: 'Left in-store volume with a legacy acquirer' }));

    case 'r_raid':
      cf[0] = 'Total-value defense: pricing, risk, and Objective 4 lock-in that a rate lock can\'t match.';
      cf[1] = 'SPE + Partner co-sell: roadmap and switching cost. Strong, but defensive.';
      cf[2] = 'A blanket rate cut hands Adyen the narrative.';
      if (i === 0) {
        if (ok) return R(O('You meet the new VP with the receipts: segmentation and IC++, risk handled, embedded finance live, and an MSAP of milestones hit. Adyen\'s rate lock looks thin next to it. The top 50 stay.', 'Defend with total value, built from discovery. Switching cost lives in pricing tools, risk coverage, and Objective 4 products \u2014 not in the rate.', rv(150000), { trust: 12, execAccess: 10 }, { addFlag: 'defended' }));
        return R(O('The new VP isn\'t convinced. Eight of the top 50 groups move to Adyen.', 'Generic defense loses to a rate lock. Discovery and lock-in products make the difference.', -100000, { trust: -5, execAccess: -5 }, { addFlag: 'dual_process' }));
      }
      if (i === 1) return R(O('The Envoy brings SPE co-sell resources and the partner shows the migration cost. Adyen\'s pitch stalls.', 'SPE co-sell and partner switching-cost analysis are strong defensive plays.', rv(60000), { trust: 6, execAccess: 5 }, { unlockCompanion: 'spe', addFlag: 'defended_partial' }));
      return R(O('A blanket cut keeps the top 50 \u2014 and costs $2.8M a year in margin.', 'Never lead a defense with price.', -90000, { execAccess: -5 }, { mistake: 'Panic rate cut to defend against a competitor' }));

    case 'r_renewal': {
      const [m, txt] = renewalBoost(gs);
      cf[0] = 'IC++ + Managed Risk + Objective 4: the gold standard for a $950M platform.';
      cf[1] = 'Segmented buy rate + Radar Pro + Objective 4: the pragmatic optimum with in-house risk.';
      cf[2] = 'Imperial Alliance: every lever plus joint go-to-market.';
      cf[3] = 'Optimization only: minimal disruption, minimal upside.';
      if (i === 0) return R(O('IC++ for the top tier, Managed Risk platform-wide, and embedded finance signed. The ultimate partnership at $950M.' + txt, 'Passthrough pricing, Stripe-owned risk, and Objective 4 depth: the gold standard for large platforms.', Math.round(rv(160000) * m), { trust: 15, techCred: 10, execAccess: 10 }));
      if (i === 1) return R(O('Pricing Tool segmentation, Radar Pro, and Objective 4 products signed. Pragmatic excellence at scale.' + txt, 'Segmentation + the right Radar plan + embedded finance is a strong, controllable package.', Math.round(rv(130000) * m), { trust: 12, techCred: 8, productMastery: 8 }));
      if (i === 2) return R(O('LEGENDARY! The Imperial Alliance: IC++, Managed Risk, embedded finance, and SPE co-sell. OrderOS and Stripe go to market together.' + txt, 'The deepest platform partnerships combine pricing, risk, Objective 4, and joint go-to-market.', Math.round(rv(200000) * m), { trust: 18, execAccess: 15, productMastery: 10 }));
      return R(O('Buy rate optimization signed. Incremental, forgettable.' + txt, 'At $950M, an optimization-only renewal leaves the biggest levers unused.', Math.round(rv(40000) * m), { trust: 3 }, { mistake: 'Optimization-only renewal' }));
    }
  }
  return null;
}
