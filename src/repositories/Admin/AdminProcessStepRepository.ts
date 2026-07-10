import { BaseRepository } from "../BaseRepository";
import { LISTS } from "../../constants/lists";
import { IProcessStep } from "../../models";
import {
  ICreateProcessStepInput,
  IUpdateProcessStepInput,
} from "../../pages/AdminPage/types/AdminProcessConfigTypes";

const STEP_SELECT = [
  "Id",
  "Title",
  "ProcessIDId",
  "ProcessID/ProcessCode",
  "StepOrder",
  "StepApproverId",
  "StepApprover/Id",
  "StepApprover/Title",
  "StepApprover/EMail",
  "SLA_Hours",
  "BeforeSLA",
  "IsActive",
] as const;

const STEP_EXPAND = ["StepApprover", "ProcessID"] as const;

export class AdminProcessStepRepository extends BaseRepository {
  async getStepsByProcessId(processId: number): Promise<IProcessStep[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.select(...STEP_SELECT)
        .expand(...STEP_EXPAND)
        .filter(`ProcessIDId eq ${processId}`)
        .orderBy("StepOrder", true)();

      return items.map(this._mapStep.bind(this));
    } catch (e) {
      this.handleError(e, "getStepsByProcessId");
    }
  }

  async getStepById(id: number): Promise<IProcessStep | null> {
    try {
      const item = await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.getById(id)
        .select(...STEP_SELECT)
        .expand(...STEP_EXPAND)();

      return item ? this._mapStep(item) : null;
    } catch (e) {
      this.handleError(e, "getStepById");
    }
  }

  async createStep(input: ICreateProcessStepInput): Promise<IProcessStep> {
    try {
      const payload: Record<string, unknown> = {
        Title: input.title,
        ProcessIDId: input.processId,
        StepOrder: input.stepOrder,
        IsActive: input.isActive ?? true,
      };

      if (input.stepApproverId !== undefined) {
        payload.StepApproverId = input.stepApproverId;
      }

      if (input.slaHours !== undefined) {
        payload.SLA_Hours = input.slaHours;
      }

      if (input.beforeSLA !== undefined) {
        payload.BeforeSLA = input.beforeSLA;
      }

      const result = await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.add(payload);

      const created = await this.getStepById(result.Id);

      if (!created) {
        throw new Error(`Khong tim thay buoc sau khi tao. Id: ${result.Id}`);
      }

      return created;
    } catch (e) {
      this.handleError(e, "createStep");
    }
  }

  async updateStep(input: IUpdateProcessStepInput): Promise<void> {
    try {
      const payload: Record<string, unknown> = {};

      if (input.title !== undefined) {
        payload.Title = input.title;
      }

      if (input.stepOrder !== undefined) {
        payload.StepOrder = input.stepOrder;
      }

      if (input.stepApproverId !== undefined) {
        payload.StepApproverId = input.stepApproverId;
      }

      if (input.slaHours !== undefined) {
        payload.SLA_Hours = input.slaHours;
      }

      if (input.beforeSLA !== undefined) {
        payload.BeforeSLA = input.beforeSLA;
      }

      if (input.isActive !== undefined) {
        payload.IsActive = input.isActive;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.getById(input.id)
        .update(payload);
    } catch (e) {
      this.handleError(e, "updateStep");
    }
  }

  async deactivateStep(id: number): Promise<void> {
    try {
      await this.updateStep({
        id,
        isActive: false,
      });
    } catch (e) {
      this.handleError(e, "deactivateStep");
    }
  }
  private _mapStep = (raw: Record<string, unknown>): IProcessStep => ({
    Id: raw["Id"] as number,
    Title: raw["Title"] as string,
    ProcessIDId: raw["ProcessIDId"] as number,
    ProcessCode:
      (raw["ProcessID"] as { ProcessCode?: string } | undefined)?.ProcessCode ??
      "",
    StepOrder: raw["StepOrder"] as number,
    StepApprover: this.mapPerson(raw, "StepApprover"),
    StepApproverId:
      (raw["StepApproverId"] as number | undefined) ??
      (raw["StepApprover"] as { Id?: number } | undefined)?.Id ??
      undefined,
    IsActive: raw["IsActive"] as boolean,
    SLA_Hours: raw["SLA_Hours"] as number | undefined,
    BeforeSLA: raw["BeforeSLA"] as number | undefined,
  });
}
