import type { Worker, DailyBreakdown, PayrollEntry } from '../types';

export const FRINGE = 12.61;
export const FED = 0.22;
export const SS = 0.062;
export const MED = 0.0145;
export const TAX_RATE = FED + SS + MED;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function deriveRates(regularRate: number) {
  const otRate = regularRate * 1.5;
  const baseReg = regularRate - FRINGE;
  const otBase = otRate - FRINGE;
  return { otRate, baseReg, otBase };
}

function calcNet(T: number, baseReg: number, otBase: number): number {
  const rH = Math.min(T, 40);
  const oH = Math.max(0, T - 40);
  const base = rH * baseReg + oH * otBase;
  return T * FRINGE + base * (1 - TAX_RATE);
}

export function solveHours(checkAmount: number, baseReg: number, otBase: number): number {
  let lo = 0, hi = 200;
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    calcNet(mid, baseReg, otBase) < checkAmount ? (lo = mid) : (hi = mid);
  }
  return (lo + hi) / 2;
}

export function buildDailyBreakdown(
  T: number,
  workDays: number[],
  baseReg: number,
  otBase: number
): DailyBreakdown[] {
  const hrsPerDay = T / workDays.length;
  let cum = 0;
  return workDays.map((dayIdx) => {
    const s = cum;
    const e = cum + hrsPerDay;
    let ntH = 0, otH = 0;
    if (e <= 40) { ntH = hrsPerDay; otH = 0; }
    else if (s >= 40) { ntH = 0; otH = hrsPerDay; }
    else { ntH = 40 - s; otH = e - 40; }
    cum = e;
    return {
      dayName: DAY_NAMES[dayIdx],
      totalHours: hrsPerDay,
      ntHours: ntH,
      otHours: otH,
      ntFringe: ntH * FRINGE,
      ntBase: ntH * baseReg,
      otFringe: otH * FRINGE,
      otBase: otH * otBase,
      dayTotal: ntH * (FRINGE + baseReg) + otH * (FRINGE + otBase),
    };
  });
}

export function buildPayrollEntry(
  checkAmount: number,
  worker: Worker,
  workDays: number[],
  weekNumber: number,
  weekLabel: string,
  payPeriodStart: string,
  payPeriodEnd: string
): Omit<PayrollEntry, 'id' | 'createdAt'> {
  const { otRate, baseReg, otBase } = deriveRates(worker.regularRate);
  const T = solveHours(checkAmount, baseReg, otBase);
  const regH = Math.min(T, 40);
  const otH = Math.max(0, T - 40);
  const base = regH * baseReg + otH * otBase;
  const fringe = T * FRINGE;
  const gross = base + fringe;
  const taxes = base * TAX_RATE;
  const netPay = gross - taxes;
  const daily = buildDailyBreakdown(T, [...workDays].sort((a, b) => a - b), baseReg, otBase);
  const ntFringe = daily.reduce((s, d) => s + d.ntFringe, 0);
  const ntBase = daily.reduce((s, d) => s + d.ntBase, 0);
  const otFringe = daily.reduce((s, d) => s + d.otFringe, 0);
  const otBaseSum = daily.reduce((s, d) => s + d.otBase, 0);
  return {
    projectId: worker.projectId,
    workerId: worker.id,
    weekNumber,
    weekLabel,
    payPeriodStart,
    payPeriodEnd,
    checkAmount,
    workDays,
    totalHours: T,
    regularHours: regH,
    overtimeHours: otH,
    hoursPerDay: T / workDays.length,
    grossPay: gross,
    regularPay: regH * worker.regularRate,
    overtimePay: otH * otRate,
    fringeTotal: ntFringe + otFringe,
    baseTotal: ntBase + otBaseSum,
    taxableBase: base,
    federalTax: base * FED,
    socialSecurityTax: base * SS,
    medicareTax: base * MED,
    totalTaxes: taxes,
    netPay,
    netWithoutFringe: netPay - fringe,
    dailyBreakdown: daily,
  };
}
