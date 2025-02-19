import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import DiscordButton from '../../additionalComponents/DiscordButton';
import Tooltip, { FakeTooltip } from '../../additionalComponents/Tooltip';
import CustomizationModal from '../../customization/CustomizationModal';
import { BasicItem } from '../../itemTracker/BasicItem';
import images from '../../itemTracker/Images';
import RequirementsTooltip from '../../locationTracker/RequirementsTooltip';
import type { RootTooltipExpression } from '../../tooltips/TooltipExpression';
import styles from './Guide.module.css';
import {
    exampleTooltip,
    impossibleTooltip,
    semiLogicTooltip,
    trickLogicTooltip,
} from './GuideTooltips';

export default function Guide() {
    return (
        <div className={styles.guidePage}>
            <div className={styles.guideContent}>
                <Heading level={1}>User Guide</Heading>
                <Section>
                    <p>
                        Welcome to the Skyward Sword Randomizer Tracker User
                        Guide. This page documents all features of the tracker
                        and contains useful information for effective tracker
                        usage. Have a question that isn't answered by this
                        guide? Drop by on the Skyward Sword Randomizer Discord{' '}
                        <DiscordButton /> and ask for help there!
                    </p>

                    <p>
                        <Link to="/">← Options</Link>
                    </p>
                </Section>
                <Heading level={2}>Table of Contents</Heading>
                <Section>
                    <ul>
                        <li>
                            <a href="#why-use-tracker">Why use a Tracker?</a>
                        </li>
                        <li>
                            <a href="#your-first-seed">Your First Seed</a>
                        </li>
                        <li>
                            <a href="#tracker-features">Tracker Features</a>
                        </li>
                        <ul>
                            <li>
                                <a href="#options">Options</a>
                            </li>
                            <li>
                                <a href="#customization">Customization</a>
                            </li>
                            <li>
                                <a href="#saving-loading">Saving and Loading</a>
                            </li>
                            <li>
                                <a href="#item-tracking">Item Tracking</a>
                            </li>
                            <li>
                                <a href="#dungeon-tracking">Dungeon Tracking</a>
                            </li>
                            <li>
                                <a href="#location-tracking">
                                    Location Tracking
                                </a>
                            </li>
                            <li>
                                <a href="#entrance-tracking">
                                    Entrance Tracking
                                </a>
                            </li>
                            <li>
                                <a href="#hint-tracking">Hint Tracking</a>
                            </li>
                            <li>
                                <a href="#semilogic-tricklogic">
                                    Semi-Logic and Trick Logic
                                </a>
                            </li>
                        </ul>
                        <li>
                            <a href="#frequently-asked-questions">
                                Frequently Asked Questions
                            </a>
                        </li>
                        <ul>
                            <li>
                                <a href="#sphere-tracking">
                                    Is Sphere Tracking supported?
                                </a>
                            </li>
                        </ul>
                    </ul>
                </Section>
                <Heading level={2} id="why-use-tracker">
                    Why use a Tracker?
                </Heading>
                <Section>
                    A tracker allows you to, well, track everything that
                    happened in your seed:
                    <ul>
                        <li>
                            You can mark your collected <b>Items</b> so that you
                            always have an overview over your current inventory.
                        </li>
                        <li>
                            You can mark your collected <b>Checks</b> so that
                            you never miss or double-check a location.
                        </li>
                        <li>
                            The <b>Logic Integration</b> allows the tracker to
                            always show you exactly which checks are currently
                            reachable, so that you can optimize your routing.
                        </li>
                        <li>
                            With the <b>Settings Integration</b>, the tracker
                            will always show you only those things that are
                            relevant in your current settings — nothing less,
                            nothing more.
                        </li>
                        <li>
                            Its advanced <b>Requirement Tooltips</b> can answer
                            pretty much every question you could ever have about
                            randomizer logic and how it changes with settings
                            and randomized entrances.
                        </li>
                    </ul>
                    Plenty of players do not use a tracker, or do not use every
                    feature of this tracker. However, experience has shown that
                    this tracker is great for first-time players, or players who
                    try out unfamiliar settings, and many of them will keep
                    using it for all of the aforementioned benefits.
                </Section>
                <Heading level={2} id="your-first-seed">
                    Your First Seed
                </Heading>
                <Section>
                    TODO expand this
                    <ol>
                        <li>Enter your starting location</li>
                        <li>Ask Fi for your required dungeons and mark them</li>
                        <li>Ask Fi for hints (if any) and act on them</li>
                        <li>Enter a randomized starting item (if any)</li>
                    </ol>
                </Section>
                <Heading level={2} id="tracker-features">
                    Tracker Features
                </Heading>
                <Heading level={3} id="options">
                    Options
                </Heading>
                <Section>
                    <p>
                        The <b>Options</b> screen is the landing page of the
                        tracker. Here you can configure your run so that the
                        tracker knows which Randomizer version you are using,
                        which logical rules apply, and which settings you've
                        chosen.
                    </p>
                    <p>
                        The <b>Releases</b> dropdown allows you to choose your
                        Randomizer version. The Randomizer window will typically
                        include a version number, which is the version that you
                        need to select in the dropdown. Participants in racing
                        matches may instead be using a special "Racing Build",
                        which can also be selected in this dropdown.
                    </p>
                    <p>
                        If you are testing a special beta features build, the{' '}
                        <b>Beta Feature</b> tab may instead be used. Ask the
                        provider of this build for instructions on setting up
                        the tracker.
                    </p>
                    <p>
                        After you selected the correct Randomizer release, you
                        can paste the <b>Settings String</b> that you acquired
                        from the Randomizer. This will transfer all settings
                        from the randomizer{' '}
                        <i>
                            as long as you selected the correct Randomizer
                            release
                        </i>
                        . Settings strings are version-specific, a settings
                        string from a different Randomizer version will result
                        in wrong settings and starting items.
                    </p>
                    <p>
                        As an alternative to the settings string, you can also
                        save and load <b>Presets</b> using the button of the
                        same name. In addition to any presets created by you in
                        the Tracker application, official Randomizer presets are
                        offered. For example, an official Racing release may
                        include an official Racing preset.
                    </p>
                    <p>
                        You should not need to change the <b>Settings</b> below
                        much — after all, you already should have the correct
                        settings due to the settings string or preset. You can
                        however inspect the settings for correctness or change
                        settings for experimentation purposes. The tracker
                        supports all options listed there, but only logically
                        relevant options are included — cosmetic options are
                        excluded, for example.
                    </p>
                </Section>
                <Heading level={3} id="customization">
                    Customization
                </Heading>
                <Section>
                    <p>
                        The tracker features an extensive customization menu,
                        which you can access using the <b>Customization</b>{' '}
                        button at the bottom of the main tracker screen. Many
                        options will be explained in the relevant section of
                        this guide.
                    </p>
                    <p>
                        <GuideCustomization />
                    </p>
                    <p>
                        Here is also where you can customize almost all colors
                        in this tracker to your liking. For content creators, we
                        recommend using <b>Dark Mode</b> along with a Chroma Key
                        on your capture window(s) in order to capture the
                        tracker without a background.
                    </p>
                </Section>
                <Heading level={3} id="saving-loading">
                    Saving and Loading
                </Heading>
                <Section>
                    <p>
                        The tracker will automatically save your progress and
                        reload it the next time you open it. Note that after
                        re-opening the tracker, you will be redirected to the
                        Options page, where you can choose to <b>Continue</b>{' '}
                        your saved run. If you'd like to start a new run, click{' '}
                        <b>Launch New Tracker</b> instead; this will discard all
                        saved progress.
                    </p>
                    <p>
                        On the main tracker screen, you can also <b>Export</b>{' '}
                        your progress to a save file, which you can import on
                        the Options screen by choosing <b>Import Saved Run</b>.
                    </p>
                </Section>
                <Heading level={3} id="item-tracking">
                    Item Tracking
                </Heading>
                <Section>
                    <p>
                        The tracker will start with any fixed starting items
                        already marked. Left-clicking an unmarked item will mark
                        it as collected; left-clicking a progressive item (such
                        as the Beetle, of which there are up to four in the item
                        pool) adds one copy. Right-clicking an item will reduce
                        its count or unmark it. Note that the Dungeon Tracker
                        also includes various dungeon-related items.
                    </p>
                    <GuideItem />
                    <p>
                        In the <b>Item Tracker Settings</b> customization option
                        you can switch between an <b>In-Game Inventory</b> with
                        a layout similar to the game's pause menu, and the{' '}
                        <b>Grid Layout</b> that arranges items in a plain grid
                        without any background.
                    </p>
                    <p>
                        The <b>Track Tim</b> customization option adds Tim the
                        Tumbleweed, the tracker's mascot and the community's
                        beloved junk item, to the Item Tracker. This item never
                        unlocks anything; the option is provided purely as fan
                        service.
                    </p>
                </Section>
                <Heading level={3} id="dungeon-tracking">
                    Dungeon Tracking
                </Heading>
                <Section>
                    <p>
                        The <b>Dungeon Tracker</b> allows you to mark dungeons
                        as required, shows the completion status of each
                        dungeon, and allows you to track some dungeon-related
                        items. The game's six main dungeons along with their
                        abbreviations are:
                    </p>
                    <ul>
                        <li>Skyview Temple (SV)</li>
                        <li>Earth Temple (ET)</li>
                        <li>Lanayru Mining Facility (LMF)</li>
                        <li>Ancient Cistern (AC)</li>
                        <li>Sandship (SSH)</li>
                        <li>Fire Sanctuary (FS)</li>
                    </ul>
                    <p>
                        Additionally, Sky Keep (SK) can appear in the dungeon
                        tracker if your settings may require you to visit Sky
                        Keep or at least enter the Sky Keep Entrance in Skyloft,
                        but Sky Keep cannot be required like the other dungeons.
                    </p>
                    <p>
                        Left-clicking a dungeon label marks the dungeon as{' '}
                        <b>Required</b>, while right-clicking selects the
                        dungeon in the Location Tracker. A dungeon label will
                        have a strikethrough visualization if you marked the
                        dungeon's "completion check" as acquired; this is what
                        the Randomizer checks for when deciding whether to open
                        the door to Hylia's Realm and thus the Randomizer's end
                        game.
                    </p>
                </Section>
                <Heading level={3} id="location-tracking">
                    Location Tracking
                </Heading>
                <Section>
                    <p>
                        Unsure where a certain location is? You can find all
                        locations in the{' '}
                        <a
                            rel="noreferrer noopener"
                            target="_blank"
                            href="https://docs.google.com/document/d/1F8AmQccCvtblnRhw_kEAVTME_xX1-O_9Ln16TVDPx6w/view"
                        >
                            Skyward Sword Randomizer Location Guide
                        </a>
                        !
                    </p>
                    <p>
                        The location tracker allows you to mark locations (or
                        "checks") as acquired, displays each location's logical
                        state given your currently marked items, and shows item
                        requirements for access to each check.
                    </p>
                    <p>
                        Locations are grouped by their <b>Hint Region</b>. The{' '}
                        <b>Map Layout</b> displays regions on a map, while the{' '}
                        <b>List Layout</b> arranges all regions in a flat list.
                        We recommend the map layout, but the legacy list layout
                        can be enabled in the customization menu.
                    </p>
                    <p>
                        Note that only logically relevant locations are
                        displayed — locations excluded by current settings are
                        hidden. If <b>Empty Unrequired Dungeons</b> is enabled
                        and you haven't marked any dungeons as required, those
                        dungeons won't display any checks, so make sure to mark
                        your required dungeons.
                    </p>
                    <p>
                        Locations will be displayed in different colors
                        depending on the logical state (note that colors can be
                        customized; these are default colors):
                    </p>
                    <ul>
                        <li>
                            <b>Red:</b> Out of Logic, the randomizer logic does
                            not consider this location accessible with your
                            current items.
                        </li>
                        <li>
                            <b>Orange:</b> Semi-Logic, see below
                        </li>
                        <li>
                            <b>Green:</b> Trick Logic, see below
                        </li>
                        <li>
                            <b>Blue:</b> In-logic, the randomizer logic
                            considers this location accessible with your current
                            items.
                        </li>
                    </ul>
                    <p>
                        Note that you might be able to access some locations
                        even if the tracker shows them as Out of Logic. This can
                        have technical reasons or balance reasons — the
                        randomizer's logic framework has limits regarding the
                        kinds of logic that can be expressed, so dungeon key
                        logic may be overly pessimistic. Other locations can be
                        reached with tricks that the randomizer does not enable
                        by default so as to make seeds not overly difficult for
                        players.
                    </p>
                    <p>
                        Hovering over a location shows a{' '}
                        <b>Requirements Tooltip</b> that shows exact
                        prerequisites for the location's access logic in form of
                        a boolean expression. Prerequisites can be items, wallet
                        capacity, gratitude crystals, tricks and goddess cubes.
                        These requirements are dynamically computed from the
                        world graph, so a location may show{' '}
                        <b>Impossible (discover an entrance first)</b> if the
                        tracker can't find any set of items that will give you
                        access to this location; this is typically due to an
                        entrance you haven't tracked. Marking additional
                        entrances may change prior locations' requirements too.
                    </p>
                    <div className={styles.guideTooltipsRow}>
                        <GuideTooltip requirements={exampleTooltip} />
                        <GuideTooltip requirements={impossibleTooltip} />
                    </div>
                    <p>
                        Left-clicking an unmarked location marks it as collected
                        (strikethrough), while left-clicking a marked location
                        unmarks it. Right-clicking on the region marker (map
                        layout only) or the region name opens a context menu
                        where you can mark all locations (or all locations in
                        logic) with a single action.
                    </p>
                    <p>
                        The locations list may include regular checks (can
                        contain mostly any item), loose gratitude crystals
                        (contain a single gratitude crystal), Gossip Stones (may
                        contain a hint), and goddess cubes (unlock a goddess
                        chest in the Sky). Only regular checks count towards
                        counters. Loose gratitude crystals are shown for marking
                        even if logically excluded, but the fact that they are
                        logically excluded will be highlighted.
                    </p>
                </Section>
                <Heading level={3} id="entrance-tracking">
                    Entrance Tracking
                </Heading>
                <Section>
                    <p>
                        If <b>Entrance Randomization</b> settings like{' '}
                        <b>Random Starting Spawn</b>,{' '}
                        <b>Dungeon Entrance Randomizer</b> or{' '}
                        <b>Random Starting Statues</b> are enabled, you need to
                        inform the tracker how these exits and entrances connect
                        so that it can compute logical state and requirement
                        tooltips.
                    </p>
                    <p>
                        Regions that have an <b>Exit</b> will display those
                        exits at the bottom of the locations list. Clicking an
                        unassigned exit opens a list of eligible{' '}
                        <b>Entrances</b>. You can always click an assigned exit
                        to reassign or reset the entrance.
                    </p>
                    <p>
                        On the world map, certain mouse shortcuts can open the
                        entrances list for a given exit. For example,
                        right-clicking an unassigned exit to a dungeon opens the
                        dungeon entrances list (analogously for Silent Realms),
                        while (with Random Starting Statues) right-clicking a
                        province marker on the sky map opens that province's
                        list of statues.
                    </p>
                </Section>
                <Heading level={3} id="hint-tracking">
                    Hint Tracking
                </Heading>
                <Section>
                    <p>
                        Depending on your <b>Hint Distribution</b>, Fi and/or
                        Gossip Stones may give you hints. The types of hints and
                        their rules are explained in detail in the{' '}
                        <a
                            rel="noreferrer noopener"
                            target="_blank"
                            href="https://docs.google.com/document/d/197EDWKE3HWtx_uYhF44_Iv2xSzY2B9pjUtejvvbNRWs/view"
                        >
                            Skyward Sword Randomizer Hints Guide
                        </a>
                        . This section covers how hints can be recorded in the
                        tracker.
                    </p>
                    <p>
                        <b>Spirit of the Sword</b> (SOTS) and <b>Barren</b>{' '}
                        hints can be recorded by right-clicking a region marker
                        (map layout only) or a region name and choosing the
                        relevant option.
                    </p>
                    <p>
                        <b>Imprecise item hints</b> and <b>boss path hints</b>{' '}
                        can be added the same way. Alternatively, you can drag
                        and drop a dungeon label to assign a path hint, and drag
                        and drop an item to assign an imprecise item hint.
                    </p>
                    <p>
                        <b>Location hints</b> and <b>precise item hints</b> can
                        be assigned by right-clicking a location and choosing
                        the item. Alternatively, you can drag and drop an item
                        onto a location to mark the location as containing that
                        item.
                    </p>
                    <p>
                        Dragging and item and dropping it onto the location you
                        found it in can be useful for tracking whether you found
                        the the location an SOTS hint, an imprecise item hint or
                        a path hint might have referred to.
                    </p>
                    <p>
                        The customization option{' '}
                        <b>Assign items to locations while tracking</b> allows
                        you to automatically record that a collected check held
                        a particular item. To do this, you need to first mark a
                        location and then click the item you found there.
                    </p>
                    <p>
                        Finally, there is a text area for plain text where you
                        can record hints in whatever arcane syntax is convenient
                        for you.
                    </p>
                </Section>
                <Heading level={3} id="semilogic-tricklogic">
                    Semi-Logic and Trick Logic
                </Heading>
                <Section>
                    <p>
                        Certain locations may appear in an orange color (or
                        another color if the color was customized). This
                        indicates <b>semi-logic</b>: The location isn't quite
                        accessible, but there is a simple and predictable
                        (sequence of) action(s) that makes the location
                        logically accessible:
                    </p>
                    <ul>
                        <li>
                            There may be accessible loose crystals that, if
                            collected, give you access to a Batreaux reward
                        </li>
                        <li>
                            There may be accessible goddess cubes that, if
                            collected, give you access to a goddess chest
                        </li>
                        <li>
                            You may have enough items to be able to guarantee
                            receiving a key from a dungeon that unlocks
                            additional checks in that dungeon
                        </li>
                        <li>
                            You may have access to a location that you marked as
                            holding an item that in turn gives you access to
                            more locations
                        </li>
                    </ul>
                    <GuideTooltip requirements={semiLogicTooltip} />
                    <p>
                        If you like going out of logic, <b>Show Trick Logic</b>{' '}
                        can be enabled. Locations that are accessible with
                        additional tricks beyond those enabled by the seed's
                        settings will be shown in a green color (or another
                        color if the color was customized). If no tricks are
                        selected in the customization option, the tracker will
                        consider all tricks it knows about. If tricks are
                        selected, only the selected tricks will be considered.
                        If a location requires both semi-logic assumptions and
                        tricks, the location will be shown as accessible in
                        trick logic.
                    </p>
                    <GuideTooltip requirements={trickLogicTooltip} />
                    <p>
                        The customization option <b>Counter Basis</b> allows you
                        to choose whether only checks that are in logic should
                        be counted as accessible (default), or whether
                        semi-logic (and trick logic) checks should be included.
                    </p>
                </Section>
                <Heading level={2} id="frequently-asked-questions">
                    Frequently Asked Questions
                </Heading>
                <Heading level={3} id="sphere-tracking">
                    Is Sphere Tracking supported?
                </Heading>
                <Section>
                    <p>
                        Some other randomizer trackers support Sphere Tracking:
                        Everything you can collect from the start is Sphere 0,
                        everything you can collect with those items is Sphere 1,
                        and so on, and by telling a tracker where you found each
                        item, a tracker can expose these sphere numbers.
                        However, the Randomizer does not place its items in
                        spheres, so showing sphere numbers would be misleading.
                    </p>
                    <p>
                        This tracker's logic tooltips already expose precise
                        requirements, and if you'd like to track where you found
                        an item, <a href="#hint-tracking">Hint Tracking</a> can
                        be used.
                    </p>
                </Section>
            </div>
        </div>
    );
}

function Heading({
    level,
    id,
    children,
}: {
    level: 1 | 2 | 3;
    id?: string;
    children: React.ReactNode;
}) {
    const El = ([undefined, 'h1', 'h2', 'h3'] as const)[level];
    return <El id={id}>{children}</El>;
}

function Section({ children }: { children: React.ReactNode }) {
    return <div className={styles.guideSection}>{children}</div>;
}

function GuideCustomization() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                className="tracker-button"
                onClick={() => setIsOpen(true)}
            >
                Customization
            </button>
            <CustomizationModal open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}

function GuideItem() {
    const [count, setCount] = useState(0);
    return (
        <div className={styles.guideItemSection}>
            <Tooltip content="Progressive Beetle">
                <BasicItem
                    className={styles.guideItem}
                    itemName="Progressive Beetle"
                    images={images['Progressive Beetle']}
                    count={count}
                    onGiveOrTake={(take: boolean) => {
                        setCount((old) => {
                            if (take) {
                                return old === 0 ? 4 : old - 1;
                            } else {
                                return old === 4 ? 0 : old + 1;
                            }
                        });
                    }}
                />
            </Tooltip>
        </div>
    );
}

function GuideTooltip({
    requirements,
}: {
    requirements: RootTooltipExpression;
}) {
    return (
        <FakeTooltip
            content={<RequirementsTooltip requirements={requirements} />}
        />
    );
}
