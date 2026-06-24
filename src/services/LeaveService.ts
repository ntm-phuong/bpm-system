// src/services/LeaveService.ts
import { ProcessService } from "./ProcessService";
import {
  LeaveRepository,
  ICreateLeaveInput,
} from "../repositories/LeaveRepository";
import { ILeaveOfAbsence, IRequest, IStepHistory } from "../models";
import { StepStatus, RequestStatus } from "../constants/enums";

// Hàm mock nếu bạn chưa có parseStepHistory trong model
const parseStepHistory = (historyStr?: string): IStepHistory[] => {
  try {
    return JSON.parse(historyStr || "[]");
  } catch {
    return [];
  }
};


export interface ApproveStepInput {
  leaveId: number;
  requestId: number;
  isLastStep: boolean;
  stepHistory: {
    step: number;
    stepName: string;
    approver: string; // Có thể truyền Title hoặc Email
  };
  comment?: string;
}

export interface ISubmitLeaveResult {
  leave: ILeaveOfAbsence;
  request: IRequest;
  nextApproverName: string;
}

export interface IApproveResult {
  isCompleted: boolean;
  leave: ILeaveOfAbsence;
  nextApproverName?: string;
}



export class LeaveService {
  private _leaveRepo: LeaveRepository;
  private _processService: ProcessService;

  constructor() {
    this._leaveRepo = new LeaveRepository();
    this._processService = new ProcessService();
  }

  async submitLeave(
  input: ICreateLeaveInput,
  processCode: string,
): Promise<ISubmitLeaveResult> {

  try {

    console.log("A");
    const leave = await this._leaveRepo.createLeave(input);
    console.log("leave =", leave);

    console.log("B");
    const firstStep =
      await this._processService.getFirstStepApprover(
        input.ProcessIDId,
      );
    console.log("firstStep =", firstStep);

    console.log("C");
    const approverId =
  firstStep.Approver?.Id ?? input.ManagerId;
  console.log(
  JSON.stringify(firstStep, null, 2)
);

if (approverId == null) {
  throw new Error(
    `Step ${firstStep.StepOrder} chưa được cấu hình Approver và đơn cũng không có ManagerId`
  );
}
    console.log("approverId =", approverId);

    console.log("D");
    await this._leaveRepo.updateLeaveFlow({
      id: leave.Id,
      statusRequest: RequestStatus.Pending,
      statusStep: StepStatus.Pending,
      indexOfStep: firstStep.StepOrder,
      approvedById: approverId,
      historyStep: [],
    });

    console.log("E");
    const request =
      await this._leaveRepo.createRequest({
        absenceIDId: leave.Id,
        // processCode,
        approverId,
        currentStep: firstStep.StepOrder,
        department: leave.Author?.Title,
      });

    console.log("request =", request);

    console.log("F");
    const updatedLeave =
      await this._leaveRepo.getLeaveById(leave.Id);

    console.log("updatedLeave =", updatedLeave);

    console.log("G");

    return {
      leave: updatedLeave,
      request,
      nextApproverName:
        firstStep.Approver?.Title || "Người quản lý",
    };

  } catch (e) {

    console.error("FULL ERROR =", e);

    if (e instanceof Error) {
      console.error("STACK =", e.stack);
    }

    throw e;
  }
}


  async approveStep(input: ApproveStepInput): Promise<IApproveResult> {
    try {
      const leave = await this._leaveRepo.getLeaveById(input.leaveId);
      const currentHistory = parseStepHistory(leave.HistoryStep);

      const newHistoryRecord: IStepHistory = {
        step: input.stepHistory.step,
        stepName: input.stepHistory.stepName,
        approver: input.stepHistory.approver,
        action: "Approved", // Dùng string hoặc StepAction.Approved nếu đã định nghĩa Enum
        comment: input.comment,
        actionTime: new Date().toISOString(),
      };
      const updatedHistory = [...currentHistory, newHistoryRecord];

      if (input.isLastStep) {
        // ── Bước cuối: hoàn tất đơn ──
        await this._leaveRepo.updateLeaveFlow({
          id: input.leaveId,
          statusRequest: RequestStatus.Approved, // Đơn chính thức được duyệt
          statusStep: StepStatus.Approved,
          historyStep: updatedHistory,
          approvedById: undefined, // Xóa người giữ phiếu
        });

        await this._leaveRepo.closeRequest(
          input.requestId,
          RequestStatus.Approved,
        );

        const completedLeave = await this._leaveRepo.getLeaveById(
          input.leaveId,
        );
        return { isCompleted: true, leave: completedLeave };
      } else {
        // ── Chưa phải bước cuối: lấy thông tin bước tiếp ──
        const currentStepOrder = input.stepHistory.step;
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

        // Cập nhật LeaveOfAbsence: chuyển sang bước tiếp
        await this._leaveRepo.updateLeaveFlow({
          id: input.leaveId,
          statusStep: StepStatus.Pending,
          indexOfStep: currentStepOrder + 1,
          approvedById: nextApprover.Id,
          historyStep: updatedHistory,
        });

        await this._leaveRepo.closeRequest(
          input.requestId,
          RequestStatus.Approved,
        );
        // const currentRequest = await this._leaveRepo.getRequestById(
        //   input.requestId,
        // );

        await this._leaveRepo.createRequest({
          absenceIDId: input.leaveId,
          // processCode: currentRequest.ProcessCode ?? "",
          approverId: nextApprover.Id,
          currentStep: stepInfo.nextStep.StepOrder,
        });

        const updatedLeave = await this._leaveRepo.getLeaveById(input.leaveId);
        return {
          isCompleted: false,
          leave: updatedLeave,
          nextApproverName: nextApprover.Title,
        };
      }
    } catch (e) {
      throw this._wrapError(e, "approveStep");
    }
  }

  // ═══════════════════════════════════════════════════════
  // REJECT — Người phê duyệt nhấn Từ chối
  // ═══════════════════════════════════════════════════════
  async rejectLeave(params: {
    leaveId: number;
    requestId: number;
    stepOrder: number;
    stepName: string;
    approverEmail: string;
    comment: string;
  }): Promise<ILeaveOfAbsence> {
    try {
      const leave = await this._leaveRepo.getLeaveById(params.leaveId);
      const currentHistory = parseStepHistory(leave.HistoryStep);

      const historyRecord: IStepHistory = {
        step: params.stepOrder,
        stepName: params.stepName,
        approver: params.approverEmail,
        action: "Rejected",
        comment: params.comment,
        actionTime: new Date().toISOString(),
      };

      await this._leaveRepo.updateLeaveFlow({
        id: params.leaveId,
        statusRequest: RequestStatus.Rejected,
        statusStep: StepStatus.Rejected,
        historyStep: [...currentHistory, historyRecord],
        approvedById: undefined,
      });

      await this._leaveRepo.closeRequest(
        params.requestId,
        RequestStatus.Rejected,
      );

      return this._leaveRepo.getLeaveById(params.leaveId);
    } catch (e) {
      throw this._wrapError(e, "rejectLeave");
    }
  }

  // ═══════════════════════════════════════════════════════
  // RECALL — Người nộp đơn tự thu hồi
  // ═══════════════════════════════════════════════════════
  async recallLeave(params: {
    leaveId: number;
    requestId: number;
    recallerEmail: string;
  }): Promise<ILeaveOfAbsence> {
    try {
      const leave = await this._leaveRepo.getLeaveById(params.leaveId);

      // Thu hồi khi đang Pending
      if (leave.StatusRequest !== RequestStatus.Pending) {
        throw new Error(`Chỉ được thu hồi đơn đang ở trạng thái Đang xử lý`);
      }

      const currentHistory = parseStepHistory(leave.HistoryStep);

      const historyRecord: IStepHistory = {
        step: leave.IndexOfStep ?? 0,
        stepName: "Thu hồi bởi người nộp đơn",
        approver: params.recallerEmail,
        action: "Recalled",
        actionTime: new Date().toISOString(),
      };

      // Giả sử RequestStatus chưa có Cancelled, ta dùng Draft hoặc tự định nghĩa thêm
      await this._leaveRepo.updateLeaveFlow({
        id: params.leaveId,
        statusRequest: RequestStatus.Draft, // Chuyển về nháp để có thể sửa nộp lại
        statusStep: StepStatus.Rejected, // Hoặc định nghĩa thêm StepStatus.Recalled
        historyStep: [...currentHistory, historyRecord],
        approvedById: undefined,
      });

      // Hàm closeRequest cần RequestStatus mới, ở đây tạm dùng Rejected
      await this._leaveRepo.closeRequest(
        params.requestId,
        RequestStatus.Rejected,
      );

      return this._leaveRepo.getLeaveById(params.leaveId);
    } catch (e) {
      throw this._wrapError(e, "recallLeave");
    }
  }

  // ═══════════════════════════════════════════════════════
  // QUERIES — Dùng cho các trang danh sách
  // ═══════════════════════════════════════════════════════
  async getMyLeaves(
    currentUserId: number,
    statusFilter?: RequestStatus, // Đã đổi sang RequestStatus
  ): Promise<ILeaveOfAbsence[]> {
    try {
      return this._leaveRepo.getMyLeaves(currentUserId, statusFilter);
    } catch (e) {
      throw this._wrapError(e, "getMyLeaves");
    }
  }

  async getPendingApprovals(approverId: number): Promise<ILeaveOfAbsence[]> {
    try {
      return this._leaveRepo.getPendingApprovals(approverId);
    } catch (e) {
      throw this._wrapError(e, "getPendingApprovals");
    }
  }

  async getLeaveDetail(leaveId: number): Promise<{
    leave: ILeaveOfAbsence;
    activeRequest: IRequest | undefined; // Sửa null thành undefined để chiều linter
    allRequests: IRequest[];
  }> {
    try {
      // getAllRequestsByLeave tạm thời bị lược bỏ trong bản LeaveRepo tối ưu trước đó.
      // Bạn có thể thêm lại hàm này vào LeaveRepo, hoặc chỉ cần fetch activeRequest là đủ cho flow chính.
      const [leave, activeRequest] = await Promise.all([
        this._leaveRepo.getLeaveById(leaveId),
        this._leaveRepo.getActiveRequestByLeave(leaveId),
      ]);

      return {
        leave,
        activeRequest,
        allRequests: activeRequest ? [activeRequest] : [],
      };
    } catch (e) {
      throw this._wrapError(e, "getLeaveDetail");
    }
  }

  // ─── Private ───────────────────────────────────────────
  private _wrapError(e: unknown, method: string): Error {
    const msg = e instanceof Error ? e.message : String(e);
    return new Error(`[LeaveService.${method}] ${msg}`);
  }
}