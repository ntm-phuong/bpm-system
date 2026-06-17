import { FieldType } from "../constants/enums";

export interface IFieldConfig {
  Id: number;
  Title: string;
  ProcessIDId: number;
  StepIDId?: number;
  ProcessCode?: string;
  ComponentType?: string;
  FieldInternalName: string;
  FieldDisplayName: string;
  FieldType: FieldType;
  FieldOptions: string; // JSON string for options (e.g., for dropdowns)
  IsRequired: boolean;
  IsVisible: boolean;
  IsEditable: boolean;
}
 