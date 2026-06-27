import { ILeaveOfAbsence, IRequest } from "../models";

export interface IActionUser {
  Id: number;
  Title?: string;
  EMail?: string;
}

export interface ApproveStepInput {
  requestId: number;
  currentUser: IActionUser;
  comment?: string;
}

export interface RejectLeaveInput {
  requestId: number;
  currentUser: IActionUser;
  comment?: string;
}

export interface RecallLeaveInput {
  requestId: number;
  currentUser: IActionUser;
  comment?: string;
}

export interface ISubmitLeaveResult {
  leave: ILeaveOfAbsence;
  request: IRequest;
  nextApproverName: string;
}

export interface IApproveResult {
  isCompleted: boolean;
  leave: ILeaveOfAbsence;
  nextApproverName?: string;
}