import * as React from "react";
import { IProcessStep } from "../../../models";
import {
  ICreateProcessStepInput,
  IUpdateProcessStepInput,
} from "../types/AdminProcessConfigTypes";
import styles from "../AdminProcessConfigPage.module.scss";
import { PersonPicker } from "../../../components/PersonPicker/PersonPicker";
import { IPerson } from "../../../models";

interface IStepEditorPanelProps {
  isOpen: boolean;
  processId?: number;
  step?: IProcessStep;
  saving?: boolean;
  onSearchUsers: (keyword: string) => Promise<IPerson[]>;
  onSave: (input: ICreateProcessStepInput | IUpdateProcessStepInput) => void;
  onCancel: () => void;
}

const parseOptionalNumber = (value: string): number | undefined => {
  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const StepEditorPanel: React.FC<IStepEditorPanelProps> = ({
  isOpen,
  processId,
  step,
  saving = false,
  onSearchUsers,
  onSave,
  onCancel,
}) => {
  const isEditMode = Boolean(step);

  const [title, setTitle] = React.useState<string>("");
  const [stepOrder, setStepOrder] = React.useState<string>("1");
  const [slaHours, setSlaHours] = React.useState<string>("");
  const [beforeSLA, setBeforeSLA] = React.useState<string>("");
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [selectedApprover, setSelectedApprover] = React.useState<IPerson | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (step) {
      setTitle(step.Title ?? "");
      setStepOrder(String(step.StepOrder ?? 1));
      setSelectedApprover(step.StepApprover ?? null);
      setSlaHours(
        step.SLA_Hours !== undefined && step.SLA_Hours !== null
          ? String(step.SLA_Hours)
          : "",
      );
      setBeforeSLA(
        step.BeforeSLA !== undefined && step.BeforeSLA !== null
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

  if (!isOpen) {
    return null;
  }

  const handleSave = (): void => {
    if (!isEditMode && !processId) {
      return;
    }

    const normalizedTitle = title.trim();
    const normalizedStepOrder = Number(stepOrder);
    const normalizedSlaHours = parseOptionalNumber(slaHours);
    const normalizedBeforeSLA = parseOptionalNumber(beforeSLA);

    if (isEditMode && step) {
      let normalizedApproverId: number | null | undefined;
      const originalApproverId = step.StepApproverId;
      const selectedApproverId = selectedApprover?.Id;

      if (selectedApproverId !== undefined) {
        if (originalApproverId === selectedApproverId) {
          normalizedApproverId = undefined;
        } else {
          normalizedApproverId = selectedApproverId;
        }
      } else if (originalApproverId !== undefined && originalApproverId !== null) {
        normalizedApproverId = null;
      } else {
        normalizedApproverId = undefined;
      }

      onSave({
        id: step.Id,
        title: normalizedTitle,
        stepOrder: Number.isFinite(normalizedStepOrder)
          ? normalizedStepOrder
          : 1,
        stepApproverId: normalizedApproverId,
        slaHours: normalizedSlaHours,
        beforeSLA: normalizedBeforeSLA,
        isActive,
      });

      return;
    }

    onSave({
      processId: processId as number,
      title: normalizedTitle,
      stepOrder: Number.isFinite(normalizedStepOrder) ? normalizedStepOrder : 1,
      stepApproverId: selectedApprover?.Id,
      slaHours: normalizedSlaHours,
      beforeSLA: normalizedBeforeSLA,
      isActive,
    });
  };

  return (
    <div className={styles.panelOverlay}>
      <section className={styles.editorPanel}>
        <h3>{isEditMode ? "Chỉnh sửa bước" : "Tạo bước mới"}</h3>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="step-editor-title">Title</label>
            <input
              id="step-editor-title"
              className={styles.inputControl}
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="step-editor-order">StepOrder</label>
            <input
              id="step-editor-order"
              className={styles.inputControl}
              type="number"
              value={stepOrder}
              onChange={(event) => setStepOrder(event.target.value)}
              disabled={saving}
            />
          </div>

          <PersonPicker
            label="Người duyệt"
            selectedPerson={selectedApprover}
            placeholder="Tìm người duyệt theo tên hoặc email"
            disabled={saving}
            onSearch={onSearchUsers}
            onChange={setSelectedApprover}
          />

          <div className={styles.formGroup}>
            <label htmlFor="step-editor-sla-hours">SLA_Hours</label>
            <input
              id="step-editor-sla-hours"
              className={styles.inputControl}
              type="number"
              value={slaHours}
              onChange={(event) => setSlaHours(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="step-editor-before-sla">BeforeSLA</label>
            <input
              id="step-editor-before-sla"
              className={styles.inputControl}
              type="number"
              value={beforeSLA}
              onChange={(event) => setBeforeSLA(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className={styles.checkboxRow}>
            <label htmlFor="step-editor-is-active">
              <input
                id="step-editor-is-active"
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={saving}
              />
              IsActive
            </label>
          </div>
        </div>

        <div className={styles.panelActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={saving || (!isEditMode && !processId)}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={saving}
          >
            Hủy
          </button>
        </div>
      </section>
    </div>
  );
};
