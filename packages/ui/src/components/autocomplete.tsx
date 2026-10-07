"use client";

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { Input } from "./input";

type AutocompleteProps = {
  id: string;
  items: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
};

function Autocomplete({
  id,
  items,
  value,
  onValueChange,
  placeholder,
  maxLength,
  disabled,
}: AutocompleteProps) {
  return (
    <AutocompletePrimitive.Root
      items={items}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      openOnInputClick
    >
      <AutocompletePrimitive.Input
        id={id}
        placeholder={placeholder}
        maxLength={maxLength}
        render={<Input />}
      />
      <AutocompletePrimitive.Portal>
        <AutocompletePrimitive.Positioner
          sideOffset={4}
          align="start"
          className="z-50"
        >
          <AutocompletePrimitive.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
            <AutocompletePrimitive.List className="max-h-[min(16rem,var(--available-height))] overflow-y-auto p-1 empty:hidden">
              {(item: string) => (
                <AutocompletePrimitive.Item
                  key={item}
                  value={item}
                  className="cursor-default rounded-md px-2.5 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {item}
                </AutocompletePrimitive.Item>
              )}
            </AutocompletePrimitive.List>
          </AutocompletePrimitive.Popup>
        </AutocompletePrimitive.Positioner>
      </AutocompletePrimitive.Portal>
    </AutocompletePrimitive.Root>
  );
}

export { Autocomplete };
