import { BaseRepository } from "./BaseRepository";
import { ILeaveOfAbsence, IWorkflowStep, parseHistorySteps } from "../models"; // (Đã bỏ IComment)
import { LISTS } from "../constants/lists";
import { RequestStatus, StepStatus } from "../constants/enums";

export interface ICreateLeaveInput {
  Title: string;
  ProcessIDId: number;

  RequesterId: number;
  RequesterName?: string;
  RequesterEmail?: string;
  department?: string;
  isEmergency?: boolean;

  AbsenceType: string;
  PartialDay: string;
  AbsenceDates: string;
  RequestReason?: string;
  TotalDays: number;

  ManagerId?: number | null;
  NotifyToId?: number | null;
  LateEarlyHours?: number;

  HistoryStep?: IWorkflowStep[];
  initialStatusRequest?: RequestStatus;
  initialStatusStep?: StepStatus;
  initialIndexOfStep?: number;
}
export interface IUpdateLeaveFlowInput {
  id: number;
  statusRequest?: RequestStatus;
  statusStep?: StepStatus;
  indexOfStep?: number;

  approvedById?: number | null;

  historyStep?: IWorkflowStep[];
}
export interface ILeaveFilterInput {
  requesterId?: number;
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

  "RequesterId",
  "Requester/Id",
  "Requester/Title",
  "Requester/EMail",

  "ApprovedById",
  "ApprovedBy/Id",
  "ApprovedBy/Title",
  "ApprovedBy/EMail",

  "ManagerId",
  "Manager/Id",
  "Manager/Title",
  "Manager/EMail",

  "NotifyToId",
  "NotifyTo/Id",
  "NotifyTo/Title",
  "NotifyTo/EMail",
] as const;

const LEAVE_EXPAND = [
  "Requester",
  "ApprovedBy",
  "Manager",
  "NotifyTo",
] as const;

export class LeaveRepository extends BaseRepository {
  async createLeave(input: ICreateLeaveInput): Promise<ILeaveOfAbsence> {
    const result = await this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE)
      .items.add({
        Title: input.Title,
        ProcessIDId: input.ProcessIDId,

        RequesterId: input.RequesterId,

        AbsenceType: input.AbsenceType,
        PartialDay: input.PartialDay,
        RequestReason: input.RequestReason,
        AbsenceDates: input.AbsenceDates,
        TotalDays: input.TotalDays,
        LateEarlyHours: input.LateEarlyHours,

        ManagerId: input.ManagerId ?? null,
        NotifyToId: input.NotifyToId ?? null,

        StatusRequest: RequestStatus.Draft,
        StatusStep: StepStatus.Pending,
        IndexOfStep: 0,

        HistoryStep: JSON.stringify(input.HistoryStep || []),
      });

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

    if (filter.requesterId !== undefined) {
      conditions.push(`RequesterId eq ${filter.requesterId}`);
    }

    if (filter.statusRequest !== undefined) {
      conditions.push(`StatusRequest eq '${filter.statusRequest}'`);
    }

    if (filter.absenceType !== undefined) {
      conditions.push(`AbsenceType eq '${filter.absenceType}'`);
    }

    if (filter.processIDId !== undefined) {
      conditions.push(`ProcessIDId eq ${filter.processIDId}`);
    }

    const filterStr =
      conditions.length > 0 ? conditions.join(" and ") : undefined;

    let query = this.sp.web.lists
      .getByTitle(LISTS.LEAVE_OF_ABSENCE)
      .items.select(...LEAVE_SELECT)
      .expand(...LEAVE_EXPAND)
      .orderBy("Id", false);

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
      requesterId: currentUserId,
      statusRequest,
      top: 100,
    });
  }

  async updateLeaveFlow(input: IUpdateLeaveFlowInput): Promise<void> {
    const payload: any = {};

    if (input.statusRequest !== undefined) {
      payload.StatusRequest = input.statusRequest;
    }

    if (input.statusStep !== undefined) {
      payload.StatusStep = input.statusStep;
    }

    if (input.indexOfStep !== undefined) {
      payload.IndexOfStep = input.indexOfStep;
    }

    if (input.approvedById !== undefined) {
      payload.ApprovedById = input.approvedById;
    }

    if (input.historyStep !== undefined) {
      payload.HistoryStep = JSON.stringify(input.historyStep);
    }

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

    ApprovedById: raw.ApprovedById as number | null | undefined,
    ApprovedBy: this.mapPerson(raw, "ApprovedBy"),

    RequesterId: (raw.RequesterId as number | undefined) ?? raw.Requester?.Id,
    Requester: this.mapPerson(raw, "Requester"),

    AbsenceType: raw.AbsenceType as string,
    PartialDay: raw.PartialDay as string,
    AbsenceDates: (raw.AbsenceDates as string) ?? "[]",
    RequestReason: raw.RequestReason as string | undefined,
    TotalDays: raw.TotalDays as number,

    ManagerId: (raw.ManagerId as number | null | undefined) ?? raw.Manager?.Id,
    Manager: this.mapPerson(raw, "Manager"),

    NotifyToId:
      (raw.NotifyToId as number | null | undefined) ?? raw.NotifyTo?.Id,
    NotifyTo: this.mapPerson(raw, "NotifyTo"),

    LateEarlyHours: raw.LateEarlyHours as number | undefined,

    IndexOfStep: raw.IndexOfStep as number | undefined,
    StatusStep: raw.StatusStep as StepStatus | undefined,
    StatusRequest: raw.StatusRequest as RequestStatus | undefined,

    HistoryStep: parseHistorySteps((raw.HistoryStep as string) ?? "[]"),
  });
}
