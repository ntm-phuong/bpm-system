import * as React from "react";
import { useState } from "react";

import { WorkflowStatus } from "../components/WorkflowStatus/WorkflowStatus";
import { RequestForm } from "../components/RequestForm/RequestForm";

import { RequestRepository } from "../repositories/RequestRepository";
import { LeaveRepository } from "../repositories/LeaveRepository";
import { useProcessForm } from "../hooks/UseProcessForm";
import { RequestGeneralInfo } from "../components/RequestInfo/RequestInfo";
import { HistoryApproval } from "../components/HistoryApproval/HistoryApproval";
import { RequestComment } from "../components/RequestComment/RequestComment";
import { RequestActions } from "../components/RequestAction/RequestActions";
import { RequestActionService } from "../services/RequestActionService";
import { WorkflowAction, RequestStatus } from "../constants/enums";
import { useApp } from "../context/AppContext";
import { IActionUser } from "../types/LeaveServiceType";
import { IPerson } from "../models";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { UserService as SiteUsersService } from "../services/UserService";


const requestRepository = new RequestRepository();
const leaveRepository = new LeaveRepository();
const requestActionService = new RequestActionService();

interface IRequestDetailPageProps {
  requestId: number;
  onBack: () => void;
  currentUserId: number;
  context: WebPartContext;
}

export const RequestDetailPage: React.FC<IRequestDetailPageProps> = ({
  requestId,
  onBack,
  currentUserId,
  context,
}) => {
  const { currentUser } = useApp();
  const [request, setRequest] = useState<any>(null);
  const [absence, setAbsence] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);

  const processId = request?.ProcessIDId;

  const { formConfig, loading, error } = useProcessForm(processId ?? undefined);
  const [reassignUsers, setReassignUsers] = useState<IPerson[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const siteUsersService = React.useMemo(() => new SiteUsersService(context), [context]);
  React.useEffect(() => {
    void loadDetail();
  }, [requestId]);

  const loadDetail = async (): Promise<void> => {
    try {
      setLoadingDetail(true);

      if (!requestId) {
        alert("Không tìm thấy mã phiếu.");
        return;
      }

      const requestData = await requestRepository.getRequestById(requestId);
      setRequest(requestData);

      if (!requestData.AbsenceIDId) {
        alert("Phiếu không có AbsenceIDId.");
        return;
      }

      const absenceData = await leaveRepository.getLeaveById(
        requestData.AbsenceIDId,
      );

      setAbsence(absenceData);

      setFormData({
        ...absenceData,
        Reason: absenceData.RequestReason,
        IsUrgent: requestData.IsEmergency,
      });
    } catch (err) {
      console.error("Load chi tiết phiếu thất bại:", err);
      alert("Không thể tải chi tiết phiếu.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFieldChange = (key: string, value: any): void => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearchUsers = async (keyword: string): Promise<void> => {
  try {
    const term = keyword.trim();

    if (!term) {
      setReassignUsers([]);
      return;
    }

    setSearchingUsers(true);

    const users = await siteUsersService.searchUser(term);
    setReassignUsers(users);
  } catch (error) {
    console.error("Tìm kiếm người dùng thất bại:", error);
    setReassignUsers([]);
  } finally {
    setSearchingUsers(false);
  }
};

  const handleApprove = async (reason?: string): Promise<void> => {
    try {
      setSubmittingAction(true);

      await requestActionService.processAction({
        requestId: request.Id,
        action: WorkflowAction.Approved,
        currentUser: {
          Id: currentUser?.Id ?? currentUserId,
          Title: currentUser?.Title,
          EMail: currentUser?.EMail,
        },
        comment: reason,
      });

      alert("Duyệt phiếu thành công.");
      await loadDetail();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Duyệt phiếu thất bại: ${message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async (reason: string): Promise<void> => {
    try {
      setSubmittingAction(true);

      await requestActionService.processAction({
        requestId: request.Id,
        action: WorkflowAction.Rejected,
        currentUser: {
          Id: currentUser?.Id ?? currentUserId,
          Title: currentUser?.Title,
          EMail: currentUser?.EMail,
        },
        comment: reason,
      });

      alert("Từ chối phiếu thành công.");
      await loadDetail();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Từ chối phiếu thất bại: ${message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

const handleReassign = async (
  targetUser: IActionUser,
  reason?: string,
): Promise<void> => {
  try {
    setSubmittingAction(true);

    await requestActionService.processAction({
      requestId: request.Id,
      action: WorkflowAction.Reassigned,
      currentUser: {
        Id: currentUser?.Id ?? currentUserId,
        Title: currentUser?.Title,
        EMail: currentUser?.EMail,
      },
      targetUser,
      comment: reason,
    });

    alert("Giao lại phiếu thành công.");
    await loadDetail();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    alert(`Giao lại phiếu thất bại: ${message}`);
  } finally {
    setSubmittingAction(false);
  }
};

  if (loadingDetail || loading) {
    return <div style={{ padding: 20 }}>Đang tải chi tiết phiếu...</div>;
  }

  if (error) {
    return <div style={{ padding: 20 }}>Không thể tải cấu hình: {error}</div>;
  }

  if (!request || !absence || !formConfig) {
    return <div style={{ padding: 20 }}>Không có dữ liệu phiếu.</div>;
  }
  const canProcess =
    request.CurrentApproverId === currentUserId &&
    request.Status === RequestStatus.Pending;

  const workflowSteps =
    typeof absence.HistoryStep === "string"
      ? JSON.parse(absence.HistoryStep || "[]")
      : absence.HistoryStep || [];

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f3f2f1",
        minHeight: "100vh",
      }}
    >
      <button type="button" onClick={onBack}>
        Quay lại
      </button>

      <WorkflowStatus steps={workflowSteps} />

      <RequestForm
        formConfig={formConfig}
        formData={formData}
        onFieldChange={handleFieldChange}
        isReadOnly={true}
      />
      <RequestActions
  canProcess={canProcess}
  submitting={submittingAction}
  reassignUsers={reassignUsers}
  searchingUsers={searchingUsers}
  onSearchUsers={(keyword) => {
    void handleSearchUsers(keyword);
  }}
  onApprove={(reason) => {
    void handleApprove(reason);
  }}
  onReject={(reason) => {
    void handleReject(reason);
  }}
  onForward={() => alert("Chức năng chuyển bước đang được phát triển.")}
  onReassign={(targetUser, reason) => {
    void handleReassign(targetUser, reason);
  }}
/>
      <RequestGeneralInfo
        requesterName={request.Requester?.Title}
        approverName={request.CurrentApprover?.Title}
        status={request.Status}
        expectedSLA={request.ExpectedSLA}
        currentStepSLA={request.CurrentStepSLA}
        actualSLA={request.ActualSLA}
        completeSLA={request.CompleteSLA}
        isEmergency={request.IsEmergency}
      />

      <HistoryApproval historyApproval={request.HistoryApproval} />

      <RequestComment requestId={request.Id} currentUserId={currentUserId} />
    </div>
  );
};
