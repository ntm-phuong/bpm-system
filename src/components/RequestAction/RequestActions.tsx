import * as React from "react";
import styles from "./RequestActions.module.scss";

interface IRequestActionsProps {
  canProcess: boolean;
  submitting?: boolean;
  onApprove: (reason?: string) => void;
  onReject: (reason: string) => void;
  onForward: (reason?: string) => void;
  onReassign: (reason?: string) => void;
}

export const RequestActions: React.FC<IRequestActionsProps> = ({
  canProcess,
  submitting,
  onApprove,
  onReject,
  onForward,
  onReassign,
}) => {
  const [reason, setReason] = React.useState("");

  if (!canProcess) {
    return null;
  }

  const handleReject = (): void => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      alert("Vui lòng nhập lý do khi từ chối phiếu.");
      return;
    }

    onReject(trimmedReason);
  };

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>Xử lý phiếu</h3>

      <div className={styles.formGroup}>
       

        <textarea
          id="action-reason"
          className={styles.textarea}
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Nhập lý do khi từ chối "
          disabled={submitting}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onReassign(reason.trim())}
          disabled={submitting}
        >
          Giao lại
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onForward(reason.trim())}
          disabled={submitting}
        >
          Chuyển bước
        </button>

        <button
          type="button"
          className={styles.rejectButton}
          onClick={handleReject}
          disabled={submitting}
        >
          Từ chối
        </button>

        <button
          type="button"
          className={styles.approveButton}
          onClick={() => onApprove(reason.trim())}
          disabled={submitting}
        >
          Duyệt
        </button>
      </div>
    </section>
  );
};