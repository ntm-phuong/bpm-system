import { RequestStatus, WorkflowAction } from "../constants/enums";
import { ICreateLeaveInput } from "../repositories/LeaveRepository";
import { LeaveSubmitService } from "./LeaveSubmitService";
import { LeaveQueryService } from "./LeaveQueryService";
import { RequestActionService } from "./RequestActionService";
import { ApproveStepInput, RejectLeaveInput } from "../types/LeaveServiceType";

export class LeaveService {
  private _submitService = new LeaveSubmitService();
  private _requestActionService = new RequestActionService();
  private _queryService = new LeaveQueryService();

  submitLeave(input: ICreateLeaveInput) {
    return this._submitService.submitLeave(input);
  }

  approveStep(input: ApproveStepInput) {
    return this._requestActionService.processAction({
      ...input,
      action: WorkflowAction.Approved,
    });
  }

  rejectLeave(input: RejectLeaveInput) {
    return this._requestActionService.processAction({
      ...input,
      action: WorkflowAction.Rejected,
    });
  }

  // recallLeave(input: RecallLeaveInput) {
  //   return this._requestActionService.processAction(input);
  // }

  getMyLeaves(currentUserId: number, statusFilter?: RequestStatus) {
    return this._queryService.getMyLeaves(currentUserId, statusFilter);
  }

  getLeaveDetail(leaveId: number) {
    return this._queryService.getLeaveDetail(leaveId);
  }
}
