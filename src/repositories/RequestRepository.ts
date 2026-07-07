import { BaseRepository } from "./BaseRepository";
import { IRequest, IHistoryApproval } from "../models";
import { LISTS } from "../constants/lists";
import { RequestStatus } from "../constants/enums";

export interface ICreateRequestInput {
  processIDId: number;
  absenceIDId: number;
  status: RequestStatus;

  requesterId: number;
  currentApproverId?: number | null;
  currentStepName?: string;
  currentStep: number;
  department?: string;
  isEmergency?: boolean;
  historyApproval?: IHistoryApproval[];
  expectedSLA?: number;
  currentStepSLA?: number;
  actualSLA?: number;
  completeSLA?: "InProgress" | "OnTime" | "Overdue";
  slaStartTime?: string;
  slaEndTime?: string;
}

export interface IRequestFilterInput {
  requesterId?: number;
  currentApproverId?: number;

  status?: RequestStatus;
  statusNot?: RequestStatus;

  absenceIDId?: number;
  top?: number;
  skip?: number;
}

export interface IUpdateRequestInput {
  id: number;

  status?: RequestStatus;
  currentApproverId?: number | null;
  currentStep?: number;
  currentStepName?: string;

  department?: string;
  isEmergency?: boolean;
  historyApproval?: IHistoryApproval[];
  expectedSLA?: number;
  currentStepSLA?: number;
  actualSLA?: number;
  completeSLA?: "InProgress" | "OnTime" | "Overdue";
  slaStartTime?: string;
  slaEndTime?: string;
}

export interface IUpdateRequestAdminInput {
  id: number;
  status?: RequestStatus;
  currentStep?: number;
  currentStepName?: string;
  currentApproverId?: number | null;
  isEmergency?: boolean;
}

const REQUEST_SELECT = [
  "Id",
  "Title",
  "Created",

  "AbsenceIDId",
  "AbsenceID/Id",
  "AbsenceID/Title",

  "ProcessIDId",
  "ProcessID/Id",
  "ProcessID/Title",

  "RequesterId",
  "Requester/Id",
  "Requester/Title",
  "Requester/EMail",

  "CurrentApproverId",
  "CurrentApprover/Id",
  "CurrentApprover/Title",
  "CurrentApprover/EMail",

  "Status",
  "CurrentStep",
  "CurrentStepName",
  "IsEmergency",
  "Department",
  "ExpectedSLA",
  "CurrentStepSLA",
  "ActualSLA",
  "CompleteSLA",
  "SLAStartTime",
  "SLAEndTime",
  "HistoryApproval",
] as const;

const REQUEST_EXPAND = [
  "Requester",
  "CurrentApprover",
  "AbsenceID",
  "ProcessID",
] as const;
export class RequestRepository extends BaseRepository {
  // CREATE

  async createRequest(input: ICreateRequestInput): Promise<IRequest> {
    const payload: Record<string, unknown> = {
      Title: this.generateTitle("REQ", input.absenceIDId),

      ProcessIDId: input.processIDId,
      AbsenceIDId: input.absenceIDId,

      RequesterId: input.requesterId,
      CurrentApproverId: input.currentApproverId ?? null,

      Status: RequestStatus.Pending,
      CurrentStep: input.currentStep,

      Department: input.department,
      IsEmergency: input.isEmergency ?? false,

      ExpectedSLA: input.expectedSLA,
      CurrentStepSLA: input.currentStepSLA,
      ActualSLA: input.actualSLA,
      CompleteSLA: input.completeSLA,
      SLAStartTime: input.slaStartTime,
      SLAEndTime: input.slaEndTime,

      CurrentStepName: input.currentStepName,
      HistoryApproval: JSON.stringify(input.historyApproval || []),
    };

    if (!input.currentApproverId) {
      delete payload.CurrentApproverId;
    }

    const result = await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.add(payload);

    return this.getRequestById(result.Id);
  }

  // READ

  async getRequestById(id: number): Promise<IRequest> {
    const item = await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.getById(id)
      .select(...REQUEST_SELECT)
      .expand(...REQUEST_EXPAND)();

    return this._mapRequest(item);
  }

  async getRequests(filter: IRequestFilterInput = {}): Promise<IRequest[]> {
    const filterStr = this._buildFilter(filter);

    let query = this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.select(...REQUEST_SELECT)
      .expand(...REQUEST_EXPAND)
      .orderBy("Created", false);

    if (filterStr) query = query.filter(filterStr);
    if (filter.top) query = query.top(filter.top);
    if (filter.skip) query = query.skip(filter.skip);

    const items = await query();

    return items.map(this._mapRequest.bind(this));
  }

  getAllRequests(top = 100): Promise<IRequest[]> {
    return this.getRequests({ top });
  }

  getAllRequestsForAdmin(): Promise<IRequest[]> {
    return this.getRequests({ top: 5000 });
  }

  getMyRequests(currentUserId: number, top = 100): Promise<IRequest[]> {
    return this.getRequests({
      requesterId: currentUserId,
      top,
    });
  }

  getPendingRequests(
    currentApproverId: number,
    top = 100,
  ): Promise<IRequest[]> {
    return this.getRequests({
      currentApproverId,
      status: RequestStatus.Pending,
      top,
    });
  }

  getRequestsByLeave(absenceIDId: number, top = 100): Promise<IRequest[]> {
    return this.getRequests({
      absenceIDId,
      top,
    });
  }

  async getActiveRequestByLeave(
    absenceIDId: number,
  ): Promise<IRequest | undefined> {
    const items = await this.getRequests({
      absenceIDId,
      status: RequestStatus.Pending,
      top: 1,
    });

    return items[0];
  }

  // UPDATE

  async updateRequest(input: IUpdateRequestInput): Promise<void> {
    const payload = this._buildUpdatePayload(input);

    await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.getById(input.id)
      .update(payload);
  }

  async updateRequestAdmin(input: IUpdateRequestAdminInput): Promise<void> {
    await this.updateRequest({
      id: input.id,
      status: input.status,
      currentStep: input.currentStep,
      currentStepName: input.currentStepName,
      currentApproverId: input.currentApproverId,
      isEmergency: input.isEmergency,
    });
  }

  async deleteRequest(id: number): Promise<void> {
    await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.getById(id)
      .delete();
  }

  async closeRequest(id: number, status: RequestStatus): Promise<void> {
    await this.updateRequest({
      id,
      status,
    });
  }

  async updateHistoryApproval(
    requestId: number,
    historyApproval: IHistoryApproval[],
  ): Promise<void> {
    await this.updateRequest({
      id: requestId,
      historyApproval,
    });
  }

  // PRIVATE

  private _buildFilter(filter: IRequestFilterInput): string | undefined {
    const conditions: string[] = [];

    if (filter.requesterId !== undefined) {
      conditions.push(`RequesterId eq ${filter.requesterId}`);
    }

    if (filter.currentApproverId !== undefined) {
      conditions.push(`CurrentApproverId eq ${filter.currentApproverId}`);
    }

    if (filter.status !== undefined) {
      conditions.push(`Status eq '${filter.status}'`);
    }

    if (filter.statusNot !== undefined) {
      conditions.push(`Status ne '${filter.statusNot}'`);
    }

    if (filter.absenceIDId !== undefined) {
      conditions.push(`AbsenceIDId eq ${filter.absenceIDId}`);
    }

    return conditions.length > 0 ? conditions.join(" and ") : undefined;
  }

  private _buildUpdatePayload(
    input: IUpdateRequestInput,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (input.status !== undefined) {
      payload.Status = input.status;
    }

    if (input.currentApproverId !== undefined) {
      payload.CurrentApproverId = input.currentApproverId;
    }

    if (input.currentStep !== undefined) {
      payload.CurrentStep = input.currentStep;
    }

    if (input.currentStepName !== undefined) {
      payload.CurrentStepName = input.currentStepName;
    }

    if (input.department !== undefined) {
      payload.Department = input.department;
    }

    if (input.isEmergency !== undefined) {
      payload.IsEmergency = input.isEmergency;
    }

    if (input.historyApproval !== undefined) {
      payload.HistoryApproval = JSON.stringify(input.historyApproval);
    }

    if (input.expectedSLA !== undefined) {
      payload.ExpectedSLA = input.expectedSLA;
    }

    if (input.currentStepSLA !== undefined) {
      payload.CurrentStepSLA = input.currentStepSLA;
    }

    if (input.actualSLA !== undefined) {
      payload.ActualSLA = input.actualSLA;
    }

    if (input.completeSLA !== undefined) {
      payload.CompleteSLA = input.completeSLA;
    }

    if (input.slaStartTime !== undefined) {
      payload.SLAStartTime = input.slaStartTime;
    }

    if (input.slaEndTime !== undefined) {
      payload.SLAEndTime = input.slaEndTime;
    }

    return payload;
  }
  private _mapRequest = (raw: any): IRequest => {
    const absenceIdValue = raw.AbsenceID?.Id ?? raw.AbsenceIDId;

    return {
      Id: raw.Id as number,
      Title: raw.Title as string,
      Created: raw.Created as string ,

      AbsenceIDId: absenceIdValue as number,
      AbsenceTitle: raw.AbsenceID?.Title,

      ProcessIDId: raw.ProcessID?.Id ?? raw.ProcessIDId,
      ProcessTitle: raw.ProcessID?.Title,

      RequesterId: (raw.RequesterId as number | undefined) ?? raw.Requester?.Id,
      Requester: this.mapPerson(raw, "Requester"),

      CurrentApproverId:
        (raw.CurrentApproverId as number | null | undefined) ??
        raw.CurrentApprover?.Id ??
        null,
      CurrentApprover: this.mapPerson(raw, "CurrentApprover"),

      Status: raw.Status as RequestStatus,
      CurrentStep: raw.CurrentStep as number | undefined,
      CurrentStepName: raw.CurrentStepName as string | undefined,

      IsEmergency: raw.IsEmergency as boolean | undefined,
      Department: raw.Department as string | undefined,

      ExpectedSLA: raw.ExpectedSLA as number | undefined,
      CurrentStepSLA: raw.CurrentStepSLA as number | undefined,
      ActualSLA: raw.ActualSLA as number | undefined,
      CompleteSLA:
        raw.CompleteSLA as IRequest["CompleteSLA"],
      SLAStartTime: raw.SLAStartTime as string | undefined,
      SLAEndTime: raw.SLAEndTime as string | undefined,

      HistoryApproval: (raw.HistoryApproval as string) ?? "[]",
    };
  };
}
