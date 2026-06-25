import { LeaveRepository } from "../repositories/LeaveRepository";
import { RequestRepository } from "../repositories/RequestRepository";
import { ILeaveOfAbsence, IRequest } from "../models";
import { RequestStatus } from "../constants/enums";

export class LeaveQueryService {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();

  async getMyLeaves(
    currentUserId: number,
    statusFilter?: RequestStatus,
  ): Promise<ILeaveOfAbsence[]> {
    return this._leaveRepo.getMyLeaves(currentUserId, statusFilter);
  }

  async getPendingApprovals(approverId: number): Promise<ILeaveOfAbsence[]> {
    return this._leaveRepo.getPendingApprovals(approverId);
  }

  async getLeaveDetail(leaveId: number): Promise<{
    leave: ILeaveOfAbsence;
    activeRequest: IRequest | undefined;
    allRequests: IRequest[];
  }> {
    const [leave, activeRequest] = await Promise.all([
      this._leaveRepo.getLeaveById(leaveId),
      this._requestRepo.getActiveRequestByLeave(leaveId),
    ]);

    return {
      leave,
      activeRequest,
      allRequests: activeRequest ? [activeRequest] : [],
    };
  }
}