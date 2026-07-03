import {
  IWorkflowStep,
  IHistoryApproval,
  parseHistoryApproval,
} from "../../models";
import { StepStatus, WorkflowAction } from "../../constants/enums";
import { IActionUser } from "../../types/RequestActionType";

export class WorkflowHistoryService {
  approveCurrentHistoryStep(params: {
    historyStep: IWorkflowStep[];
    currentStepOrder: number;
    nextStepOrder?: number;
    now: string;
    action: WorkflowAction;
    stepStatus: StepStatus;
  }): IWorkflowStep[] {
    return params.historyStep.map((step) => {
      if (step.stepOrder === params.currentStepOrder) {
        return {
          ...step,
          status: params.stepStatus,
          completedAt: params.now,
          action: params.action,
        };
      }

      if (params.nextStepOrder && step.stepOrder === params.nextStepOrder) {
        return {
          ...step,
          status: StepStatus.Pending,
          assignedAt: params.now,
        };
      }

      return step;
    });
  }

  rejectCurrentHistoryStep(params: {
    historyStep: IWorkflowStep[];
    currentStepOrder: number;
    now: string;
    action: WorkflowAction;
    stepStatus: StepStatus;
  }): IWorkflowStep[] {
    return params.historyStep.map((step) => {
      if (step.stepOrder === params.currentStepOrder) {
        return {
          ...step,
          status: params.stepStatus,
          completedAt: params.now,
          action: params.action,
        };
      }

      return step;
    });
  }

  appendHistoryApproval(params: {
    oldHistory?: string | IHistoryApproval[];
    requestId: number;
    stepOrder: number;
    stepName: string;
    actor: IActionUser;
    action: WorkflowAction;
    now: string;
    comment?: string;
  }): IHistoryApproval[] {
    const history = parseHistoryApproval(params.oldHistory);

    return [
      ...history,
      {
        requestId: params.requestId,

        stepOrder: params.stepOrder,
        stepName: params.stepName,

        actorId: params.actor.Id,
        actorName: params.actor.Title,
        actorEmail: params.actor.EMail,

        assigneeId: params.actor.Id,
        assigneeName: params.actor.Title,
        assigneeEmail: params.actor.EMail,

        action: params.action,
        actionTime: params.now,
        comment: params.comment,
      },
    ];
  }
}