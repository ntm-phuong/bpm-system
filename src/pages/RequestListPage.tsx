import * as React from "react";
import { useEffect, useState } from "react";
import { IRequest } from "../models";
import { RequestRepository } from "../repositories/RequestRepository";
import { RequestQueryService } from "../services/RequestQueryService";

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

  const repo = React.useMemo(() => new RequestRepository(), []);
  const requestQueryService = React.useMemo(() => new RequestQueryService(), []);

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

  return (
    <div style={{ padding: 24 }}>
      <h2>{getTitle(type)}</h2>

      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && items.length === 0 && <p>Không có phiếu nào.</p>}

      {!loading && items.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Phiếu nghỉ</th>
              <th>Trạng thái</th>
              <th>Người xử lý</th>
              <th>Bước</th>
              <th>Phòng ban</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.Id}>
                <td>{item.Title}</td>
                <td>{item.AbsenceTitle}</td>
                <td>{item.Status}</td>
                <td>{item.CurrentApprover?.Title}</td>
                <td>{item.CurrentStep}</td>
                <td>{item.Department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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