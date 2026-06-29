import { RequestStatus } from "../constants/enums";
import { IHistoryApproval } from "./IHistoryApproval";
import { IPerson } from "./IPerson";

export interface IRequest {
  Id: number;
  Title: string;
  Created?: string;

  AbsenceIDId: number;
  AbsenceTitle?: string;

  ProcessIDId?: number;
  ProcessTitle?: string;

  RequesterId?: number;
  Requester?: IPerson;

  CurrentApproverId?: number | null;
  CurrentApprover?: IPerson | null;

  CurrentStep?: number;
  CurrentStepName?: string;
  Status: RequestStatus;

  IsEmergency?: boolean;
  Department?: string;

  HistoryApproval?: string | IHistoryApproval[];
}