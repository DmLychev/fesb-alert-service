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
      size="sm"
      cursor={disabled ? "not-allowed" : "pointer"}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={({ checked }) => onCheckedChange(checked === true)}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control cursor="inherit">
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox.Root>
  );
};

export default RowSelectionCheckbox;
