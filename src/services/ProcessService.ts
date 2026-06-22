// src/services/ProcessService.ts
import { ProcessRepository } from '../repositories/ProcessRepository';
import {
  IProcess,
  IProcessStep,
  IFieldConfig,
} from '../models';

// ─── Output types ──────────────────────────────────────────

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

// ─── Service ───────────────────────────────────────────────

export class ProcessService {
  private _repo: ProcessRepository;

  constructor() {
    this._repo = new ProcessRepository();
  }

  // ═══════════════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════════════
  async getMenuItems(): Promise<IMenuItems[]> {
    try {
      const processes = await this._repo.getAllActive();
      return processes.map(p => ({
        processId: p.Id,
        processCode: p.ProcessCode,
        title: p.Title,
      }));
    } catch (e) {
      throw this._wrapError(e, 'getMenuItems');
    }
  }

  // ═══════════════════════════════════════════════════════
  // FORM CONFIG (Dành cho trang giao diện động)
  // ═══════════════════════════════════════════════════════
  async loadFormConfig(processId: number): Promise<IFormConfig> {
    try {
      const [process, steps, allFieldConfigs] = await Promise.all([
        this._repo.getById(processId),
        this._repo.getStepsByProcessId(processId),
        this._repo.getFieldConfigs(processId),
      ]);

      const data = { process, steps, allFieldConfigs };
      console.log('Dữ liệu nhận từ SharePoint:', data);

      if (!process) {
        throw new Error(`Không tìm thấy quy trình với Id: ${processId}`);
      }

      // ĐÃ SỬA: Dùng StepIDId thay vì StepId
      const commonFieldConfigs = allFieldConfigs.filter(f => !f.StepIDId);
      const fieldConfigsByStep: Record<number, IFieldConfig[]> = {};

      for (const step of steps) {
        // Lấy config riêng của bước này
        const stepSpecific = allFieldConfigs.filter(f => f.StepIDId === step.Id);

        // ĐÃ TỐI ƯU: Merge config riêng đè lên config chung bằng findIndex (ES6)
        const merged = [...commonFieldConfigs];
        for (const sc of stepSpecific) {
          const foundIndex = merged.findIndex(m => m.FieldInternalName === sc.FieldInternalName);
          
          if (foundIndex >= 0) {
            merged[foundIndex] = sc; // Ghi đè
          } else {
            merged.push(sc); // Thêm mới
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
      throw this._wrapError(e, 'loadFormConfig');
    }
  }

  // ═══════════════════════════════════════════════════════
  // STEP NAVIGATION — Dành cho LeaveService điều phối luồng
  // ═══════════════════════════════════════════════════════
  async getStepInfo(processId: number, stepOrder: number): Promise<IStepInfo> {
    try {
      const [currentStep, totalSteps] = await Promise.all([
        this._repo.getStepByOrder(processId, stepOrder),
        this._repo.countSteps(processId),
      ]);

      if (!currentStep) {
        throw new Error(`Không tìm thấy bước ${stepOrder} trong quy trình ${processId}`);
      }

      const isLastStep = stepOrder >= totalSteps;

      const nextStep = isLastStep 
        ? undefined 
        : (await this._repo.getStepByOrder(processId, stepOrder + 1)) ?? undefined;

      return { step: currentStep, isLastStep, nextStep };
    } catch (e) {
      throw this._wrapError(e, 'getStepInfo');
    }
  }

  async getFirstStepApprover(processId: number): Promise<IProcessStep> {
    try {
      const step = await this._repo.getStepByOrder(processId, 1);
      if (!step) {
        throw new Error(`Quy trình ${processId} chưa có bước nào được cấu hình`);
      }
      return step;
    } catch (e) {
      throw this._wrapError(e, 'getFirstStepApprover');
    }
  }

  // ─── Private ───────────────────────────────────────────
  private _wrapError(e: unknown, method: string): Error {
    const msg = e instanceof Error ? e.message : String(e);
    return new Error(`[ProcessService.${method}] ${msg}`);
  }
}