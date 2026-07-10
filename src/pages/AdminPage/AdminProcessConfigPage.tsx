import * as React from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IFieldConfig, IProcess, IProcessStep, IPerson } from "../../models";
import {
  AdminProcessConfigService,
  IAdminProcessConfig,
} from "../../services/Admin/AdminProcessConfigService";
import { AdminProcessService } from "../../services/Admin/AdminProcessService";
import { AdminProcessStepService } from "../../services/Admin/AdminProcessStepService";
import {
  ICreateProcessInput,
  ICreateProcessStepInput,
  IUpdateProcessInput,
  IUpdateProcessStepInput,
} from "./types/AdminProcessConfigTypes";
import { ProcessEditorPanel } from "./components/Processes/ProcessEditorPanel";
import { StepEditorPanel } from "./components/Processes/StepEditorPanel";
import styles from "./AdminProcessConfigPage.module.scss";
import { UserService } from "../../services/UserService";
import { ProcessAction } from "./components/Processes/ProcessAction";

const adminProcessConfigService = new AdminProcessConfigService();
const adminProcessService = new AdminProcessService();
const adminProcessStepService = new AdminProcessStepService();

const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

interface IAdminProcessConfigPageProps {
  context: WebPartContext;
}

export const AdminProcessConfigPage: React.FC<IAdminProcessConfigPageProps> = ({
  context,
}) => {
  const userService = React.useMemo(() => new UserService(context), [context]);
  const [processes, setProcesses] = React.useState<IProcess[]>([]);
  const [selectedProcessId, setSelectedProcessId] = React.useState<
    number | undefined
  >();
  const [config, setConfig] = React.useState<IAdminProcessConfig | undefined>();
  const [loadingProcesses, setLoadingProcesses] =
    React.useState<boolean>(false);
  const [loadingConfig, setLoadingConfig] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [showProcessPanel, setShowProcessPanel] =
    React.useState<boolean>(false);
  const [editingProcess, setEditingProcess] = React.useState<
    IProcess | undefined
  >();
  const [savingProcess, setSavingProcess] = React.useState<boolean>(false);
  const [showStepPanel, setShowStepPanel] = React.useState<boolean>(false);
  const [editingStep, setEditingStep] = React.useState<
    IProcessStep | undefined
  >();
  const [savingStep, setSavingStep] = React.useState<boolean>(false);

  const loadProcesses = React.useCallback(async (): Promise<void> => {
    try {
      setLoadingProcesses(true);
      setError(undefined);

      const data = await adminProcessConfigService.getProcesses();
      setProcesses(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoadingProcesses(false);
    }
  }, []);

  const loadProcessConfig = React.useCallback(
    async (processId: number): Promise<void> => {
      try {
        setLoadingConfig(true);
        setError(undefined);

        const processConfig =
          await adminProcessConfigService.getProcessConfig(processId);
        setConfig(processConfig);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        setConfig(undefined);
      } finally {
        setLoadingConfig(false);
      }
    },
    [],
  );
  const handleSearchUsers = React.useCallback(
    async (keyword: string): Promise<IPerson[]> => {
      return userService.searchUsers(keyword);
    },
    [userService],
  );

  React.useEffect(() => {
    loadProcesses().catch((e) => {
      console.error("Không thể tải danh sách quy trình:", e);
    });
  }, [loadProcesses]);

  React.useEffect(() => {
    if (!selectedProcessId) {
      setConfig(undefined);
      return;
    }

    loadProcessConfig(selectedProcessId).catch((e) => {
      console.error("Không thể tải cấu hình quy trình:", e);
    });
  }, [selectedProcessId, loadProcessConfig]);

  const handleProcessChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    const rawValue = event.target.value;

    if (!rawValue) {
      setSelectedProcessId(undefined);
      setConfig(undefined);
      return;
    }

    setSelectedProcessId(Number(rawValue));
  };

  const handleCreateProcess = (): void => {
    setEditingProcess(undefined);
    setShowProcessPanel(true);
  };

  const handleEditProcess = (): void => {
    if (!config?.process) {
      return;
    }

    setEditingProcess(config.process);
    setShowProcessPanel(true);
  };

  const handleSaveProcess = async (
    input: ICreateProcessInput | IUpdateProcessInput,
  ): Promise<void> => {
    try {
      setSavingProcess(true);
      setError(undefined);

      if ("id" in input) {
        await adminProcessService.updateProcess(input);
        await loadProcesses();

        if (selectedProcessId) {
          await loadProcessConfig(selectedProcessId);
        }
      } else {
        const created = await adminProcessService.createProcess(input);
        await loadProcesses();
        setSelectedProcessId(created.Id);
      }

      setShowProcessPanel(false);
      setEditingProcess(undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setSavingProcess(false);
    }
  };

  const handleDeactivateProcess = async (): Promise<void> => {
    if (!config?.process) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn tắt quy trình \"${config.process.Title}\" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(undefined);
      await adminProcessService.deactivateProcess(config.process.Id);
      await loadProcesses();

      if (selectedProcessId) {
        await loadProcessConfig(selectedProcessId);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    }
  };

  const handleCreateStep = (): void => {
    if (!selectedProcessId) {
      return;
    }

    setEditingStep(undefined);
    setShowStepPanel(true);
  };

  const handleEditStep = (step: IProcessStep): void => {
    setEditingStep(step);
    setShowStepPanel(true);
  };

  const handleSaveStep = async (
    input: ICreateProcessStepInput | IUpdateProcessStepInput,
  ): Promise<void> => {
    try {
      setSavingStep(true);
      setError(undefined);

      if ("id" in input) {
        await adminProcessStepService.updateStep(input);
      } else {
        await adminProcessStepService.createStep(input);
      }

      if (selectedProcessId) {
        await loadProcessConfig(selectedProcessId);
      }

      setShowStepPanel(false);
      setEditingStep(undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setSavingStep(false);
    }
  };

  const handleDeactivateStep = async (step: IProcessStep): Promise<void> => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn tắt bước \"${step.Title}\" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(undefined);
      await adminProcessStepService.deactivateStep(step.Id);

      if (selectedProcessId) {
        await loadProcessConfig(selectedProcessId);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.headerSection}>
        <h2 className={styles.title}>Admin Process Configuration</h2>
        <p className={styles.subtitle}>
          Trang tổng quan cấu hình quy trình ở chế độ chỉ đọc.
        </p>
      </section>

      <ProcessAction
        process={config?.process}
        onCreate={handleCreateProcess}
        onEdit={handleEditProcess}
        onDeactivate={handleDeactivateProcess}
      />

      <ProcessEditorPanel
        isOpen={showProcessPanel}
        process={editingProcess}
        saving={savingProcess}
        onSave={(input) => {
          handleSaveProcess(input).catch((e) => {
            console.error("Không thể lưu quy trình:", e);
          });
        }}
        onCancel={() => {
          setShowProcessPanel(false);
        }}
      />

      <StepEditorPanel
        isOpen={showStepPanel}
        processId={selectedProcessId}
        step={editingStep}
        saving={savingStep}
        onSearchUsers={handleSearchUsers}
        onSave={(input) => {
          handleSaveStep(input).catch((e) => {
            console.error("Không thể lưu bước:", e);
          });
        }}
        onCancel={() => setShowStepPanel(false)}
      />

      <section className={styles.panel}>
        <h3>Process Selector</h3>
        <div className={styles.selectorRow}>
          <label htmlFor="process-selector">Chọn quy trình</label>
          <select
            id="process-selector"
            value={selectedProcessId ?? ""}
            onChange={handleProcessChange}
            disabled={loadingProcesses}
          >
            <option value="">-- Chọn quy trình --</option>
            {processes.map((process) => (
              <option key={process.Id} value={process.Id}>
                {process.Title}
              </option>
            ))}
          </select>
        </div>
        {loadingProcesses && (
          <div className={styles.info}>Đang tải danh sách quy trình...</div>
        )}
      </section>

      {error && (
        <section className={styles.panel}>
          <div className={styles.error}>{error}</div>
        </section>
      )}

      {loadingConfig && (
        <section className={styles.panel}>
          <div className={styles.info}>Đang tải cấu hình quy trình...</div>
        </section>
      )}

      {config && (
        <>
          <section className={styles.panel}>
            <h3>Process Summary</h3>
            <div className={styles.summaryGrid}>
              <div>
                <strong>Title:</strong> {displayValue(config.process.Title)}
              </div>
              <div>
                <strong>Process Code:</strong>{" "}
                {displayValue(config.process.ProcessCode)}
              </div>
              <div>
                <strong>Description:</strong>{" "}
                {displayValue(config.process.Description)}
              </div>
              <div>
                <strong>Is Active:</strong>{" "}
                {displayValue(config.process.IsActive)}
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h3>Steps Table</h3>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={handleCreateStep}
                disabled={!selectedProcessId}
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
                  {config.steps.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.emptyRow}>
                        Không có dữ liệu bước.
                      </td>
                    </tr>
                  )}
                  {config.steps.map((step: IProcessStep) => (
                    <tr key={step.Id}>
                      <td>{displayValue(step.StepOrder)}</td>
                      <td>{displayValue(step.Title)}</td>
                      <td>{displayValue(step.StepApprover?.Title)}</td>
                      <td>{displayValue(step.StepApprover?.EMail)}</td>
                      <td>{displayValue(step.SLA_Hours)}</td>
                      <td>{displayValue(step.BeforeSLA)}</td>
                      <td>{displayValue(step.IsActive)}</td>
                      <td>
                        <div className={styles.toolbar}>
                          <button
                            type="button"
                            className={styles.toolbarButton}
                            onClick={() => handleEditStep(step)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={() => {
                              handleDeactivateStep(step).catch((e) => {
                                console.error("Không thể tắt bước:", e);
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
                  {config.fieldConfigs.length === 0 && (
                    <tr>
                      <td colSpan={9} className={styles.emptyRow}>
                        Không có dữ liệu cấu hình trường.
                      </td>
                    </tr>
                  )}
                  {config.fieldConfigs.map((fieldConfig: IFieldConfig) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
