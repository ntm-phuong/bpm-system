import { ProcessService } from "./ProcessService";
import {
  LeaveRepository,
  ICreateLeaveInput,
} from "../repositories/LeaveRepository";
import { RequestRepository } from "../repositories/RequestRepository";
import { StepStatus, RequestStatus } from "../constants/enums";
import { IHistoryApproval } from "../models";
import { ISubmitLeaveResult } from "../types/LeaveServiceType";

export class LeaveSubmitService {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();
  private _processService = new ProcessService();

  async submitLeave(input: ICreateLeaveInput): Promise<ISubmitLeaveResult> {
    const leave = await this._leaveRepo.createLeave(input);

    const firstStep = await this._processService.getFirstStepApprover(
      input.ProcessIDId,
    );

    const approverId = firstStep.Approver?.Id ?? input.ManagerId;

    if (approverId == null) {
      throw new Error(
        `Step ${firstStep.StepOrder} chưa được cấu hình Approver và đơn cũng không có ManagerId`,
      );
    }

    await this._leaveRepo.updateLeaveFlow({
      id: leave.Id,
      statusRequest: RequestStatus.Pending,
      statusStep: StepStatus.Pending,
      indexOfStep: firstStep.StepOrder,
      approvedById: approverId,
    });

    const historyApproval: IHistoryApproval[] = [
      {
        action: "Submitted",
        stepOrder: firstStep.StepOrder,
        stepName: firstStep.Title,
        // // actorId: leave.Author?.Id,
        // actorName: leave.Author?.Title,
        // actorEmail: leave.Author?.EMail,
        approverId,
        approverName: firstStep.Approver?.Title,
        approverEmail: firstStep.Approver?.EMail,
        actionTime: new Date().toISOString(),
      },
    ];

    const request = await this._requestRepo.createRequest({
      absenceIDId: leave.Id,
      approverId,
      currentStep: firstStep.StepOrder,
      department: leave.Author?.Title,
      historyApproval,
    });

    const updatedLeave = await this._leaveRepo.getLeaveById(leave.Id);

    return {
      leave: updatedLeave,
      request,
      nextApproverName: firstStep.Approver?.Title || "Người quản lý",
    };
  }
}