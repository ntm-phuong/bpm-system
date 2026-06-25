import { RequestStatus } from "../constants/enums";
import { IPerson } from "./IPerson";

export interface IRequest {
  Id: number;
  Title: string;
  AbsenceIDId: number;
  AbsenceTitle?: string;
  // ProcessCode?: string;
  Status: RequestStatus;
  ApproverId?: number;
  Approver?: IPerson;
  AuthorId?: number;
  Author?: IPerson;
  CurrentStep?: number;
  IsEmergency?: boolean;
  Department?: string;
  HistoryApproval?: string;
}
