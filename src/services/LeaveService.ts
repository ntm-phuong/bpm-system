import { RequestStatus } from "../constants/enums";
import { ICreateLeaveInput } from "../repositories/LeaveRepository";
import { LeaveSubmitService } from "./LeaveSubmitService";
import { LeaveApprovalService } from "./LeaveApprovalService";
import { LeaveQueryService } from "./LeaveQueryService";
import {
  ApproveStepInput,
  RejectLeaveInput,
  RecallLeaveInput,
} from "../types/LeaveServiceType";

export class LeaveService {
  private _submitService = new LeaveSubmitService();
  private _approvalService = new LeaveApprovalService();
  private _queryService = new LeaveQueryService();

  submitLeave(input: ICreateLeaveInput) {
    return this._submitService.submitLeave(input);
  }

  approveStep(input: ApproveStepInput) {
    return this._approvalService.approveStep(input);
  }

  rejectLeave(input: RejectLeaveInput) {
    return this._approvalService.rejectLeave(input);
  }

  recallLeave(input: RecallLeaveInput) {
    return this._approvalService.recallLeave(input);
  }

  getMyLeaves(currentUserId: number, statusFilter?: RequestStatus) {
    return this._queryService.getMyLeaves(currentUserId, statusFilter);
  }

  getPendingApprovals(approverId: number) {
    return this._queryService.getPendingApprovals(approverId);
  }

  getLeaveDetail(leaveId: number) {
    return this._queryService.getLeaveDetail(leaveId);
  }
}