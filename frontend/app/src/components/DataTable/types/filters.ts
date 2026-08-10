export interface UiFilterRow {
  id: string;
  column: string;
  operation: string;
  value: string;
}

export type FilterFieldType =
  | "string"
  | "number"
  | "boolean"
  | "datetime"
  | "choice";

export interface FilterChoice {
  value: string;
  label: string;
}

export interface FilterFieldDefinition {
  label: string;
  type: FilterFieldType;
  nullable?: boolean;
  choices?: readonly FilterChoice[];
}

export type FilterFieldRegistry = Record<string, FilterFieldDefinition>;
