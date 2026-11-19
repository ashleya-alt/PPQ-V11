import { Encounter, EncChoice, Signal } from '../types';
import { ENC_FITNESS } from './encounters-fitness';
import { ENC_PROPERTY } from './encounters-property';
import { ENC_RESTAURANT } from './encounters-restaurant';

/* ============================================================================
 * v11 CAMPAIGNS
 * Builds each platform's encounter list from (a) v10 encounters, patched
 * (chapter, discovery tags, hidden signals, ally swaps) and (b) new v11
 * encounters. Order in each array = play order. Chapters follow the
 * journey: Discovery > Launch/Facilitate > Monetize > Grow > Retain > Defend > Renewal,
 * trimmed by platform maturity.
 * ========================================================================== */

const ALL = [...ENC_FITNESS, ...ENC_PROPERTY, ...ENC_RESTAURANT];
function base(id: string): Encounter {
  const e = ALL.find(x => x.id === id);
  if (!e) throw new Error('Missing v10 encounter ' + id);
  return e;
}

/** Head of Payments is no longer a recruitable ally: its bonuses move to ProServ. */
function swapAllies(choices: EncChoice[]): EncChoice[] {
  return choices.map(c => {
    if (!c.companionBonus || c.companionBonus.payments_lead === undefined) return { ...c };
    const { payments_lead, ...rest } = c.companionBonus;
    return { ...c, companionBonus: { ...rest, proserv: Math.max(rest.proserv || 0, payments_lead) } };
  });
}

interface Patch {
  chapter: number;
  discovery?: Record<number, string[]>;
  reveal?: Signal[];
  choices?: (choices: EncChoice[]) => EncChoice[];
  type?: Encounter['type'];
  flavor?: string;
}
function patch(id: string, p: Patch): Encounter {
  const e = base(id);
  let choices = swapAllies(e.choices);
  if (p.discovery) choices = choices.map((c, i) => (p.discovery![i] ? { ...c, discovery: p.discovery![i] } : c));
  if (p.choices) choices = p.choices(choices);
  return {
    ...e,
    chapter: p.chapter,
    type: p.type || e.type,
    flavor: p.flavor || e.flavor,
    signals: p.reveal ? [...(e.signals || []), ...p.reveal] : e.signals,
    choices,
  };
}

const ungate = (idx: number) => (cs: EncChoice[]) => cs.map((c, i) => (i === idx ? { ...c, requires: undefined } : c));

/* ---------------------------------------------------------------------------
 * 🏋️ FITSTACK: "The Attach Win" (Launch -> Retain, 7 chapters)
 * ------------------------------------------------------------------------- */
const FITNESS: Encounter[] = [
  // Ch1 Discovery
  {id:'f_scout',title:'The Scouting Report',emoji:'\u{1F5FA}\uFE0F',type:'discovery',chapter:1,flavor:'Your first meeting with FitStack\'s leadership is in three days. A champion who arrives prepared asks better questions. Where do you focus your preparation?',choices:[
    {label:'Study the Merchant Ledger',desc:'Gym payments economics: $50 tickets, recurring memberships, debit-heavy mix, interchange basics.'},
    {label:'Map the Royal Court',desc:'Research the board, CEO, CFO, and CTO: what each one is actually measured on.'},
    {label:'Scout the Rival Banners',desc:'Which gym-software competitors embed payments, and who else is pitching FitStack.'}]},
  {id:'f_attach_q',title:'The Attach Question',emoji:'\u{1F517}',type:'discovery',chapter:1,flavor:'First meeting. Before you can sit down, the CEO opens: "So \u2014 how fast can we get to buy rate?"',signals:[
    {type:'yellow',text:'CEO is leading with a solution, not a problem'},
    {type:'green',text:'Full leadership team in the room: a rare discovery window'},
    {type:'green',text:'\u{1F50D} Your prep: most gyms run recurring memberships on debit \u2014 early buy rate spreads would be thin',reveal:'disc_economics'},
    {type:'green',text:'\u{1F50D} Your court map: the board is measured on ARR growth and net revenue retention \u2014 not take rate',reveal:'disc_exec'}],choices:[
    {label:'Ask: "How many of your gyms process payments through FitStack today?"',desc:'Find the real starting line: payments attach.'},
    {label:'Ask: "What keeps your gym owners up at night?"',desc:'Discover merchant pain: cash flow, failed payments, disputes.'},
    {label:'Answer the question: walk through the buy rate pitch',desc:'Give the CEO what they asked for.'}]},
  {id:'f_council',title:'The War Room Session',emoji:'\u{1F5E3}\uFE0F',type:'discovery',chapter:1,flavor:'You\'ve earned 90 minutes with the CEO, CFO, and CTO together. How do you use it?',signals:[
    {type:'green',text:'Executives are curious and engaged'},
    {type:'yellow',text:'90 minutes goes fast with three executives and three agendas'}],choices:[
    {label:'Run a structured discovery workshop with your SA',desc:'Business goals, payments readiness, risk posture, and merchant needs \u2014 facilitated together.',useDice:true,diceStat:'trust',diceThreshold:10,companionBonus:{sa:2},discovery:['disc_exec']},
    {label:'Send a discovery questionnaire ahead, then walk through the answers',desc:'Structured, efficient, a little impersonal.'},
    {label:'Skip discovery \u2014 use the time for a product demo',desc:'Show them Connect, Capital, and Radar. Let the product sell itself.'}]},

  // Ch2 Launch -> Facilitate
  patch('f_decree',{chapter:2,reveal:[
    {type:'green',text:'\u{1F50D} Your discovery: attach is the first win \u2014 most gyms process off-platform today',reveal:'disc_attach'},
    {type:'yellow',text:'\u{1F50D} Your discovery: no payments PM, no P&L owner \u2014 buy rate readiness is far off',reveal:'disc_economics'}],
    choices:cs=>[...cs,{label:'Partner Gateway Only (Facilitate)',desc:'Let gyms bring their own gateway through a partner integration. No pricing risk \u2014 and no payments revenue.'}]}),
  patch('f_technical',{chapter:2}),

  // Ch3 Monetize
  {id:'f_convert',title:'From Gateway to Gold',emoji:'\u{1FA99}',type:'stage_transition',chapter:3,flavor:'The partner gateway works \u2014 but FitStack earns nothing on $12M of volume. The CFO notices.',conditional:(gs)=>gs.flags.includes('facilitate_only'),signals:[
    {type:'green',text:'Payments already embedded in the product \u2014 merchants are used to it'},
    {type:'yellow',text:'CFO asking why payments revenue is still zero'}],choices:[
    {label:'Move to Standard Connect Rev Share',desc:'Turn on monetization with zero pricing risk.'},
    {label:'Stay on the partner gateway',desc:'It works. Why change?'},
    {label:'Jump straight to buy rate',desc:'If we\'re going to monetize, go big.'}]},
  patch('f_margin_crisis',{chapter:3}),
  patch('f_whitelabel',{chapter:3}),
  patch('f_crucible',{chapter:3,discovery:{0:['disc_economics'],1:['disc_economics']},reveal:[
    {type:'red',text:'\u{1F50D} Your discovery: still no payments PM, no P&L owner, and a debit-heavy membership mix',reveal:'disc_economics'}]}),
  patch('f_stabilize',{chapter:3}),

  // Ch4 Grow
  {id:'f_msap',title:'The Pact of Mutual Success',emoji:'\u{1F4DC}',type:'opportunity',chapter:4,flavor:'FitStack committed to embedded payments. Now 2,000 gyms need to actually go live \u2014 and the CEO has already moved on to the next initiative.',signals:[
    {type:'green',text:'Signed commitment and a motivated board'},
    {type:'yellow',text:'No named FitStack owner for go-live milestones'},
    {type:'red',text:'Deals without an activation plan often stall before revenue activates'}],choices:[
    {label:'Co-build an MSAP with FitStack and bring in ProServ',desc:'Mutual Success & Activation Plan: owners, milestones, and dates on both sides. ProServ de-risks the launch.'},
    {label:'Draft the MSAP yourself and share it',desc:'Faster. Less buy-in.'},
    {label:'They signed \u2014 they\'ll figure out go-live',desc:'Move on to the next deal.'}]},
  {id:'f_attach_campaign',title:'The Attach Campaign',emoji:'\u{1F3C6}',type:'opportunity',chapter:4,flavor:'Only a fraction of FitStack\'s 2,000 gyms process on-platform. Every gym that switches is recurring revenue, richer data, and a stickier customer.',signals:[
    {type:'green',text:'Gyms want one system for memberships and payments'},
    {type:'yellow',text:'Switching processors feels risky to small gym owners'},
    {type:'green',text:'\u{1F50D} You measured it: attach is ~15%. 1,700 gyms still process elsewhere.',reveal:'disc_attach'}],choices:[
    {label:'Launch an SPE growth workshop + embedded onboarding',desc:'Engage the Stripe Partner Ecosystem: growth workshop, co-marketing, and Connect embedded onboarding for gyms.',useDice:true,diceStat:'productMastery',diceThreshold:11,discovery:['disc_attach'],companionBonus:{partner:2,proserv:1},boonBonus:{msap:2}},
    {label:'Offer switching incentives: 90 days of waived fees',desc:'Buy attach with short-term credits.'},
    {label:'Mandate integrated payments for all gyms',desc:'Make it a requirement in the next contract cycle.'}]},
  patch('f_harvest',{chapter:4,flavor:'Attach is moving. Rev share is generating real revenue. Gym owners are asking for more.'}),
  {id:'f_risk',title:'The Chargeback Goblins',emoji:'\u{1F47A}',type:'crisis',chapter:4,flavor:'"Forgot to cancel" disputes and card-testing attacks are hitting FitStack\'s gyms. FitStack has no risk team. Which Radar plan \u2014 or Managed Risk \u2014 fits?',signals:[
    {type:'yellow',text:'Dispute rate trending toward network monitoring thresholds'},
    {type:'red',text:'Gym owners are blaming FitStack for the losses'},
    {type:'green',text:'New Radar plans: Standard (included) \u2192 Plus \u2192 Pro, or Stripe Managed Risk'},
    {type:'yellow',text:'\u{1F50D} Your discovery: zero risk headcount and no appetite to build a risk operation',reveal:'disc_risk'}],choices:[
    {label:'Radar Plus: custom rules and dynamic thresholds',desc:'Control and tuning. Someone at FitStack has to own the rules.',useDice:true,diceStat:'techCred',diceThreshold:11,discovery:['disc_risk'],companionBonus:{sa:2,tam:2}},
    {label:'Stripe Managed Risk (SMR)',desc:'Stripe takes on decisioning and liability for connected accounts. Higher fee, no risk team required.'},
    {label:'Radar Pro: Plus + account and customer abuse prevention',desc:'The most advanced protection: signup, free-trial, and bot abuse.'},
    {label:'Stay on Radar Standard and hope it settles',desc:'Standard is already included.'}]},

  // Ch5 Retain (Objective 4)
  {id:'f_obj4',title:'Beyond the Gateway',emoji:'\u{1F3E6}',type:'opportunity',chapter:5,flavor:'The board asks: "What\'s our next revenue line?" Gym owners need cash between membership cycles, a place to hold funds, and cards for equipment and supplies. Objective 4: monetize outside of payments.',signals:[
    {type:'green',text:'55% of gyms eligible for Capital'},
    {type:'green',text:'Embedded finance lifts retention and valuation multiples'},
    {type:'green',text:'\u{1F50D} Your discovery: cash flow between membership cycles is the #1 gym-owner pain',reveal:'disc_obj4'}],choices:[
    {label:'Embedded finance bundle: Capital + Financial Accounts + Issuing cards',desc:'Lending, a place to hold funds, and spend cards \u2014 three new revenue lines.',useDice:true,diceStat:'productMastery',diceThreshold:12,discovery:['disc_obj4'],companionBonus:{spe:2,proserv:1},boonBonus:{merchant_loyalty:2}},
    {label:'Start small: Capital only (or expand it)',desc:'The easiest Objective 4 entry point.'},
    {label:'Not now \u2014 stay focused on payments',desc:'One thing at a time.'}]},

  // Ch6 Defend
  patch('f_rival',{chapter:6,type:'defend',discovery:{0:['disc_competition']},reveal:[
    {type:'green',text:'\u{1F50D} Your scouting: Adyen\'s "no minimums" offer requires FitStack to own risk, onboarding, and support',reveal:'disc_competition'}],
    choices:cs=>cs.map((c,i)=>i===0?{...c,boonBonus:{...(c.boonBonus||{}),msap:2,treasury_key:1}}:c)}),

  // Ch7 Grand Renewal
  {id:'f_renewal_prep',title:'The Renewal War Map',emoji:'\u{1F5FA}\uFE0F',type:'opportunity',chapter:7,flavor:'Renewal is 60 days away. The board will ask one question: "What did payments actually do for us?"',choices:[
    {label:'Build the value case: attach %, revenue, products live, MSAP milestones',desc:'Quantify the value delivered before you ask for anything.',useDice:true,diceStat:'execAccess',diceThreshold:10,discovery:['disc_exec'],boonBonus:{msap:2}},
    {label:'Ask the SA and TAM for a technical health review',desc:'Solid, but technical rather than business value.'},
    {label:'Wing it \u2014 the relationship is strong',desc:'They like you. That\'s enough.'}]},
  {id:'f_renewal',title:'The Grand Renewal',emoji:'\u{1F451}',type:'finale',chapter:7,flavor:'Contract renewal. The Grand Council convenes. Everything culminates here.',choices:[
    {label:'Rev Share 2.0 + Objective 4 Bundle',desc:'Optimized rev share with Capital, Instant Payouts, Financial Accounts, and Issuing.'},
    {label:'Buy Rate + Product Bundle',desc:'Buy rate transition with products. Only if readiness was proven.',requires:{flag:'buy_rate_ready'}},
    {label:'Risk Expansion: Radar Plus \u2192 Pro + SMR for high-risk gyms',desc:'The new Radar plan structure as an expansion lever, with Managed Risk where FitStack wants Stripe to own liability.',hidden:true,requires:{flag:'disc_risk'}},
    {label:'Rev Share Increase Only',desc:'Simple but leaves value on the table.'}]},
];

/* ---------------------------------------------------------------------------
 * 🏠 RENTFLOW: "The Crossroads" (Monetize -> Retain, 6 chapters)
 * ------------------------------------------------------------------------- */
const PROPERTY: Encounter[] = [
  // Ch1 Discovery
  {id:'p_scout',title:'The Scouting Report',emoji:'\u{1F5FA}\uFE0F',type:'discovery',chapter:1,flavor:'The investor has called a board session on "the buy rate question" next week. You have a few days to prepare.',choices:[
    {label:'Study Debit & ACH Economics',desc:'Durbin-regulated interchange, debit program fees, ACH pricing models.'},
    {label:'Map the Boardroom',desc:'What the investor, CEO, and CFO are each measured on \u2014 and who really decides.'},
    {label:'Scout the Rival Banners',desc:'Who else is courting RentFlow, and what they\'re offering.'}]},
  {id:'p_ledger',title:'The Ledger of Rails',emoji:'\u{1F4D2}',type:'discovery',chapter:1,flavor:'Your first working session with RentFlow\'s CFO. The investor\'s deck \u2014 "Competitors make 180 bps!" \u2014 is on the table.',signals:[
    {type:'yellow',text:'Investor benchmarks come from other companies, not RentFlow data'},
    {type:'green',text:'CFO willing to open the books'},
    {type:'green',text:'\u{1F50D} Your prep: Durbin caps regulated debit interchange \u2014 the spread math is very different here',reveal:'disc_economics'}],choices:[
    {label:'Pull the real payment mix: cards vs. debit vs. ACH',desc:'Build the economics on RentFlow\'s actual data.'},
    {label:'Interview three property managers about their money flows',desc:'Rent, deposits, owner payouts, maintenance \u2014 where does the money go?'},
    {label:'Accept the investor\'s benchmarks and model buy rate',desc:'The board already believes them.'}]},
  {id:'p_council',title:'The Council of Stewards',emoji:'\u{1F5E3}\uFE0F',type:'discovery',chapter:1,flavor:'The CFO, CTO, and Head of Operations agree to a working session. The investor will hear the readout.',choices:[
    {label:'Run a joint discovery session with your SA',desc:'Goals, readiness, risk, and the competitive picture \u2014 facilitated together.',useDice:true,diceStat:'trust',diceThreshold:10,companionBonus:{sa:2},discovery:['disc_exec']},
    {label:'Ask the CFO directly: "Who else are you talking to?"',desc:'One sharp question.'},
    {label:'Skip it \u2014 the investor already defined the problem',desc:'Buy rate. Move fast.'}]},

  // Ch2 Monetize
  patch('p_crossroads',{chapter:2,reveal:[
    {type:'green',text:'\u{1F50D} Your mix analysis: under 10% credit \u2014 buy rate spread would be ~20-40 bps, not 180',reveal:'disc_economics'},
    {type:'green',text:'\u{1F50D} The bigger prize: deposits, owner payouts, and maintenance spend never touch card interchange',reveal:'disc_obj4'}]}),
  patch('p_technical',{chapter:2}),
  patch('p_margin_crisis',{chapter:2}),
  patch('p_crucible',{chapter:2,discovery:{0:['disc_economics'],1:['disc_economics']}}),

  // Ch3 Grow
  {id:'p_msap',title:'The Pact of Mutual Success',emoji:'\u{1F4DC}',type:'opportunity',chapter:3,flavor:'Whatever pricing path RentFlow chose, change is coming: new pricing, ACH flows, and international expansion. The CFO and CTO need one shared plan.',signals:[
    {type:'yellow',text:'No dedicated payments team to drive milestones'},
    {type:'green',text:'CFO and CTO both engaged after the Crossroads decision'}],choices:[
    {label:'Co-build an MSAP with the CFO + CTO and bring in ProServ',desc:'Owners, milestones, and dates on both sides. ProServ covers the ACH and multi-country build.'},
    {label:'Draft the MSAP yourself and share it',desc:'Faster. Less buy-in.'},
    {label:'Skip the plan \u2014 they know what to do',desc:'Trust the customer.'}]},
  patch('p_uprising',{chapter:3,discovery:{0:['disc_obj4']}}),
  patch('p_expansion',{chapter:3,choices:ungate(1)}),

  // Ch4 Retain (Objective 4)
  patch('p_cost',{chapter:4}),
  {id:'p_obj4',title:'The Vault of Deposits',emoji:'\u{1F3E6}',type:'opportunity',chapter:4,flavor:'Property managers hold millions in security deposits across dozens of bank accounts, pay owners manually, and run maintenance on personal cards. Objective 4: monetize outside of payments.',signals:[
    {type:'green',text:'This money never touches card interchange \u2014 no Durbin cap on this revenue'},
    {type:'yellow',text:'Requires compliance and multi-country thinking'},
    {type:'green',text:'\u{1F50D} Your interviews: deposits and owner payouts are the #1 operational headache',reveal:'disc_obj4'}],choices:[
    {label:'Financial Accounts for deposits + Issuing for maintenance + Capital',desc:'Hold deposits, fund maintenance cards, and lend to property managers.',useDice:true,diceStat:'productMastery',diceThreshold:12,discovery:['disc_obj4'],companionBonus:{proserv:2,spe:1},boonBonus:{compliance_armor:2}},
    {label:'Capital for property managers only',desc:'Start with lending.'},
    {label:'Squeeze more from ACH pricing instead',desc:'Stay inside payments.'}]},

  // Ch5 Defend
  {id:'p_adyen',title:'The Adyen Gambit',emoji:'\u2694\uFE0F',type:'defend',chapter:5,flavor:'Adyen offers RentFlow a buy rate with "no minimums" and a $250K migration incentive. The CFO forwards it to you: "Convince me to stay."',signals:[
    {type:'yellow',text:'CFO is genuinely tempted by the migration incentive'},
    {type:'red',text:'The investor is amplifying the Adyen pitch to the board'},
    {type:'green',text:'\u{1F50D} Your scouting: Adyen\'s offer assumes RentFlow takes on risk, onboarding, and compliance it isn\'t staffed for',reveal:'disc_competition'},
    {type:'green',text:'\u{1F50D} Your mix analysis: on a debit/ACH mix, Adyen\'s buy rate spread is thinner than RentFlow\'s rev share today',reveal:'disc_economics'}],choices:[
    {label:'Competitive value narrative: total platform value, not rate',desc:'Real payment-mix economics, switching cost, Objective 4 products, and the activation plan.',useDice:true,diceStat:'productMastery',diceThreshold:13,discovery:['disc_competition','disc_economics'],companionBonus:{sa:2,tam:1,partner:2},boonBonus:{msap:2,treasury_key:2,compliance_armor:1}},
    {label:'Rally the Guild: Partner + ProServ switching-cost analysis',desc:'Show exactly what a migration would cost RentFlow in engineering time and risk.'},
    {label:'Match Adyen\'s pricing',desc:'Neutralize the offer.'},
    {label:'Dismiss it \u2014 they\'d never leave',desc:'Two years on Stripe. Too sticky to move.'}]},

  // Ch6 Grand Renewal
  {id:'p_renewal',title:'The Grand Renewal',emoji:'\u{1F451}',type:'finale',chapter:6,flavor:'Contract renewal. The debit/ACH mix makes this unlike any other negotiation.',choices:[
    {label:'Buy Rate + Dual-Rail Pricing + Objective 4 Products',desc:'Separate card and ACH economics with Financial Accounts, Issuing, and Tax.',requires:{flag:'on_buyrate'}},
    {label:'Rev Share 2.0 + Objective 4 Suite',desc:'Optimized rev share with Financial Accounts, Issuing, Capital, and Tax. Let Stripe manage the card mix.'},
    {label:'Risk Expansion: Radar Plus + SMR for high-risk properties',desc:'The new Radar plans as an expansion lever, with Managed Risk where RentFlow wants Stripe to own liability.',hidden:true,requires:{flag:'disc_risk'}},
    {label:'Increase Rev Share Only',desc:'Simple. Leaves the Objective 4 opportunity on the table.'}]},
];

/* ---------------------------------------------------------------------------
 * 🍕 ORDEROS: "The Empire" (late Monetize -> Retain, 5 chapters)
 * ------------------------------------------------------------------------- */
const RESTAURANT: Encounter[] = [
  // Ch1 Discovery
  {id:'r_scout',title:'The Scouting Report',emoji:'\u{1F5FA}\uFE0F',type:'discovery',chapter:1,flavor:'Eighteen months on the account \u2014 but the empire has changed. Before the quarterly business review, you prepare.',choices:[
    {label:'Study IC++ and Card-Mix Economics',desc:'Interchange variance, rewards cards, cross-border, statement generation.'},
    {label:'Map the Imperial Court',desc:'COO, Head of Payments, CFO: what each one is measured on.'},
    {label:'Scout the Rival Banners',desc:'Who is courting OrderOS\'s largest restaurant groups.'}]},
  {id:'r_audit',title:'The Imperial Audit',emoji:'\u{1F50E}',type:'discovery',chapter:1,flavor:'You have one day on site at OrderOS HQ. Where do you spend it?',signals:[
    {type:'green',text:'Leadership open to an honest audit'},
    {type:'yellow',text:'Everyone assumes you already know the account'}],choices:[
    {label:'Shadow the 3-person risk team for a day',desc:'See the dispute queue firsthand.'},
    {label:'Measure attach: in-store hardware vs. online ordering payments',desc:'How much volume actually flows through OrderOS?'},
    {label:'Interview restaurant owners about cash flow and supplier spend',desc:'Where do they need money, and how do they spend it?'},
    {label:'Skip the audit \u2014 you\'ve been on this account 18 months',desc:'You know this empire.'}]},
  {id:'r_council',title:'The Emperor\'s Council',emoji:'\u{1F5E3}\uFE0F',type:'discovery',chapter:1,flavor:'The COO grants you the executive staff meeting. Thirty minutes. Make it count.',choices:[
    {label:'Facilitate an executive discovery session with your SA',desc:'Margin, risk, growth, and retention priorities \u2014 ranked by the execs themselves.',useDice:true,diceStat:'execAccess',diceThreshold:10,companionBonus:{sa:2},discovery:['disc_exec']},
    {label:'Ask the COO: "What happens if you don\'t solve this in 12 months?"',desc:'One question that reveals the stakes.'},
    {label:'Present your roadmap instead',desc:'They\'re busy. Show them the answer.'}]},

  // Ch2 Monetize: Optimize
  {id:'r_burden',title:"The Emperor's Burden",emoji:'\u{1F525}',type:'stage_transition',chapter:2,flavor:'Margin Reports are in. At $950M volume, 20% of merchants underwater means millions in losses \u2014 and engineering says custom pricing logic would take two quarters.',signals:[
    {type:'green',text:'$950M volume \u2014 every basis point of improvement is worth millions'},
    {type:'green',text:'Head of Payments has Margin Reports and wants to act'},
    {type:'green',text:'Platform Pricing Tool: no-code pricing schemes and pricing groups by tier, payment method, and geography'},
    {type:'yellow',text:'Head of Payments recommends a blanket rate increase as the fastest path to margin repair'},
    {type:'red',text:'20% of merchants underwater on high-interchange cards in tourist areas'},
    {type:'green',text:'\u{1F50D} Your prep: tourist-area locations run ~60% rewards cards vs. 25% in suburbs',reveal:'disc_economics'}],choices:[
    {label:'Card-mix analysis \u2192 segment with the Platform Pricing Tool',desc:'No-code pricing schemes and connected-account pricing groups. Live in weeks, not quarters.',useDice:true,diceStat:'techCred',diceThreshold:10,discovery:['disc_economics'],companionBonus:{sa:2,tam:2},boonBonus:{margin_lens:3}},
    {label:'Investigate Card Mix First',desc:'Understand the actual cost drivers before acting. Data before decisions.'},
    {label:'Accept HoP Recommendation: Raise All Rates 20 bps',desc:'Your trusted contact says this is the fastest fix. $1.9M in immediate margin recovery.'},
    {label:'Have engineering hand-build segmented application fees',desc:'Custom application_fee_amount logic. Full control \u2014 two quarters of engineering.'}]},
  patch('r_technical',{chapter:2}),
  {id:'r_tam_recruit',title:'The War Council',emoji:'\u{1F6E1}\uFE0F',type:'companion',chapter:2,flavor:'At $950M, the transformation ahead requires allies. Who do you bring in first?',choices:[
    {label:'Recruit the TAM (Paid Support)',desc:'Crisis response, margin monitoring, and technical escalation at scale.'},
    {label:'Engage ProServ for the IC++ and billing build',desc:'Stripe Professional Services: master builders for complex migrations.'},
    {label:'Bring in an Implementation Partner (SI)',desc:'A partner guild with restaurant-POS expertise and capacity.'},
    {label:'Go it alone \u2014 sharpen your instincts',desc:'You have 18 months of account knowledge.'}]},
  patch('r_enterprise',{chapter:2,discovery:{0:['disc_economics']}}),
  {id:'r_msap',title:'The Pact for the Rollout',emoji:'\u{1F4DC}',type:'opportunity',chapter:2,flavor:'Pricing is changing for 45,000 restaurants and the top 50 groups. The Head of Payments needs one plan everyone signs.',choices:[
    {label:'Co-build an MSAP with the Head of Payments + ProServ',desc:'Mutual Success & Activation Plan: owners, milestones, and dates on both sides.'},
    {label:'Draft the MSAP yourself and share it',desc:'Faster. Less buy-in.'},
    {label:'Skip the plan \u2014 the team is sophisticated',desc:'They\'ve done migrations before.'}]},

  // Ch3 Grow: risk, allies, omnichannel
  {id:'r_fraud',title:'The Fraud Dragon',emoji:'\u{1F409}',type:'crisis',chapter:3,flavor:'Dispute rates spiking across 45,000 restaurants. The risk team of 3 is drowning and network monitoring thresholds are approaching. Which Radar plan \u2014 or Managed Risk?',signals:[
    {type:'green',text:'New Radar plans: Standard (included) \u2192 Plus \u2192 Pro, or Stripe Managed Risk'},
    {type:'yellow',text:'Head of Payments wants to keep control in-house'},
    {type:'red',text:'Monitoring-program threshold approaching \u2014 fines and program risk'},
    {type:'yellow',text:'\u{1F50D} Your audit: 400 manual dispute reviews a week, and the COO wants scale without headcount',reveal:'disc_risk'}],choices:[
    {label:'Radar Plus: custom rules and dynamic thresholds',desc:'Control and tuning \u2014 the risk team owns the rules.',useDice:true,diceStat:'techCred',diceThreshold:11,discovery:['disc_risk'],companionBonus:{tam:2,sa:2}},
    {label:'Radar Pro: Plus + account and customer abuse prevention',desc:'Adds protection against fake accounts and promo abuse across online ordering and ghost kitchens.',useDice:true,diceStat:'techCred',diceThreshold:10,discovery:['disc_risk'],companionBonus:{tam:2,sa:1}},
    {label:'Stripe Managed Risk (SMR)',desc:'Stripe takes on decisioning and liability for connected accounts. Higher fee, risk team freed.'},
    {label:'Support the internal team with better tooling',desc:'Honor the Head of Payments\' preference for control.'}]},
  patch('r_champion',{chapter:3,discovery:{0:['disc_exec']}}),
  {id:'r_scale',title:'The Scale Crucible',emoji:'\u2696\uFE0F',type:'boss',chapter:3,flavor:'The COO: "We process nearly $1B. Do we hire 5 more risk ops people, or is there a smarter way to scale?"',signals:[
    {type:'red',text:'Current risk team of 3 can\'t scale with volume'},
    {type:'yellow',text:'COO worries about ceding control'},
    {type:'green',text:'5 FTEs cost ~$750K/year before tooling'}],choices:[
    {label:'Stripe Managed Risk across the platform',desc:'Scale without headcount: Stripe owns decisioning and liability.',useDice:true,diceStat:'trust',diceThreshold:10,discovery:['disc_risk'],companionBonus:{tam:3,proserv:1}},
    {label:'Radar Pro + hire 5 FTEs',desc:'Keep risk in-house with the most advanced Radar plan. $750K/year.',useDice:true,diceStat:'execAccess',diceThreshold:10},
    {label:'Nothing structural \u2014 next-day settlement only',desc:'Address the merchant speed complaint and move on.'}]},
  {id:'r_omni',title:'The Omnichannel Frontier',emoji:'\u{1F9FE}',type:'opportunity',chapter:3,flavor:'Restaurants use OrderOS for online ordering \u2014 but many still run a legacy acquirer at the counter.',signals:[
    {type:'green',text:'Restaurant groups want unified online + in-store data'},
    {type:'yellow',text:'Hardware rollouts need installation partners'},
    {type:'green',text:'\u{1F50D} Your audit: ~60% of in-store volume leaks to a legacy acquirer',reveal:'disc_attach'}],choices:[
    {label:'Terminal consolidation + Instant Payouts',desc:'Bring in-store volume onto OrderOS with Stripe Terminal, and monetize faster payouts.',useDice:true,diceStat:'productMastery',diceThreshold:12,discovery:['disc_attach'],companionBonus:{partner:2,proserv:2}},
    {label:'Instant Payouts only',desc:'Fast revenue, no hardware.'},
    {label:'Leave in-store to the legacy acquirer',desc:'Online ordering is the core business.'}]},

  // Ch4 Retain + Defend
  {id:'r_obj4',title:'The Imperial Treasury',emoji:'\u{1F3E6}',type:'opportunity',chapter:4,flavor:'Restaurants live on thin margins: they need cash for slow seasons, cards for supplier purchasing, and a place to hold tips and payroll funds. Objective 4: monetize outside of payments.',signals:[
    {type:'green',text:'Embedded finance revenue doesn\'t depend on interchange'},
    {type:'green',text:'\u{1F50D} Your interviews: supplier spend and slow-season cash are top owner pains',reveal:'disc_obj4'}],choices:[
    {label:'Capital + Issuing supplier cards + Financial Accounts',desc:'Lending, spend, and a place to hold funds \u2014 three new revenue lines.',useDice:true,diceStat:'productMastery',diceThreshold:12,discovery:['disc_obj4'],companionBonus:{spe:2,proserv:1},boonBonus:{merchant_loyalty:2}},
    {label:'Capital only',desc:'The easiest Objective 4 entry point.'},
    {label:'Not a priority this year',desc:'Pricing transformation is enough change.'}]},
  {id:'r_raid',title:'The Competitor Raid',emoji:'\u2694\uFE0F',type:'defend',chapter:4,flavor:'Adyen goes directly after OrderOS\'s top 50 restaurant groups \u2014 and the new VP of Payments came from an Adyen shop.',signals:[
    {type:'red',text:'Top 50 groups = 30% of volume'},
    {type:'yellow',text:'New VP has no history with Stripe'},
    {type:'green',text:'\u{1F50D} Your scouting: Adyen is offering the top 50 IC++ with a one-year rate lock',reveal:'disc_competition'}],choices:[
    {label:'Defend with total value: pricing + risk + Objective 4 lock-in',desc:'IC++/segmentation, Managed Risk or Radar, embedded finance, and the activation plan.',useDice:true,diceStat:'execAccess',diceThreshold:13,discovery:['disc_competition','disc_exec'],companionBonus:{partner:2,proserv:1,tam:1},boonBonus:{msap:2,treasury_key:2,smr_aegis:2,pricing_forge:1}},
    {label:'Co-sell with SPE + Partner: roadmap and switching cost',desc:'Bring the Stripe Partner Ecosystem and the SI to the table.'},
    {label:'Offer the top 50 a blanket rate cut',desc:'Neutralize the price.'}]},

  // Ch5 Grand Renewal
  {id:'r_renewal',title:'The Grand Renewal',emoji:'\u{1F451}',type:'finale',chapter:5,flavor:'Contract renewal on a $950M platform. The entire industry is watching.',choices:[
    {label:'Full Suite: IC++ + Managed Risk + Objective 4 Products',desc:'Passthrough pricing, Stripe-owned risk, and embedded finance.',requires:{flag:'on_icpp'}},
    {label:'Segmented Buy Rate + Radar Pro + Objective 4 Products',desc:'Platform Pricing Tool segmentation with in-house risk on the most advanced Radar plan.'},
    {label:'Imperial Alliance: IC++ + SMR + Objective 4 + SPE co-sell',desc:'The deepest partnership: every lever, plus joint go-to-market.',hidden:true,requires:{flag:'defended',companionCount:3}},
    {label:'Buy Rate Optimization Only',desc:'Incremental improvement. Minimal disruption, minimal upside.'}]},
];

export const CAMPAIGNS: Record<string, Encounter[]> = { fitness: FITNESS, property: PROPERTY, restaurant: RESTAURANT };
