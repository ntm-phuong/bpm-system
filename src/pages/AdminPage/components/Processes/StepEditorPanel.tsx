import * as React from "react";
import {
  IPerson,
  IProcessStep,
} from "../../../../models";
import {
  ICreateProcessStepInput,
  IUpdateProcessStepInput,
} from "../../types/AdminProcessConfigTypes";
import { PersonPicker } from "../../../../components/PersonPicker/PersonPicker";
import styles from "./StepEditorPanel.module.scss";

interface IStepEditorPanelProps {
  isOpen: boolean;
  processId: number;
  step?: IProcessStep;
  saving?: boolean;
  onSearchUsers: (
    keyword: string,
  ) => Promise<IPerson[]>;
  onSave: (
    input:
      | ICreateProcessStepInput
      | IUpdateProcessStepInput,
  ) => void;
  onCancel: () => void;
}

interface IStepFormErrors {
  title?: string;
  stepOrder?: string;
  slaHours?: string;
  beforeSLA?: string;
}

const parseOptionalNumber = (
  value: string,
): number | undefined => {
  const raw = value.trim();

  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
};

export const StepEditorPanel: React.FC<
  IStepEditorPanelProps
> = ({
  isOpen,
  processId,
  step,
  saving = false,
  onSearchUsers,
  onSave,
  onCancel,
}) => {
  const isEditMode = step !== undefined;

  const [title, setTitle] =
    React.useState<string>("");

  const [stepOrder, setStepOrder] =
    React.useState<string>("1");

  const [slaHours, setSlaHours] =
    React.useState<string>("");

  const [beforeSLA, setBeforeSLA] =
    React.useState<string>("");

  const [isActive, setIsActive] =
    React.useState<boolean>(true);

  const [selectedApprover, setSelectedApprover] =
    React.useState<IPerson | null>(null);

  const [errors, setErrors] =
    React.useState<IStepFormErrors>({});

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrors({});

    if (step) {
      setTitle(step.Title ?? "");
      setStepOrder(String(step.StepOrder ?? 1));
      setSelectedApprover(
        step.StepApprover ?? null,
      );

      setSlaHours(
        step.SLA_Hours !== undefined &&
          step.SLA_Hours !== null
          ? String(step.SLA_Hours)
          : "",
      );

      setBeforeSLA(
        step.BeforeSLA !== undefined &&
          step.BeforeSLA !== null
          ? String(step.BeforeSLA)
          : "",
      );

      setIsActive(Boolean(step.IsActive));

      return;
    }

    setTitle("");
    setStepOrder("1");
    setSelectedApprover(null);
    setSlaHours("");
    setBeforeSLA("");
    setIsActive(true);
  }, [isOpen, step]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ): void => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        onCancel();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isOpen, saving, onCancel]);

  const validateForm = (): boolean => {
    const validationErrors: IStepFormErrors = {};

    const normalizedTitle = title.trim();
    const normalizedStepOrder =
      Number(stepOrder);

    const normalizedSlaHours =
      parseOptionalNumber(slaHours);

    const normalizedBeforeSLA =
      parseOptionalNumber(beforeSLA);

    if (!normalizedTitle) {
      validationErrors.title =
        "Vui lòng nhập tên bước.";
    }

    if (
      !Number.isInteger(normalizedStepOrder) ||
      normalizedStepOrder <= 0
    ) {
      validationErrors.stepOrder =
        "Thứ tự bước phải là số nguyên lớn hơn 0.";
    }

    if (
      slaHours.trim() &&
      (
        normalizedSlaHours === undefined ||
        normalizedSlaHours < 0
      )
    ) {
      validationErrors.slaHours =
        "Thời gian SLA phải là số không âm.";
    }

    if (
      beforeSLA.trim() &&
      (
        normalizedBeforeSLA === undefined ||
        normalizedBeforeSLA < 0
      )
    ) {
      validationErrors.beforeSLA =
        "Thời gian cảnh báo phải là số không âm.";
    }

    if (
      normalizedSlaHours !== undefined &&
      normalizedBeforeSLA !== undefined &&
      normalizedBeforeSLA >
        normalizedSlaHours
    ) {
      validationErrors.beforeSLA =
        "Thời gian cảnh báo không được lớn hơn thời gian SLA.";
    }

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors).length === 0
    );
  };

  const handleSave = (): void => {
    if (!validateForm()) {
      return;
    }

    const normalizedTitle = title.trim();
    const normalizedStepOrder =
      Number(stepOrder);

    const normalizedSlaHours =
      parseOptionalNumber(slaHours);

    const normalizedBeforeSLA =
      parseOptionalNumber(beforeSLA);

    if (isEditMode && step) {
      let normalizedApproverId:
        | number
        | null
        | undefined;

      const originalApproverId =
        step.StepApproverId;

      const selectedApproverId =
        selectedApprover?.Id;

      if (selectedApproverId !== undefined) {
        normalizedApproverId =
          originalApproverId ===
          selectedApproverId
            ? undefined
            : selectedApproverId;
      } else if (
        originalApproverId !== undefined &&
        originalApproverId !== null
      ) {
        normalizedApproverId = null;
      } else {
        normalizedApproverId = undefined;
      }

      onSave({
        id: step.Id,
        title: normalizedTitle,
        stepOrder: normalizedStepOrder,
        stepApproverId:
          normalizedApproverId,
        slaHours: normalizedSlaHours,
        beforeSLA:
          normalizedBeforeSLA,
        isActive,
      });

      return;
    }

    onSave({
      processId,
      title: normalizedTitle,
      stepOrder: normalizedStepOrder,
      stepApproverId:
        selectedApprover?.Id,
      slaHours: normalizedSlaHours,
      beforeSLA: normalizedBeforeSLA,
      isActive,
    });
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
        aria-labelledby="step-editor-heading"
      >
        <header className={styles.editorHeader}>
          <div>
            <h3 id="step-editor-heading">
              {isEditMode
                ? "Chỉnh sửa bước"
                : "Tạo bước mới"}
            </h3>

            <p
              className={
                styles.editorDescription
              }
            >
              Cấu hình thứ tự xử lý, người duyệt
              và thời gian SLA của bước.
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
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="step-editor-title">
                Tên bước
                <span
                  className={styles.required}
                >
                  *
                </span>
              </label>

              <input
                id="step-editor-title"
                className={styles.inputControl}
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);

                  setErrors(
                    (previousErrors) => ({
                      ...previousErrors,
                      title: undefined,
                    }),
                  );
                }}
                placeholder="Ví dụ: Trưởng phòng phê duyệt"
                disabled={saving}
                autoFocus
              />

              {errors.title && (
                <span
                  className={styles.fieldError}
                >
                  {errors.title}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="step-editor-order">
                Thứ tự bước
                <span
                  className={styles.required}
                >
                  *
                </span>
              </label>

              <input
                id="step-editor-order"
                className={styles.inputControl}
                type="number"
                min={1}
                step={1}
                value={stepOrder}
                onChange={(event) => {
                  setStepOrder(
                    event.target.value,
                  );

                  setErrors(
                    (previousErrors) => ({
                      ...previousErrors,
                      stepOrder: undefined,
                    }),
                  );
                }}
                disabled={saving}
              />

              {errors.stepOrder && (
                <span
                  className={styles.fieldError}
                >
                  {errors.stepOrder}
                </span>
              )}
            </div>

            <div className={styles.approverSection}>
              <div
                className={
                  styles.sectionHeading
                }
              >
                Người duyệt
              </div>

              <div
                className={
                  styles.sectionDescription
                }
              >
                Chọn người chịu trách nhiệm xử lý
                bước này.
              </div>

              <PersonPicker
                label=""
                selectedPerson={
                  selectedApprover
                }
                placeholder="Tìm theo tên hoặc email"
                disabled={saving}
                onSearch={onSearchUsers}
                onChange={
                  setSelectedApprover
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="step-editor-sla-hours">
                Thời gian SLA (giờ)
              </label>

              <input
                id="step-editor-sla-hours"
                className={styles.inputControl}
                type="number"
                min={0}
                value={slaHours}
                onChange={(event) => {
                  setSlaHours(
                    event.target.value,
                  );

                  setErrors(
                    (previousErrors) => ({
                      ...previousErrors,
                      slaHours: undefined,
                    }),
                  );
                }}
                placeholder="Ví dụ: 24"
                disabled={saving}
              />

              {errors.slaHours && (
                <span
                  className={styles.fieldError}
                >
                  {errors.slaHours}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="step-editor-before-sla">
                Cảnh báo trước SLA (giờ)
              </label>

              <input
                id="step-editor-before-sla"
                className={styles.inputControl}
                type="number"
                min={0}
                value={beforeSLA}
                onChange={(event) => {
                  setBeforeSLA(
                    event.target.value,
                  );

                  setErrors(
                    (previousErrors) => ({
                      ...previousErrors,
                      beforeSLA: undefined,
                    }),
                  );
                }}
                placeholder="Ví dụ: 4"
                disabled={saving}
              />

              {errors.beforeSLA && (
                <span
                  className={styles.fieldError}
                >
                  {errors.beforeSLA}
                </span>
              )}
            </div>
          </div>

          <div className={styles.statusSection}>
            <div>
              <div className={styles.statusTitle}>
                Trạng thái bước
              </div>

              <div
                className={
                  styles.statusDescription
                }
              >
                Bước đang hoạt động sẽ được sử dụng
                trong luồng xử lý.
              </div>
            </div>

            <label className={styles.switchControl}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(
                    event.target.checked,
                  )
                }
                disabled={saving}
              />

              <span className={styles.switchTrack}>
                <span
                  className={styles.switchThumb}
                />
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
                  : "Tạo bước"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};