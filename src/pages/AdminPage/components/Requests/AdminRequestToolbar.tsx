import * as React from "react";
import { REQUEST_STATUS_OPTIONS } from "../constants/adminRequestConstants";
import { IAdminRequestToolbarProps } from "../types/AdminRequestTypes";
import styles from "../AdminRequestPage.module.scss";

export const AdminRequestToolbar: React.FC<IAdminRequestToolbarProps> = ({
  keyword,
  statusFilter,
  loading,
  onKeywordChange,
  onStatusChange,
  onRefresh,
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.controlGroup}>
        <label htmlFor="admin-request-search">Tìm kiếm</label>
        <input
          id="admin-request-search"
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Theo mã phiếu, tiêu đề, người yêu cầu, người xử lý..."
        />
      </div>

      <div className={styles.controlGroup}>
        <label htmlFor="admin-request-status">Trạng thái</label>
        <select
          id="admin-request-status"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          {REQUEST_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.controlGroupInline}>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={loading}
        >
          Tải lại
        </button>
      </div>
    </div>
  );
};
