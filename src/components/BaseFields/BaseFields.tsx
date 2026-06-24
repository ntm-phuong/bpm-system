import * as React from "react";
import { TextField, Checkbox, Icon } from "@fluentui/react";
import styles from "../BaseFields.module.scss";

export interface IBaseFieldsProps {
  formData: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
  onSave: () => void;
  onSubmit: () => void;
  onReset: () => void;
}

export const BaseFields: React.FC<IBaseFieldsProps> = ({
  formData,
  onFieldChange,
  onSave,
  onSubmit,
  onReset,
}) => {
  return (
    <div className={styles.baseCard}>
      {/* 1. Dòng: Lý do */}
      <div className={styles.formRow}>
        <div className={styles.labelCol}>Lý do</div>
        <div className={styles.inputCol}>
          <TextField
            multiline
            rows={3}
            resizable={false}
            value={formData.Reason || ""}
            onChange={(_, val) => onFieldChange("Reason", val)}
          />
        </div>
      </div>

      {/* 2. Dòng: Người phê duyệt */}
      <div className={styles.formRow}>
        <div className={styles.labelCol}>
          Người phê duyệt <span className={styles.required}>*</span>
        </div>
        <div className={styles.inputCol}>
          <TextField
            placeholder="Tìm kiếm người dùng"
            value={formData.Approver || ""}
            onChange={(_, val) => onFieldChange("Approver", val)}
          />
        </div>
      </div>

      {/* 3. Dòng: Trạng thái khẩn cấp */}
      <div className={styles.formRow}>
        <div className={styles.labelCol}>Trạng thái khẩn cấp</div>
        <div className={styles.inputCol}>
          <div className={styles.urgentBox}>
            <Checkbox
              label="Có/Không"
              checked={!!formData.IsUrgent}
              onChange={(_, checked) => onFieldChange("IsUrgent", checked)}
            />
          </div>
        </div>
      </div>

      {/* 4. Thanh hành động (Action Buttons) và Footer */}
      <div className={styles.actionsRow}>
        <div className={styles.buttonsGroup}>
          <button
            className={`${styles.actionBtn} ${styles.btnSave}`}
            onClick={onSave}
            type="button"
          >
            <Icon iconName="Save" /> Lưu
          </button>

          <button
            className={`${styles.actionBtn} ${styles.btnSubmit}`}
            onClick={onSubmit}
            type="button"
          >
            <Icon iconName="Send" /> Gửi Đi
          </button>

          <button
            className={`${styles.actionBtn} ${styles.btnReset}`}
            onClick={onReset}
            type="button"
          >
            <Icon iconName="Refresh" /> Làm Mới
          </button>
        </div>

        <div className={styles.footerText}>Powered by TSG</div>
      </div>
    </div>
  );
};
