import * as React from "react";
import { IProcess } from "../../../../models";
import styles from "../../AdminProcessConfigPage.module.scss";

interface IProcessDashboardTableProps {
  processes: IProcess[];
  loading: boolean;
  onOpenProcess: (processId: number) => void;
  onEditProcess: (process: IProcess) => void;
  onDeactivateProcess: (process: IProcess) => Promise<void>;
}

const displayValue = (value: unknown): string => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return String(value);
};

export const ProcessDashboardTable: React.FC<
  IProcessDashboardTableProps
> = ({
  processes,
  loading,
  onOpenProcess,
  onEditProcess,
  onDeactivateProcess,
}) => {
  if (loading) {
    return (
      <section className={styles.panel}>
        <div className={styles.info}>
          Đang tải danh sách quy trình...
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Danh sách quy trình</h3>

          <p className={styles.panelDescription}>
            Chọn tiêu đề quy trình để mở trang cấu hình chi tiết.
          </p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Mã quy trình</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {processes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className={styles.emptyRow}
                >
                  Không có dữ liệu quy trình.
                </td>
              </tr>
            ) : (
              processes.map((process) => (
                <tr key={process.Id}>
                  <td>
                    <button
                      type="button"
                      className={styles.titleLink}
                      onClick={() =>
                        onOpenProcess(process.Id)
                      }
                    >
                      {displayValue(process.Title)}
                    </button>
                  </td>

                  <td>
                    {displayValue(process.ProcessCode)}
                  </td>

                  <td>
                    {displayValue(process.Description)}
                  </td>

                  <td>
                    <span
                      className={
                        process.IsActive
                          ? styles.activeStatus
                          : styles.inactiveStatus
                      }
                    >
                      {process.IsActive
                        ? "Đang hoạt động"
                        : "Đã tắt"}
                    </span>
                  </td>

                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        className={styles.toolbarButton}
                        onClick={() =>
                          onEditProcess(process)
                        }
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => {
                          void onDeactivateProcess(process);
                        }}
                        disabled={!process.IsActive}
                      >
                        Tắt
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};