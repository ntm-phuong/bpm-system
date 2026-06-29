import { ProcessService } from "./ProcessService";
import {
  LeaveRepository,
  ICreateLeaveInput,
} from "../repositories/LeaveRepository";
import { RequestRepository } from "../repositories/RequestRepository";
import { StepStatus, RequestStatus } from "../constants/enums";
import { IHistoryApproval, IWorkflowStep, IProcessStep } from "../models";
import { ISubmitLeaveResult } from "../types/LeaveServiceType";

export class LeaveSubmitService {
  private _leaveRepo = new LeaveRepository();
  private _requestRepo = new RequestRepository();
  private _processService = new ProcessService();

  async submitLeave(input: ICreateLeaveInput): Promise<ISubmitLeaveResult> {
    const now = new Date().toISOString();

    const steps = await this._processService.getStepsByProcessId(
      input.ProcessIDId
    );

    if (!steps.length) {
      throw new Error("Quy trình chưa có bước nào được cấu hình.");
    }

    const submitStep =
      steps.find(step => step.StepOrder === 1) ?? steps[0];

    const nextStep = steps.find(
      step => step.StepOrder > submitStep.StepOrder
    );

    if (!nextStep) {
      throw new Error("Quy trình chưa có bước xử lý sau bước tạo đơn.");
    }

    const requesterId = input.RequesterId;

    if (!requesterId) {
      throw new Error("Không xác định được người tạo đơn.");
    }

    const historyStep = this._buildInitialHistoryStep({
      steps,
      submitStepOrder: submitStep.StepOrder,
      currentStepOrder: nextStep.StepOrder,
      requesterId,
      requesterName: input.RequesterName,
      requesterEmail: input.RequesterEmail,
      now,
    });

    const historyApproval: IHistoryApproval[] = [
      {
        requestId: undefined,

        stepOrder: submitStep.StepOrder,
        stepName: submitStep.Title,

        actorId: requesterId,
        actorName: input.RequesterName,
        actorEmail: input.RequesterEmail,

        assigneeId: requesterId,
        assigneeName: input.RequesterName,
        assigneeEmail: input.RequesterEmail,

        action: "Submitted",
        actionTime: now,
      },
    ];

    const leave = await this._leaveRepo.createLeave({
      ...input,
      HistoryStep: historyStep,
      initialStatusRequest: RequestStatus.Pending,
      initialStatusStep: StepStatus.Pending,
      initialIndexOfStep: nextStep.StepOrder,
      stepName: nextStep.Title,
    });

    const request = await this._requestRepo.createRequest({
      processIDId: input.ProcessIDId,
      absenceIDId: leave.Id,

      requesterId,
      currentApproverId: nextStep.StepApproverId ?? null,

      currentStep: nextStep.StepOrder,
      currentStepName: nextStep.Title,


      department: input.department,
      isEmergency: input.isEmergency,
      historyApproval,
    });

    const updatedLeave = await this._leaveRepo.getLeaveById(leave.Id);

    return {
      leave: updatedLeave,
      request,
      nextApproverName:
        nextStep.StepApprover?.Title ?? "Chưa có người phụ trách",
    };
  }

  private _buildInitialHistoryStep(params: {
    steps: IProcessStep[];
    submitStepOrder: number;
    currentStepOrder: number;
    requesterId: number;
    requesterName?: string;
    requesterEmail?: string;
    now: string;
  }): IWorkflowStep[] {
    return params.steps.map(step => {
      const isSubmitStep = step.StepOrder === params.submitStepOrder;
      const isCurrentStep = step.StepOrder === params.currentStepOrder;

      if (isSubmitStep) {
        return {
          stepOrder: step.StepOrder,
          title: step.Title,

          assigneeId: params.requesterId,
          assignee: params.requesterName ?? "Requester",
          assigneeEmail: params.requesterEmail ?? null,

          isRequesterStep: true,
          isApprovalStep: false,

          status: StepStatus.Approved,

          assignedAt: params.now,
          completedAt: params.now,

          action: "Submitted",

          slaHours: step.SLA_Hours,
          beforeSLA: step.BeforeSLA,
        };
      }

      return {
        stepOrder: step.StepOrder,
        title: step.Title,

        assigneeId: step.StepApproverId ?? null,
        assignee: step.StepApprover?.Title ?? null,
        assigneeEmail: step.StepApprover?.EMail ?? null,

        isRequesterStep: false,
        isApprovalStep: true,

        status: isCurrentStep
          ? StepStatus.Pending
          : StepStatus.Waiting,

        assignedAt: isCurrentStep ? params.now : null,
        completedAt: null,

        action: undefined,

        slaHours: step.SLA_Hours,
        beforeSLA: step.BeforeSLA,
      };
    });
  }
}