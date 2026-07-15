import * as React from "react";
import { IProcess } from "../../../../models";
import {
  ICreateProcessInput,
  IUpdateProcessInput,
} from "../../types/AdminProcessConfigTypes";
import styles from "./ProcessEditorPanel.module.scss";

interface IProcessEditorPanelProps {
  isOpen: boolean;
  process?: IProcess;
  saving?: boolean;
  onSave: (
    input: ICreateProcessInput | IUpdateProcessInput,
  ) => void;
  onCancel: () => void;
}

interface IProcessFormErrors {
  title?: string;
  processCode?: string;
}

export const ProcessEditorPanel: React.FC<
  IProcessEditorPanelProps
> = ({
  isOpen,
  process,
  saving = false,
  onSave,
  onCancel,
}) => {
  const isEditMode = process !== undefined;

  const [title, setTitle] = React.useState("");
  const [processCode, setProcessCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] =
    React.useState<IProcessFormErrors>({});

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrors({});

    if (process) {
      setTitle(process.Title ?? "");
      setProcessCode(process.ProcessCode ?? "");
      setDescription(process.Description ?? "");
      setIsActive(Boolean(process.IsActive));
      return;
    }

    setTitle("");
    setProcessCode("");
    setDescription("");
    setIsActive(true);
  }, [isOpen, process]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, saving, onCancel]);

  const validateForm = (): boolean => {
    const validationErrors: IProcessFormErrors = {};

    if (!title.trim()) {
      validationErrors.title =
        "Vui lòng nhập tên quy trình.";
    }

    if (!processCode.trim()) {
      validationErrors.processCode =
        "Vui lòng nhập mã quy trình.";
    } else if (
      !/^[A-Za-z][A-Za-z0-9_-]*$/.test(
        processCode.trim(),
      )
    ) {
      validationErrors.processCode =
        "Mã quy trình phải bắt đầu bằng chữ và chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const commonInput: ICreateProcessInput = {
      title: title.trim(),
      processCode: processCode.trim(),
      description: description.trim(),
      isActive,
    };

    if (process) {
      const updateInput: IUpdateProcessInput = {
        ...commonInput,
        id: process.Id,
      };

      onSave(updateInput);
      return;
    }

    onSave(commonInput);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.editorOverlay}
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onCancel();
        }
      }}
    >
      <section
        className={styles.editorPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="process-editor-title"
      >
        <header className={styles.editorHeader}>
          <div>
            <h3 id="process-editor-title">
              {isEditMode
                ? "Chỉnh sửa quy trình"
                : "Tạo quy trình"}
            </h3>

            <p className={styles.editorDescription}>
              Cấu hình thông tin cơ bản và trạng thái của
              quy trình.
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
        </header>

        <form
          className={styles.editorForm}
          onSubmit={handleSubmit}
        >
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="process-editor-name">
                Tên quy trình
                <span className={styles.required}>*</span>
              </label>

              <input
                id="process-editor-name"
                className={styles.inputControl}
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);

                  setErrors((previousErrors) => ({
                    ...previousErrors,
                    title: undefined,
                  }));
                }}
                placeholder="Ví dụ: Quy trình xin nghỉ phép"
                disabled={saving}
                autoFocus
              />

              {errors.title && (
                <span className={styles.fieldError}>
                  {errors.title}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="process-editor-code">
                Mã quy trình
                <span className={styles.required}>*</span>
              </label>

              <input
                id="process-editor-code"
                className={styles.inputControl}
                type="text"
                value={processCode}
                onChange={(event) => {
                  setProcessCode(event.target.value);

                  setErrors((previousErrors) => ({
                    ...previousErrors,
                    processCode: undefined,
                  }));
                }}
                placeholder="Ví dụ: LEAVE_REQUEST"
                disabled={saving || isEditMode}
              />

              {isEditMode && (
                <span className={styles.helpText}>
                  Mã quy trình không thể thay đổi sau khi
                  được tạo.
                </span>
              )}

              {errors.processCode && (
                <span className={styles.fieldError}>
                  {errors.processCode}
                </span>
              )}
            </div>

            <div
              className={`${styles.formGroup} ${styles.fullWidthGroup}`}
            >
              <label htmlFor="process-editor-description">
                Mô tả
              </label>

              <textarea
                id="process-editor-description"
                className={styles.textareaControl}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Mô tả ngắn về mục đích và phạm vi của quy trình"
                disabled={saving}
                rows={4}
              />

              <span className={styles.characterCount}>
                {description.length}/500
              </span>
            </div>
          </div>

          <div className={styles.statusSection}>
            <div>
              <div className={styles.statusTitle}>
                Trạng thái quy trình
              </div>

              <div className={styles.statusDescription}>
                Quy trình đang hoạt động sẽ được hiển thị
                cho người dùng.
              </div>
            </div>

            <label className={styles.switchControl}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(event.target.checked)
                }
                disabled={saving}
              />

              <span className={styles.switchTrack}>
                <span className={styles.switchThumb} />
              </span>

              <span className={styles.switchLabel}>
                {isActive
                  ? "Đang hoạt động"
                  : "Đã tắt"}
              </span>
            </label>
          </div>

          <footer className={styles.editorActions}>
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
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Tạo quy trình"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};