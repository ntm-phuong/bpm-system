import { ProcessRepository } from "../repositories/ProcessRepository";
import {
  IProcess,
  IProcessStep,
  IFieldConfig,
} from "../models";

export interface IMenuItems {
  processId: number;
  processCode: string;
  title: string;
}

export interface IFormConfig {
  process: IProcess;
  steps: IProcessStep[];
  fieldConfigsByStep: Record<number, IFieldConfig[]>;
  commonFieldConfigs: IFieldConfig[];
  totalSteps: number;
}

export interface IStepInfo {
  step: IProcessStep;
  isLastStep: boolean;
  nextStep?: IProcessStep;
}

export class ProcessService {
  private _repo: ProcessRepository;

  constructor() {
    this._repo = new ProcessRepository();
  }

  async getMenuItems(): Promise<IMenuItems[]> {
    try {
      const processes = await this._repo.getAllActive();

      return processes.map(p => ({
        processId: p.Id,
        processCode: p.ProcessCode,
        title: p.Title,
      }));
    } catch (e) {
      throw this._wrapError(e, "getMenuItems");
    }
  }

  async loadFormConfig(processId: number): Promise<IFormConfig> {
    try {
      const [process, steps, allFieldConfigs] = await Promise.all([
        this._repo.getById(processId),
        this._repo.getStepsByProcessId(processId),
        this._repo.getFieldConfigs(processId),
      ]);

      if (!process) {
        throw new Error(`Không tìm thấy quy trình với Id: ${processId}`);
      }

      const commonFieldConfigs = allFieldConfigs.filter(f => !f.StepIDId);
      const fieldConfigsByStep: Record<number, IFieldConfig[]> = {};

      for (const step of steps) {
        const stepSpecific = allFieldConfigs.filter(
          f => f.StepIDId === step.Id
        );

        const merged = [...commonFieldConfigs];

        for (const sc of stepSpecific) {
          const foundIndex = merged.findIndex(
            m => m.FieldInternalName === sc.FieldInternalName
          );

          if (foundIndex >= 0) {
            merged[foundIndex] = sc;
          } else {
            merged.push(sc);
          }
        }

        fieldConfigsByStep[step.Id] = merged.filter(f => f.IsVisible);
      }

      return {
        process,
        steps,
        fieldConfigsByStep,
        commonFieldConfigs: commonFieldConfigs.filter(f => f.IsVisible),
        totalSteps: steps.length,
      };
    } catch (e) {
      throw this._wrapError(e, "loadFormConfig");
    }
  }

  async getStepsByProcessId(processId: number): Promise<IProcessStep[]> {
    try {
      return await this._repo.getStepsByProcessId(processId);
    } catch (e) {
      throw this._wrapError(e, "getStepsByProcessId");
    }
  }

  async getStepInfo(
    processId: number,
    stepOrder: number
  ): Promise<IStepInfo> {
    try {
      const steps = await this._repo.getStepsByProcessId(processId);

      const currentStep = steps.find(
        step => step.StepOrder === stepOrder
      );

      if (!currentStep) {
        throw new Error(
          `Không tìm thấy bước ${stepOrder} trong quy trình ${processId}`
        );
      }

      const nextStep = steps.find(
        step => step.StepOrder > stepOrder
      );

      return {
        step: currentStep,
        isLastStep: !nextStep,
        nextStep,
      };
    } catch (e) {
      throw this._wrapError(e, "getStepInfo");
    }
  }

  async getNextStep(
    processId: number,
    currentStepOrder: number
  ): Promise<IProcessStep | undefined> {
    try {
      const steps = await this._repo.getStepsByProcessId(processId);

      return steps.find(step => step.StepOrder > currentStepOrder);
    } catch (e) {
      throw this._wrapError(e, "getNextStep");
    }
  }

  private _wrapError(e: unknown, method: string): Error {
    const msg = e instanceof Error ? e.message : String(e);
    return new Error(`[ProcessService.${method}] ${msg}`);
  }
}