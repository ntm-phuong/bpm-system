import {
  IWorkflowStep,
  IHistoryApproval,
  parseHistoryApproval,
} from "../../models";
import { StepStatus, WorkflowAction } from "../../constants/enums";
import { IActionUser } from "../../types/LeaveServiceType";


export class WorkflowHistoryService {
  updateCurrentStep(params: {
    historyStep: IWorkflowStep[];
    currentStepOrder: number;
    now: string;
    action: WorkflowAction;
    stepStatus: StepStatus;

    completedAt?: string;
    assignedAt?: string;

    assignee?: IActionUser;
  }): IWorkflowStep[] {
    return params.historyStep.map((step) => {
      if (step.stepOrder !== params.currentStepOrder) {
        return step;
      }

      return {
        ...step,
        status: params.stepStatus,
        action: params.action,
        completedAt: params.completedAt,
        assignedAt: params.assignedAt,

        assigneeId: params.assignee?.Id ?? step.assigneeId,
        assignee: params.assignee?.Title ?? step.assignee,
        assigneeEmail: params.assignee?.EMail ?? step.assigneeEmail,
      };
    });
  }

  markNextStepPending(params: {
    historyStep: IWorkflowStep[];
    nextStepOrder: number;
    now: string;
    assignee?: IActionUser;
  }): IWorkflowStep[] {
    return params.historyStep.map((step) => {
      if (step.stepOrder !== params.nextStepOrder) {
        return step;
      }

      return {
        ...step,
        status: StepStatus.Pending,
        assignedAt: params.now,

        assigneeId: params.assignee?.Id ?? step.assigneeId,
        assignee: params.assignee?.Title ?? step.assignee,
        assigneeEmail: params.assignee?.EMail ?? step.assigneeEmail,
      };
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

    assignee?: IActionUser;
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

        assigneeId: params.assignee?.Id ?? params.actor.Id,
        assigneeName: params.assignee?.Title ?? params.actor.Title,
        assigneeEmail: params.assignee?.EMail ?? params.actor.EMail,

        action: params.action,
        actionTime: params.now,
        comment: params.comment,
      },
    ];
  }
}