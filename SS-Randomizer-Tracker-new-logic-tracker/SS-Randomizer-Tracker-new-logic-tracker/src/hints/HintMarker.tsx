import { useState } from 'react';
import required from '../assets/Entrance.png';
import unknown from '../assets/hints/unknown.png';
import unrequired from '../assets/No_Entrance.png';
import keyDownWrapper from '../utils/KeyDownWrapper';

function HintMarker() {
    const [current, setCurrent] = useState(0);

    const images = [unknown, unrequired, required];
    const altTexts = ['Unknown', 'Not Required', 'Required'];
    const max = 2;

    const handleClick = () => {
        setCurrent((xCurrent) => (xCurrent < max ? xCurrent + 1 : 0));
    };

    return (
        <div
            onClick={handleClick}
            onKeyDown={keyDownWrapper(handleClick)}
            role="button"
            tabIndex={0}
            style={{ width: '100%' }}
        >
            <img
                src={images[current]}
                alt={altTexts[current]}
                style={{ width: '100%' }}
            />
        </div>
    );
}

export default HintMarker;
