import { GameState, Stats, StatKey, ChoiceOutcome, CounterfactualSet, LogEntry, EncChoice } from '../types';
import { PLATFORMS, STAT_META, COMPANIONS, BOONS, DISCOVERY } from '../data/constants';
import { getActiveEncounters } from './resolveChoice';

export function initGame(pid: string): GameState {
  const p = PLATFORMS.find(x => x.id === pid)!;
  return {
    phase: 'briefing',
    platformId: pid,
    currentEncIdx: 0,
    stats: { ...p.startStats },
    companions: ['sa'],
    boons: [],
    companionAbilitiesUsed: [],
    stage: p.startStage,
    journey: p.startJourney,
    revenue: 0,
    flags: [],
    choiceIdx: -1,
    diceResult: 0,
    diceModifiers: [],
    diceTotal: 0,
    resultMsg: '',
    resultLearn: '',
    resultRev: 0,
    resultStatChanges: {},
    counterfactuals: {},
    log: [],
    mistakes: [],
    sidebarOpen: false,
    currentChapter: 1,
    pendingChapterIntro: 0,
  };
}

export function calculateDiceModifiers(gs: GameState, choice: EncChoice): { label: string; value: number }[] {
  const mods: { label: string; value: number }[] = [];
  if (choice.diceStat) {
    const b = Math.floor(gs.stats[choice.diceStat] / 25);
    if (b > 0) mods.push({ label: STAT_META[choice.diceStat].label + ' (' + gs.stats[choice.diceStat] + ')', value: b });
  }
  if (choice.companionBonus) {
    for (const [cid, bonus] of Object.entries(choice.companionBonus)) {
      if (gs.companions.includes(cid)) {
        const c = COMPANIONS.find(x => x.id === cid);
        if (c) mods.push({ label: c.name, value: bonus });
      }
    }
  }
  if (choice.boonBonus) {
    for (const [bid, bonus] of Object.entries(choice.boonBonus)) {
      if (gs.boons.includes(bid)) {
        const b = BOONS.find(x => x.id === bid);
        if (b) mods.push({ label: b.name, value: bonus });
      }
    }
  }
  // v11: discovery is the main dice modifier. Uncovered = +2 each, missing = -2 each.
  if (choice.discovery) {
    for (const flag of choice.discovery) {
      const d = DISCOVERY[flag];
      const name = d ? d.label : flag;
      if (gs.flags.includes(flag)) mods.push({ label: '\u{1F50D} Discovery: ' + name, value: 2 });
      else mods.push({ label: '\u2753 Guessing: ' + name, value: -2 });
    }
  }
  return mods;
}

/** v11: journey phase can never trail what the platform has actually done. */
export function journeyFloor(stage: number, flags: string[], boons: string[]): number {
  let j = 0;
  if (flags.includes('facilitate_only')) j = 1;
  if (stage >= 1) j = 2;
  if (boons.includes('speed_talisman') || flags.includes('attach_win') || flags.includes('terminal_attach')) j = Math.max(j, 3);
  if (boons.includes('treasury_key') || boons.includes('merchant_loyalty') || flags.includes('obj4_bundle')) j = Math.max(j, 4);
  return j;
}

export function applyOutcome(
  gs: GameState,
  result: { outcome: ChoiceOutcome; counterfactuals: CounterfactualSet },
  choiceIdx: number,
  diceRoll?: number,
  diceTotal?: number
): GameState {
  const outcome = result.outcome;
  const encs = getActiveEncounters(gs.platformId, gs);
  const enc = encs[gs.currentEncIdx];
  const choice = enc.choices[choiceIdx];

  const newStats = { ...gs.stats };
  for (const [k, v] of Object.entries(outcome.stats)) {
    newStats[k as StatKey] = Math.max(0, Math.min(100, newStats[k as StatKey] + (v as number)));
  }

  let newC = [...gs.companions];
  if (outcome.unlockCompanion && !newC.includes(outcome.unlockCompanion)) newC.push(outcome.unlockCompanion);

  let newB = [...gs.boons];
  if (outcome.unlockBoon && !newB.includes(outcome.unlockBoon)) newB.push(outcome.unlockBoon);

  let newF = [...gs.flags];
  if (outcome.addFlag) outcome.addFlag.split(',').forEach(f => { if (!newF.includes(f.trim())) newF.push(f.trim()); });

  let newStage = outcome.advanceStage !== undefined ? Math.max(gs.stage, outcome.advanceStage) : gs.stage;
  if (outcome.revertStage !== undefined) newStage = outcome.revertStage;

  const newJ = Math.max(gs.journey || 0, outcome.advanceJourney || 0, journeyFloor(newStage, newF, newB));

  const newM = outcome.mistake ? [...gs.mistakes, outcome.mistake] : gs.mistakes;
  let discoveryNote: string | undefined;
  if (diceRoll !== undefined && gs.diceModifiers.length) {
    const d = gs.diceModifiers.filter(m => m.label.includes('Discovery:') || m.label.includes('Guessing:'));
    if (d.length) discoveryNote = d.map(m => (m.value > 0 ? '+' : '') + m.value + ' ' + m.label.replace(/^\S+ /, '')).join(' \u00B7 ');
  }
  const logEntry: LogEntry = { nodeId: enc.id, title: enc.title, choiceLabel: choice.label, msg: outcome.msg, rev: outcome.rev, diceRoll, diceTotal, journey: newJ, discoveryNote };

  return {
    ...gs,
    phase: 'result',
    stats: newStats,
    companions: newC,
    boons: newB,
    flags: newF,
    stage: newStage,
    journey: newJ,
    revenue: gs.revenue + outcome.rev,
    resultMsg: outcome.msg,
    resultLearn: outcome.learn,
    resultRev: outcome.rev,
    resultStatChanges: outcome.stats,
    counterfactuals: result.counterfactuals,
    log: [...gs.log, logEntry],
    mistakes: newM,
  };
}

export function isChoiceAvailable(gs: GameState, choice: EncChoice): boolean {
  if (!choice.requires) return true;
  const r = choice.requires;
  if (r.companion && !gs.companions.includes(r.companion)) return false;
  if (r.boon && !gs.boons.includes(r.boon)) return false;
  if (r.stat && gs.stats[r.stat[0]] < r.stat[1]) return false;
  if (r.flag && !gs.flags.includes(r.flag)) return false;
  if (r.stage !== undefined && gs.stage < r.stage) return false;
  if (r.companionCount !== undefined && gs.companions.length < r.companionCount) return false;
  return true;
}

export function getLetterGrade(val: number): { letter: string; color: string } {
  if (val >= 80) return { letter: 'A', color: '#e8cc5c' };
  if (val >= 65) return { letter: 'B+', color: '#3a8a50' };
  if (val >= 50) return { letter: 'B', color: '#5a9' };
  if (val >= 35) return { letter: 'C+', color: '#d4812a' };
  if (val >= 20) return { letter: 'C', color: '#c04040' };
  return { letter: 'D', color: '#a33' };
}

export function getArchetype(stats: Stats): { name: string; desc: string } {
  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const top2 = sorted.slice(0, 2).map(s => s[0]);
  if (top2.includes('trust') && top2.includes('execAccess')) return { name: 'The Diplomat', desc: 'Builds relationships at every level.' };
  if (top2.includes('trust') && top2.includes('productMastery')) return { name: 'The Strategist', desc: 'Long-term value player.' };
  if (top2.includes('techCred') && top2.includes('productMastery')) return { name: 'The Architect', desc: 'Technically deep. Designs solutions that last.' };
  if (top2.includes('execAccess') && top2.includes('techCred')) return { name: 'The Closer', desc: 'Gets things done at the top with technical backing.' };
  const min = Math.min(...Object.values(stats));
  if (min >= 40) return { name: 'The Complete AE', desc: 'Balanced across all dimensions.' };
  return { name: 'The Specialist', desc: 'Deep expertise in key areas, with room to grow.' };
}

export function calculateFinalScore(gs: GameState) {
  const base = gs.revenue + (gs.stats.trust * 1000) + (gs.stats.techCred * 800) + (gs.stats.execAccess * 600) + (gs.stats.productMastery * 700);
  const minStat = Math.min(gs.stats.trust, gs.stats.techCred, gs.stats.execAccess, gs.stats.productMastery);
  let balanceBonus = 0;
  if (minStat >= 50) balanceBonus = 0.25;
  else if (minStat >= 30) balanceBonus = 0.15;
  else if (minStat < 15) balanceBonus = -0.20;
  const mistakePenalty = Math.min(0.6, gs.mistakes.length * 0.08);
  // v11: reward discovery and progress along the journey (Objective 4 = Retain).
  const discovered = Object.keys(DISCOVERY).filter(k => gs.flags.includes(k)).length;
  const discoveryBonus = discovered * 0.04;
  const journeyBonus = (gs.journey || 0) >= 4 ? 0.15 : (gs.journey || 0) >= 3 ? 0.07 : 0;
  const total = Math.round(base * (1 + balanceBonus + discoveryBonus + journeyBonus) * (1 - mistakePenalty));
  const rf = gs.platformId === 'restaurant' ? 1.7 : 1;
  const rv = gs.revenue / rf;
  const revGrade = rv >= 600000 ? { letter: 'A', color: '#e8cc5c' } : rv >= 400000 ? { letter: 'B+', color: '#3a8a50' } : rv >= 200000 ? { letter: 'B', color: '#5a9' } : rv >= 80000 ? { letter: 'C+', color: '#d4812a' } : rv >= 0 ? { letter: 'C', color: '#c04040' } : { letter: 'D', color: '#a33' };
  return { total, revGrade, balanceBonus, mistakePenalty, discovered, discoveryBonus, journeyBonus, archetype: getArchetype(gs.stats) };
}
