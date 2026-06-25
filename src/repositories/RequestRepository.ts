import { BaseRepository } from "./BaseRepository";
import { IRequest, IHistoryApproval } from "../models";
import { LISTS } from "../constants/lists";
import { RequestStatus } from "../constants/enums";

export interface ICreateRequestInput {
  absenceIDId: number;
  approverId: number;
  currentStep: number;
  department?: string;
  isEmergency?: boolean;
  historyApproval?: IHistoryApproval[];
}

const REQUEST_SELECT = [
  "Id",
  "Title",
  "AbsenceIDId",
  "Status",
  "CurrentStep",
  "IsEmergency",
  "Department",
  "AbsenceID/Id",
  "AbsenceID/Title",
  "Approver/Id",
  "Approver/Title",
  "Approver/EMail",
  "Author/Id",
  "Author/Title",
  "Author/EMail",
  "HistoryApproval",
] as const;

const REQUEST_EXPAND = ["Approver", "Author", "AbsenceID"] as const;

export class RequestRepository extends BaseRepository {
  async createRequest(input: ICreateRequestInput): Promise<IRequest> {
    const result = await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.add({
        Title: this.generateTitle("REQ", input.absenceIDId),
        AbsenceIDId: input.absenceIDId,
        Status: RequestStatus.Pending,
        ApproverId: input.approverId,
        CurrentStep: input.currentStep,
        Department: input.department,
        IsEmergency: input.isEmergency ?? false,
        HistoryApproval: JSON.stringify(input.historyApproval || []),
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

  async updateHistoryApproval(
    requestId: number,
    history: IHistoryApproval[],
  ): Promise<void> {
    await this.sp.web.lists
      .getByTitle(LISTS.REQUESTS)
      .items.getById(requestId)
      .update({
        HistoryApproval: JSON.stringify(history),
      });
  }

  private _mapRequest = (raw: any): IRequest => {
    const absenceIdValue = raw.AbsenceID?.Id ?? raw.AbsenceIDId;

    return {
      Id: raw.Id as number,
      Title: raw.Title as string,
      AbsenceIDId: absenceIdValue as number,
      AbsenceTitle: raw.AbsenceID?.Title,
      Status: raw.Status as RequestStatus,
      Approver: this.mapPerson(raw, "Approver"),
      Author: this.mapPerson(raw, "Author"),
      CurrentStep: raw.CurrentStep as number | undefined,
      IsEmergency: raw.IsEmergency as boolean | undefined,
      Department: raw.Department as string | undefined,
      HistoryApproval: (raw.HistoryApproval as string) ?? "[]",
    };
  };
}