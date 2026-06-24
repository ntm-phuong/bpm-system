import { BaseRepository } from "./BaseRepository";
import { ILeaveOfAbsence, IRequest } from "../models"; // (Đã bỏ IComment)
import { LISTS } from "../constants/lists";
import { RequestStatus, StepStatus } from "../constants/enums";
import { IWorkflowStep } from "../components/WorkflowStatus/WorkflowStatus";

// ─── Input types nội bộ ────────────────────────────────────

export interface ICreateLeaveInput {
  Title: string;
  ProcessIDId: number;
  AbsenceType: string;
  PartialDay: string;
  AbsenceDates: string;
  RequestReason?: string;
  TotalDays: number;
  ManagerId?: number;
  NotifyToId?: number;
  LateEarlyHours?: number;
  HistoryStep?: IWorkflowStep[];
}

export interface ICreateRequestInput {
  absenceIDId: number;
  // processCode: string;
  approverId: number;
  currentStep: number;
  department?: string;
  isEmergency?: boolean;
}

export interface IUpdateLeaveFlowInput {
  id: number;
  statusRequest?: RequestStatus; // Đồng bộ dùng RequestStatus
  statusStep?: StepStatus;
  indexOfStep?: number;
  approvedById?: number;
  historyStep?: any[];
}

export interface ILeaveFilterInput {
  authorId?: number;
  approverId?: number;
  statusRequest?: RequestStatus;
  absenceType?: string;
  processIDId?: number;
  top?: number;
  skip?: number;
}

// ─── Select / Expand constants ─────────────────────────────

const LEAVE_SELECT = [
  "Id",
  "Title",
  "ProcessIDId",
  "AbsenceType",
  "PartialDay",
  "AbsenceDates",
  "TotalDays",
  "LateEarlyHours",
  "RequestReason",
  "IndexOfStep",
  "StatusStep",
  "StatusRequest",
  "HistoryStep",
  "ApprovedBy/Id",
  "ApprovedBy/Title",
  "ApprovedBy/EMail",
  "Author/Id",
  "Author/Title",
  "Author/EMail",
  "Manager/Id",
  "Manager/Title",
  "NotifyTo/Id",
  "NotifyTo/Title",
] as const;

const LEAVE_EXPAND = ["ApprovedBy", "Author", "Manager", "NotifyTo"] as const;

const REQUEST_SELECT = [
  "Id",
  "Title",
  "AbsenceIDId",
  // "ProcessCode",
  "Status",
  "CurrentStep",
  "IsEmergency",
  "Department",
  "AbsenceID/Id",
  "AbsenceID/Title",
  "CurrentApprover/Id",
  "CurrentApprover/Title",
  "CurrentApprover/EMail",
  "Author/Id",
  "Author/Title",
  "Author/EMail",
  "HistoryApproval",
] as const;

const REQUEST_EXPAND = ["CurrentApprover", "Author", "AbsenceID"] as const;

// ─── Repository ────────────────────────────────────────────

export class LeaveRepository extends BaseRepository {
  // ═══════════════════════════════════════════════════════
  // LEAVE OF ABSENCE
  // ═══════════════════════════════════════════════════════

  async createLeave(input: ICreateLeaveInput): Promise<ILeaveOfAbsence> {
    const result = await this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE) // Sửa lại đúng tên hằng số list của bạn
      .items.add({
        Title: input.Title,
        ProcessIDId: input.ProcessIDId,
        AbsenceType: input.AbsenceType,
        PartialDay: input.PartialDay,
        RequestReason: input.RequestReason,
        AbsenceDates: input.AbsenceDates,
        TotalDays: input.TotalDays,
        LateEarlyHours: input.LateEarlyHours,
        ManagerId: input.ManagerId,
        NotifyToId: input.NotifyToId,
        StatusRequest: RequestStatus.Draft, // Đổi sang RequestStatus
        StatusStep: StepStatus.Pending,
        IndexOfStep: 0,
        HistoryStep: JSON.stringify(input.HistoryStep || []),
      });

    console.log("ADD RESULT =", result);
    console.log("ADD RESULT DATA =", result.data);

    return this.getLeaveById(result.Id);
  }

  async getLeaveById(id: number): Promise<ILeaveOfAbsence> {
    const item = await this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE)
      .items.getById(id)
      .select(...LEAVE_SELECT)
      .expand(...LEAVE_EXPAND)();

    return this._mapLeave(item);
  }

  async getLeaves(filter: ILeaveFilterInput): Promise<ILeaveOfAbsence[]> {
    const conditions: string[] = [];

    // OData filter tối ưu dùng thẳng trường ID
    if (filter.authorId !== undefined)
      conditions.push(`AuthorId eq ${filter.authorId}`);

    if (filter.approverId !== undefined)
      conditions.push(`ApprovedById eq ${filter.approverId}`);

    // Bọc nháy đơn vì Enum giờ là String
    if (filter.statusRequest !== undefined)
      conditions.push(`StatusRequest eq '${filter.statusRequest}'`);

    if (filter.absenceType !== undefined)
      conditions.push(`AbsenceType eq '${filter.absenceType}'`);

    if (filter.processIDId !== undefined)
      conditions.push(`ProcessIDId eq ${filter.processIDId}`);

    const filterStr =
      conditions.length > 0 ? conditions.join(" and ") : undefined;

    let query = this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE)
      .items.select(...LEAVE_SELECT)
      .expand(...LEAVE_EXPAND)
      .orderBy("RequestedTime", false);

    if (filterStr) query = query.filter(filterStr);
    if (filter.top) query = query.top(filter.top);
    if (filter.skip) query = query.skip(filter.skip);

    const items = await query();
    return items.map(this._mapLeave.bind(this));
  }

  async getMyLeaves(
    currentUserId: number,
    statusRequest?: RequestStatus,
  ): Promise<ILeaveOfAbsence[]> {
    return this.getLeaves({
      authorId: currentUserId,
      statusRequest,
      top: 100,
    });
  }

  // Lấy đơn đang chờ MÌNH duyệt (StatusRequest = Pending & StatusStep = Pending)
  async getPendingApprovals(approverId: number): Promise<ILeaveOfAbsence[]> {
    const items = await this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE)
      .items.select(...LEAVE_SELECT)
      .expand(...LEAVE_EXPAND)
      .filter(
        `StatusRequest eq '${RequestStatus.Pending}'` + // Bọc nháy đơn
          ` and StatusStep eq '${StepStatus.Pending}'` + // Bọc nháy đơn
          ` and ApprovedById eq ${approverId}`,
      )
      .orderBy("RequestedTime", true)();

    return items.map(this._mapLeave.bind(this));
  }

  async updateLeaveFlow(input: IUpdateLeaveFlowInput): Promise<void> {
    const payload: any = {};

    if (input.statusRequest !== undefined)
      payload.StatusRequest = input.statusRequest;
    if (input.statusStep !== undefined) payload.StatusStep = input.statusStep;
    if (input.indexOfStep !== undefined)
      payload.IndexOfStep = input.indexOfStep;
    if (input.approvedById !== undefined)
      payload.ApprovedById = input.approvedById;
    if (input.historyStep !== undefined)
      payload.HistoryStep = JSON.stringify(input.historyStep);

    await this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE)
      .items.getById(input.id)
      .update(payload);
  }

  async deleteDraftLeave(id: number): Promise<void> {
    await this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE)
      .items.getById(id)
      .delete();
  }

  // ═══════════════════════════════════════════════════════
  // REQUESTS (Hộp thư công việc)
  // ═══════════════════════════════════════════════════════

  async createRequest(input: ICreateRequestInput): Promise<IRequest> {
    const result = await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.add({
        Title: this.generateTitle("REQ", input.absenceIDId),
        AbsenceIDId: input.absenceIDId, // Khớp cột AbsenceIDId
        // ProcessCode: input.processCode,
        Status: RequestStatus.Pending,
        CurrentApproverId: input.approverId,
        CurrentStep: input.currentStep,
        Department: input.department,
        IsEmergency: input.isEmergency ?? false,
      });

    return this.getRequestById(result.Id);
  }

  async getRequestById(id: number): Promise<IRequest> {
    const item = await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.getById(id)
      .select(...REQUEST_SELECT)
      .expand(...REQUEST_EXPAND)();

    return this._mapRequest(item);
  }

  async getActiveRequestByLeave(
    absenceIDId: number,
  ): Promise<IRequest | undefined> {
    const items = await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.select(...REQUEST_SELECT)
      .expand(...REQUEST_EXPAND)
      .filter(
        `AbsenceIDId eq ${absenceIDId} and Status eq '${RequestStatus.Pending}'`,
      )
      .top(1)();

    return items.length > 0 ? this._mapRequest(items[0]) : undefined;
  }

  async closeRequest(id: number, status: RequestStatus): Promise<void> {
    await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.getById(id)
      .update({ Status: status });
  }

  // ═══════════════════════════════════════════════════════
  // PRIVATE MAPPERS (Đã xử lý sạch linter)
  // ═══════════════════════════════════════════════════════

  private _mapLeave = (raw: any): ILeaveOfAbsence => ({
    Id: raw.Id as number,
    Title: raw.Title as string,
    ProcessIDId: raw.ProcessIDId as number,
    ApprovedBy: this.mapPerson(raw, "ApprovedBy"),
    Author: this.mapPerson(raw, "Author"),
    AbsenceType: raw.AbsenceType as string,
    PartialDay: raw.PartialDay as string,
    AbsenceDates: (raw.AbsenceDates as string) ?? "[]",
    TotalDays: raw.TotalDays as number,
    Manager: this.mapPerson(raw, "Manager"),
    NotifyTo: this.mapPerson(raw, "NotifyTo"),
    LateEarlyHours: raw.LateEarlyHours as number | undefined,
    IndexOfStep: raw.IndexOfStep as number | undefined,
    StatusStep: raw.StatusStep as StepStatus | undefined,
    StatusRequest: raw.StatusRequest as RequestStatus | undefined,
    HistoryStep: (raw.HistoryStep as string) ?? "[]",
  });

  private _mapRequest = (raw: any): IRequest => {
    // Xử lý an toàn cho cột Lookup AbsenceID
    const absenceIdValue = raw.AbsenceID?.Id ?? raw.AbsenceIDId;

    return {
      Id: raw.Id as number,
      Title: raw.Title as string,
      AbsenceIDId: absenceIdValue as number,
      AbsenceTitle: raw.AbsenceID?.Title,
      // ProcessCode: raw.ProcessCode as string | undefined,
      Status: raw.Status as RequestStatus,
      CurrentApprover: this.mapPerson(raw, "CurrentApprover"),
      Author: this.mapPerson(raw, "Author"),
      CurrentStep: raw.CurrentStep as number | undefined,
      IsEmergency: raw.IsEmergency as boolean | undefined,
      Department: raw.Department as string | undefined,
      HistoryApproval: (raw.HistoryApproval as string) ?? "[]",
    };
  };
}
