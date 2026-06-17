import { RequestStatus, StepStatus } from "../constants/enums";
import { IPerson } from "./IPerson";

export interface ILeaveOfAbsence {
  Id: number;
  Title: string;
  ProcessIDId: number;
  ApprovedById?: number;
  ApprovedBy?: IPerson;
  AuthorId?: number;
  Author?: IPerson;        
  AbsenceType: string;
  RequestedTime: string;
  AbsenceDates: string;    
  TotalDays: number;
  ManagerId?: number;
  Manager?: IPerson;
  NotifyToId?: number;
  NotifyTo?: IPerson;
  LateEarlyHours?: number;
  IndexOfStep?: number;
  StatusStep?: StepStatus;
  StatusRequest?: RequestStatus;
  HistoryStep?: string;   
}