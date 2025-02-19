
import fs from 'node:fs';

const baseFileUrl = (/** @type {string} */ file) =>
    `https://raw.githubusercontent.com/ssrando/ssrando/main/${file}.yaml`;

const loadFile = async (/** @type {string} */ file) => {
    const fileUrl = baseFileUrl(file);
    const response = await fetch(fileUrl);
    const text = await response.text();
    await fs.promises.writeFile(`./testData/${file}.yaml`, text);
};

await Promise.all([
    loadFile('dump'),
    loadFile('options'),
]);
