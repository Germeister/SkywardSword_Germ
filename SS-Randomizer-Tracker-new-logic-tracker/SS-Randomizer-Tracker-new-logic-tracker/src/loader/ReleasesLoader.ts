import { memoize } from 'es-toolkit';
import { useSyncExternalStore } from 'react';
import { dedupePromise } from '../utils/Promises';

/*
 * This module implements a small GitHub releases API caching layer.
 * GitHub's REST API has a very low rate limit (60/hour/IP address),
 * if unauthenticated, which is shared across all requests behind that
 * IP address. This is not hugely problematic for a single app in isolation,
 * but If Everybody Did This nobody could reliably get GH release information.
 * As a result, we try very hard to make as few requests as possible:
 *   * Not make more than 1 request/hour
 *   * Store response in localstorage
 */

const ONE_HOUR = 1000 * 60 * 60;

const listeners: Set<() => void> = new Set();

function subscribe(callback: () => void) {
    listeners.add(callback);
    // Intentionally dangling promise here - ideally
    // we would regularly re-check but that seems overkill
    void checkForUpdates();
    return () => listeners.delete(callback);
}

function notify() {
    for (const cb of listeners.keys()) {
        cb();
    }
}

/**
 * Asynchronously fetch the latest GitHub releases, in a convenient
 * hook that returns undefined or cached results until results are ready.
 */
export function useReleases() {
    return useSyncExternalStore(subscribe, getStoredData);
}

function getStoredRelease(): {
    isOutdated: boolean;
    releases: string[] | undefined;
} {
    const storedTime = localStorage.getItem('githubReleasesDataTime');
    if (storedTime !== null) {
        const lastFetch = parseInt(storedTime, 10);
        const storedReleases = localStorage.getItem('githubReleasesData');
        if (storedReleases !== null) {
            const isOutdated = !lastFetch || lastFetch + ONE_HOUR < Date.now();
            const releases = JSON.parse(storedReleases) as string[];
            return { releases, isOutdated };
        }
    }

    return { releases: undefined, isOutdated: true };
}

/**
 * React expects stores to return memoized objects
 */
const mapReleases = memoize(
    (releases: string[]) => ({
        latest: releases[0],
        releases,
    }),
    { getCacheKey: (x) => JSON.stringify(x) },
);

function getStoredData() {
    const { releases } = getStoredRelease();
    return releases && mapReleases(releases);
}

/**
 * Get the latest release. Tries to fetch, so this will always
 * either return the latest release or throw an error.
 */
export async function getLatestRelease() {
    const { releases, isOutdated } = getStoredRelease();
    if (releases && !isOutdated) {
        return releases[0];
    }

    return (await fetchGithubReleases())[0];
}

async function checkForUpdates() {
    const { isOutdated } = getStoredRelease();
    if (isOutdated) {
        await fetchGithubReleases();
    }
}

interface GithubRelease {
    tag_name: string;
}

const fetchGithubReleases = dedupePromise(async () => {
    const response = await fetch(
        'https://api.github.com/repos/ssrando/ssrando/releases',
    );
    if (response.status !== 200) {
        throw new Error('Unknown error: ' + (await response.text()));
    }
    // drop excess data
    const data: string[] = ((await response.json()) as GithubRelease[]).map(
        (release) => release['tag_name'],
    );
    localStorage.setItem('githubReleasesData', JSON.stringify(data));
    localStorage.setItem('githubReleasesDataTime', Date.now().toString(10));
    notify();

    return data;
});
