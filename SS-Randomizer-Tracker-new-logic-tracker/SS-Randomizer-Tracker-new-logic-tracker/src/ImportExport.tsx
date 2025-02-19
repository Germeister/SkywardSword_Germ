import { type ChangeEvent, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { RemoteReference } from './loader/LogicLoader';
import { type ThunkResult, useAppDispatch } from './store/Store';
import { type TrackerState, loadTracker } from './tracker/Slice';

const version = 'SSRANDO-TRACKER-NG-V2';

export interface ExportState {
    version: string;
    state: TrackerState;
    logicBranch: RemoteReference | undefined;
}

function doExport(): ThunkResult {
    return (_dispatch, getState) => {
        const state = getState().tracker;
        const logicBranch = getState().logic.loaded?.remote;

        const filename = `SS-Rando-Tracker${new Date().toISOString()}`;
        const exportVal: ExportState = { state, version, logicBranch };
        const exportstring = JSON.stringify(exportVal, undefined, '\t');
        const blob = new Blob([exportstring], { type: 'json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `${filename}.json`;
        a.href = url;
        a.dataset.downloadurl = ['json', a.download, a.href].join(':');
        a.click();
        window.URL.revokeObjectURL(url);
    };
}

export function ExportButton() {
    const dispatch = useAppDispatch();
    const onClick = useCallback(() => {
        dispatch(doExport());
    }, [dispatch]);

    return (
        <button type="button" className="tracker-button" onClick={onClick}>
            Export
        </button>
    );
}

export function ImportButton({
    setLogicBranch,
}: {
    setLogicBranch: (branch: RemoteReference) => void;
}) {
    const dispatch = useDispatch();

    const doImport = (text: string) => {
        const importVal = JSON.parse(text) as ExportState;
        if (importVal.version !== version) {
            window.alert(
                'This export was made with an incompatible version of the Tracker and cannot be imported here.',
            );
            return;
        }
        dispatch(loadTracker(importVal.state));
        if (importVal.logicBranch) {
            setLogicBranch(importVal.logicBranch);
        }
    };

    const readFile = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) {
            return;
        }
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (e) => {
            if (!e.target?.result) {
                return;
            }
            doImport(e.target.result as string);
        };
    };

    return (
        <>
            <label
                style={{ margin: 0, display: 'contents' }}
                htmlFor="importButton"
            >
                <div
                    className="tracker-button"
                    style={{
                        display: 'flex',
                        flexFlow: 'row',
                        alignItems: 'center',
                    }}
                >
                    Import Saved Run
                </div>
            </label>
            <input
                style={{ display: 'none' }}
                type="file"
                id="importButton"
                accept=".json"
                onChange={readFile}
            />
        </>
    );
}
