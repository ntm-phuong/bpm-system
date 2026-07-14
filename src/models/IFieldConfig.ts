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
  FieldOptions?: string; // Stored as JSON string from SharePoint for dropdown options
  IsRequired: boolean;
  IsVisible: boolean;
  IsEditable: boolean;
}
 