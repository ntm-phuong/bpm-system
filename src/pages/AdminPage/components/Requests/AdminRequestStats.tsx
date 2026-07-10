import * as React from "react";
import { IAdminRequestStatsProps } from "../../types/AdminRequestTypes";
import styles from "../../AdminRequestPage.module.scss";

export const AdminRequestStats: React.FC<IAdminRequestStatsProps> = ({ stats }) => {
  return (
    <div className={styles.summaryGrid}>
      <article className={styles.summaryCard}>
        <span>Tổng số request</span>
        <strong>{stats.total}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span>Đang chờ duyệt</span>
        <strong>{stats.pending}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span>Đã duyệt</span>
        <strong>{stats.approved}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span>Đã từ chối</span>
        <strong>{stats.rejected}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span>Khẩn cấp</span>
        <strong>{stats.emergency}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span>Quá SLA</span>
        <strong>{stats.overdue}</strong>
      </article>
    </div>
  );
};
