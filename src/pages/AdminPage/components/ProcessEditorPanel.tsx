import * as React from "react";
import { IProcess } from "../../../models";
import {
  ICreateProcessInput,
  IUpdateProcessInput,
} from "../types/AdminProcessConfigTypes";
import styles from "../AdminProcessConfigPage.module.scss";

interface IProcessEditorPanelProps {
  isOpen: boolean;
  process?: IProcess;
  saving?: boolean;
  onSave: (input: ICreateProcessInput | IUpdateProcessInput) => void;
  onCancel: () => void;
}

export const ProcessEditorPanel: React.FC<IProcessEditorPanelProps> = ({
  isOpen,
  process,
  saving = false,
  onSave,
  onCancel,
}) => {
  const isEditMode = Boolean(process);

  const [title, setTitle] = React.useState<string>("");
  const [processCode, setProcessCode] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [isActive, setIsActive] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

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

  if (!isOpen) {
    return null;
  }

  const handleSave = (): void => {
    const normalizedTitle = title.trim();
    const normalizedProcessCode = processCode.trim();
    const normalizedDescription = description.trim();

    if (isEditMode && process) {
      onSave({
        id: process.Id,
        title: normalizedTitle,
        processCode: normalizedProcessCode,
        description: normalizedDescription,
        isActive,
      });
      return;
    }

    onSave({
      title: normalizedTitle,
      processCode: normalizedProcessCode,
      description: normalizedDescription,
      isActive,
    });
  };

  return (
    <section className={styles.panel}>
      <h3>{isEditMode ? "Chỉnh sửa quy trình" : "Tạo quy trình mới"}</h3>

      <div className={styles.selectorRow}>
        <label htmlFor="process-editor-title">Title</label>
        <input
          id="process-editor-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={saving}
        />
      </div>

      <div className={styles.selectorRow}>
        <label htmlFor="process-editor-code">ProcessCode</label>
        <input
          id="process-editor-code"
          type="text"
          value={processCode}
          onChange={(event) => setProcessCode(event.target.value)}
          disabled={saving}
        />
      </div>

      <div className={styles.selectorRow}>
        <label htmlFor="process-editor-description">Description</label>
        <textarea
          id="process-editor-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={saving}
          rows={4}
        />
      </div>

      <div className={styles.selectorRow}>
        <label htmlFor="process-editor-active">
          <input
            id="process-editor-active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={saving}
          />
          IsActive
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Hủy
        </button>
      </div>
    </section>
  );
};
