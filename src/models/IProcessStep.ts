import { IPerson } from "./IPerson";

export interface IProcessStep {
  Id: number;
  Title: string;         
  ProcessIDId: number;
  ProcessCode: string;
  StepOrder: number;
  Approver?: IPerson;
  ApproverId?: number;
  IsActive: boolean;
  SLA_Hours?: number;
  BeforeSLA?: number;
  ExpectedSLA?: number;
  ActualSLA?: number;
  CompletedSLA?: boolean;
}