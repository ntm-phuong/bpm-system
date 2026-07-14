import { BaseRepository } from "../BaseRepository";
import { FieldType } from "../../constants/enums";
import { LISTS } from "../../constants/lists";
import { IFieldConfig } from "../../models";
import {
  ICreateFieldConfigInput,
  IUpdateFieldConfigInput,
} from "../../pages/AdminPage/types/AdminProcessConfigTypes";

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

export class AdminFieldConfigRepository extends BaseRepository {
  async getFieldConfigsByProcessId(processId: number): Promise<IFieldConfig[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.FIELD_CONFIG)
        .items.select(...FIELD_CONFIG_SELECT)
        .filter(`ProcessIDId eq ${processId}`)
        .orderBy("Id", true)();

      return items.map(this._mapFieldConfig);
    } catch (e) {
      this.handleError(e, "getFieldConfigsByProcessId");
    }
  }

  async getFieldConfigById(id: number): Promise<IFieldConfig | null> {
    try {
      const item = await this.sp.web.lists
        .getByTitle(LISTS.FIELD_CONFIG)
        .items.getById(id)
        .select(...FIELD_CONFIG_SELECT)();

      return item ? this._mapFieldConfig(item) : null;
    } catch (e) {
      this.handleError(e, "getFieldConfigById");
    }
  }

  async createFieldConfig(
    input: ICreateFieldConfigInput,
  ): Promise<IFieldConfig> {
    try {
      const payload: Record<string, unknown> = {
        // Title: input.title,
        ProcessIDId: input.processId,
        FieldInternalName: input.fieldInternalName,
        FieldDisplayName: input.fieldDisplayName,
        FieldType: input.fieldType,
        IsRequired: input.isRequired,
        IsVisible: input.isVisible,
        IsEditable: input.isEditable,
      };

      if (input.stepId !== undefined) {
        payload.StepIDId = input.stepId;
      }

      if (input.componentType !== undefined) {
        payload.ComponentType = input.componentType;
      }

      if (input.fieldOptions !== undefined) {
        payload.FieldOptions = input.fieldOptions;
      }

      const result = await this.sp.web.lists
        .getByTitle(LISTS.FIELD_CONFIG)
        .items.add(payload);

      const created = await this.getFieldConfigById(result.Id);

      if (!created) {
        throw new Error(
          `Khong tim thay cau hinh truong sau khi tao. Id: ${result.Id}`,
        );
      }

      return created;
    } catch (e) {
      this.handleError(e, "createFieldConfig");
    }
  }

  async updateFieldConfig(input: IUpdateFieldConfigInput): Promise<void> {
    try {
      const payload: Record<string, unknown> = {};

      if (input.stepId !== undefined) {
        payload.StepIDId = input.stepId;
      }

      // if (input.title !== undefined) {
      //   payload.Title = input.title;
      // }

      if (input.componentType !== undefined) {
        payload.ComponentType = input.componentType;
      }

      if (input.fieldInternalName !== undefined) {
        payload.FieldInternalName = input.fieldInternalName;
      }

      if (input.fieldDisplayName !== undefined) {
        payload.FieldDisplayName = input.fieldDisplayName;
      }

      if (input.fieldType !== undefined) {
        payload.FieldType = input.fieldType;
      }

      if (input.fieldOptions !== undefined) {
        payload.FieldOptions = input.fieldOptions;
      }

      if (input.isRequired !== undefined) {
        payload.IsRequired = input.isRequired;
      }

      if (input.isVisible !== undefined) {
        payload.IsVisible = input.isVisible;
      }

      if (input.isEditable !== undefined) {
        payload.IsEditable = input.isEditable;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      await this.sp.web.lists
        .getByTitle(LISTS.FIELD_CONFIG)
        .items.getById(input.id)
        .update(payload);
    } catch (e) {
      this.handleError(e, "updateFieldConfig");
    }
  }

  async deactivateFieldConfig(id: number): Promise<void> {
    try {
      await this.updateFieldConfig({
        id,
        isVisible: false,
      });
    } catch (e) {
      this.handleError(e, "deactivateFieldConfig");
    }
  }

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
