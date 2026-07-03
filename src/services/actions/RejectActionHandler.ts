import { ProcessService } from "../ProcessService";
import { LeaveRepository } from "../../repositories/LeaveRepository";
import { RequestRepository } from "../../repositories/RequestRepository";
import { ILeaveOfAbsence } from "../../models";
import { IRequestActionInput } from "../../types/RequestActionType";
import { WorkflowAction } from "../../constants/enums";
import {
  mapActionToRequestStatus,
  mapActionToStepStatus,
} from "../../utils/WorkflowStatusMapper";
import { WorkflowHistoryService } from "../workflow/WorkflowHistoryService";
import { WorkflowValidationService } from "../workflow/WorkflowValidationService";

export class RejectActionHandler {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();
  private _processService = new ProcessService();
  private _historyService = new WorkflowHistoryService();
  private _validationService = new WorkflowValidationService();

  async handle(input: IRequestActionInput): Promise<ILeaveOfAbsence> {
    const now = new Date().toISOString();
    const action = WorkflowAction.Rejected;

    const request = await this._requestRepo.getRequestById(input.requestId);

    this._validationService.validateProcessableRequest(
      request,
      input.currentUser.Id,
    );

    const leave = await this._leaveRepo.getLeaveById(request.AbsenceIDId);

    const currentStepOrder = request.CurrentStep;

    if (!currentStepOrder) {
      throw new Error("Request không có CurrentStep.");
    }

    const stepInfo = await this._processService.getStepInfo(
      leave.ProcessIDId,
      currentStepOrder,
    );

    const requestStatus = mapActionToRequestStatus(action);
    const stepStatus = mapActionToStepStatus(action);

    const updatedHistoryStep =
      this._historyService.rejectCurrentHistoryStep({
        historyStep: leave.HistoryStep ?? [],
        currentStepOrder,
        now,
        action,
        stepStatus,
      });

    const updatedHistoryApproval =
      this._historyService.appendHistoryApproval({
        oldHistory: request.HistoryApproval,
        requestId: request.Id,
        stepOrder: currentStepOrder,
        stepName: stepInfo.step.Title,
        actor: input.currentUser,
        action,
        now,
        comment: input.comment,
      });

    await this._leaveRepo.updateLeaveFlow({
      id: leave.Id,
      statusRequest: requestStatus,
      statusStep: stepStatus,
      indexOfStep: currentStepOrder,
      stepName: stepInfo.step.Title,
      approvedById: input.currentUser.Id,
      historyStep: updatedHistoryStep,
    });

    await this._requestRepo.updateRequest({
      id: request.Id,
      status: requestStatus,
      currentApproverId: input.currentUser.Id,
      currentStep: currentStepOrder,
      currentStepName: stepInfo.step.Title,
      historyApproval: updatedHistoryApproval,
    });

    return this._leaveRepo.getLeaveById(leave.Id);
  }
}