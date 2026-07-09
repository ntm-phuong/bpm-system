import { IFieldConfig, IProcess, IProcessStep } from "../../models";
import { AdminFieldConfigService } from "./AdminFieldConfigService";
import { AdminProcessService } from "./AdminProcessService";
import { AdminProcessStepService } from "./AdminProcessStepService";

export interface IAdminProcessConfig {
	process: IProcess;
	steps: IProcessStep[];
	fieldConfigs: IFieldConfig[];
}

export class AdminProcessConfigService {
	private _processService = new AdminProcessService();
	private _stepService = new AdminProcessStepService();
	private _fieldConfigService = new AdminFieldConfigService();

	async getProcesses(): Promise<IProcess[]> {
		return this._processService.getProcesses();
	}

	async getProcessConfig(processId: number): Promise<IAdminProcessConfig> {
		this._validateId(processId, "processId");

		const process = await this._processService.getProcessById(processId);
		if (!process) {
			throw new Error(`Không tìm thấy quy trình với id: ${processId}.`);
		}

		const [steps, fieldConfigs] = await Promise.all([
			this._stepService.getStepsByProcessId(processId),
			this._fieldConfigService.getFieldConfigsByProcessId(processId),
		]);

		return {
			process,
			steps,
			fieldConfigs,
		};
	}

	async reloadProcessConfig(processId: number): Promise<IAdminProcessConfig> {
		return this.getProcessConfig(processId);
	}

	private _validateId(id: number, fieldName: string): void {
		if (!Number.isFinite(id) || id <= 0) {
			throw new Error(`${fieldName} phải là số dương lớn hơn 0.`);
		}
	}
}
