import { BaseRepository } from "./BaseRepository";
import { ILeaveOfAbsence,  IWorkflowStep, parseHistorySteps} from "../models"; // (Đã bỏ IComment)
import { LISTS } from "../constants/lists";
import { RequestStatus, StepStatus } from "../constants/enums";

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
export interface IUpdateLeaveFlowInput {
  id: number;
  statusRequest?: RequestStatus; // Đồng bộ dùng RequestStatus
  statusStep?: StepStatus;
  indexOfStep?: number;
  approvedById?: number;
  historyStep?: IWorkflowStep[];
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

export class LeaveRepository extends BaseRepository {
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
    HistoryStep: parseHistorySteps((raw.HistoryStep as string) ?? "[]"),
  });

  
}
