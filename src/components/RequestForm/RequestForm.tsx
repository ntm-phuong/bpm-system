import * as React from "react";
import { useState } from "react";
import { Icon } from "@fluentui/react";
import { FieldType } from "../../constants/enums";
import { IFieldConfig } from "../../models";
import { IFormConfig } from "../../services/ProcessService";
import styles from "./RequestForm.module.scss";

export interface IRequestFormProps {
  formConfig: IFormConfig;
  formData: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
  isReadOnly?: boolean;
}

const parseFieldOptions = (fieldOptions: string): string[] => {
  if (!fieldOptions) {
    return [];
  }

  try {
    const parsed = JSON.parse(fieldOptions) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch (error) {
    return fieldOptions
      .split(/[;,\n]/)
      .map((option) => option.trim())
      .filter(Boolean);
  }

  return [];
};

export const RequestForm: React.FC<IRequestFormProps> = ({
  formConfig,
  formData,
  onFieldChange,
  isReadOnly,
}) => {
  // State để quản lý việc mở rộng / thu gọn form
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [fieldValues, setFieldValues] = useState<
    Record<string, string | number | boolean>
  >({});
  console.log(fieldValues);
  React.useEffect(() => {
    setFieldValues({});
  }, [formConfig.process.Id]);

  const fields = React.useMemo(() => {
    const sortedSteps = [...formConfig.steps].sort(
      (a, b) => a.StepOrder - b.StepOrder,
    );
    const activeStepId = sortedSteps[0]?.Id;

    if (!activeStepId) {
      return formConfig.commonFieldConfigs;
    }

    return (
      formConfig.fieldConfigsByStep[activeStepId] ||
      formConfig.commonFieldConfigs
    );
  }, [formConfig]);

  const toggleForm = () => {
    setIsExpanded(!isExpanded);
  };

  const renderFieldInput = (field: IFieldConfig): JSX.Element => {
    const value = formData[field.FieldInternalName];
    const fieldReadOnly = isReadOnly || !field.IsEditable;
    const inputId = field.FieldInternalName;

    console.log("Field:", field.FieldInternalName);
    console.log("FormData:", formData);
    console.log("Value:", formData[field.FieldInternalName]);

    switch (field.FieldType) {
      case FieldType.MultiLine:
        return (
          <textarea
            id={inputId}
            className={styles.inputControl}
            rows={4}
            value={typeof value === "string" ? value : ""}
            onChange={(event) =>
              onFieldChange(field.FieldInternalName, event.target.value)
            }
            disabled={fieldReadOnly}
          />
        );
      case FieldType.Number:
        return (
          <input
            id={inputId}
            type="number"
            className={styles.inputControl}
            value={typeof value === "number" ? String(value) : ""}
            onChange={(event) => {
              const rawValue = event.target.value;
              onFieldChange(
                field.FieldInternalName,
                rawValue === "" ? "" : Number(rawValue),
              );
            }}
            disabled={fieldReadOnly}
          />
        );
      case FieldType.DateTime: {
        const dateValue =
          typeof value === "string" && value.length >= 10
            ? value.slice(0, 10)
            : "";

        return (
          <input
            id={inputId}
            type="date"
            className={styles.inputControl}
            value={dateValue}
            onChange={(event) =>
              onFieldChange(field.FieldInternalName, event.target.value)
            }
            disabled={fieldReadOnly}
          />
        );
      }
      case FieldType.Choice:
      case FieldType.Dropdown: {
        const options = parseFieldOptions(field.FieldOptions);
        return (
          <select
            id={inputId}
            className={styles.inputControl}
            value={typeof value === "string" ? value : ""}
            onChange={(event) =>
              onFieldChange(field.FieldInternalName, event.target.value)
            }
            disabled={fieldReadOnly}
          >
            <option value="">--Lựa chọn--</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
      case FieldType.YesNo:
        return (
          <select
            id={inputId}
            className={styles.inputControl}
            value={typeof value === "boolean" ? String(value) : ""}
            onChange={(event) =>
              onFieldChange(
                field.FieldInternalName,
                event.target.value === "true",
              )
            }
            disabled={fieldReadOnly}
          >
            <option value="">--Lựa chọn--</option>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </select>
        );
      case FieldType.Person:
        return (
          <input
            id={inputId}
            type="text"
            className={styles.inputControl}
            value={typeof value === "string" ? value : ""}
            placeholder="Tìm kiếm người dùng"
            onChange={(event) =>
              onFieldChange(field.FieldInternalName, event.target.value)
            }
            disabled={fieldReadOnly}
          />
        );
      case FieldType.Text:
      default:
        return (
          <input
            id={inputId}
            type="text"
            className={styles.inputControl}
            value={typeof value === "string" ? value : ""}
            onChange={(event) =>
              onFieldChange(field.FieldInternalName, event.target.value)
            }
            disabled={fieldReadOnly}
          />
        );
    }
  };

  return (
    <div className={styles.formContainer}>
      {/* Header Form */}
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>{formConfig.process.Title}</h3>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={toggleForm}
          title={isExpanded ? "Thu gọn" : "Mở rộng"}
        >
          <Icon iconName={isExpanded ? "ChevronUp" : "ChevronDown"} />
        </button>
      </div>

      {/* Body Form (Sẽ bị ẩn nếu isExpanded = false) */}
      {isExpanded && (
        <div className={styles.formBody}>
          {fields.length === 0 && (
            <div>Chưa có cấu hình trường dữ liệu cho quy trình này.</div>
          )}

          {fields.map((field) => (
            <div key={field.Id} className={styles.formGroup}>
              <label className={styles.label} htmlFor={field.FieldInternalName}>
                {field.FieldDisplayName}
                {field.IsRequired && <span className={styles.required}>*</span>}
              </label>
              {renderFieldInput(field)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
