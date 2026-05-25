export type UnitCondition = 'Breakdown' | 'Running With Trouble' | 'Running Without Trouble' | string;
export type UC3Status = 'Done' | 'Inprogress' | 'waiting Part' | 'None' | string;
export type WorkStatus = 'RFU_LEAD JOB' | 'Inprogress' | 'Delay Labour' | 'Not Progress' | string;

export interface SRRecord {
  id: string; // Unique local or sheet row ID
  customer: string;
  srNumber: string;
  woNumber: string;
  uc3Number: string;
  uc3Status: UC3Status;
  srDate: string; // YYYY-MM-DD or readable date
  srAging: number;
  planningDate: string;
  actionDate: string;
  rfuDate: string;
  unitCondition: UnitCondition;
  snUnit: string;
  model: string;
  issueDescription: string;
  location: string;
  labour1: string;
  labour2: string;
  status: WorkStatus;
  leadJobDescription: string;
}

export interface DashboardStats {
  totalSRs: number;
  breakdownCount: number;
  runningWithTroubleCount: number;
  runningWithoutTroubleCount: number;
  doneCount: number;
  inProgressCount: number;
  avgAging: number;
}
