import { BaseRepository } from "./BaseRepository";
import { IProcess, IProcessStep, IFieldConfig } from "../models";
import { LISTS } from "../constants/lists";
import { FieldType } from "../constants/enums";

const PROCESS_SELECT = [
  "Id",
  "Title",
  "ProcessCode",
  "Description",
  "IsActive",
] as const;

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

const FIELD_CONFIG_SELECT = [
  "Id",
  "Title",
  "ProcessIDId",
  "StepIDId",
  "ComponentType",
  "FieldInternalName",
  "FieldDisplayName",
  "FieldType",
  "FieldOptions",
  "IsRequired",
  "IsVisible",
  "IsEditable",
] as const;

export class ProcessRepository extends BaseRepository {
  async getAllActive(): Promise<IProcess[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.PROCESSES)
        .items.select(...PROCESS_SELECT)
        .filter("IsActive eq 1")
        .orderBy("Title", true)();

      return items.map(this._mapProcess);
    } catch (e) {
      this.handleError(e, "getAllActive");
    }
  }

  async getByCode(code: string): Promise<IProcess | null> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.PROCESSES)
        .items.select(...PROCESS_SELECT)
        .filter(`ProcessCode eq '${code}' and IsActive eq 1`)
        .top(1)();

      return items.length > 0 ? this._mapProcess(items[0]) : null;
    } catch (e) {
      this.handleError(e, "getByCode");
    }
  }

  // Lấy một quy trình theo Id
  async getById(id: number): Promise<IProcess | null> {
    try {
      const item = await this.sp.web.lists
        .getByTitle(LISTS.PROCESSES)
        .items.getById(id)
        .select(...PROCESS_SELECT)();

      return item ? this._mapProcess(item) : null;
    } catch (e) {
      this.handleError(e, "getById");
    }
  }

  async getStepsByProcessId(processId: number): Promise<IProcessStep[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.select(...STEP_SELECT)
        .expand(...STEP_EXPAND)
        .filter(`ProcessIDId eq ${processId} and IsActive eq 1`)
        .orderBy("StepOrder", true)();

      return items.map(this._mapStep.bind(this));
    } catch (e) {
      this.handleError(e, "getStepsByProcessId");
    }
  }

  // Lấy một bước theo Id
  async getStepById(stepId: number): Promise<IProcessStep | null> {
    try {
      const item = await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.getById(stepId)
        .select(...STEP_SELECT)
        .expand(...STEP_EXPAND)();

      return item ? this._mapStep(item) : null;
    } catch (e) {
      this.handleError(e, "getStepById");
    }
  }

  async getStepByOrder(
    processId: number,
    stepOrder: number,
  ): Promise<IProcessStep | null> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.select(...STEP_SELECT)
        .expand(...STEP_EXPAND)
        .filter(
          `ProcessIDId eq ${processId} and StepOrder eq ${stepOrder} and IsActive eq 1`,
        )
        .top(1)();

      return items.length > 0 ? this._mapStep(items[0]) : null;
    } catch (e) {
      this.handleError(e, "getStepByOrder");
    }
  }

  async countSteps(processId: number): Promise<number> {
    try {
      const result = await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.filter(`ProcessIDId eq ${processId} and IsActive eq 1`)
        .select("Id")
        .top(500)();

      return result.length;
    } catch (e) {
      this.handleError(e, "countSteps");
    }
  }

  findNextApprovalStepFromSteps(
    steps: IProcessStep[],
    currentStepOrder: number,
  ): IProcessStep | null {
    const nextStep = steps.find(
      (step) => step.StepOrder > currentStepOrder && !!step.StepApproverId,
    );

    return nextStep ?? null;
  }

  async getNextApprovalStep(
    processId: number,
    currentStepOrder: number,
  ): Promise<IProcessStep | null> {
    try {
      const steps = await this.getStepsByProcessId(processId);

      return this.findNextApprovalStepFromSteps(steps, currentStepOrder);
    } catch (e) {
      this.handleError(e, "getNextApprovalStep");
    }
  }

  // Cập nhật ActualSLA và CompletedSLA sau khi bước hoàn thành
  async updateStepSLA(
    stepId: number,
    actualSLA: number,
    completed: boolean,
  ): Promise<void> {
    try {
      await this.sp.web.lists
        .getByTitle(LISTS.PROCESS_STEPS)
        .items.getById(stepId)
        .update({
          ActualSLA: actualSLA,
          CompletedSLA: completed,
        });
    } catch (e) {
      this.handleError(e, "updateStepSLA");
    }
  }

  async getFieldConfigs(processId: number): Promise<IFieldConfig[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.FIELD_CONFIG)
        .items.select(...FIELD_CONFIG_SELECT)
        .filter(`ProcessIDId eq ${processId}`)
        .orderBy("Id", true)();

      return items.map(this._mapFieldConfig);
    } catch (e) {
      this.handleError(e, "getFieldConfigs");
    }
  }

  async getFieldConfigsByStep(
    processId: number,
    stepId: number,
  ): Promise<IFieldConfig[]> {
    try {
      // SharePoint không hỗ trợ "IS NULL" trong REST filter
      // Nên phải query 2 lần rồi merge ở client
      const [stepConfigs, generalConfigs] = await Promise.all([
        // Config riêng cho bước này
        this.sp.web.lists
          .getByTitle(LISTS.FIELD_CONFIG)
          .items.select(...FIELD_CONFIG_SELECT)
          .filter(`ProcessIDId eq ${processId} and StepIDId eq ${stepId}`)(),

        // Config chung — StepId = 0 (quy ước: dùng 0 thay vì null cho REST filter dễ hơn)
        // Hoặc lấy tất cả rồi filter ở client
        this.sp.web.lists
          .getByTitle(LISTS.FIELD_CONFIG)
          .items.select(...FIELD_CONFIG_SELECT)
          .filter(`ProcessIDId eq ${processId}`)(),
      ]);

      // Filter: lấy config chung (không có StepId) + config riêng bước này
      const general = generalConfigs.filter(
        (i: Record<string, unknown>) => !i["StepIDId"],
      );
      const forStep = stepConfigs;

      // Merge: config bước cụ thể override config chung nếu cùng FieldInternalName
      const merged = [...general];
      for (const sc of forStep) {
        const idx = merged.findIndex(
          (g: Record<string, unknown>) =>
            g["FieldInternalName"] === sc["FieldInternalName"],
        );
        if (idx >= 0) {
          merged[idx] = sc; // override
        } else {
          merged.push(sc); // thêm mới
        }
      }

      return merged.map(this._mapFieldConfig);
    } catch (e) {
      this.handleError(e, "getFieldConfigsByStep");
    }
  }

  private _mapProcess = (raw: Record<string, unknown>): IProcess => ({
    Id: raw["Id"] as number,
    Title: raw["Title"] as string,
    ProcessCode: raw["ProcessCode"] as string,
    Description: raw["Description"] as string | undefined,
    IsActive: raw["IsActive"] as boolean,
  });

  private _mapStep = (raw: Record<string, unknown>): IProcessStep => ({
    Id: raw["Id"] as number,
    Title: raw["Title"] as string,
    ProcessIDId: raw["ProcessIDId"] as number,
    ProcessCode:
      (raw["ProcessID"] as { ProcessCode?: string } | undefined)?.ProcessCode ??
      "", // Bổ sung để khớp với interface
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

  private _mapFieldConfig = (raw: Record<string, unknown>): IFieldConfig => ({
    Id: raw["Id"] as number,
    Title: raw["Title"] as string,
    ProcessIDId: raw["ProcessIDId"] as number,
    StepIDId: raw["StepIDId"] as number | undefined,
    ProcessCode: raw["ProcessCode"] as string | undefined,
    ComponentType: raw["ComponentType"] as string | undefined,
    FieldInternalName: raw["FieldInternalName"] as string,
    FieldDisplayName: raw["FieldDisplayName"] as string,
    FieldType: raw["FieldType"] as FieldType,
    IsRequired: raw["IsRequired"] as boolean,
    IsVisible: raw["IsVisible"] as boolean,
    IsEditable: raw["IsEditable"] as boolean,
    FieldOptions: (raw["FieldOptions"] as string) || "",
  });
}
