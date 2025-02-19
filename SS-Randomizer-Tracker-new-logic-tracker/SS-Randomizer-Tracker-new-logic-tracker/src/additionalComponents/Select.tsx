import { useMemo } from 'react';
import ReactSelect, {
    type ActionMeta,
    type MultiValue,
    type SingleValue,
} from 'react-select';
import { selectStyles } from '../customization/ComponentStyles';

export interface SelectValue<T> {
    value: string;
    label: string;
    payload: T;
}

const resetValue = 'Select__Internal_RESET';

const matches = (name: string, searchString: string) => {
    if (!searchString) {
        return true;
    }
    const fragments = searchString.toLowerCase().split(' ');
    const lowerName = name.toLowerCase();
    return fragments.every((fragment) => lowerName.includes(fragment.trim()));
};

export function Select<T>({
    label,
    disabled = false,
    placeholder,
    selectedValue,
    options,
    onValueChange,
    searchable = false,
    clearable = false,
    id,
}: {
    label: string;
    disabled?: boolean;
    placeholder?: string;
    selectedValue: SelectValue<T> | undefined;
    options: SelectValue<T>[];
    onValueChange: (value: T | undefined) => void;
    searchable?: boolean;
    clearable?: boolean;
    id?: string;
}) {
    const actualOptions: SelectValue<T>[] = useMemo(() => {
        if (clearable && selectedValue) {
            return [
                {
                    value: resetValue,
                    label: 'Reset',
                    payload: undefined as unknown as T,
                },
                ...options,
            ];
        }
        return options;
    }, [clearable, options, selectedValue]);

    const onChange = (
        selectedOption: SingleValue<SelectValue<T>>,
        meta: ActionMeta<SelectValue<T>>,
    ) => {
        if (meta.action === 'select-option') {
            if (!selectedOption || selectedOption.value === resetValue) {
                onValueChange(undefined);
            } else {
                onValueChange(selectedOption.payload);
            }
        }
    };
    return (
        <ReactSelect
            styles={selectStyles<false, SelectValue<T>>()}
            isDisabled={disabled}
            isSearchable={searchable}
            options={actualOptions}
            value={selectedValue}
            filterOption={(option, search) =>
                matches(option.data.label.toLowerCase(), search.toLowerCase())
            }
            aria-label={label}
            id={id}
            placeholder={placeholder}
            onChange={onChange}
        />
    );
}

export function MultiSelect<T>({
    label,
    disabled,
    placeholder,
    selectedValue,
    options,
    onValueChange,
    searchable,
    clearable,
    id,
}: {
    label: string;
    disabled?: boolean;
    placeholder?: string;
    selectedValue: SelectValue<T>[];
    options: SelectValue<T>[];
    onValueChange: (value: T[]) => void;
    searchable?: boolean;
    clearable?: boolean;
    id?: string;
}) {
    const onChange = (
        selectedOption: MultiValue<SelectValue<T>>,
        meta: ActionMeta<SelectValue<T>>,
    ) => {
        if (meta.action === 'select-option' || meta.action === 'remove-value') {
            onValueChange(selectedOption.map((v) => v.payload));
        } else if (meta.action === 'clear') {
            onValueChange([]);
        }
    };
    return (
        <ReactSelect
            styles={selectStyles<true, SelectValue<T>>()}
            isMulti={true}
            isDisabled={disabled}
            isSearchable={searchable}
            options={options}
            value={selectedValue}
            filterOption={(option, search) =>
                matches(option.data.label.toLowerCase(), search.toLowerCase())
            }
            aria-label={label}
            id={id}
            placeholder={placeholder}
            onChange={onChange}
            isClearable={clearable}
        />
    );
}
