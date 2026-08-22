import type { InputProps } from "@chakra-ui/react";
import {
  Box,
  Field,
  Input,
  defineStyle,
  useControllableState,
} from "@chakra-ui/react";
import { useState, type FocusEvent } from "react";
import { PasswordInput } from "./ui/password-input";

interface FloatingLabelInputProps extends InputProps {
  type?: string;
  label: React.ReactNode;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
}

const FloatingLabelInput = (props: FloatingLabelInputProps) => {
  const {
    label,
    onValueChange,
    value,
    defaultValue = "",
    type,
    ...rest
  } = props;

  const [inputState, setInputState] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value,
  });

  const [focused, setFocused] = useState(false);
  const shouldFloat = inputState.length > 0 || focused;

  const eventInterceptors = {
    onFocus: (event: FocusEvent<HTMLInputElement>) => {
      props.onFocus?.(event);
      setFocused(true);
    },
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      props.onBlur?.(event);
      setFocused(false);
    },
    onChange: (event: FocusEvent<HTMLInputElement>) => {
      props.onChange?.(event);
      setInputState(event.target.value);
    },
    value: inputState,
    "data-float": shouldFloat || undefined,
  };

  return (
    <Box pos="relative" w="full">
      {type === "password" ? (
        <PasswordInput {...rest} {...eventInterceptors} />
      ) : (
        <Input type={type} {...rest} {...eventInterceptors} />
      )}

      <Field.Label css={floatingStyles} data-float={shouldFloat || undefined}>
        {label}
      </Field.Label>
    </Box>
  );
};

const floatingStyles = defineStyle({
  pos: "absolute",
  bg: "bg",
  px: "0.5",
  top: "2.5",
  insetStart: "3",
  fontWeight: "normal",
  pointerEvents: "none",
  transition: "position",
  color: "fg.muted",
  "&[data-float]": {
    top: "-3",
    insetStart: "2",
    color: "fg",
  },
});

export default FloatingLabelInput;
