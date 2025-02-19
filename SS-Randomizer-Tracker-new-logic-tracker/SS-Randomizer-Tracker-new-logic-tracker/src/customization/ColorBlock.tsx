import SketchPicker from '@uiw/react-color-sketch';
import { debounce } from 'es-toolkit';
import { useState } from 'react';
import styles from './ColorBlock.module.css';
import type { ColorScheme } from './ColorScheme';

export default function ColorBlock({
    colorName,
    colorScheme,
    schemeKey,
    updateColorScheme,
}: {
    colorName: string;
    schemeKey: keyof ColorScheme;
    colorScheme: ColorScheme;
    updateColorScheme: (scheme: ColorScheme) => void;
}) {
    const [showPicker, setShowPicker] = useState(false);
    const debouncedUpdate = debounce(updateColorScheme, 200);
    return (
        <>
            <div className={styles.colorBlock}>
                <div>{colorName}</div>
                <div
                    className={styles.color}
                    style={{
                        background: colorScheme[schemeKey],
                        border: '2px solid var(--scheme-text)',
                    }}
                    onClick={() => setShowPicker((prevState) => !prevState)}
                />
            </div>
            {showPicker && (
                <div>
                    <SketchPicker
                        color={colorScheme[schemeKey]}
                        onChange={(color) => {
                            const newScheme: ColorScheme = {
                                ...colorScheme,
                                [schemeKey]: color.hex,
                            };
                            debouncedUpdate(newScheme);
                        }}
                        disableAlpha
                        presetColors={[
                            '#FFFFFF',
                            '#00FFFF',
                            '#FF00FF',
                            '#FFFF00',
                            '#FF0000',
                            '#00FF00',
                            '#0000FF',
                        ]}
                    />
                </div>
            )}
        </>
    );
}
