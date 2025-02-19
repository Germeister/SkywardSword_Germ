# Skyward Sword Randomizer Tracker
[![Discord](https://discordapp.com/api/guilds/767090759773323264/embed.png?style=shield)](https://discord.gg/evpNKkaaw6)

Web based tracker for the [Skyward Sword Randomizer](https://github.com/ssrando/ssrando).

## Instances
[Production](https://robojumper.github.io/SS-Randomizer-Tracker/) - the one and only deployed version of this tracker. Directly updated from the default branch of this repository within minutes of merging a Pull Request.

## Usage

Find instructions and detailed documentation on the tracker's features in the [Tracker User Guide](https://robojumper.github.io/SS-Randomizer-Tracker/guide).

## Supported Randomizer Version

The tracker should support the following randomizer versions:

* The [latest stable Randomizer release](https://github.com/ssrando/ssrando/releases/latest)
* The [latest Randomizer development build](https://nightly.link/ssrando/ssrando/workflows/build.yaml/main)
* The [latest official beta-features build](https://nightly.link/ssrando/ssrando/workflows/build.yaml/beta-features)
* The latest Racing build

Other builds (older releases, experimental branches) are not officially supported and may or may not work.

## Reporting Issues

Ran into a bug? Bugs found in the production instance should be reported [here on GitHub](https://github.com/robojumper/SS-Randomizer-Tracker/issues) or in the Discord.

## Running From Source
Building and running an instance of the tracker locally requires Node v20 and npm.

1. Clone the repository
2. Install dependcies
```
npm install
```
3. Build and serve the application
```
npm start
```
4. Access the application at http://localhost:5173/

## Contributing

Run `npm run prepare` once to set up a convenient pre-commit hook that automatically formats your code.

## Shoutouts

Also see the [Acknowledgements](https://robojumper.github.io/SS-Randomizer-Tracker/acknowledgement) page.

- [lepelog](https://github.com/lepelog), [peppernicus](https://github.com/Peppernicus2000), [azer67](https://github.com/azer67) - Creating the [randomizer](https://github.com/ssrando/ssrando)
- [Floha](https://github.com/Floha258), [Kuonino](https://github.com/Kuonino), Extodasher, [CapitanBublo](https://github.com/CapitanBublo), [CovenEsme](https://github.com/covenesme), [YourAverageLink](https://github.com/youraveragelink) - Fellow devs on the tracker
- [wooferzfg](https://github.com/wooferzfg) - Creating [the tracker for The Wind Waker Randomizer](https://github.com/wooferzfg/tww-rando-tracker), from which much of the original logic subsystem in this tracker was derived
- [cjs](https://github.com/cjs8487/) - Creating [the original Skyward Sword Randomizer tracker](https://github.com/cjs8487/SS-Randomizer-Tracker), from which this tracker was originally forked
