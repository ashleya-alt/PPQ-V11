import { StatKey, CompanionDef, BoonDef, Platform, ChapterDef } from '../types';

const STAT_META:Record<StatKey, {label:string; emoji:string; color:string}> = {
  trust:{label:'Trust',emoji:'\u{1F91D}',color:'#4a9'},
  techCred:{label:'Tech Cred',emoji:'\u{1F527}',color:'#59c'},
  execAccess:{label:'Exec Access',emoji:'\u{1F451}',color:'#c8a'},
  productMastery:{label:'Product Mastery',emoji:'\u{1F4DA}',color:'#d84'},
};

/** v11: The Stripe embedded payments journey (Launch > Facilitate > Monetize > Grow > Retain) */
const JOURNEY = [
  {id:0,title:'Launch',emoji:'\u{1F680}',color:'#8792A2',desc:'Build an exceptional product and charge a subscription fee.',products:'Billing'},
  {id:1,title:'Facilitate',emoji:'\u{1F50C}',color:'#7B73FF',desc:'Enable payment processing via a bring-your-own-gateway or partner model.',products:'Connect, Payments'},
  {id:2,title:'Monetize',emoji:'\u{1F4B0}',color:'#5951FF',desc:'Make money from payments processed through your platform; Checkout and local payment methods maximize conversion.',products:'Payment methods, Checkout, pricing model'},
  {id:3,title:'Grow',emoji:'\u{1F4C8}',color:'#4A42E8',desc:'Launch incremental payments products: integrated POS, recurring payments, faster payouts.',products:'Terminal, Instant Payouts, Billing, Radar'},
  {id:4,title:'Retain',emoji:'\u{1F512}',color:'#2D28B8',desc:'Objective 4: monetize outside of payments with financial services: treasury, bill pay, lending, expense cards.',products:'Capital, Treasury, Issuing'},
];
export function journeyObj(n: number) {
  return JOURNEY[Math.max(0, Math.min(JOURNEY.length - 1, Math.floor(n)))];
}

/** v11: Pricing models are levers INSIDE Monetize, not a maturity ladder. */
const STAGES = [
  {id:0,title:'Subscription Only',tag:'No Payments',color:'#8792A2',emoji:'\u{1F4E6}',desc:'Platform earns SaaS fees only'},
  {id:1,title:'Rev Share',tag:'Rev Share',color:'#7B73FF',emoji:'\u{1F91D}',desc:'Stripe handles pricing, platform earns a share'},
  {id:1.5,title:'Rev Share 2.0',tag:'Rev Share 2.0',color:'#6A63FF',emoji:'\u{1F4C8}',desc:'Better terms, white-label, 30-80 bps'},
  {id:2,title:'Buy Rate (Blended)',tag:'Buy Rate',color:'#5951FF',emoji:'\u{1F4B0}',desc:'Platform owns pricing, keeps the spread'},
  {id:2.5,title:'Segmented Pricing',tag:'Segmented',color:'#4A42E8',emoji:'\u{1F3AF}',desc:'Different rates by tier, method, and risk'},
  {id:3,title:'IC++',tag:'IC++',color:'#3B35D1',emoji:'\u{1F52C}',desc:'True cost-plus, zero interchange risk'},
];

/** Returns the highest pricing model at or below n (safe for legacy values like 3.5). */
export function stageObj(n: number) {
  let best = STAGES[0];
  for (const s of STAGES) if (s.id <= n) best = s;
  return best;
}

/** Discovery topics. Uncovered = +2 on dependent dice rolls, missing = -2 ("Guessing"). */
const DISCOVERY:Record<string,{label:string;emoji:string;desc:string}> = {
  disc_attach:{label:'Payments Attach',emoji:'\u{1F517}',desc:'What % of merchants process through the platform today'},
  disc_economics:{label:'Payments Economics',emoji:'\u{1F4CA}',desc:'Payment mix, payments team, P&L owner, interchange fluency'},
  disc_risk:{label:'Risk Profile',emoji:'\u{1F6E1}\uFE0F',desc:'Fraud patterns, risk appetite, risk-team capacity'},
  disc_obj4:{label:'Merchant Needs',emoji:'\u{1F3E6}',desc:'Cash flow, funds-holding, and spend needs (Objective 4 fuel)'},
  disc_competition:{label:'Competitive Landscape',emoji:'\u2694\uFE0F',desc:'Who else is pitching and what the incumbent setup looks like'},
  disc_exec:{label:'Exec Priorities',emoji:'\u{1F451}',desc:'What the board and executives are actually measured on'},
};

const COMPANIONS:CompanionDef[] = [
  {id:'sa',name:'The Architect',emoji:'\u{1F3D7}\uFE0F',title:'Solutions Architect',desc:'Every account has an SA.',passive:'+2 on technical encounters. Available on every account.'},
  {id:'tam',name:'The TAM',emoji:'\u{1F6E1}\uFE0F',title:'Technical Account Manager',desc:'A seasoned guardian who knows every system.',passive:'+2 to dice on crisis encounters.'},
  {id:'partner',name:'The Guildmaster',emoji:'\u{1F91D}',title:'Implementation Partner (SI / ISV)',desc:'A partner guild that brings implementation capacity and partner-sourced deals.',passive:'+2 on integration and defend rolls; faster activation.'},
  {id:'proserv',name:'The Artificers',emoji:'\u{1F9F0}',title:'Professional Services',desc:'Stripe ProServ: master builders for complex migrations and integrations.',passive:'+3 on big pricing moves (buy rate, IC++) and migrations.'},
  {id:'spe',name:'The Envoy',emoji:'\u{1F310}',title:'Stripe Partner Ecosystem (SPE)',desc:'Unlocks SPE tier benefits: growth workshops, co-sell, and MDF.',passive:'+3 on attach and Grow campaigns.'},
];

const BOONS:BoonDef[] = [
  {id:'fraud_shield',name:'Radar Ward',emoji:'\u{1F6E1}\uFE0F',desc:'Forged from Radar Plus / Pro',effect:'+2 on risk and crisis rolls.'},
  {id:'smr_aegis',name:'Aegis of Managed Risk',emoji:'\u{1F530}',desc:'Stripe Managed Risk: Stripe owns decisioning and liability',effect:'Fraud losses covered; frees the risk team.'},
  {id:'merchant_loyalty',name:'Merchant Loyalty Amulet',emoji:'\u{1F48E}',desc:'Earned through Capital',effect:'+1 to Trust dice; Objective 4 live.'},
  {id:'speed_talisman',name:'Speed Talisman',emoji:'\u26A1',desc:'Powered by Instant Payouts',effect:'+15% revenue.'},
  {id:'compliance_armor',name:'Compliance Armor',emoji:'\u{1F9E9}',desc:'Woven from Tax + Identity',effect:'+2 compliance dice.'},
  {id:'treasury_key',name:'Treasury Keystone',emoji:'\u{1F511}',desc:'Unlocked via Treasury / Financial Accounts',effect:'+$20K per encounter.'},
  {id:'margin_lens',name:'Margin Lens',emoji:'\u{1F50D}',desc:'Crafted from Margin Reports',effect:'+2 on pricing decisions.'},
  {id:'pricing_forge',name:'Pricing Forge',emoji:'\u2692\uFE0F',desc:'Platform Pricing Tool: no-code pricing schemes and groups',effect:'+2 on pricing decisions; segmentation without engineering.'},
  {id:'sa_rapport',name:'SA Rapport',emoji:'\u{1F91D}',desc:'Built through effective SA deployment',effect:'+2 on technical encounters.'},
  {id:'msap',name:'Pact of Mutual Success',emoji:'\u{1F4DC}',desc:'A Mutual Success & Activation Plan, co-owned with the customer',effect:'+2 on activation, defend, and renewal rolls.'},
];

const PLATFORMS:Platform[] = [
  {id:'fitness',name:'FitStack',emoji:'\u{1F3CB}\uFE0F',desc:'Gym management SaaS',volume:12000000,startStage:0,startJourney:0,journeyLabel:'Launch \u2192 Retain | The Attach Win',startStats:{trust:55,techCred:25,execAccess:15,productMastery:35},briefing:'FitStack powers 2,000 gym locations. Their merchants are classic SMBs \u2014 $50 average tickets, high volume, perpetually cash-strapped. Today FitStack earns revenue only from SaaS subscriptions; its gyms process payments through a patchwork of outside processors.\n\nThe board is impatient. They see competitors embedding payments and want in \u2014 NOW. The CEO came back from a conference saying "we need buy rate." The CTO has questions.\n\nHere\'s what nobody has measured: how many gyms would actually process through FitStack? Payments attach is the first real win \u2014 every gym that processes on-platform is revenue, data, and stickiness.\n\nYour challenge: discover before you prescribe. Win the attach battle, then guide FitStack from Launch to Retain. The temptation will be to rush to buy rate.'},
  {id:'property',name:'RentFlow',emoji:'\u{1F3E0}',desc:'Property management platform',volume:30000000,startStage:1.5,startJourney:2,journeyLabel:'Monetize \u2192 Retain | The Crossroads',startStats:{trust:50,techCred:35,execAccess:25,productMastery:40},briefing:'RentFlow manages 500 properties across 3 countries. They\'ve been on Stripe Connect for two years with an optimized Rev Share earning 55 bps. Volume is growing 40% YoY.\n\nHere\'s what makes RentFlow tricky: rent payments are overwhelmingly debit cards and ACH. Average interchange is just 1.1\u20131.4% on debit (Durbin-regulated), and 40% of volume is ACH \u2014 which follows completely different economics. The spread on buy rate would be razor-thin.\n\nThe Series C investor doesn\'t see this: "Competitors are on buy rate and making 180 bps. Why aren\'t we?" And Adyen has been circling the CFO.\n\nRentFlow has no dedicated payments team. No one owns the payments P&L. But property managers hold security deposits, pay owners, and fund maintenance \u2014 money that never touches a card network.\n\nYour challenge: is buy rate even the right destination? Or is the real prize outside of payments entirely?'},
  {id:'restaurant',name:'OrderOS',emoji:'\u{1F355}',desc:'Restaurant POS + online ordering platform',volume:950000000,startStage:2,startJourney:2,journeyLabel:'Monetize \u2192 Retain | The Empire',startStats:{trust:60,techCred:40,execAccess:30,productMastery:50},briefing:'OrderOS is the empire \u2014 45,000 restaurants plus ghost kitchens and food halls, $950M annual processing volume, blended buy rate live for 18 months. At this scale, every basis point is millions.\n\nBut the Head of Payments just showed you the Margin Reports. Twenty percent of merchants are underwater \u2014 high rewards card usage, cross-border transactions from tourist areas, and a flat rate that doesn\'t account for card mix. Engineering says custom pricing logic would take two quarters.\n\nMeanwhile, their 50 largest restaurant groups (30% of volume) want interchange-passthrough pricing. The risk team of 3 people is drowning in disputes. The COO asked: "Do we hire 5 more people, or is there a smarter way?"\n\nAt nearly $1B in volume, the decisions you make here ripple across the entire industry.'},
];

const CHAPTERS_FITNESS:Record<number,ChapterDef> = {
  1:{title:'Discovery: The Scouting Expedition',emoji:'\u{1F9ED}',flavor:'Before any banner is raised, a wise champion learns the land. What you uncover here will tip every roll of the dice ahead.'},
  2:{title:'Launch \u2192 Facilitate: The First Gateway',emoji:'\u{1F680}',flavor:'The Frontier Kingdom has never known payments. Its first gateway must be built well.'},
  3:{title:'Monetize: The Crucible',emoji:'\u2696\uFE0F',flavor:'Revenue flows. The board says "buy rate." The investor says "buy rate." Are they ready?'},
  4:{title:'Grow: The Attach Campaign',emoji:'\u{1F4C8}',flavor:'Every gym that processes on-platform is a victory. Now win the realm, merchant by merchant.'},
  5:{title:'Retain: Beyond the Gateway (Objective 4)',emoji:'\u{1F512}',flavor:'The richest kingdoms earn gold beyond payments \u2014 lending, treasuries, and cards for their merchants.'},
  6:{title:'Defend: The Siege',emoji:'\u{1F3F0}',flavor:'Success attracts rivals. A dark rider approaches the gates.'},
  7:{title:'The Grand Renewal',emoji:'\u{1F451}',flavor:'Everything culminates. Your guidance will define whether this kingdom thrives.'},
};

const CHAPTERS_PROPERTY:Record<number,ChapterDef> = {
  1:{title:'Discovery: The Ledger of Rails',emoji:'\u{1F9ED}',flavor:'Rent flows through strange rails \u2014 debit, ACH, deposits. Learn them before you price them.'},
  2:{title:'Monetize: The Crossroads',emoji:'\u{1F6E4}\uFE0F',flavor:'The realm stands at a fork. Buy rate or hold? Your discovery will be tested.'},
  3:{title:'Grow: Consequences & Expansion',emoji:'\u{1F30D}',flavor:'The decision is made. Now come the consequences \u2014 activation, churn, and foreign shores.'},
  4:{title:'Retain: The Vault (Objective 4)',emoji:'\u{1F512}',flavor:'Deposits, owner payouts, maintenance spend \u2014 gold that never touches a card network.'},
  5:{title:'Defend: The Adyen Gambit',emoji:'\u{1F3F0}',flavor:'A rival kingdom sends envoys with gold and promises. Will RentFlow stay?'},
  6:{title:'The Grand Renewal',emoji:'\u{1F451}',flavor:'Contract renewal. Everything you\'ve built converges here.'},
};

const CHAPTERS_RESTAURANT:Record<number,ChapterDef> = {
  1:{title:'Discovery: The Imperial Audit',emoji:'\u{1F9ED}',flavor:'The empire is vast but bleeding gold. Before you prescribe, audit the realm.'},
  2:{title:'Monetize: Optimize the Empire',emoji:'\u{1F52C}',flavor:'The path from blended buy rate to surgical precision pricing.'},
  3:{title:'Grow: Allies, Risk & the Omnichannel Frontier',emoji:'\u{1F409}',flavor:'Dragons, departures, and new frontiers. The empire must scale without breaking.'},
  4:{title:'Retain & Defend: The Imperial Treasury',emoji:'\u{1F512}',flavor:'Objective 4 riches await \u2014 and a rival raids the empire\'s greatest lords.'},
  5:{title:'The Grand Renewal',emoji:'\u{1F451}',flavor:'The renewal defines the next era.'},
};

export function getChapters(pid: string): Record<number, ChapterDef> {
  if (pid === 'fitness') return CHAPTERS_FITNESS;
  if (pid === 'property') return CHAPTERS_PROPERTY;
  return CHAPTERS_RESTAURANT;
}

export { STAT_META, STAGES, JOURNEY, DISCOVERY, COMPANIONS, BOONS, PLATFORMS };
