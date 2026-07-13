# Release Checklist

- [ ] Clean checkout and `npm ci`
- [ ] `npm run check`
- [ ] `npm run audit:release`
- [ ] `npm run test:coverage`
- [ ] Sites deployment and live guided-sample/export smoke test
- [ ] Trusted Authenticode PFX supplied through environment only
- [ ] Signed Windows application and NSIS installer chains verified
- [ ] Clean Windows 10 and 11 install/upgrade/uninstall matrix completed
- [ ] `.pdgproj` association and user-project preservation verified
- [ ] Offline analysis and every export format verified
- [ ] Updater manifest/signature and non-blocking failure verified
- [ ] Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome smoke matrix completed
- [ ] Accessibility and performance budgets reviewed
- [ ] Inkscape/commercial vector import checks completed
- [ ] GitHub source and public release assets published
- [ ] Published assets re-downloaded; hashes/signatures verified
