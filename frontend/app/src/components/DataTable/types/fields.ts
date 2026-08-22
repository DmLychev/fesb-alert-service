import type { ReactNode } from "react";
import type { FilterFieldDefinition, FilterFieldRegistry } from "./filters";
import type { ColumnDef } from "@tanstack/react-table";
export type HeterogeneousColumnDef<TData> = ColumnDef<TData, any>;

export type EditableValue = string | number | boolean | null;

export interface EditableControlProps {
  value: EditableValue;
  disabled?: boolean;

  onChange: (value: EditableValue) => void;
}

export interface EditDefinition {
  control?: "input" | "textarea";

  renderEditor?: (props: EditableControlProps) => ReactNode;
}

export interface EditableFieldDefinition
  extends FilterFieldDefinition, EditDefinition {}

export type EditableFieldRegistry = Record<string, EditableFieldDefinition>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type RegistryColumnDef<TData> = DistributiveOmit<
  HeterogeneousColumnDef<TData>,
  "id" | "header" | "size" | "minSize"
>;

export interface TableFieldDefinition<TData> {
  label: string;
  defaultSize?: number;
  minSize?: number;
  column?: RegistryColumnDef<TData>;
  value?: Omit<FilterFieldDefinition, "label">;
  filter?: boolean;
  edit?: boolean | EditDefinition;
}

export type TableFieldRegistry<Tdata> = Record<
  string,
  TableFieldDefinition<Tdata>
>;

export interface TableDefinitions<Tdata> {
  columns: HeterogeneousColumnDef<Tdata>[];
  filterFields: FilterFieldRegistry;
  editableFields: EditableFieldRegistry;
}
