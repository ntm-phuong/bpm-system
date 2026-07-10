import * as React from "react";
import { IProcess } from "../../../../models";
import styles from "../../AdminProcessConfigPage.module.scss";

interface IProcessSummaryProps {
  process: IProcess;
}

const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

export const ProcessSummary: React.FC<IProcessSummaryProps> = ({
  process,
}) => {
  return (
    <section className={styles.panel}>
      <h3>Process Summary</h3>

      <div className={styles.summaryGrid}>
        <div>
          <strong>Title:</strong> {displayValue(process.Title)}
        </div>

        <div>
          <strong>Process Code:</strong>{" "}
          {displayValue(process.ProcessCode)}
        </div>

        <div>
          <strong>Description:</strong>{" "}
          {displayValue(process.Description)}
        </div>

        <div>
          <strong>Is Active:</strong>{" "}
          {displayValue(process.IsActive)}
        </div>
      </div>
    </section>
  );
};