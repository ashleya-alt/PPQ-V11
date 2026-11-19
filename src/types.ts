export interface Stats {
  trust: number;
  techCred: number;
  execAccess: number;
  productMastery: number;
}

export type StatKey = keyof Stats;

export interface CompanionDef {
  id: string;
  name: string;
  emoji: string;
  title: string;
  desc: string;
  passive: string;
}

export interface BoonDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  effect: string;
}

export interface Platform {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  volume: number;
  startStage: number;
  startJourney: number;
  startStats: Stats;
  briefing: string;
  journeyLabel: string;
}

export interface ChapterDef {
  title: string;
  emoji: string;
  flavor: string;
}

export interface EncChoice {
  label: string;
  desc: string;
  hidden?: boolean;
  requires?: {
    companion?: string;
    boon?: string;
    stat?: [StatKey, number];
    flag?: string;
    stage?: number;
    companionCount?: number;
  };
  useDice?: boolean;
  /** Discovery flags this dice roll depends on: +2 each if uncovered, -2 each if not */
  discovery?: string[];
  diceStat?: StatKey;
  diceThreshold?: number;
  companionBonus?: Record<string, number>;
  boonBonus?: Record<string, number>;
}

export type SignalType = 'green' | 'yellow' | 'red';

export interface Signal {
  type: SignalType;
  text: string;
  /** Hidden signal: only shown if this discovery flag was uncovered */
  reveal?: string;
}

export interface Encounter {
  id: string;
  title: string;
  emoji: string;
  type: 'stage_transition' | 'crisis' | 'opportunity' | 'companion' | 'boss' | 'finale' | 'training' | 'technical' | 'consequence' | 'discovery' | 'defend';
  flavor: string;
  chapter: number;
  signals?: Signal[];
  choices: EncChoice[];
  conditional?: (gs: GameState) => boolean;
}

export interface ChoiceOutcome {
  msg: string;
  learn: string;
  rev: number;
  stats: Partial<Stats>;
  unlockCompanion?: string;
  unlockBoon?: string;
  addFlag?: string;
  advanceStage?: number;
  revertStage?: number;
  advanceJourney?: number;
  mistake?: string;
}

export interface CounterfactualSet {
  [choiceIdx: number]: string;
}

export interface LogEntry {
  nodeId: string;
  title: string;
  choiceLabel: string;
  msg: string;
  rev: number;
  diceRoll?: number;
  diceTotal?: number;
  journey?: number;
  discoveryNote?: string;
}

export interface GameState {
  phase: 'briefing' | 'chapterIntro' | 'encounter' | 'dice' | 'result' | 'ended';
  platformId: string;
  currentEncIdx: number;
  stats: Stats;
  companions: string[];
  boons: string[];
  companionAbilitiesUsed: string[];
  stage: number;
  journey: number;
  revenue: number;
  flags: string[];
  choiceIdx: number;
  diceResult: number;
  diceModifiers: { label: string; value: number }[];
  diceTotal: number;
  resultMsg: string;
  resultLearn: string;
  resultRev: number;
  resultStatChanges: Partial<Stats>;
  counterfactuals: CounterfactualSet;
  log: LogEntry[];
  mistakes: string[];
  sidebarOpen: boolean;
  currentChapter: number;
  pendingChapterIntro: number;
}
