import * as React from "react";
import { IFieldConfig } from "../../../../models";
import styles from "./FieldConfigsTable.module.scss";

interface IFieldConfigsTableProps {
  fieldConfigs: IFieldConfig[];
  canCreate: boolean;
  onCreate: () => void;
  onEdit: (fieldConfig: IFieldConfig) => void;
  onDeactivate: (
    fieldConfig: IFieldConfig,
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

const BooleanBadge: React.FC<{
  value?: boolean;
}> = ({ value }) => {
  return (
    <span
      className={`${styles.booleanBadge} ${
        value ? styles.booleanYes : styles.booleanNo
      }`}
    >
      {value ? "Có" : "Không"}
    </span>
  );
};

export const FieldConfigsTable: React.FC<
  IFieldConfigsTableProps
> = ({
  fieldConfigs,
  canCreate,
  onCreate,
  onEdit,
  onDeactivate,
}) => {
  const sortedFieldConfigs = React.useMemo(
    () =>
      [...fieldConfigs].sort((first, second) => {
        const firstStep = first.StepIDId ?? 0;
        const secondStep = second.StepIDId ?? 0;

        if (firstStep !== secondStep) {
          return firstStep - secondStep;
        }

        return first.FieldDisplayName.localeCompare(
          second.FieldDisplayName,
        );
      }),
    [fieldConfigs],
  );

  const handleDeactivate = async (
    fieldConfig: IFieldConfig,
  ): Promise<void> => {
    try {
      await onDeactivate(fieldConfig);
    } catch (error) {
      console.error(
        "Không thể tắt cấu hình trường:",
        error,
      );
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Cấu hình trường biểu mẫu</h3>

          <p className={styles.description}>
            Quản lý các trường hiển thị trong biểu mẫu của
            quy trình.
          </p>
        </div>

        <button
          type="button"
          className={styles.createButton}
          onClick={onCreate}
          disabled={!canCreate}
        >
          + Thêm trường
        </button>
      </div>

      {sortedFieldConfigs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>
            Chưa có trường cấu hình
          </div>

          <div className={styles.emptyDescription}>
            Thêm trường đầu tiên để bắt đầu xây dựng biểu mẫu.
          </div>

          <button
            type="button"
            className={styles.createButton}
            onClick={onCreate}
            disabled={!canCreate}
          >
            Thêm trường đầu tiên
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trường</th>
                <th>Kiểu dữ liệu</th>
                <th>Phạm vi hiển thị</th>
                <th>Bắt buộc</th>
                <th>Hiển thị</th>
                <th>Chỉnh sửa</th>
                <th>Component</th>
                <th className={styles.actionsHeader}>
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedFieldConfigs.map((fieldConfig) => (
                <tr key={fieldConfig.Id}>
                  <td>
                    <div className={styles.fieldIdentity}>
                      <strong className={styles.displayName}>
                        {displayValue(
                          fieldConfig.FieldDisplayName,
                          "Chưa đặt tên",
                        )}
                      </strong>

                      <code className={styles.internalName}>
                        {displayValue(
                          fieldConfig.FieldInternalName,
                        )}
                      </code>
                    </div>
                  </td>

                  <td>
                    <span className={styles.typeBadge}>
                      {displayValue(fieldConfig.FieldType)}
                    </span>
                  </td>

                  <td>
                    <span className={styles.stepBadge}>
                      {fieldConfig.StepIDId === undefined ||
                      fieldConfig.StepIDId === null
                        ? "Dùng chung"
                        : `Bước ${fieldConfig.StepIDId}`}
                    </span>
                  </td>

                  <td>
                    <BooleanBadge
                      value={fieldConfig.IsRequired}
                    />
                  </td>

                  <td>
                    <BooleanBadge
                      value={fieldConfig.IsVisible}
                    />
                  </td>

                  <td>
                    <BooleanBadge
                      value={fieldConfig.IsEditable}
                    />
                  </td>

                  <td>
                    {fieldConfig.ComponentType ? (
                      <code className={styles.componentName}>
                        {fieldConfig.ComponentType}
                      </code>
                    ) : (
                      <span className={styles.mutedText}>
                        Tự động
                      </span>
                    )}
                  </td>

                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => onEdit(fieldConfig)}
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        className={styles.deactivateButton}
                        onClick={() => {
                          void handleDeactivate(fieldConfig);
                        }}
                         disabled={!fieldConfig.IsVisible}
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
      )}
    </section>
  );
};