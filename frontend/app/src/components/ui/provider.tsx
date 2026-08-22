"use client";

import {
  ChakraProvider,
  defaultSystem,
  LocaleProvider,
} from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <LocaleProvider locale="ru-RU">
        <ColorModeProvider {...props} />
      </LocaleProvider>
    </ChakraProvider>
  );
}
