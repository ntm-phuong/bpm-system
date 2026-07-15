import * as React from "react";
import { IProcessStep } from "../../../../models";
import styles from "./ProcessStepTable.module.scss";

interface IProcessStepsTableProps {
  steps: IProcessStep[];
  canCreateStep: boolean;
  onCreateStep: () => void;
  onEditStep: (step: IProcessStep) => void;
  onDeactivateStep: (
    step: IProcessStep,
  ) => Promise<void>;
}

const displayValue = (
  value: unknown,
  fallback = "-",
): string => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
};

export const ProcessStepsTable: React.FC<
  IProcessStepsTableProps
> = ({
  steps,
  canCreateStep,
  onCreateStep,
  onEditStep,
  onDeactivateStep,
}) => {
  const sortedSteps = React.useMemo(
    () =>
      [...steps].sort(
        (firstStep, secondStep) =>
          firstStep.StepOrder -
          secondStep.StepOrder,
      ),
    [steps],
  );

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Luồng xử lý quy trình</h3>

          <p className={styles.description}>
            Các bước được thực hiện theo thứ tự từ trái
            sang phải.
          </p>
        </div>

        <button
          type="button"
          className={styles.createButton}
          onClick={onCreateStep}
          disabled={!canCreateStep}
        >
          Thêm bước
        </button>
      </div>

      {sortedSteps.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>
            Quy trình chưa có bước xử lý
          </div>

          <div className={styles.emptyDescription}>
            Hãy thêm bước đầu tiên để bắt đầu cấu hình
            luồng duyệt.
          </div>

          <button
            type="button"
            className={styles.createButton}
            onClick={onCreateStep}
            disabled={!canCreateStep}
          >
            Thêm bước đầu tiên
          </button>
        </div>
      ) : (
        <div className={styles.flowWrapper}>
          <div className={styles.flow}>
            {sortedSteps.map((step, index) => {
              const isLastStep =
                index === sortedSteps.length - 1;

              return (
                <React.Fragment key={step.Id}>
                  <article
                    className={`${styles.stepCard} ${
                      step.IsActive
                        ? styles.activeStep
                        : styles.inactiveStep
                    }`}
                  >
                    <div className={styles.stepHeader}>
                      <span className={styles.stepNumber}>
                        {step.StepOrder}
                      </span>

                      <span
                        className={`${styles.statusBadge} ${
                          step.IsActive
                            ? styles.activeStatus
                            : styles.inactiveStatus
                        }`}
                      >
                        {step.IsActive
                          ? "Đang hoạt động"
                          : "Đã tắt"}
                      </span>
                    </div>

                    <h4 className={styles.stepTitle}>
                      {displayValue(
                        step.Title,
                        "Chưa đặt tên",
                      )}
                    </h4>

                    <dl className={styles.stepDetails}>
                      <div className={styles.detailRow}>
                        <dt>Người duyệt</dt>
                        <dd>
                          {displayValue(
                            step.StepApprover?.Title,
                            "Chưa cấu hình",
                          )}
                        </dd>
                      </div>

                      <div className={styles.detailRow}>
                        <dt>Email</dt>
                        <dd>
                          {displayValue(
                            step.StepApprover?.EMail,
                          )}
                        </dd>
                      </div>

                      <div className={styles.detailRow}>
                        <dt>SLA</dt>
                        <dd>
                          {step.SLA_Hours !== undefined &&
                          step.SLA_Hours !== null
                            ? `${step.SLA_Hours} giờ`
                            : "-"}
                        </dd>
                      </div>

                      <div className={styles.detailRow}>
                        <dt>Cảnh báo trước</dt>
                        <dd>
                          {step.BeforeSLA !== undefined &&
                          step.BeforeSLA !== null
                            ? `${step.BeforeSLA} giờ`
                            : "-"}
                        </dd>
                      </div>
                    </dl>

                    <div className={styles.stepActions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => onEditStep(step)}
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        className={styles.deactivateButton}
                        onClick={() => {
                          void onDeactivateStep(
                            step,
                          ).catch((error) => {
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
                  </article>

                  {!isLastStep && (
                    <div
                      className={styles.connector}
                      aria-hidden="true"
                    >
                      {/* <span className={styles.connectorLine} /> */}
                      <span className={styles.connectorArrow}>
                        →
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            <div className={styles.completedNode}>
              <span className={styles.completedIcon}>
                ✓
              </span>

              <span>Hoàn tất</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};