import { FieldType } from "../../constants/enums";
import { IFieldConfig } from "../../models";
import { AdminFieldConfigRepository } from "../../repositories/Admin/AdminFieldConfigRepository";
import {
  ICreateFieldConfigInput,
  IUpdateFieldConfigInput,
} from "../../pages/AdminPage/types/AdminProcessConfigTypes";

export class AdminFieldConfigService {
  private _repo = new AdminFieldConfigRepository();

  async getFieldConfigsByProcessId(processId: number): Promise<IFieldConfig[]> {
    this._validateId(processId, "processId");
    return this._repo.getFieldConfigsByProcessId(processId);
  }

  async getFieldConfigById(id: number): Promise<IFieldConfig | null> {
    this._validateId(id, "id");
    return this._repo.getFieldConfigById(id);
  }

  async createFieldConfig(
    input: ICreateFieldConfigInput,
  ): Promise<IFieldConfig> {
    this._validateId(input.processId, "processId");
    this._validateOptionalPositiveId(input.stepId, "stepId");

    const fieldInternalName = input.fieldInternalName?.trim();
    if (!fieldInternalName) {
      throw new Error("Tên nội bộ trường là bắt buộc.");
    }

    const fieldDisplayName = input.fieldDisplayName?.trim();
    if (!fieldDisplayName) {
      throw new Error("Tên hiển thị trường là bắt buộc.");
    }

    if (!input.fieldType) {
      throw new Error("Kiểu trường là bắt buộc.");
    }

    const normalizedStepId = this._normalizeStepId(input.stepId);
    const normalizedFieldOptions =
      input.fieldType === FieldType.Dropdown
        ? this._normalizeFieldOptions(input.fieldOptions)
        : undefined;

    this._validateFieldOptions(input.fieldType, normalizedFieldOptions);
    await this._ensureFieldInternalNameUnique(
      input.processId,
      normalizedStepId,
      fieldInternalName,
    );

    const normalizedInput: ICreateFieldConfigInput = {
      processId: input.processId,
      stepId:
        normalizedStepId === null || normalizedStepId === undefined
          ? undefined
          : normalizedStepId,
      componentType:
        input.componentType !== undefined
          ? input.componentType.trim()
          : undefined,
      fieldInternalName,
      fieldDisplayName,
      fieldType: input.fieldType,
      fieldOptions: normalizedFieldOptions,
      isRequired: input.isRequired ?? false,
      isVisible: input.isVisible ?? true,
      isEditable: input.isEditable ?? true,
    };

    return this._repo.createFieldConfig(normalizedInput);
  }

  async updateFieldConfig(input: IUpdateFieldConfigInput): Promise<void> {
    this._validateId(input.id, "id");

    const currentFieldConfig = await this._repo.getFieldConfigById(input.id);
    if (!currentFieldConfig) {
      throw new Error(`Không tìm thấy cấu hình trường với id: ${input.id}.`);
    }

    this._validateOptionalPositiveId(input.stepId, "stepId");

    const normalizedInput: IUpdateFieldConfigInput = {
      id: input.id,
    };

    if (input.stepId !== undefined) {
      normalizedInput.stepId = this._normalizeStepId(input.stepId);
    }
    if (input.componentType !== undefined) {
      normalizedInput.componentType = input.componentType.trim();
    }

    if (input.fieldInternalName !== undefined) {
      const fieldInternalName = input.fieldInternalName.trim();
      if (!fieldInternalName) {
        throw new Error("Tên nội bộ trường không được để trống.");
      }
      normalizedInput.fieldInternalName = fieldInternalName;
    }

    if (input.fieldDisplayName !== undefined) {
      const fieldDisplayName = input.fieldDisplayName.trim();
      if (!fieldDisplayName) {
        throw new Error("Tên hiển thị trường không được để trống.");
      }
      normalizedInput.fieldDisplayName = fieldDisplayName;
    }

    if (input.fieldType !== undefined) {
      normalizedInput.fieldType = input.fieldType;
    }

    if (input.fieldOptions !== undefined) {
      normalizedInput.fieldOptions = this._normalizeFieldOptions(
        input.fieldOptions,
      );
    }

    if (input.isRequired !== undefined) {
      normalizedInput.isRequired = input.isRequired;
    }

    if (input.isVisible !== undefined) {
      normalizedInput.isVisible = input.isVisible;
    }

    if (input.isEditable !== undefined) {
      normalizedInput.isEditable = input.isEditable;
    }

    if (Object.keys(normalizedInput).length === 1) {
      return;
    }

    const nextFieldType = input.fieldType ?? currentFieldConfig.FieldType;

    if (
      nextFieldType !== FieldType.Dropdown &&
      input.fieldType !== undefined &&
      input.fieldType !== currentFieldConfig.FieldType
    ) {
      normalizedInput.fieldOptions = [];
    }

    const currentFieldOptions = this._parseStoredFieldOptions(
      currentFieldConfig.FieldOptions,
    );
    const finalFieldOptions =
      normalizedInput.fieldOptions !== undefined
        ? normalizedInput.fieldOptions
        : currentFieldOptions;

    this._validateFieldOptions(nextFieldType, finalFieldOptions);

    const currentStepContext = this._normalizeStepId(
      currentFieldConfig.StepIDId,
    );
    const nextStepContext =
      normalizedInput.stepId !== undefined
        ? this._normalizeStepId(normalizedInput.stepId)
        : currentStepContext;

    const nextInternalName =
      normalizedInput.fieldInternalName ?? currentFieldConfig.FieldInternalName;

    const stepContextChanged = nextStepContext !== currentStepContext;
    const internalNameChanged =
      nextInternalName.toLowerCase() !==
      currentFieldConfig.FieldInternalName.toLowerCase();

    if (stepContextChanged || internalNameChanged) {
      await this._ensureFieldInternalNameUnique(
        currentFieldConfig.ProcessIDId,
        nextStepContext,
        nextInternalName,
        input.id,
      );
    }

    await this._repo.updateFieldConfig(normalizedInput);
  }

  async deactivateFieldConfig(id: number): Promise<void> {
    this._validateId(id, "id");
    await this._repo.deactivateFieldConfig(id);
  }

  private _validateId(id: number, fieldName: string): void {
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error(`${fieldName} phải là số dương lớn hơn 0.`);
    }
  }

  private _validateOptionalPositiveId(
    id: number | null | undefined,
    fieldName: string,
  ): void {
    if (id === undefined || id === null) {
      return;
    }

    if (!Number.isFinite(id) || id <= 0) {
      throw new Error(`${fieldName} phải là số dương lớn hơn 0.`);
    }
  }

  private _normalizeStepId(
    stepId: number | null | undefined,
  ): number | null | undefined {
    if (stepId === undefined) {
      return undefined;
    }

    if (stepId === null) {
      return null;
    }

    return stepId;
  }

  private _normalizeFieldOptions(
    fieldOptions: string[] | undefined,
  ): string[] | undefined {
    if (fieldOptions === undefined) {
      return undefined;
    }

    const normalized: string[] = [];
    const seen = new Set<string>();

    fieldOptions.forEach((option) => {
      const normalizedOption = option.trim();
      if (!normalizedOption) {
        return;
      }

      const normalizedKey = normalizedOption.toLocaleLowerCase();
      if (seen.has(normalizedKey)) {
        return;
      }

      seen.add(normalizedKey);
      normalized.push(normalizedOption);
    });

    return normalized;
  }

  private _parseStoredFieldOptions(fieldOptions?: string): string[] | undefined {
    if (!fieldOptions) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(fieldOptions) as unknown;

      if (Array.isArray(parsed)) {
        return parsed
          .filter((option): option is string => typeof option === "string")
          .map((option) => option.trim())
          .filter(Boolean);
      }
    } catch {
      // Fallback for legacy raw strings separated by comma/newline.
    }

    return fieldOptions
      .split(/\r?\n|,/) 
      .map((option) => option.trim())
      .filter(Boolean);
  }

  private _validateFieldOptions(
    fieldType: FieldType,
    fieldOptions: string[] | undefined,
  ): void {
    if (fieldType !== FieldType.Dropdown) {
      return;
    }

    if (!fieldOptions || fieldOptions.length === 0) {
      throw new Error("FieldOptions là bắt buộc cho kiểu trường Dropdown.");
    }

    const hasEmptyOption = fieldOptions.some((option) => option.trim().length === 0);
    if (hasEmptyOption) {
      throw new Error("FieldOptions không được chứa lựa chọn rỗng.");
    }
  }

  private async _ensureFieldInternalNameUnique(
    processId: number,
    stepId: number | null | undefined,
    fieldInternalName: string,
    excludeFieldConfigId?: number,
  ): Promise<void> {
    const allFieldConfigs =
      await this._repo.getFieldConfigsByProcessId(processId);

    const normalizedStepId = stepId ?? null;
    const normalizedInternalName = fieldInternalName.trim().toLowerCase();

    const duplicated = allFieldConfigs.some((fieldConfig) => {
      if (fieldConfig.Id === excludeFieldConfigId) {
        return false;
      }

      const fieldStepId = fieldConfig.StepIDId ?? null;
      const sameStepContext = fieldStepId === normalizedStepId;
      const sameInternalName =
        fieldConfig.FieldInternalName.trim().toLowerCase() ===
        normalizedInternalName;

      return sameStepContext && sameInternalName;
    });

    if (duplicated) {
      throw new Error(
        `Tên nội bộ trường \"${fieldInternalName}\" đã tồn tại trong cùng phạm vi bước cấu hình.`,
      );
    }
  }
}
