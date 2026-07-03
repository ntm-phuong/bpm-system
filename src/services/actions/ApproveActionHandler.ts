import { ProcessService } from "../ProcessService";
import { LeaveRepository } from "../../repositories/LeaveRepository";
import { RequestRepository } from "../../repositories/RequestRepository";
import { IApproveResult } from "../../types/LeaveServiceType";
import { IRequestActionInput } from "../../types/RequestActionType";
import { StepStatus, WorkflowAction } from "../../constants/enums";
import {
  mapActionToRequestStatus,
  mapActionToStepStatus,
} from "../../utils/WorkflowStatusMapper";
import { WorkflowHistoryService } from "../workflow/WorkflowHistoryService";
import { WorkflowValidationService } from "../workflow/WorkflowValidationService";

export class ApproveActionHandler {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();
  private _processService = new ProcessService();
  private _historyService = new WorkflowHistoryService();
  private _validationService = new WorkflowValidationService();

  async handle(input: IRequestActionInput): Promise<IApproveResult> {
    const now = new Date().toISOString();
    const action = WorkflowAction.Approved;

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

    const isFinalStep = stepInfo.isLastStep || !stepInfo.nextStep;

    const requestStatus = mapActionToRequestStatus(action, isFinalStep);
    const stepStatus = mapActionToStepStatus(action);

    const updatedHistoryStep = this._historyService.approveCurrentHistoryStep({
      historyStep: leave.HistoryStep ?? [],
      currentStepOrder,
      nextStepOrder: stepInfo.nextStep?.StepOrder,
      now,
      action,
      stepStatus,
    });

    const updatedHistoryApproval = this._historyService.appendHistoryApproval({
      oldHistory: request.HistoryApproval,
      requestId: request.Id,
      stepOrder: currentStepOrder,
      stepName: stepInfo.step.Title,
      actor: input.currentUser,
      action,
      now,
      comment: input.comment,
    });

    if (isFinalStep) {
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

      const completedLeave = await this._leaveRepo.getLeaveById(leave.Id);

      return {
        isCompleted: true,
        leave: completedLeave,
      };
    }

    const nextStep = stepInfo.nextStep;

    if (!nextStep) {
      throw new Error("Không tìm thấy bước tiếp theo.");
    }

    await this._leaveRepo.updateLeaveFlow({
      id: leave.Id,
      statusRequest: requestStatus,
      statusStep: StepStatus.Pending,
      indexOfStep: nextStep.StepOrder,
      stepName: nextStep.Title,
      approvedById: nextStep.StepApproverId ?? undefined,
      historyStep: updatedHistoryStep,
    });

    await this._requestRepo.updateRequest({
      id: request.Id,
      status: requestStatus,
      currentApproverId: nextStep.StepApproverId ?? null,
      currentStep: nextStep.StepOrder,
      currentStepName: nextStep.Title,
      historyApproval: updatedHistoryApproval,
    });

    const updatedLeave = await this._leaveRepo.getLeaveById(leave.Id);

    return {
      isCompleted: false,
      leave: updatedLeave,
      nextApproverName:
        nextStep.StepApprover?.Title ?? "Chưa có người phụ trách",
    };
  }
}
