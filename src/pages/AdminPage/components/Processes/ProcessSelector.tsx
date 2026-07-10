import * as React from 'react';
import { IProcess } from '../../../../models';
import styles from '../../AdminProcessConfigPage.module.scss';

interface IProcessSelectorProps {
    processes: IProcess[];
    selectedProcessId?: number;
    loading: boolean;
    onChange: (processId?: number) => void;
}

export const ProcessSelector: React.FC<IProcessSelectorProps> = ({
  processes,
  selectedProcessId,
  loading,
  onChange,
}) => {
  return (
    <section className={styles.panel}>
      <h3>Process Selector</h3>

      <div className={styles.selectorRow}>
        <label htmlFor="process-selector">
          Chọn quy trình
        </label>

        <select
          id="process-selector"
          value={selectedProcessId ?? ""}
          onChange={(event) => {
            const rawValue = event.target.value;

            if (!rawValue) {
              onChange(undefined);
              return;
            }

            onChange(Number(rawValue));
          }}
          disabled={loading}
        >
          <option value="">-- Chọn quy trình --</option>

          {processes.map((process) => (
            <option key={process.Id} value={process.Id}>
              {process.Title}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className={styles.info}>
          Đang tải danh sách quy trình...
        </div>
      )}
    </section>
  );
};