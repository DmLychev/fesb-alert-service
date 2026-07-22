import { Checkbox } from "@chakra-ui/react";

interface RowSelectionCheckboxProps {
  checked: boolean | "indeterminate";
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const RowSelectionCheckbox = ({
  checked,
  disabled,
  onCheckedChange,
}: RowSelectionCheckboxProps) => {
  return (
    <Checkbox.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={({ checked }) => onCheckedChange(checked === true)}
      size="sm"
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox.Root>
  );
};

export default RowSelectionCheckbox;
