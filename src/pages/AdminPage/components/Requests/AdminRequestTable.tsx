import * as React from "react";
import { IconButton } from "@fluentui/react";
import { IAdminRequestTableProps } from "../types/AdminRequestTypes";
import styles from "../AdminRequestPage.module.scss";

export const AdminRequestTable: React.FC<IAdminRequestTableProps> = ({
  items,
  loading,
  error,
  deletingId,
  onOpenDetail,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return <div className={styles.feedback}>Đang tải danh sách request...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (items.length === 0) {
    return <div className={styles.feedback}>Không có request phù hợp điều kiện lọc.</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mã phiếu</th>
            <th>Tiêu đề</th>
            <th>Người yêu cầu</th>
            <th>Người xử lý hiện tại</th>
            <th>Quy trình</th>
            <th>Bước hiện tại</th>
            <th>Trạng thái</th>
            <th>Khẩn cấp</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.Id}>
              <td>#{item.Id}</td>
              <td>
                <button
                  type="button"
                  className={styles.titleLinkButton}
                  onClick={() => onOpenDetail(item.Id)}
                >
                  {item.AbsenceTitle || "-"}
                </button>
              </td>
              <td>{item.Requester?.Title || "-"}</td>
              <td>{item.CurrentApprover?.Title || "-"}</td>
              <td>{item.ProcessTitle || "-"}</td>
              <td>{item.CurrentStepName || (item.CurrentStep ?? "-")}</td>
              <td>
                <span className={styles.statusBadge}>{item.Status}</span>
              </td>
              <td>{item.IsEmergency ? "Có" : "Không"}</td>
              <td>{item.Created ? new Date(item.Created).toLocaleString("vi-VN") : "-"}</td>
              <td>
                <div className={styles.actionRow}>
                  <IconButton
                    className={styles.linkButton}
                    iconProps={{ iconName: "Edit" }}
                    title="Sửa"
                    ariaLabel="Sửa"
                    onClick={() => onEdit(item)}
                  />
                  <IconButton
                    className={styles.dangerButton}
                    iconProps={{ iconName: "Delete" }}
                    title={deletingId === item.Id ? "Đang xóa..." : "Xóa"}
                    ariaLabel={deletingId === item.Id ? "Đang xóa..." : "Xóa"}
                    onClick={() => onDelete(item.Id)}
                    disabled={deletingId === item.Id}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
