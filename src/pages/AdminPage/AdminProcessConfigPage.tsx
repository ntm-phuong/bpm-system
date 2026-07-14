import * as React from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IProcess } from "../../models";
import {
  AdminProcessConfigService,
} from "../../services/Admin/AdminProcessConfigService";
import { AdminProcessService } from "../../services/Admin/AdminProcessService";

import {
  ICreateProcessInput,
  IUpdateProcessInput,
} from "./types/AdminProcessConfigTypes";
import { ProcessEditorPanel } from "./components/Processes/ProcessEditorPanel";
import styles from "./AdminProcessConfigPage.module.scss";
import { ProcessConfigDetailPage } from "./pages/ProcessConfigPage/ProcessConfigDetailPage";
import { ProcessDashboardTable } from "./components/Processes/ProcessDashboardTable";

const adminProcessConfigService = new AdminProcessConfigService();
const adminProcessService = new AdminProcessService();
// const adminProcessStepService = new AdminProcessStepService();
// const adminFieldConfigService = new AdminFieldConfigService();

interface IAdminProcessConfigPageProps {
  context: WebPartContext;
}

export const AdminProcessConfigPage: React.FC<IAdminProcessConfigPageProps> = ({
  context,
}) => {
  const [processes, setProcesses] = React.useState<IProcess[]>([]);
  const [loadingProcesses, setLoadingProcesses] =
    React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [showProcessPanel, setShowProcessPanel] =
    React.useState<boolean>(false);
  const [editingProcess, setEditingProcess] = React.useState<
    IProcess | undefined
  >();
  const [savingProcess, setSavingProcess] = React.useState<boolean>(false);

  const [detailProcessId, setDetailProcessId] = React.useState<
    number | undefined
  >();

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

  
  // const handleSearchUsers = React.useCallback(
  //   async (keyword: string): Promise<IPerson[]> => {
  //     return userService.searchUsers(keyword);
  //   },
  //   [userService],
  // );

  React.useEffect(() => {
    loadProcesses().catch((e) => {
      console.error("Không thể tải danh sách quy trình:", e);
    });
  }, [loadProcesses]);

  // React.useEffect(() => {
  //   if (!selectedProcessId) {
  //     setConfig(undefined);
  //     return;
  //   }

  //   loadProcessConfig(selectedProcessId).catch((e) => {
  //     console.error("Không thể tải cấu hình quy trình:", e);
  //   });
  // }, [selectedProcessId, loadProcessConfig]);

 
  //PROCESS
  const handleCreateProcess = (): void => {
    setEditingProcess(undefined);
    setShowProcessPanel(true);
  };

  const handleEditProcess = (process: IProcess): void => {
    setEditingProcess(process);
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
      } else {
        await adminProcessService.createProcess(input);
      }

      await loadProcesses();

      setShowProcessPanel(false);
      setEditingProcess(undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);

      setError(message);
    } finally {
      setSavingProcess(false);
    }
  };

  const handleDeactivateProcess = async (process: IProcess): Promise<void> => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn tắt quy trình "${process.Title}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(undefined);

      await adminProcessService.deactivateProcess(process.Id);

      await loadProcesses();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);

      setError(message);
    }
  };

  const handleOpenProcessDetail = (processId: number): void => {
    setDetailProcessId(processId);
  };
  //STEP
  
  //fIELD CONFIG
  

  if (detailProcessId !== undefined) {
    return (
      <ProcessConfigDetailPage
        context={context}
        processId={detailProcessId}
        onBack={() => {
          setDetailProcessId(undefined);
        }}
      />
    );
  }

  return (
  <div className={styles.page}>
    <section className={styles.headerSection}>
      <div className={styles.dashboardHeader}>
        <div>
          <h2 className={styles.title}>
            Quản lý quy trình
          </h2>

          <p className={styles.subtitle}>
            Quản lý danh sách quy trình và truy cập trang
            cấu hình chi tiết.
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleCreateProcess}
        >
          Thêm quy trình
        </button>
      </div>
    </section>

    {error && (
      <section className={styles.panel}>
        <div className={styles.error}>
          {error}
        </div>
      </section>
    )}

    <ProcessDashboardTable
      processes={processes}
      loading={loadingProcesses}
      onOpenProcess={handleOpenProcessDetail}
      onEditProcess={handleEditProcess}
      onDeactivateProcess={handleDeactivateProcess}
    />

    <ProcessEditorPanel
      isOpen={showProcessPanel}
      process={editingProcess}
      saving={savingProcess}
      onSave={(input) => {
        void handleSaveProcess(input);
      }}
      onCancel={() => {
        setShowProcessPanel(false);
        setEditingProcess(undefined);
      }}
    />
  </div>
);
};
