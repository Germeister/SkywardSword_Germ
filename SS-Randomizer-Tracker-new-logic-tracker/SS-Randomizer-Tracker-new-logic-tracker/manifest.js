export default function (startUrl = '/') {
    return {
        short_name: 'SS Rando Tracker',
        name: 'Skyward Sword Randomizer Tracker',
        icons: [
            {
                src: 'favicon.ico',
                sizes: '64x64',
                type: 'image/x-icon',
                purpose: 'any',
            },
            {
                src: 'logo192.png',
                type: 'image/png',
                sizes: '192x192',
                purpose: 'any',
            },
            {
                src: 'logo192-maskable.png',
                type: 'image/png',
                sizes: '192x192',
                purpose: 'maskable',
            },
            {
                src: 'logo512.png',
                type: 'image/png',
                sizes: '512x512',
                purpose: 'any',
            },
        ],
        screenshots: [
            {
                src: 'preview-wide.png',
                sizes: '619x350',
                type: 'image/png',
                form_factor: 'wide',
                label: 'Map Tracker',
            },
            {
                src: 'preview-portrait.png',
                sizes: '429x777',
                type: 'image/png',
                label: 'Item Tracker',
            },
        ],
        start_url: startUrl,
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff',
    };
}
