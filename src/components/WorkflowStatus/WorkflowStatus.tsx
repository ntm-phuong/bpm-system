import * as React from 'react';
import styles from '../WorkflowStatus.module.scss';
import { RequestStatus } from '../../constants/enums';

// Định nghĩa màu sắc cho các trạng thái
const STATUS_COLORS = {
  Approved: '#27AE60', // Hoàn thành (Xanh lá)
  Processing: '#F2A93B', // Đang xử lý (Vàng cam)
  Forwarded: '#4A55A2', // Chuyển bước (Xanh đậm)
  Rejected: '#EB5757',  // Từ chối (Đỏ)
  Draft: '#56CCF2',     // Lưu (Xanh nhạt)
  Pending: '#7C8196',   // Chưa đến (Xám)
};

export interface IWorkflowStep {
  id: number;
  title: string;

  assigneeId?: number;
  assignee?: string;

  status: RequestStatus;

  assignedAt?: string;
  completedAt?: string;

  // comments?: string;

  slaHours?: number;
  beforeSLA?: number;
}
interface IWorkflowStatusProps {
  steps: IWorkflowStep[];
}

export const WorkflowStatus: React.FC<IWorkflowStatusProps> = ({ steps }) => {
  return (
    <div className={styles.container}>
      {/* 1. Phần chú thích màu sắc (Legend) */}
      <div className={styles.legendContainer}>
        <div className={styles.legendItem}><span className={styles.dot} style={{ backgroundColor: STATUS_COLORS.Approved }}></span> Hoàn thành</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ backgroundColor: STATUS_COLORS.Processing }}></span> Đang xử lý</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ backgroundColor: STATUS_COLORS.Forwarded }}></span> Chuyển bước</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ backgroundColor: STATUS_COLORS.Rejected }}></span> Từ chối</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ backgroundColor: STATUS_COLORS.Draft }}></span> Lưu</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ backgroundColor: STATUS_COLORS.Pending }}></span> Chưa đến</div>
      </div>

      <h3 className={styles.title}>Luồng trạng thái</h3>

      {/* 2. Phần mũi tên quy trình */}
      <div className={styles.stepsWrapper}>
        {steps.map((step) => {
          const stepColor = STATUS_COLORS[step.status];

          return (
            <div key={step.id} className={styles.stepColumn}>
              {/* Thẻ mũi tên (Truyền CSS Variable để đổi màu động) */}
              <div 
                className={styles.stepArrow} 
                style={{ '--step-color': stepColor } as React.CSSProperties}
              >
                {step.title}
              </div>
              
              {/* Tên người phụ trách */}
              <div className={styles.assignee}>
                {step.assignee || '\u00A0'} {/* Ký tự trắng để giữ layout không bị giật nếu ko có tên */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};