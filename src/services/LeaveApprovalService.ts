import { ProcessService } from "./ProcessService";
import { LeaveRepository } from "../repositories/LeaveRepository";
import { RequestRepository } from "../repositories/RequestRepository";
import {
  ILeaveOfAbsence,
  IWorkflowStep,
  IHistoryApproval,
  parseHistoryApproval,
} from "../models";
import { StepStatus, RequestStatus, WorkflowAction } from "../constants/enums";
import {
  mapActionToRequestStatus,
  mapActionToStepStatus,
} from "../utils/WorkflowStatusMapper";
import { IApproveResult } from "../types/LeaveServiceType";

interface IActionUser {
  Id: number;
  Title?: string;
  EMail?: string;
}

export class LeaveApprovalService {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();
  private _processService = new ProcessService();

  async approveStep(input: {
    requestId: number;
    currentUser: IActionUser;
    comment?: string;
  }): Promise<IApproveResult> {
    try {
      const now = new Date().toISOString();
      
      const action = WorkflowAction.Approved;

      const request = await this._requestRepo.getRequestById(input.requestId);

      this._validateProcessableRequest(request, input.currentUser.Id);

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

      const updatedHistoryStep = this._approveCurrentHistoryStep({
        historyStep: leave.HistoryStep ?? [],
        currentStepOrder,
        nextStepOrder: stepInfo.nextStep?.StepOrder,
        now,
        action,
        stepStatus,

      });

      const updatedHistoryApproval = this._appendHistoryApproval({
        oldHistory: request.HistoryApproval,
        requestId: request.Id,
        stepOrder: currentStepOrder,
        stepName: stepInfo.step.Title,
        actor: input.currentUser,
        action: action,
        now,
        comment: input.comment,
      });

      if (stepInfo.isLastStep || !stepInfo.nextStep) {
        // const nextStep = stepInfo.nextStep;
        // const nextStepName = nextStep.Title;

        await this._leaveRepo.updateLeaveFlow({
          id: leave.Id,
          statusRequest: requestStatus,
          statusStep: stepStatus,
          indexOfStep: currentStepOrder,
          approvedById: input.currentUser.Id,
          historyStep: updatedHistoryStep,
        });

        await this._requestRepo.updateRequest({
          id: request.Id,
          status: requestStatus,
          // currentApproverId: null,
          currentApproverId: input.currentUser.Id,
          currentStep: currentStepOrder,
          historyApproval: updatedHistoryApproval,
        });

        const completedLeave = await this._leaveRepo.getLeaveById(leave.Id);

        return {
          isCompleted: true,
          leave: completedLeave,
        };
      }

      await this._leaveRepo.updateLeaveFlow({
        id: leave.Id,
        statusRequest: requestStatus,
        statusStep: StepStatus.Pending,
        indexOfStep: stepInfo.nextStep.StepOrder,
        approvedById: stepInfo.nextStep.StepApproverId ?? undefined,
        historyStep: updatedHistoryStep,
      });

      await this._requestRepo.updateRequest({
        id: request.Id,
        status: requestStatus,
        currentApproverId: stepInfo.nextStep.StepApproverId ?? null,
        currentStep: stepInfo.nextStep.StepOrder,
        currentStepName: stepInfo.nextStep.Title,
        historyApproval: updatedHistoryApproval,
      });

      const updatedLeave = await this._leaveRepo.getLeaveById(leave.Id);

      return {
        isCompleted: false,
        leave: updatedLeave,
        nextApproverName:
          stepInfo.nextStep.StepApprover?.Title ?? "Chưa có người phụ trách",
      };
    } catch (e) {
      throw this._wrapError(e, "approveStep");
    }
  }

  async rejectLeave(input: {
    requestId: number;
    currentUser: IActionUser;
    comment?: string;
  }): Promise<ILeaveOfAbsence> {
    try {
      const now = new Date().toISOString();
      const action = WorkflowAction.Rejected;
      const requestStatus = mapActionToRequestStatus(action);
      const stepStatus = mapActionToStepStatus(action);

      const request = await this._requestRepo.getRequestById(input.requestId);

      this._validateProcessableRequest(request, input.currentUser.Id);

      const leave = await this._leaveRepo.getLeaveById(request.AbsenceIDId);

      const currentStepOrder = request.CurrentStep;

      if (!currentStepOrder) {
        throw new Error("Request không có CurrentStep.");
      }

      const stepInfo = await this._processService.getStepInfo(
        leave.ProcessIDId,
        currentStepOrder,
      );

      const updatedHistoryStep = this._rejectCurrentHistoryStep({
        historyStep: leave.HistoryStep ?? [],
        currentStepOrder,
        now,
        action,
        stepStatus, 
      });

      const updatedHistoryApproval = this._appendHistoryApproval({
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
        approvedById: input.currentUser.Id,
        historyStep: updatedHistoryStep,
      });

      await this._requestRepo.updateRequest({
        id: request.Id,
        status: requestStatus,
        // currentApproverId: null,
        currentApproverId: input.currentUser.Id,
        currentStep: currentStepOrder,
        historyApproval: updatedHistoryApproval,
      });

      return this._leaveRepo.getLeaveById(leave.Id);
    } catch (e) {
      throw this._wrapError(e, "rejectLeave");
    }
  }


  private _validateProcessableRequest(
    request: {
      Status: RequestStatus;
      CurrentApproverId?: number | null;
    },
    currentUserId: number,
  ): void {
    if (request.Status !== RequestStatus.Pending) {
      throw new Error("Chỉ có thể xử lý request đang Pending.");
    }

    if (!request.CurrentApproverId) {
      throw new Error("Request hiện tại chưa có người phụ trách.");
    }

    if (request.CurrentApproverId !== currentUserId) {
      throw new Error("Bạn không phải người phụ trách bước hiện tại.");
    }
  }

  private _approveCurrentHistoryStep(params: {
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

  private _rejectCurrentHistoryStep(params: {
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

  private _appendHistoryApproval(params: {
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
        // comment: params.comment,
      },
    ];
  }

  private _wrapError(e: unknown, method: string): Error {
    const msg = e instanceof Error ? e.message : String(e);
    return new Error(`[LeaveApprovalService.${method}] ${msg}`);
  }
}
