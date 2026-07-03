import { RequestStatus } from "../../constants/enums";

export class WorkflowValidationService {
  validateProcessableRequest(
    request: {
      Status: RequestStatus;
      CurrentApproverId?: number | null;
    },
    currentUserId: number,
  ): void {
    if (request.Status !== RequestStatus.Pending) {
      throw new Error("Chỉ có thể xử lý request đang Pending.");
    }

    if (!request.CurrentApproverId) {
      throw new Error("Request hiện tại chưa có người phụ trách.");
    }

    if (request.CurrentApproverId !== currentUserId) {
      throw new Error("Bạn không phải người phụ trách bước hiện tại.");
    }
  }
}