import { ILeaveOfAbsence, IRequest, IWorkflowStep } from "../models"

export interface ApproveStepInput {
  leaveId: number;
  requestId: number;
  isLastStep: boolean;
  stepHistory: IWorkflowStep;
  comment?: string;
}

export interface RejectLeaveInput {
  leaveId: number;
  requestId: number;
  stepOrder: number;
  stepName: string;
  approverEmail: string;
  comment: string;
}

export interface RecallLeaveInput {
  leaveId: number;
  requestId: number;
  recallerEmail: string;
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