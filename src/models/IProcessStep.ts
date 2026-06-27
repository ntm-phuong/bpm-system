import { IPerson } from "./IPerson";

export interface IProcessStep {
  Id: number;
  Title: string;
  ProcessIDId: number;
  ProcessCode: string;
  StepOrder: number;

  StepApprover?: IPerson | null;
  StepApproverId?: number | null;

  IsActive: boolean;
  SLA_Hours?: number;
  BeforeSLA?: number;
}