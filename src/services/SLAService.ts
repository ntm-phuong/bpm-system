import { IProcessStep } from "../models";

export interface ISubmitSLAResult {
  ExpectedSLA: number;
  CurrentStepSLA: number;
  ActualSLA: number;
  CompleteSLA: "InProgress" | "OnTime" | "Overdue";
  SLAStartTime: string;
  SLAEndTime?: string;
}

export class SLAService {
  calculateSLAOnSubmit(
    steps: IProcessStep[],
    currentStepOrder: number,
    startTime: string = new Date().toISOString(),
  ): ISubmitSLAResult {
    const orderedSteps = [...steps].sort((a, b) => a.StepOrder - b.StepOrder);

    const currentStep = orderedSteps.find(
      (step) => step.StepOrder === currentStepOrder,
    );

    const expectedSLA = this._toSLAHours(
      // orderedSteps
      // 	.filter(step => step.StepOrder >= currentStepOrder)
      // 	.reduce((sum, step) => sum + this._toSLAHours(step.SLA_Hours), 0),
      orderedSteps.reduce(
        (sum, step) => sum + this._toSLAHours(step.SLA_Hours),
        0,
      ),
    );

    return {
      ExpectedSLA: expectedSLA,
      CurrentStepSLA: this._toSLAHours(currentStep?.SLA_Hours),
      ActualSLA: 0,
      CompleteSLA: "InProgress",
      SLAStartTime: startTime,
      SLAEndTime: undefined,
    };
  }

  private _toSLAHours(value?: number): number {
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      return 0;
    }

    return Math.round(value * 100) / 100;
  }
}
