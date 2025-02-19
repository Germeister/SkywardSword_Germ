import {
    RouterProvider,
    createRootRoute,
    createRoute,
    createRouter,
} from '@tanstack/react-router';
import { useLayoutEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useStore } from 'react-redux';
import type { ColorScheme } from './customization/ColorScheme';
import { colorSchemeSelector } from './customization/Selectors';
import ErrorPage from './miscPages/ErrorPage';
import FullAcknowledgement from './miscPages/FullAcknowledgement';
import Guide from './miscPages/guide/Guide';
import Options from './options/Options';
import type { RootState } from './store/Store';
import Tracker from './Tracker';

const rootRoute = createRootRoute();

const optionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Options,
});

const acknowledgementsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'acknowledgement',
    component: FullAcknowledgement,
});

const guideRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'guide',
    component: Guide,
});

const trackerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'tracker',
    component: Tracker,
});

const routeTree = rootRoute.addChildren([
    optionsRoute,
    acknowledgementsRoute,
    guideRoute,
    trackerRoute,
]);

const router = createRouter({
    routeTree,
    // This breaks some interactions, e.g.:
    // * Open /guide
    // * Click a table of contents entry
    // * -> scroll, OK
    // * navigate back
    // * -> no scroll, not OK
    // so turning it off for now
    // scrollRestoration: true,
    // scrollRestorationBehavior: 'instant',
});

function createApplyColorSchemeListener() {
    let prevScheme: ColorScheme | undefined = undefined;
    return (colorScheme: ColorScheme) => {
        if (colorScheme === prevScheme) {
            return;
        }
        prevScheme = colorScheme;
        const html = document.querySelector('html')!;
        Object.entries(colorScheme).forEach(([key, val]) => {
            html.style.setProperty(`--scheme-${key}`, val.toString());
        });

        // https://stackoverflow.com/a/33890907
        function getContrastColor(r: number, g: number, b: number) {
            const brightness = r * 0.299 + g * 0.587 + b * 0.114;
            // Comments suggest 150 works better than 186 for some reason
            return brightness > 150 ? '#000000' : '#FFFFFF';
        }

        const interactColor = colorScheme.interact.slice(1);
        const [r, g, b] = [0, 2, 4].map((offset) =>
            parseInt(interactColor.slice(offset, offset + 2), 16),
        );
        html.style.setProperty(
            `--scheme-interact-text`,
            getContrastColor(r, g, b),
        );
    };
}

function App() {
    const store = useStore<RootState>();
    useLayoutEffect(() => {
        const listener = createApplyColorSchemeListener();
        listener(colorSchemeSelector(store.getState()));
        return store.subscribe(() =>
            listener(colorSchemeSelector(store.getState())),
        );
    }, [store]);

    return (
        <ErrorBoundary FallbackComponent={ErrorPage}>
            <RouterProvider basepath={$PUBLIC_URL} router={router} />
        </ErrorBoundary>
    );
}

export default App;
