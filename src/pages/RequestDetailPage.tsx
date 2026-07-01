import * as React from "react";
import { useState } from "react";

import { WorkflowStatus } from "../components/WorkflowStatus/WorkflowStatus";
import { RequestForm } from "../components/RequestForm/RequestForm";

import { RequestRepository } from "../repositories/RequestRepository";
import { LeaveRepository } from "../repositories/LeaveRepository";
import { useProcessForm } from "../hooks/UseProcessForm";
import { RequestGeneralInfo } from "../components/RequestInfo";
import { HistoryApproval } from "../components/HistoryApproval/HistoryApproval";

const requestRepository = new RequestRepository();
const leaveRepository = new LeaveRepository();

interface IRequestDetailPageProps {
  requestId: number;
  onBack: () => void;
}

export const RequestDetailPage: React.FC<IRequestDetailPageProps> = ({
  requestId,
  onBack,
}) => {
  const [request, setRequest] = useState<any>(null);
  const [absence, setAbsence] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loadingDetail, setLoadingDetail] = useState(true);

  const processId = request?.ProcessIDId;

  const { formConfig, loading, error } = useProcessForm(processId ?? undefined);

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

  if (loadingDetail || loading) {
    return <div style={{ padding: 20 }}>Đang tải chi tiết phiếu...</div>;
  }

  if (error) {
    return <div style={{ padding: 20 }}>Không thể tải cấu hình: {error}</div>;
  }

  if (!request || !absence || !formConfig) {
    return <div style={{ padding: 20 }}>Không có dữ liệu phiếu.</div>;
  }

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
    </div>
  );
};
