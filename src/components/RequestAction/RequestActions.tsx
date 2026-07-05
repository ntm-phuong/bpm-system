import * as React from "react";
import styles from "./RequestActions.module.scss";
import { IActionUser } from "../../types/LeaveServiceType";
import { IPerson } from "../../models";

interface IRequestActionsProps {
  canProcess: boolean;
  submitting?: boolean;

  reassignUsers: IPerson[];
  searchingUsers?: boolean;
  onSearchUsers: (keyword: string) => void;

  onApprove: (reason?: string) => void;
  onReject: (reason: string) => void;
  onForward: (reason?: string) => void;
  onReassign: (targetUser: IActionUser, reason?: string) => void;
}

export const RequestActions: React.FC<IRequestActionsProps> = ({
  canProcess,
  submitting,
  reassignUsers,
  searchingUsers,
  onSearchUsers,
  onApprove,
  onReject,
  onForward,
  onReassign,
}) => {
  const [reason, setReason] = React.useState("");
  const [showReassign, setShowReassign] = React.useState(false);
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<IPerson | null>(null);

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

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const value = event.target.value;

    setSearchKeyword(value);
    setSelectedUser(null);
    onSearchUsers(value);
  };

  const handleSelectUser = (user: IPerson): void => {
    setSelectedUser(user);
    setSearchKeyword(`${user.Title} - ${user.EMail ?? ""}`);
  };

  const handleConfirmReassign = (): void => {
    if (!selectedUser) {
      alert("Vui lòng chọn người được giao lại.");
      return;
    }

    onReassign(
      {
        Id: selectedUser.Id,
        Title: selectedUser.Title,
        EMail: selectedUser.EMail,
      },
      reason.trim() || undefined,
    );

    setShowReassign(false);
    setSearchKeyword("");
    setSelectedUser(null);
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
          placeholder="Nhập lý do xử lý phiếu"
          disabled={submitting}
        />
      </div>

      {showReassign && (
        <div className={styles.formGroup}>
          <input
            type="text"
            value={searchKeyword}
            onChange={handleSearchChange}
            placeholder="Nhập tên hoặc email người được giao lại"
            disabled={submitting}
          />

          {searchingUsers && <div>Đang tìm kiếm...</div>}

          {!searchingUsers &&
            searchKeyword.trim() &&
            reassignUsers.length === 0 &&
            !selectedUser && <div>Không tìm thấy người dùng.</div>}

          {!selectedUser && reassignUsers.length > 0 && (
            <div className={styles.userList}>
              {reassignUsers.map((user) => (
                <button
                  key={user.Id}
                  type="button"
                  className={styles.userItem}
                  onClick={() => handleSelectUser(user)}
                  disabled={submitting}
                >
                  <div>{user.Title}</div>
                  <small>{user.EMail}</small>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className={styles.selectedUser}>
              Đã chọn: <strong>{selectedUser.Title}</strong>
              {selectedUser.EMail ? ` - ${selectedUser.EMail}` : ""}
            </div>
          )}

          <button
            type="button"
            className={styles.approveButton}
            onClick={handleConfirmReassign}
            disabled={submitting || !selectedUser}
          >
            Xác nhận giao lại
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setShowReassign((prev) => !prev)}
          disabled={submitting}
        >
          Giao lại
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onForward(reason.trim() || undefined)}
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
          onClick={() => onApprove(reason.trim() || undefined)}
          disabled={submitting}
        >
          Duyệt
        </button>
      </div>
    </section>
  );
};