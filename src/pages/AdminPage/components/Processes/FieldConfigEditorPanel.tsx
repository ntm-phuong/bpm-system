import * as React from "react";
import { FieldType } from "../../../../constants/enums";
import { IFieldConfig, IProcessStep } from "../../../../models";
import {
  ICreateFieldConfigInput,
  IUpdateFieldConfigInput,
} from "../../types/AdminProcessConfigTypes";
import styles from "./FieldConfigEditorPanel.module.scss";
import { DropdownOptionsEditor } from "./DropdownOptionEditor";

interface IFieldConfigEditorPanelProps {
  isOpen: boolean;
  processId: number;
  fieldConfig?: IFieldConfig;
  steps: IProcessStep[];
  saving: boolean;
  onSave: (input: ICreateFieldConfigInput | IUpdateFieldConfigInput) => void;
  onCancel: () => void;
}

interface IFieldConfigFormState {
  fieldInternalName: string;
  fieldDisplayName: string;
  fieldType: FieldType;
  stepId?: number;
  isRequired: boolean;
  isVisible: boolean;
  isEditable: boolean;
  componentType: string;
  fieldOptions: string[];
}

interface IFieldConfigFormErrors {
  fieldInternalName?: string;
  fieldDisplayName?: string;
  fieldType?: string;
  fieldOptions?: string;
}

const FIELD_TYPE_OPTIONS: Array<{
  value: FieldType;
  label: string;
}> = [
  {
    value: FieldType.Text,
    label: "Text",
  },
  {
    value: FieldType.Number,
    label: "Number",
  },
  {
    value: FieldType.DateTime,
    label: "Date",
  },
  {
    value: FieldType.Choice,
    label: "Choice",
  },
  {
    value: FieldType.Person,
    label: "Person",
  },
  {
    value: FieldType.YesNo,
    label: "Yes / No",
  },
  {
    value: FieldType.MultiLine,
    label: "Multi-line Text",
  },
  {
    value: FieldType.Dropdown,
    label: "Dropdown",
  },
];

const createInitialFormState = (
  fieldConfig?: IFieldConfig,
): IFieldConfigFormState => {
  return {
    fieldInternalName: fieldConfig?.FieldInternalName ?? "",
    fieldDisplayName: fieldConfig?.FieldDisplayName ?? "",
    fieldType: fieldConfig?.FieldType ?? FieldType.Text,
    stepId: fieldConfig?.StepIDId,
    isRequired: fieldConfig?.IsRequired ?? false,
    isVisible: fieldConfig?.IsVisible ?? true,
    isEditable: fieldConfig?.IsEditable ?? true,
    componentType: fieldConfig?.ComponentType ?? "",
    fieldOptions: parseFieldOptions(fieldConfig?.FieldOptions),
  };
};

const normalizeOptionalText = (value: string): string | undefined => {
  const normalizedValue = value.trim();

  return normalizedValue || undefined;
};
const parseFieldOptions = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((option) => option.trim()).filter(Boolean);
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .filter((option): option is string => typeof option === "string")
        .map((option) => option.trim())
        .filter(Boolean);
    }
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((option) => option.trim())
      .filter(Boolean);
  }

  return [];
};

export const FieldConfigEditorPanel: React.FC<IFieldConfigEditorPanelProps> = ({
  isOpen,
  processId,
  fieldConfig,
  steps,
  saving,
  onSave,
  onCancel,
}) => {
  const [form, setForm] = React.useState<IFieldConfigFormState>(() =>
    createInitialFormState(fieldConfig),
  );

  const [newOption, setNewOption] = React.useState<string>("");

  const [errors, setErrors] = React.useState<IFieldConfigFormErrors>({});

  const isEditMode = fieldConfig !== undefined;

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(createInitialFormState(fieldConfig));
    setNewOption("");
    setErrors({});
  }, [isOpen, fieldConfig]);

  const handleChange = <K extends keyof IFieldConfigFormState>(
    field: K,
    value: IFieldConfigFormState[K],
  ): void => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: undefined,
    }));
  };

  // const supportsOptions = (fieldType: FieldType): boolean =>
  //   fieldType === FieldType.Dropdown || fieldType === FieldType.Choice;

  const handleAddOption = (): void => {
    const normalizedOption = newOption.trim();

    if (!normalizedOption) {
      return;
    }

    const optionExists = form.fieldOptions.some(
      (option) =>
        option.toLocaleLowerCase() === normalizedOption.toLocaleLowerCase(),
    );

    if (optionExists) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        fieldOptions: "Lựa chọn này đã tồn tại.",
      }));

      return;
    }

    setForm((previousForm) => ({
      ...previousForm,
      fieldOptions: [...previousForm.fieldOptions, normalizedOption],
    }));

    setNewOption("");

    setErrors((previousErrors) => ({
      ...previousErrors,
      fieldOptions: undefined,
    }));
  };

  const handleRemoveOption = (optionIndex: number): void => {
    setForm((previousForm) => ({
      ...previousForm,
      fieldOptions: previousForm.fieldOptions.filter(
        (_, index) => index !== optionIndex,
      ),
    }));
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleAddOption();
  };

  const validateForm = (): boolean => {
    const validationErrors: IFieldConfigFormErrors = {};

    if (!form.fieldInternalName.trim()) {
      validationErrors.fieldInternalName = "Vui lòng nhập tên trường nội bộ.";
    }

    if (!form.fieldDisplayName.trim()) {
      validationErrors.fieldDisplayName = "Vui lòng nhập tên hiển thị.";
    }

    if (
      form.fieldInternalName.trim() &&
      !/^[A-Za-z][A-Za-z0-9_]*$/.test(form.fieldInternalName.trim())
    ) {
      validationErrors.fieldInternalName =
        "FieldInternalName phải bắt đầu bằng chữ và chỉ gồm chữ, số hoặc dấu gạch dưới.";
    }

    if (form.fieldType === undefined || form.fieldType === null) {
      validationErrors.fieldType = "Vui lòng chọn kiểu trường.";
    }

    if (form.fieldType === FieldType.Dropdown) {
      const normalizedFieldOptions = form.fieldOptions
        .map((option) => option.trim())
        .filter(Boolean);

      if (normalizedFieldOptions.length === 0) {
        validationErrors.fieldOptions =
          "Vui lòng thêm ít nhất một lựa chọn cho Dropdown.";
      }
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const normalizedFieldOptions = form.fieldOptions
      .map((option) => option.trim())
      .filter(Boolean);

    const commonInput: ICreateFieldConfigInput = {
      processId,
      fieldInternalName: form.fieldInternalName.trim(),
      fieldDisplayName: form.fieldDisplayName.trim(),
      fieldType: form.fieldType,
      fieldOptions:
        form.fieldType === FieldType.Dropdown ? normalizedFieldOptions : undefined,
      stepId: form.stepId,
      isRequired: form.isRequired,
      isVisible: form.isVisible,
      isEditable: form.isEditable,
      componentType: normalizeOptionalText(form.componentType),
    };

    if (fieldConfig) {
      const updateInput: IUpdateFieldConfigInput = {
        ...commonInput,
        id: fieldConfig.Id,
      };

      if (
        fieldConfig.FieldType === FieldType.Dropdown &&
        form.fieldType !== FieldType.Dropdown
      ) {
        updateInput.fieldOptions = [];
      }

      onSave(updateInput);
      return;
    }

    onSave(commonInput);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.editorOverlay}>
      <section
        className={styles.editorPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="field-config-editor-title"
      >
        <div className={styles.editorHeader}>
          <div>
            <h3 id="field-config-editor-title">
              {isEditMode ? "Sửa cấu hình trường" : "Thêm cấu hình trường"}
            </h3>

            <p className={styles.editorDescription}>
              Cấu hình trường hiển thị trong biểu mẫu của quy trình.
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            disabled={saving}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form className={styles.editorForm} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.controlGroup}>
              <label htmlFor="field-config-display-name">
                FieldDisplayName <span className={styles.required}>*</span>
              </label>

              <input
                id="field-config-display-name"
                type="text"
                value={form.fieldDisplayName}
                onChange={(event) =>
                  handleChange("fieldDisplayName", event.target.value)
                }
                disabled={saving}
              />

              {errors.fieldDisplayName && (
                <span className={styles.fieldError}>
                  {errors.fieldDisplayName}
                </span>
              )}
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="field-config-internal-name">
                FieldInternalName <span className={styles.required}>*</span>
              </label>

              <input
                id="field-config-internal-name"
                type="text"
                value={form.fieldInternalName}
                onChange={(event) =>
                  handleChange("fieldInternalName", event.target.value)
                }
                disabled={saving || isEditMode}
              />

              {isEditMode && (
                <span className={styles.helpText}>
                  Không nên thay đổi tên nội bộ sau khi trường đã được sử dụng.
                </span>
              )}

              {errors.fieldInternalName && (
                <span className={styles.fieldError}>
                  {errors.fieldInternalName}
                </span>
              )}
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="field-config-type">
                FieldType <span className={styles.required}>*</span>
              </label>

              <select
                id="field-config-type"
                value={String(form.fieldType)}
                onChange={(event) =>
                  handleChange("fieldType", event.target.value as FieldType)
                }
                disabled={saving}
              >
                {FIELD_TYPE_OPTIONS.map((option) => (
                  <option
                    key={String(option.value)}
                    value={String(option.value)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              {errors.fieldType && (
                <span className={styles.fieldError}>{errors.fieldType}</span>
              )}
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="field-config-step">Step</label>

              <select
                id="field-config-step"
                value={form.stepId === undefined ? "" : String(form.stepId)}
                onChange={(event) => {
                  const selectedValue = event.target.value;

                  handleChange(
                    "stepId",
                    selectedValue ? Number(selectedValue) : undefined,
                  );
                }}
                disabled={saving}
              >
                <option value="">Hiển thị chung</option>

                {steps.map((step) => (
                  <option key={step.Id} value={String(step.Id)}>
                    Bước {step.StepOrder} – {step.Title}
                  </option>
                ))}
              </select>

              <span className={styles.helpText}>
                Chọn "Hiển thị chung" nếu trường không thuộc riêng một bước.
              </span>
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="field-config-component-type">ComponentType</label>

              <input
                id="field-config-component-type"
                type="text"
                value={form.componentType}
                onChange={(event) =>
                  handleChange("componentType", event.target.value)
                }
                placeholder="Ví dụ: TextField, PersonPicker"
                disabled={saving}
              />
            </div>
          </div>

          {form.fieldType === FieldType.Dropdown && (
            <DropdownOptionsEditor
              options={form.fieldOptions}
              newOption={newOption}
              saving={saving}
              error={errors.fieldOptions}
              onChangeNewOption={(value) => {
                setNewOption(value);

                setErrors((previousErrors) => ({
                  ...previousErrors,
                  fieldOptions: undefined,
                }));
              }}
              onAddOption={handleAddOption}
              onRemoveOption={handleRemoveOption}
              onOptionKeyDown={handleOptionKeyDown}
            />
          )}

          <fieldset className={styles.checkboxGroup}>
            <legend>Quyền hiển thị và chỉnh sửa</legend>

            <label className={styles.checkboxControl}>
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(event) =>
                  handleChange("isRequired", event.target.checked)
                }
                disabled={saving}
              />

              <span>Bắt buộc nhập</span>
            </label>

            <label className={styles.checkboxControl}>
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) =>
                  handleChange("isVisible", event.target.checked)
                }
                disabled={saving}
              />

              <span>Hiển thị</span>
            </label>

            <label className={styles.checkboxControl}>
              <input
                type="checkbox"
                checked={form.isEditable}
                onChange={(event) =>
                  handleChange("isEditable", event.target.checked)
                }
                disabled={saving}
              />

              <span>Cho phép chỉnh sửa</span>
            </label>
          </fieldset>

          <div className={styles.editorActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onCancel}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving || !processId}
            >
              {saving
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Thêm cấu hình"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
