import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ComboboxOption {
    value: string;
    label: string;
    /** Optional secondary line shown under the label (e.g. SKU, branch code). */
    description?: string;
}

interface ComboboxProps {
    id?: string;
    options: ComboboxOption[];
    value: string | null | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
    /** Renders a pinned "+ Add …" row at the bottom of the list. */
    createAction?: {
        label: string;
        onSelect: () => void;
    };
    /** Called on every keystroke in the search box — lets a "+ Add" dialog pre-fill its name field. */
    onSearchChange?: (value: string) => void;
}

export function Combobox({
    id,
    options,
    value,
    onChange,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyText = 'No results found.',
    disabled = false,
    className,
    createAction,
    onSearchChange,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'border-input data-[placeholder]:text-muted-foreground h-9 w-full min-w-0 justify-between bg-transparent px-3 py-2 text-sm font-normal shadow-xs',
                        !selected && 'text-muted-foreground',
                        className,
                    )}
                >
                    <span className="truncate">{selected ? selected.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} onValueChange={onSearchChange} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.description ?? ''}`}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'size-4',
                                            option.value === value ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate">{option.label}</span>
                                        {option.description && (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        {createAction && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        value={`__create__${createAction.label}`}
                                        onSelect={() => {
                                            setOpen(false);
                                            createAction.onSelect();
                                        }}
                                        className="text-[var(--pos-teal,#00a79b)] font-medium"
                                    >
                                        <Plus className="size-4" />
                                        {createAction.label}
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
