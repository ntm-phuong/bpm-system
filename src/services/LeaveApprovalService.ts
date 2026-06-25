import { ProcessService } from "./ProcessService";
import { LeaveRepository } from "../repositories/LeaveRepository";
import { RequestRepository } from "../repositories/RequestRepository";
import { ILeaveOfAbsence, IWorkflowStep } from "../models";
import { StepStatus, RequestStatus } from "../constants/enums";
import {
  ApproveStepInput,
  IApproveResult,
  RejectLeaveInput,
  RecallLeaveInput,
} from "../types/LeaveServiceType";

export class LeaveApprovalService {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();
  private _processService = new ProcessService();

  async approveStep(input: ApproveStepInput): Promise<IApproveResult> {
    try {
      const leave = await this._leaveRepo.getLeaveById(input.leaveId);
      const currentHistory = leave.HistoryStep ?? [];

      const newHistoryRecord: IWorkflowStep = {
        stepOrder: input.stepHistory.stepOrder,
        title: input.stepHistory.title,
        assigneeId: input.stepHistory.assigneeId,
        assignee: input.stepHistory.assignee,
        status: RequestStatus.Approved,
        assignedAt: input.stepHistory.assignedAt,
        completedAt: new Date().toISOString(),
        action: "Approved",
        slaHours: input.stepHistory.slaHours,
        beforeSLA: input.stepHistory.beforeSLA,
      };

      const updatedHistory = [...currentHistory, newHistoryRecord];

      if (input.isLastStep) {
        await this._leaveRepo.updateLeaveFlow({
          id: input.leaveId,
          statusRequest: RequestStatus.Approved,
          statusStep: StepStatus.Approved,
          historyStep: updatedHistory,
          approvedById: undefined,
        });

        await this._requestRepo.closeRequest(
          input.requestId,
          RequestStatus.Approved,
        );

        const completedLeave = await this._leaveRepo.getLeaveById(input.leaveId);
        return { isCompleted: true, leave: completedLeave };
      }

      const currentStepOrder = input.stepHistory.stepOrder;

      const stepInfo = await this._processService.getStepInfo(
        leave.ProcessIDId,
        currentStepOrder,
      );

      if (!stepInfo.nextStep?.Approver) {
        throw new Error(
          `Bước ${currentStepOrder + 1} chưa được cấu hình người phê duyệt`,
        );
      }

      const nextApprover = stepInfo.nextStep.Approver;

      await this._leaveRepo.updateLeaveFlow({
        id: input.leaveId,
        statusStep: StepStatus.Pending,
        indexOfStep: stepInfo.nextStep.StepOrder,
        approvedById: nextApprover.Id,
        historyStep: updatedHistory,
      });

      await this._requestRepo.closeRequest(
        input.requestId,
        RequestStatus.Approved,
      );

      await this._requestRepo.createRequest({
        absenceIDId: input.leaveId,
        approverId: nextApprover.Id,
        currentStep: stepInfo.nextStep.StepOrder,
      });

      const updatedLeave = await this._leaveRepo.getLeaveById(input.leaveId);

      return {
        isCompleted: false,
        leave: updatedLeave,
        nextApproverName: nextApprover.Title,
      };
    } catch (e) {
      throw this._wrapError(e, "approveStep");
    }
  }

  async rejectLeave(params: RejectLeaveInput): Promise<ILeaveOfAbsence> {
    try {
      const leave = await this._leaveRepo.getLeaveById(params.leaveId);
      const currentHistory = leave.HistoryStep ?? [];

      const historyRecord: IWorkflowStep = {
        stepOrder: params.stepOrder,
        title: params.stepName,
        assignee: params.approverEmail,
        status: RequestStatus.Rejected,
        assignedAt: leave.HistoryStep?.find(
          (x) => x.stepOrder === params.stepOrder,
        )?.assignedAt,
        completedAt: new Date().toISOString(),
        action: "Rejected",
      };

      await this._leaveRepo.updateLeaveFlow({
        id: params.leaveId,
        statusRequest: RequestStatus.Rejected,
        statusStep: StepStatus.Rejected,
        historyStep: [...currentHistory, historyRecord],
        approvedById: undefined,
      });

      await this._requestRepo.closeRequest(
        params.requestId,
        RequestStatus.Rejected,
      );

      return this._leaveRepo.getLeaveById(params.leaveId);
    } catch (e) {
      throw this._wrapError(e, "rejectLeave");
    }
  }

  async recallLeave(params: RecallLeaveInput): Promise<ILeaveOfAbsence> {
    try {
      const leave = await this._leaveRepo.getLeaveById(params.leaveId);

      if (leave.StatusRequest !== RequestStatus.Pending) {
        throw new Error(`Chỉ được thu hồi đơn đang ở trạng thái Đang xử lý`);
      }

      const currentHistory = leave.HistoryStep ?? [];

      const historyRecord: IWorkflowStep = {
        stepOrder: leave.IndexOfStep ?? 0,
        title: "Thu hồi bởi người nộp đơn",
        assignee: params.recallerEmail,
        status: RequestStatus.Draft,
        completedAt: new Date().toISOString(),
        action: "Recalled",
      };

      await this._leaveRepo.updateLeaveFlow({
        id: params.leaveId,
        statusRequest: RequestStatus.Draft,
        statusStep: StepStatus.Rejected,
        historyStep: [...currentHistory, historyRecord],
        approvedById: undefined,
      });

      await this._requestRepo.closeRequest(
        params.requestId,
        RequestStatus.Rejected,
      );

      return this._leaveRepo.getLeaveById(params.leaveId);
    } catch (e) {
      throw this._wrapError(e, "recallLeave");
    }
  }

  private _wrapError(e: unknown, method: string): Error {
    const msg = e instanceof Error ? e.message : String(e);
    return new Error(`[LeaveApprovalService.${method}] ${msg}`);
  }
}