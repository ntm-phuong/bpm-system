import { LeaveRepository } from "../repositories/LeaveRepository";
import { RequestRepository } from "../repositories/RequestRepository";
import {
  ILeaveOfAbsence,
  IRequest,
} from "../models";
import { RequestStatus } from "../constants/enums";

export class LeaveQueryService {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();

  async getMyLeaves(
    currentUserId: number,
    statusFilter?: RequestStatus
  ): Promise<ILeaveOfAbsence[]> {
    return this._leaveRepo.getMyLeaves(currentUserId, statusFilter);
  }


  async getLeaveDetail(leaveId: number): Promise<{
    leave: ILeaveOfAbsence;
    activeRequest: IRequest | undefined;
    allRequests: IRequest[];
  }> {
    const [leave, allRequests] = await Promise.all([
      this._leaveRepo.getLeaveById(leaveId),
      this._requestRepo.getRequestsByLeave(leaveId),
    ]);

    const activeRequest = allRequests.find(
      request => request.Status === RequestStatus.Pending
    );

    return {
      leave,
      activeRequest,
      allRequests,
    };
  }
}