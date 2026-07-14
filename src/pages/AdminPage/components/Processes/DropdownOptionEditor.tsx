import * as React from "react";
import styles from "./DropdownOptionEditor.module.scss";

interface IDropdownOptionsEditorProps {
  options: string[];
  newOption: string;
  saving: boolean;
  error?: string;

  onChangeNewOption: (value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  onOptionKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => void;
}

export const DropdownOptionsEditor: React.FC<
  IDropdownOptionsEditorProps
> = ({
  options,
  newOption,
  saving,
  error,
  onChangeNewOption,
  onAddOption,
  onRemoveOption,
  onOptionKeyDown,
}) => {
  return (
    <div className={styles.dropdownOptionsEditor}>
      <label htmlFor="field-config-new-option">
        Danh sách lựa chọn{" "}
        <span className={styles.required}>*</span>
      </label>

      <div className={styles.optionInputRow}>
        <input
          id="field-config-new-option"
          type="text"
          value={newOption}
          onChange={(event) =>
            onChangeNewOption(event.target.value)
          }
          onKeyDown={onOptionKeyDown}
          placeholder="Nhập một lựa chọn"
          disabled={saving}
        />

        <button
          type="button"
          className={styles.addButton}
          onClick={onAddOption}
          disabled={saving || !newOption.trim()}
        >
          Thêm
        </button>
      </div>

      {error && (
        <span className={styles.error}>
          {error}
        </span>
      )}

      {options.length === 0 ? (
        <div className={styles.empty}>
          Chưa có lựa chọn nào.
        </div>
      ) : (
        <div className={styles.optionList}>
          {options.map((option, optionIndex) => (
            <div
              key={`${option}-${optionIndex}`}
              className={styles.optionItem}
            >
              <span className={styles.optionOrder}>
                {optionIndex + 1}
              </span>

              <span className={styles.optionLabel}>
                {option}
              </span>

              <button
                type="button"
                className={styles.removeButton}
                onClick={() =>
                  onRemoveOption(optionIndex)
                }
                disabled={saving}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      <span className={styles.helpText}>
        Thứ tự trong danh sách là thứ tự hiển thị
        trong dropdown.
      </span>
    </div>
  );
};