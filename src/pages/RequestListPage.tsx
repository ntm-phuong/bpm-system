import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { IRequest } from "../models";
import { RequestStatus } from "../constants/enums";
import { RequestRepository } from "../repositories/RequestRepository";
import { RequestQueryService } from "../services/RequestQueryService";
import styles from "./RequestListPage.module.scss";

type RequestListType =
  | "allRequests"
  | "myRequests"
  | "pendingRequests"
  | "processedRequests";

interface IRequestListPageProps {
  type: RequestListType;
  currentUserId: number;
}

export const RequestListPage: React.FC<IRequestListPageProps> = ({
  type,
  currentUserId,
}) => {
  const [items, setItems] = useState<IRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const repo = React.useMemo(() => new RequestRepository(), []);
  const requestQueryService = React.useMemo(
    () => new RequestQueryService(),
    [],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        let data: IRequest[] = [];

        if (type === "allRequests") {
          data = await repo.getAllRequests();
        }

        if (type === "myRequests") {
          data = await repo.getMyRequests(currentUserId);
        }

        if (type === "pendingRequests") {
          data = await requestQueryService.getPendingRequests(currentUserId);
        }

        if (type === "processedRequests") {
          data = await requestQueryService.getProcessedRequests(currentUserId);
        }

        setItems(data);
      } catch (error) {
        console.error("Load request list failed:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [type, currentUserId, repo, requestQueryService]);

  const title = useMemo(() => getTitle(type), [type]);

  const statusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(items.map((item) => String(item.Status))),
    );

    return statuses.sort((firstStatus, secondStatus) =>
      firstStatus.localeCompare(secondStatus),
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || String(item.Status) === statusFilter;

      if (!normalizedKeyword) {
        return matchesStatus;
      }

      const searchableParts = [
        String(item.Id),
        item.AbsenceTitle,
        item.Department,
        item.CurrentApprover?.Title,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesKeyword = searchableParts.some((value) =>
        value.includes(normalizedKeyword),
      );

      return matchesStatus && matchesKeyword;
    });
  }, [items, searchKeyword, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.Status === RequestStatus.Pending)
        .length,
      approved: items.filter((item) => item.Status === RequestStatus.Approved)
        .length,
      rejected: items.filter((item) => item.Status === RequestStatus.Rejected)
        .length,
    };
  }, [items]);

  const statusFilterTabs = useMemo(
    () => [
      { value: "all", label: "Tất cả", count: items.length },
      {
        value: RequestStatus.Pending,
        label: "Đang xử lý",
        count: items.filter((item) => item.Status === RequestStatus.Pending)
          .length,
      },
      {
        value: RequestStatus.Approved,
        label: "Đã duyệt",
        count: items.filter((item) => item.Status === RequestStatus.Approved)
          .length,
      },
      {
        value: RequestStatus.Rejected,
        label: "Từ chối",
        count: items.filter((item) => item.Status === RequestStatus.Rejected)
          .length,
      },
    ],
    [items],
  );

  return (
    <div className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>
            Theo dõi, tìm kiếm và xử lý phiếu nhanh hơn theo từng trạng thái.
          </p>
        </div>

        <div className={styles.summaryRow}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Tổng phiếu</span>
            <strong className={styles.summaryValue}>{summary.total}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Đang xử lý</span>
            <strong className={styles.summaryValue}>{summary.pending}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Đã duyệt</span>
            <strong className={styles.summaryValue}>{summary.approved}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Từ chối</span>
            <strong className={styles.summaryValue}>{summary.rejected}</strong>
          </article>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.filterPanel}>
          <div className={styles.searchBox}>
            <label htmlFor="request-search" className={styles.searchLabel}>
              Tìm kiếm nhanh
            </label>
            <input
              id="request-search"
              className={styles.searchInput}
              type="text"
              placeholder="Theo mã phiếu, loại phiếu, phòng ban, người xử lý..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>

          <div className={styles.filterBox}>
            <label htmlFor="request-status" className={styles.searchLabel}>
              Bộ lọc nâng cao
            </label>
            <select
              id="request-status"
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusText(status as RequestStatus)}
                </option>
              ))}
            </select>

            {(searchKeyword || statusFilter !== "all") && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => {
                  setSearchKeyword("");
                  setStatusFilter("all");
                }}
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        <div className={styles.statusTabs}>
          {statusFilterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`${styles.statusTab} ${
                statusFilter === tab.value ? styles.activeTab : ""
              }`}
              onClick={() => setStatusFilter(tab.value)}
            >
              <span>{tab.label}</span>
              <strong>{tab.count}</strong>
            </button>
          ))}
        </div>

        <div className={styles.resultInfo}>
          Hiển thị {filteredItems.length} phiếu
        </div>

        {loading && <p className={styles.feedback}>Đang tải dữ liệu...</p>}

        {!loading && filteredItems.length === 0 && (
          <p className={styles.feedback}>Không có phiếu nào phù hợp bộ lọc.</p>
        )}

        {!loading && filteredItems.length > 0 && (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Tiêu đề </th>
                    <th>Quy trình</th>
                    <th>Trạng thái</th>
                    <th>Người yêu cầu</th>
                    <th>Người xử lý</th>
                    <th>Bước hiện tại</th>
                    <th>Ngày yêu cầu</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.Id}>
                      <td>#{item.Id}</td>
                      <td>{item.AbsenceTitle || "-"}</td>
                      <td>{item.ProcessTitle || "-"}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${getStatusClassName(
                            item.Status,
                          )}`}
                        >
                          {getStatusText(item.Status)}
                        </span>
                      </td>
                      <td>{item.Requester?.Title || "-"}</td>
                      <td>{item.CurrentApprover?.Title || "-"}</td>
                      <td>{item.CurrentStepName || "-"}</td>
                      <td>
                        {item.Created
                          ? new Date(item.Created).toLocaleString("vi-VN")
                          : "-"}
                      </td>{" "}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.cardList}>
              {filteredItems.map((item) => (
                <article key={`card-${item.Id}`} className={styles.requestCard}>
                  <div className={styles.cardHeader}>
                    <h3>Mã phiếu #{item.Id}</h3>
                    <span
                      className={`${styles.statusBadge} ${getStatusClassName(
                        item.Status,
                      )}`}
                    >
                      {getStatusText(item.Status)}
                    </span>
                  </div>

                  <dl className={styles.cardMeta}>
                    <div>
                      <dt>Tiêu đề</dt>
                      <dd>{item.AbsenceTitle || "-"}</dd>
                    </div>

                    <div>
                      <dt>Quy trình</dt>
                      <dd>{item.ProcessTitle || "-"}</dd>
                    </div>

                    <div>
                      <dt>Người yêu cầu</dt>
                      <dd>{item.Requester?.Title || "-"}</dd>
                    </div>

                    <div>
                      <dt>Người xử lý</dt>
                      <dd>{item.CurrentApprover?.Title || "-"}</dd>
                    </div>

                    <div>
                      <dt>Bước hiện tại</dt>
                      <dd>{item.CurrentStepName || "-"}</dd>
                    </div>

                    <div>
                      <dt>Ngày yêu cầu</dt>
                      <dd>
                        {item.Created
                          ? new Date(item.Created).toLocaleString("vi-VN")
                          : "-"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

const getTitle = (type: RequestListType): string => {
  switch (type) {
    case "allRequests":
      return "Tất cả các phiếu";
    case "myRequests":
      return "Phiếu tôi đã tạo";
    case "pendingRequests":
      return "Phiếu cần xử lý";
    case "processedRequests":
      return "Phiếu đã xử lý";
    default:
      return "Danh sách phiếu";
  }
};

const getStatusText = (status: RequestStatus): string => {
  switch (status) {
    case RequestStatus.Pending:
      return "Đang xử lý";
    case RequestStatus.Approved:
      return "Đã duyệt";
    case RequestStatus.Rejected:
      return "Từ chối";
    case RequestStatus.Revision:
      return "Cần chỉnh sửa";
    case RequestStatus.Draft:
      return "Nháp";
    default:
      return String(status);
  }
};

const getStatusClassName = (status: RequestStatus): string => {
  switch (status) {
    case RequestStatus.Pending:
      return styles.pending;
    case RequestStatus.Approved:
      return styles.approved;
    case RequestStatus.Rejected:
      return styles.rejected;
    case RequestStatus.Revision:
      return styles.revision;
    case RequestStatus.Draft:
      return styles.draft;
    default:
      return styles.default;
  }
};
