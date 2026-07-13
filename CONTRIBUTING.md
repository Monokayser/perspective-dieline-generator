# Contributing

Use Node.js 22.13 or newer. Create a focused branch, keep the local-first privacy model intact, and do not commit user images, credentials, signing keys, PFX files, updater private keys, or generated release directories.

Before opening a pull request, run:

```bash
npm ci
npm run check
npm run audit:release
npm run test:coverage
npm run desktop:web
```

Changes to geometry, project archives, exporters, or worker protocols require tests. UI changes must remain keyboard-operable, readable at 200% zoom, usable from 320 px upward, and compatible with reduced motion and forced colors. Describe any validation, accessibility, performance, or migration impact in the pull request.
