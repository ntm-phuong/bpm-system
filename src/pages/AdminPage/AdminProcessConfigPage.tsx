import * as React from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import {  IProcess, IProcessStep, IPerson } from "../../models";
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
import { ProcessSelector } from "./components/Processes/ProcessSelector";
import { ProcessSummary } from "./components/Processes/ProcessSummary";
import { ProcessStepsTable } from "./components/Processes/ProcessStepsTable";
import { FieldConfigsTable } from "./components/Processes/FieldConfigsTable";

const adminProcessConfigService = new AdminProcessConfigService();
const adminProcessService = new AdminProcessService();
const adminProcessStepService = new AdminProcessStepService();


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

  const handleProcessChange = (processId?: number): void => {
    setSelectedProcessId(processId);

    if (!processId) {
      setConfig(undefined);
    }
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

      <ProcessSelector
        processes={processes}
        selectedProcessId={selectedProcessId}
        loading={loadingProcesses}
        onChange={handleProcessChange}
      />

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
          <ProcessSummary process={config.process} />
          <ProcessStepsTable
            steps={config.steps}
            canCreateStep={selectedProcessId !== undefined}
            onCreateStep={handleCreateStep}
            onEditStep={handleEditStep}
            onDeactivateStep={handleDeactivateStep}
          />
          <FieldConfigsTable fieldConfigs={config.fieldConfigs} />
        </>
      )}
    </div>
  );
};
