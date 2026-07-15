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
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const [keyword, setKeyword] = React.useState<string>("");
  const [results, setResults] = React.useState<IPerson[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (disabled || selectedPerson) {
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

    const timeoutId = window.setTimeout(() => {
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

          const message =
            e instanceof Error ? e.message : String(e);

          setError(message);
          setResults([]);
        } finally {
          if (!isCancelled) {
            setLoading(false);
          }
        }
      };

      void searchUsers();
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [keyword, onSearch, disabled, selectedPerson]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent): void => {
      const target = event.target;

      if (
        target instanceof Node &&
        rootRef.current &&
        !rootRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

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
    if (disabled || selectedPerson) {
      return;
    }

    if (keyword.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.personPicker}
    >
      {label && (
        <label
          className={styles.label}
          htmlFor="person-picker-search"
        >
          {label}

          {required && (
            <span className={styles.requiredMark}>
              *
            </span>
          )}
        </label>
      )}

      {selectedPerson ? (
        <div className={styles.selectedPerson}>
          <div className={styles.selectedInfo}>
            <div className={styles.selectedName}>
              {selectedPerson.Title}
            </div>

            <div className={styles.selectedEmail}>
              {selectedPerson.EMail || "-"}
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
            >
              Xóa
            </button>
          )}
        </div>
      ) : (
        <div className={styles.searchBox}>
          <input
            id="person-picker-search"
            className={styles.input}
            type="text"
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            onFocus={handleInputFocus}
            placeholder={
              placeholder ||
              "Nhập tên hoặc email để tìm người dùng"
            }
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="person-picker-results"
          />

          {isOpen && (
            <div
              id="person-picker-results"
              className={styles.dropdown}
              role="listbox"
            >
              {loading && (
                <div className={styles.loading}>
                  Đang tìm kiếm...
                </div>
              )}

              {!loading && error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              {!loading &&
                !error &&
                results.length === 0 && (
                  <div className={styles.empty}>
                    Không tìm thấy người dùng.
                  </div>
                )}

              {!loading &&
                !error &&
                results.map((person) => (
                  <button
                    key={person.Id}
                    type="button"
                    className={styles.resultItem}
                    onClick={() =>
                      handleSelect(person)
                    }
                    disabled={disabled}
                    role="option"
                  >
                    <div
                      className={styles.resultName}
                    >
                      {person.Title}
                    </div>

                    <div
                      className={styles.resultEmail}
                    >
                      {person.EMail || "-"}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};