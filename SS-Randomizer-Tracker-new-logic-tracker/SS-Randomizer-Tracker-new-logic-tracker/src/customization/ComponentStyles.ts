import { type StylesConfig } from 'react-select';

export function selectStyles<IsMulti extends boolean, Option>(): StylesConfig<
    Option,
    IsMulti
> {
    return {
        control: (baseStyles, state) => ({
            ...baseStyles,
            color: 'var(--scheme-text)',
            backgroundColor: 'var(--scheme-background)',
            ...(state.isFocused
                ? {
                      boxShadow: '0 0 0 1px var(--scheme-interact)',
                      borderColor: 'var(--scheme-interact)',
                  }
                : undefined),
            '&:hover': {
                borderColor: 'var(--scheme-interact)',
            },
        }),
        menu: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: 'var(--scheme-background)',
            boxShadow:
                '0 0 0 1px color-mix(in srgb, var(--scheme-text) 20%, transparent), 0 4px 11px color-mix(in srgb, var(--scheme-text) 20%, transparent)',
        }),
        option: (baseStyles, state) => ({
            ...baseStyles,
            color: state.isFocused
                ? 'var(--scheme-interact-text)'
                : 'var(--scheme-text)',
            backgroundColor: state.isFocused
                ? 'var(--scheme-interact)'
                : 'var(--scheme-background)',
        }),
        singleValue: (baseStyles) => ({
            ...baseStyles,
            color: `color-mix(in srgb, var(--scheme-text) 90%, transparent)`,
        }),
    };
}
