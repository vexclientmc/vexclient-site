# Vex Website Current

Current hosted website version of Vex.

This is the website-safe UI for the newer Vex launcher:

- Home
- Modrinth-powered Mods search
- Profiles
- Settings with Client ID and scope fields
- Vex+
- Current Vex blue-gray styling and assets

The hosted website cannot install mods, authenticate Microsoft accounts, or launch Minecraft directly. Those actions require the native Windows app because they need local files, PowerShell auth, DPAPI token storage, and process launch access.

## Commands

```bash
npm install
npm run dev
npm run build
```

Static production files are emitted to `dist/`.
