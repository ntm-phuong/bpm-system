import * as React from "react";
import { IProcessStep } from "../../../../models";
import styles from "../../AdminProcessConfigPage.module.scss";

const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

interface IProcessStepsTableProps {
  steps: IProcessStep[];
  canCreateStep: boolean;
  onCreateStep: () => void;
  onEditStep: (step: IProcessStep) => void;
  onDeactivateStep: (step: IProcessStep) => Promise<void>;
}

export const ProcessStepsTable: React.FC<
  IProcessStepsTableProps
> = ({
  steps,
  canCreateStep,
  onCreateStep,
  onEditStep,
  onDeactivateStep,
}) => {
  return (
    <section className={styles.panel}>
      <h3>Steps Table</h3>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={onCreateStep}
          disabled={!canCreateStep}
        >
          Thêm bước
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>StepOrder</th>
              <th>Title</th>
              <th>StepApprover.Title</th>
              <th>StepApprover.EMail</th>
              <th>SLA_Hours</th>
              <th>BeforeSLA</th>
              <th>IsActive</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {steps.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyRow}>
                  Không có dữ liệu bước.
                </td>
              </tr>
            )}

            {steps.map((step) => (
              <tr key={step.Id}>
                <td>{displayValue(step.StepOrder)}</td>

                <td>{displayValue(step.Title)}</td>

                <td>
                  {displayValue(step.StepApprover?.Title)}
                </td>

                <td>
                  {displayValue(step.StepApprover?.EMail)}
                </td>

                <td>{displayValue(step.SLA_Hours)}</td>

                <td>{displayValue(step.BeforeSLA)}</td>

                <td>{displayValue(step.IsActive)}</td>

                <td>
                  <div className={styles.toolbar}>
                    <button
                      type="button"
                      className={styles.toolbarButton}
                      onClick={() => onEditStep(step)}
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => {
                        onDeactivateStep(step).catch((error) => {
                          console.error(
                            "Không thể tắt bước:",
                            error,
                          );
                        });
                      }}
                      disabled={!step.IsActive}
                    >
                      Tắt
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};