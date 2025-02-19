import {
    type ShowContextMenuParams,
    type UseContextMenuParams,
    useContextMenu as useContexifyContextMenu,
} from 'react-contexify';

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> &
    Partial<Pick<Type, Key>>;

// The contexify library has a typing bug making type checking weaker than it could be
export function useContextMenu<ShowProps, UseProps = undefined>(
    params: UseContextMenuParams<UseProps>,
): {
    show: (
        params: MakeOptional<ShowContextMenuParams<ShowProps>, 'id'>,
    ) => void;
    hideAll: () => void;
} {
    return useContexifyContextMenu(params);
}
