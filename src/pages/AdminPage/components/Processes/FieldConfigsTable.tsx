import * as React from "react";
import { IFieldConfig } from "../../../../models";
import styles from "../../AdminProcessConfigPage.module.scss";

interface IFieldConfigsTableProps {
  fieldConfigs: IFieldConfig[];
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

export const FieldConfigsTable: React.FC<
  IFieldConfigsTableProps
> = ({ fieldConfigs }) => {
  return (
    <section className={styles.panel}>
      <h3>Field Configs Table</h3>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>FieldInternalName</th>
              <th>FieldDisplayName</th>
              <th>FieldType</th>
              <th>StepIDId</th>
              <th>IsRequired</th>
              <th>IsVisible</th>
              <th>IsEditable</th>
              <th>ComponentType</th>
            </tr>
          </thead>

          <tbody>
            {fieldConfigs.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyRow}>
                  Không có dữ liệu cấu hình trường.
                </td>
              </tr>
            )}

            {fieldConfigs.map((fieldConfig) => (
              <tr key={fieldConfig.Id}>
                <td>{displayValue(fieldConfig.Title)}</td>

                <td>
                  {displayValue(fieldConfig.FieldInternalName)}
                </td>

                <td>
                  {displayValue(fieldConfig.FieldDisplayName)}
                </td>

                <td>{displayValue(fieldConfig.FieldType)}</td>

                <td>
                  {fieldConfig.StepIDId === undefined ||
                  fieldConfig.StepIDId === null
                    ? "Common"
                    : displayValue(fieldConfig.StepIDId)}
                </td>

                <td>
                  {displayValue(fieldConfig.IsRequired)}
                </td>

                <td>
                  {displayValue(fieldConfig.IsVisible)}
                </td>

                <td>
                  {displayValue(fieldConfig.IsEditable)}
                </td>

                <td>
                  {displayValue(fieldConfig.ComponentType)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};