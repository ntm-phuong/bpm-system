import * as React from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  AdminProcessConfigService,
  IAdminProcessConfig,
} from "../../../../services/Admin/AdminProcessConfigService";
import { AdminFieldConfigService } from "../../../../services/Admin/AdminFieldConfigService";
import { ProcessSummary } from "../../components/Processes/ProcessSummary";
import { IProcessStep, IPerson, IFieldConfig } from "../../../../models";
import { AdminProcessStepService } from "../../../../services/Admin/AdminProcessStepService";
import { UserService } from "../../../../services/UserService";
import {
  ICreateProcessStepInput,
  ICreateFieldConfigInput,
  IUpdateProcessStepInput,
  IUpdateFieldConfigInput,
} from "../../types/AdminProcessConfigTypes";
import { StepEditorPanel } from "../../components/Processes/StepEditorPanel";
import { ProcessStepsTable } from "../../components/Processes/ProcessStepsTable";
import { FieldConfigEditorPanel } from "../../components/Processes/FieldConfigEditorPanel";
import { FieldConfigsTable } from "../../components/Processes/FieldConfigsTable";
import styles from "./ProcessConfigDetailPage.module.scss";

const adminProcessStepService = new AdminProcessStepService();
const adminProcessConfigService = new AdminProcessConfigService();
const adminFieldConfigService = new AdminFieldConfigService();

interface IProcessConfigDetailPageProps {
  context: WebPartContext;
  processId: number;
  onBack: () => void;
}

export const ProcessConfigDetailPage: React.FC<
  IProcessConfigDetailPageProps
> = ({ context, processId, onBack }) => {
  const userService = React.useMemo(() => new UserService(context), [context]);

  const [config, setConfig] = React.useState<IAdminProcessConfig | undefined>();

  const [loading, setLoading] = React.useState<boolean>(false);

  const [error, setError] = React.useState<string | undefined>();

  const [showStepPanel, setShowStepPanel] = React.useState<boolean>(false);
  const [editingStep, setEditingStep] = React.useState<
    IProcessStep | undefined
  >();

  const [savingStep, setSavingStep] = React.useState<boolean>(false);
  //FieldConfig

  const [showFieldConfigPanel, setShowFieldConfigPanel] =
    React.useState<boolean>(false);

  const [editingFieldConfig, setEditingFieldConfig] = React.useState<
    IFieldConfig | undefined
  >();

  const [savingFieldConfig, setSavingFieldConfig] =
    React.useState<boolean>(false);

  const loadProcessConfig = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(undefined);
      setConfig(undefined);

      const processConfig =
        await adminProcessConfigService.getProcessConfig(processId);

      setConfig(processConfig);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);

      setError(message);
      setConfig(undefined);
    } finally {
      setLoading(false);
    }
  }, [processId]);

  const handleSearchUsers = React.useCallback(
    async (keyword: string): Promise<IPerson[]> => {
      return userService.searchUsers(keyword);
    },
    [userService],
  );

  const handleCreateStep = (): void => {
    setEditingStep(undefined);
    setShowStepPanel(true);
  };

  const handleEditStep = (step: IProcessStep): void => {
    setEditingStep(step);
    setShowStepPanel(true);
  };

  const handleCancelStep = (): void => {
    setShowStepPanel(false);
    setEditingStep(undefined);
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

      await loadProcessConfig();

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
      `Bạn có chắc muốn tắt bước "${step.Title}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(undefined);

      await adminProcessStepService.deactivateStep(step.Id);

      await loadProcessConfig();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);

      setError(message);
    }
  };
  //FieldConfig

  const handleCreateFieldConfig = (): void => {
    setEditingFieldConfig(undefined);
    setShowFieldConfigPanel(true);
  };
  const handleEditFieldConfig = (fieldConfig: IFieldConfig): void => {
    setEditingFieldConfig(fieldConfig);
    setShowFieldConfigPanel(true);
  };

  const handleCancelFieldConfig = (): void => {
    setShowFieldConfigPanel(false);
    setEditingFieldConfig(undefined);
  };
  const handleSaveFieldConfig = async (
    input: ICreateFieldConfigInput | IUpdateFieldConfigInput,
  ): Promise<void> => {
    try {
      setSavingFieldConfig(true);
      setError(undefined);

      if ("id" in input) {
        await adminFieldConfigService.updateFieldConfig(input);
      } else {
        await adminFieldConfigService.createFieldConfig(input);
      }

      await loadProcessConfig();

      setShowFieldConfigPanel(false);
      setEditingFieldConfig(undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);

      setError(message);
    } finally {
      setSavingFieldConfig(false);
    }
  };

  const handleDeactivateFieldConfig = async (
    fieldConfig: IFieldConfig,
  ): Promise<void> => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn tắt cấu hình trường "${fieldConfig.FieldDisplayName}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(undefined);

      await adminFieldConfigService.deactivateFieldConfig(fieldConfig.Id);

      await loadProcessConfig();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);

      setError(message);
    }
  };

  React.useEffect(() => {
    void loadProcessConfig();
  }, [loadProcessConfig]);

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        ← Quay lại danh sách quy trình
      </button>

      <section className={styles.headerSection}>
        <h2 className={styles.title}>
          Cấu hình quy trình
          {config?.process?.Title ? `: ${config.process.Title}` : ""}
        </h2>

        <p className={styles.subtitle}>
          Quản lý cấu hình chi tiết của quy trình.
        </p>
      </section>

      {error && (
        <section className={styles.panel}>
          <div className={styles.error}>{error}</div>
        </section>
      )}

      {loading && (
        <section className={styles.panel}>
          <div className={styles.info}>Đang tải cấu hình quy trình...</div>
        </section>
      )}

      {!loading && config && (
        <>
          <ProcessSummary process={config.process} />

          <ProcessStepsTable
            steps={config.steps}
            canCreateStep
            onCreateStep={handleCreateStep}
            onEditStep={handleEditStep}
            onDeactivateStep={handleDeactivateStep}
          />

          <FieldConfigsTable
            fieldConfigs={config.fieldConfigs}
            canCreate
            onCreate={handleCreateFieldConfig}
            onEdit={handleEditFieldConfig}
            onDeactivate={handleDeactivateFieldConfig}
          />
        </>
      )}
      <StepEditorPanel
        isOpen={showStepPanel}
        processId={processId}
        step={editingStep}
        saving={savingStep}
        onSearchUsers={handleSearchUsers}
        onSave={(input) => {
          void handleSaveStep(input);
        }}
        onCancel={handleCancelStep}
      />

      <FieldConfigEditorPanel
        isOpen={showFieldConfigPanel}
        processId={processId}
        fieldConfig={editingFieldConfig}
        steps={config?.steps ?? []}
        saving={savingFieldConfig}
        onSave={(input) => {
          void handleSaveFieldConfig(input);
        }}
        onCancel={handleCancelFieldConfig}
      />
    </div>
  );
};
