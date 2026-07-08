import * as React from "react";
import styles from "./RequestInfo.module.scss";

interface IRequestGeneralInfoProps {
  requesterName?: string;
  approverName?: string;
  status?: string;
  expectedSLA?: number;
  currentStepSLA?: number;
  actualSLA?: number;
  completeSLA?: string;
  isEmergency?: boolean;
}

export const RequestGeneralInfo: React.FC<IRequestGeneralInfoProps> = ({
  requesterName,
  approverName,
  status,
  expectedSLA,
  currentStepSLA,
  actualSLA,
  completeSLA,
  isEmergency,
}) => {
  const formatSLA = (value?: number): string => {
    return value !== undefined ? `${value} giờ` : "-";
  };

  const statusValue = status && status.trim() ? status : "-";

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>Thông tin chung</h3>

      <div className={styles.grid}>
        <InfoItem label="Người yêu cầu" value={requesterName || "-"} />
        <InfoItem label="Người phê duyệt" value={approverName || "-"} />
        <InfoItem label="Trạng thái" value={statusValue} />

        <InfoItem label="SLA dự kiến" value={formatSLA(expectedSLA)} />

        <InfoItem
          label="SLA luồng trạng thái (giờ)"
          value={formatSLA(currentStepSLA)}
        />

        <InfoItem label="SLA thực tế" value={formatSLA(actualSLA)} />

        <InfoItem label="Kết quả SLA" value={completeSLA || "-"} />

        <InfoItem
          label="Trạng thái khẩn cấp"
          value={isEmergency ? "Khẩn cấp" : "Không khẩn cấp"}
        />
      </div>
    </section>
  );
};

interface IInfoItemProps {
  label: string;
  value: React.ReactNode;
}

const InfoItem: React.FC<IInfoItemProps> = ({ label, value }) => {
  return (
    <div className={styles.item}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
};