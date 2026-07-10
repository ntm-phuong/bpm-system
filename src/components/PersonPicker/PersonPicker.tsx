import * as React from "react";
import { IPerson } from "../../models";
import styles from "./PersonPicker.module.scss";

export interface IPersonPickerProps {
  label?: string;
  selectedPerson?: IPerson | null;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onSearch: (keyword: string) => Promise<IPerson[]>;
  onChange: (person: IPerson | null) => void;
}

export const PersonPicker: React.FC<IPersonPickerProps> = ({
  label,
  selectedPerson,
  placeholder,
  disabled = false,
  required = false,
  onSearch,
  onChange,
}) => {
  const [keyword, setKeyword] = React.useState<string>("");
  const [results, setResults] = React.useState<IPerson[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
  if (disabled) {
    setIsOpen(false);
    setLoading(false);
    return;
  }

  const normalizedKeyword = keyword.trim();

  if (normalizedKeyword.length < 2) {
    setResults([]);
    setError(undefined);
    setLoading(false);
    setIsOpen(false);
    return;
  }

  let isCancelled = false;

  const timeoutId = setTimeout(() => {
    const searchUsers = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(undefined);
        setIsOpen(true);

        const users = await onSearch(normalizedKeyword);

        if (isCancelled) {
          return;
        }

        setResults(users);
      } catch (e) {
        if (isCancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        setResults([]);
      }

      if (!isCancelled) {
        setLoading(false);
      }
    };

    searchUsers().catch(() => undefined);
  }, 300);

  return () => {
    isCancelled = true;
    clearTimeout(timeoutId);
  };
}, [keyword, onSearch, disabled]);

  const handleSelect = (person: IPerson): void => {
    onChange(person);
    setKeyword("");
    setResults([]);
    setError(undefined);
    setIsOpen(false);
  };

  const handleClear = (): void => {
    onChange(null);
    setKeyword("");
    setResults([]);
    setError(undefined);
    setIsOpen(false);
  };

  const handleInputFocus = (): void => {
    if (disabled) {
      return;
    }

    if (keyword.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className={styles.personPicker}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.requiredMark}>*</span>}
        </label>
      )}

      {selectedPerson && (
        <div className={styles.selectedPerson}>
          <div className={styles.selectedInfo}>
            <div className={styles.selectedName}>{selectedPerson.Title}</div>
            <div className={styles.selectedEmail}>{selectedPerson.EMail || "-"}</div>
          </div>
          {!disabled && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              disabled={disabled}
            >
              Xóa
            </button>
          )}
        </div>
      )}

      <div className={styles.searchBox}>
        <input
          className={styles.input}
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder || "Nhập tên hoặc email để tìm người dùng"}
          disabled={disabled}
        />

        {isOpen && (
          <div className={styles.dropdown}>
            {loading && <div className={styles.loading}>Đang tìm kiếm...</div>}

            {!loading && error && <div className={styles.error}>{error}</div>}

            {!loading && !error && results.length === 0 && (
              <div className={styles.empty}>Không tìm thấy người dùng.</div>
            )}

            {!loading && !error && results.length > 0 &&
              results.map((person) => (
                <button
                  key={person.Id}
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleSelect(person)}
                  disabled={disabled}
                >
                  <div className={styles.resultName}>{person.Title}</div>
                  <div className={styles.resultEmail}>{person.EMail || "-"}</div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
