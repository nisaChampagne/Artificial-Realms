module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Artificial Realms',
    executableName: 'ArtificialRealms',
    icon: './assets/icon',
    appCopyright: 'Artificial Realms',
    ignore: [
      /^\/\.git/,
      /^\/scripts/,
      /^\/node_modules\/(?!electron-squirrel-startup)/,
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ArtificialRealms',
        authors: 'Artificial Realms',
        description: 'An AI-Powered Dungeons & Dragons Experience',
        setupIcon: './assets/icon.ico',
        loadingGif: undefined,
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ]
};
