import * as React from "react";
import { IFieldConfig } from "../../../../models";
import styles from "../../AdminProcessConfigPage.module.scss";

interface IFieldConfigsTableProps {
  fieldConfigs: IFieldConfig[];
  canCreate: boolean;
  onCreate: () => void;
  onEdit: (fieldConfig: IFieldConfig) => void;
  onDeactivate: (fieldConfig: IFieldConfig) => Promise<void>;
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

export const FieldConfigsTable: React.FC<IFieldConfigsTableProps> = ({
  fieldConfigs,
  canCreate,
  onCreate,
  onEdit,
  onDeactivate,
}) => {
  const handleDeactivate = async (
    fieldConfig: IFieldConfig,
  ): Promise<void> => {
    try {
      await onDeactivate(fieldConfig);
    } catch (error) {
      console.error("Không thể tắt cấu hình trường:", error);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Danh sách cấu hình trường</h3>

        <button
          type="button"
          className={styles.toolbarButton}
          onClick={onCreate}
          disabled={!canCreate}
        >
          Thêm cấu hình trường
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>FieldInternalName</th>
              <th>FieldDisplayName</th>
              <th>FieldType</th>
              <th>Step</th>
              <th>IsRequired</th>
              <th>IsVisible</th>
              <th>IsEditable</th>
              <th>ComponentType</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {fieldConfigs.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.emptyRow}>
                  Không có dữ liệu cấu hình trường.
                </td>
              </tr>
            ) : (
              fieldConfigs.map((fieldConfig) => (
                <tr key={fieldConfig.Id}>
                  <td>{displayValue(fieldConfig.Title)}</td>

                  <td>{displayValue(fieldConfig.FieldInternalName)}</td>

                  <td>{displayValue(fieldConfig.FieldDisplayName)}</td>

                  <td>{displayValue(fieldConfig.FieldType)}</td>

                  <td>
                    {fieldConfig.StepIDId === undefined ||
                    fieldConfig.StepIDId === null
                      ? "Common"
                      : displayValue(fieldConfig.StepIDId)}
                  </td>

                  <td>{displayValue(fieldConfig.IsRequired)}</td>

                  <td>{displayValue(fieldConfig.IsVisible)}</td>

                  <td>{displayValue(fieldConfig.IsEditable)}</td>

                  <td>{displayValue(fieldConfig.ComponentType)}</td>

                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        className={styles.toolbarButton}
                        onClick={() => onEdit(fieldConfig)}
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => {
                          void handleDeactivate(fieldConfig);
                        }}
                      >
                        Tắt
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};