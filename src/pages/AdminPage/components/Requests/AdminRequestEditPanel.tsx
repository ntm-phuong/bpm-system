import * as React from "react";
import { RequestStatus } from "../../../../constants/enums";
import { REQUEST_STATUS_OPTIONS } from "../../constants/adminRequestConstants";
import { IAdminRequestEditPanelProps } from "../../types/AdminRequestTypes";
import styles from "../../AdminRequestPage.module.scss";

export const AdminRequestEditPanel: React.FC<IAdminRequestEditPanelProps> = ({
  editForm,
  currentUserId,
  savingEdit,
  approverKeyword,
  approverCandidates,
  searchingApprover,
  selectedApprover,
  onChangeForm,
  onSearchApprover,
  onChooseApprover,
  onClearApprover,
  onSave,
  onCancel,
}) => {
  return (
    <section className={styles.editPanel}>

      <div className={styles.editGrid}>
        <div className={styles.controlGroup}>
          <label htmlFor="edit-status">Trạng thái</label>
          <select
            id="edit-status"
            value={editForm.status}
            onChange={(event) =>
              onChangeForm({
                ...editForm,
                status: event.target.value as RequestStatus,
              })
            }
          >
            {REQUEST_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="edit-current-step">Bước hiện tại</label>
          <input
            id="edit-current-step"
            type="number"
            min={0}
            value={editForm.currentStep}
            onChange={(event) =>
              onChangeForm({
                ...editForm,
                currentStep: Number(event.target.value),
              })
            }
          />
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="edit-current-step-name">Tên bước hiện tại</label>
          <input
            id="edit-current-step-name"
            type="text"
            value={editForm.currentStepName}
            onChange={(event) =>
              onChangeForm({
                ...editForm,
                currentStepName: event.target.value,
              })
            }
          />
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="edit-emergency">Khẩn cấp</label>
          <select
            id="edit-emergency"
            value={editForm.isEmergency ? "true" : "false"}
            onChange={(event) =>
              onChangeForm({
                ...editForm,
                isEmergency: event.target.value === "true",
              })
            }
          >
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </div>
      </div>

      <div className={styles.approverPanel}>
        <h4>Thay đổi người xử lý</h4>

        <div className={styles.controlGroup}>
          <label htmlFor="edit-approver-search">Tìm người xử lý</label>
          <input
            id="edit-approver-search"
            type="text"
            value={approverKeyword}
            onChange={(event) => onSearchApprover(event.target.value)}
            placeholder="Nhập tên hoặc email..."
          />
        </div>

        {searchingApprover && <div className={styles.feedback}></div>}

        {!searchingApprover && approverCandidates.length > 0 && (
          <div className={styles.userList}>
            {approverCandidates.map((user) => (
              <button
                key={user.Id}
                type="button"
                className={styles.userItem}
                onClick={() => onChooseApprover(user)}
              >
                <strong>{user.Title}</strong>
                <small>{user.EMail}</small>
              </button>
            ))}
          </div>
        )}

        <div className={styles.selectedApprover}>
          <span>
            Đang chọn: {selectedApprover ? `${selectedApprover.Title} (#${selectedApprover.Id})` : "Không có"}
          </span>
          <button type="button" className={styles.clearButton} onClick={onClearApprover}>
            Xóa người xử lý
          </button>
        </div>
      </div>

      <div className={styles.editActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onSave}
          disabled={savingEdit}
        >
          {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
        </button>

        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Hủy
        </button>
      </div>

    
    </section>
  );
};
