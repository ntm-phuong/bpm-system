import { RequestStatus, StepStatus } from "../constants/enums";
import { IPerson } from "./IPerson";
import { IWorkflowStep } from "./IWorkflowStep";

export interface ILeaveOfAbsence {
  Id: number;
  Title: string;

  ProcessIDId: number;

  ApprovedById?: number | null;
  ApprovedBy?: IPerson | null;

 

  RequesterId?: number;
  Requester?: IPerson;

  AbsenceType: string;
  PartialDay: string;
  AbsenceDates: string;
  RequestReason?: string;
  TotalDays: number;

  ManagerId?: number | null;
  Manager?: IPerson | null;

  NotifyToId?: number | null;
  NotifyTo?: IPerson | null;

  LateEarlyHours?: number;

  IndexOfStep?: number;
  StepName?: string;
  StatusStep?: StepStatus;
  StatusRequest?: RequestStatus;

  HistoryStep?: IWorkflowStep[];
}