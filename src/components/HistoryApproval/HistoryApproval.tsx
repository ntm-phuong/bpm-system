import * as React from "react";
import { IHistoryApproval, parseHistoryApproval } from "../../models";
import styles from "./HistoryApproval.module.scss";

interface IHistoryApprovalProps {
  historyApproval?: string | IHistoryApproval[];
}

const ACTION_LABELS: Record<string, string> = {
  Submitted: "Đã gửi",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Revision: "Yêu cầu chỉnh sửa",
  Recalled: "Thu hồi",
  Forwarded: "Chuyển tiếp",
};

const formatDate = (value?: string): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN");
};

export const HistoryApproval: React.FC<IHistoryApprovalProps> = ({
  historyApproval,
}) => {
  const [showDetail, setShowDetail] = React.useState(false);

  const items = React.useMemo(
    () => parseHistoryApproval(historyApproval),
    [historyApproval]
  );

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>Lịch sử phê duyệt</h3>

      {items.length === 0 ? (
        <div className={styles.empty}>Chưa có lịch sử phê duyệt.</div>
      ) : (
        <>
          <div className={styles.timeline}>
            {items.map((item, index) => (
              <div
                key={`${item.stepOrder}-${item.actionTime}-${index}`}
                className={styles.timelineItem}
              >
                {/* <div className={styles.icon}>+</div> */}

                <div className={styles.summary}>
                  <div className={styles.dateRange}>
                    {formatDate(item.actionTime)} - {formatDate(item.actionTime)}
                  </div>

                  <div className={styles.handler}>
                    Người xử lý: {item.actorName || item.assigneeName || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.detailButton}
            onClick={() => setShowDetail(true)}
          >
            Chi Tiết ⊙
          </button>
        </>
      )}

      {showDetail && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết lịch sử phê duyệt</h3>

              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setShowDetail(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.detailList}>
              {items.map((item, index) => {
                const actionLabel = ACTION_LABELS[item.action] || item.action;

                return (
                  <div
                    key={`detail-${item.stepOrder}-${item.actionTime}-${index}`}
                    className={styles.detailCard}
                  >
                    <div className={styles.detailHeader}>
                      <strong>Bước {item.stepOrder}: {item.stepName || "-"}</strong>
                      <span className={styles.badge}>{actionLabel}</span>
                    </div>

                    <div>Người thực hiện: {item.actorName || item.actorEmail || "-"}</div>
                    <div>Người phụ trách: {item.assigneeName || item.assigneeEmail || "-"}</div>
                    <div>Thời gian: {formatDateTime(item.actionTime)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};