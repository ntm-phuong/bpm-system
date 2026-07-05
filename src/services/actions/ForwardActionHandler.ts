import { ProcessService } from "../ProcessService";
import { LeaveRepository } from "../../repositories/LeaveRepository";
import { RequestRepository } from "../../repositories/RequestRepository";
import { ILeaveOfAbsence } from "../../models";
import { IRequestActionInput } from "../../types/RequestActionType";
import {
  RequestStatus,
  StepStatus,
  WorkflowAction,
} from "../../constants/enums";
import { WorkflowHistoryService } from "../workflow/WorkflowHistoryService";
import { WorkflowValidationService } from "../workflow/WorkflowValidationService";

export class ForwardActionHandler {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();
  private _processService = new ProcessService();
  private _historyService = new WorkflowHistoryService();
  private _validationService = new WorkflowValidationService();

  async handle(input: IRequestActionInput): Promise<ILeaveOfAbsence> {
    const now = new Date().toISOString();
    const action = WorkflowAction.Forwarded;

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

if (isFinalStep) {
  throw new Error("Đây là bước cuối cùng, không thể chuyển bước tiếp.");
}

const nextStep = stepInfo.nextStep;

if (!nextStep || !nextStep.StepApproverId) {
  throw new Error("Bước tiếp theo chưa có người phụ trách để chuyển bước.");
}

const nextAssignee = {
  Id: nextStep.StepApproverId,
  Title: nextStep.StepApprover?.Title,
  EMail: nextStep.StepApprover?.EMail,
};

const currentHistoryStep = this._historyService.updateCurrentStep({
  historyStep: leave.HistoryStep ?? [],
  currentStepOrder,
  now,
  action,
  stepStatus: StepStatus.Skipped,
  completedAt: now,
});

const updatedHistoryApproval = this._historyService.appendHistoryApproval({
  oldHistory: request.HistoryApproval,
  requestId: request.Id,
  stepOrder: currentStepOrder,
  stepName: stepInfo.step.Title,
  actor: input.currentUser,
  assignee: nextAssignee,
  action,
  now,
  comment: input.comment,
});

const nextHistoryStep = this._historyService.markNextStepPending({
  historyStep: currentHistoryStep,
  nextStepOrder: nextStep.StepOrder,
  now,
  assignee: nextAssignee,
});

    await this._leaveRepo.updateLeaveFlow({
      id: leave.Id,
      statusRequest: RequestStatus.Pending,
      statusStep: StepStatus.Pending,
      indexOfStep: nextStep.StepOrder,
      stepName: nextStep.Title,
      approvedById: nextStep.StepApproverId,
      historyStep: nextHistoryStep,
    });

    await this._requestRepo.updateRequest({
      id: request.Id,
      status: RequestStatus.Pending,
      currentApproverId: nextStep.StepApproverId,
      currentStep: nextStep.StepOrder,
      currentStepName: nextStep.Title,
      historyApproval: updatedHistoryApproval,
    });

    return this._leaveRepo.getLeaveById(leave.Id);
  }
}
