# FiveM TypeScript Boilerplate

A boilerplate for FiveM resource development using TypeScript. This project is based on the original fivem-typescript-boilerplate by OX, with some customizations and improvements for better development workflows.

### Features

**TypeScript Support:** Write FiveM resources in TypeScript for better type safety and developer experience.

**ESBuild:** Fast and efficient bundling with esbuild.

**Custom Scripts:** Modified build and development scripts for improved workflows.

**PNPM:** Faster and more efficient package management with pnpm.

**Build Configuration:** Flexible build configuration options available in `build.config.js`, allowing customization of build modes, Lua handling, and more.

**Lua File Handling:** Automatic copying and watching of Lua files for changes, ensuring up-to-date resources.

**Dynamic and Hardcoded Builds:** Support for both dynamic and hardcoded builds, providing flexibility in how resources are compiled and managed.

**Utility Functions:** Includes utility functions for file and process management, enhancing script capabilities and automation.

**Build Modes:** Configurable build modes with `hardcode` option for single entry point or separate files.

**Lua Handling:** Option to enable or disable Lua file handling with `buildLua`.

**Web Build Handling:** Control web build processes with `enableWebBuild`.

**UI Page Configuration:** Flexible UI page settings with `uiPage` and `webUIPage`.

**Directory Configuration:** Customizable source, distribution, and web directories with `srcDir`, `distDir`, and `webDir`.

**Entry Points:** Define server and client entry points with `entryPoints`.

**Watch Mode:** Enable or disable watch mode with `watch` for automatic rebuilds.

**Lua Order:** Follow specific Lua file order with `followLuaOrder`.

### Prerequisites

**Node.js** (v16 or higher recommended)

**PNPM** (for package management)

## Getting Started

#### 1. Install PNPM

```
npm install -g pnpm
```

#### 2. Clone the Repository

```
git clone https://github.com/your-username/fivem-ts-boilerplate.git
cd fivem-ts-boilerplate
```

#### 3. Install All Dependencies Using pnpm

```
pnpm install
```

#### 4. Build the Project To build the project for production

```
pnpm build
```

#### 5. Enable watch mode for development

```
pnpm watch
```

- This will automatically rebuild the project whenever changes are detected.

---

## Customizations

- This boilerplate includes the following customizations:

## Modified Build Scripts:

- Updated build and watch scripts for better performance and flexibility.

## Environment-Specific Builds:

- Added support for different build environments (e.g., development, production).

## Improved TypeScript Configuration:

- Enhanced tsconfig.json for stricter type-checking and better developer experience.

## Acknowledgments

This project is based on the original [`fivem-typescript-boilerplate`](https://github.com/overextended/fivem-typescript-boilerplate) by OX. Special thanks to the OX team for their work on the initial boilerplate.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

Feel free to contribute, open issues, or suggest improvements! Happy coding! 🚀
