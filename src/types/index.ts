export interface Project {
  id: string;
  name: string;
  gc: string;
  address: string;
  logo: string | null;
  superintendent: { name: string; phone: string; email: string };
  contactPerson: { name: string; phone: string; email: string };
  createdAt: string;
}

export interface Worker {
  id: string;
  projectId: string;
  name: string;
  trade: string;
  regularRate: number;
}

export interface DailyBreakdown {
  dayName: string;
  totalHours: number;
  ntHours: number;
  otHours: number;
  ntFringe: number;
  ntBase: number;
  otFringe: number;
  otBase: number;
  dayTotal: number;
}

export interface PayrollEntry {
  id: string;
  projectId: string;
  workerId: string;
  weekNumber: number;
  weekLabel: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  checkAmount: number;
  workDays: number[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  hoursPerDay: number;
  grossPay: number;
  regularPay: number;
  overtimePay: number;
  fringeTotal: number;
  baseTotal: number;
  taxableBase: number;
  federalTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  totalTaxes: number;
  netPay: number;
  netWithoutFringe: number;
  dailyBreakdown: DailyBreakdown[];
  createdAt: string;
}

export interface AppData {
  projects: Project[];
  workers: Worker[];
  payrollEntries: PayrollEntry[];
}
