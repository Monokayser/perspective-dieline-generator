# Release Checklist

- [x] Clean dependency install completed
- [x] `npm run check`
- [x] `npm run audit:release`
- [x] `npm run test:coverage`
- [x] Sites deployment and live guided-sample/export smoke test
- [ ] Trusted Authenticode PFX supplied through environment only
- [ ] Signed Windows application and NSIS installer chains verified
- [ ] Clean Windows 10 and 11 install/upgrade/uninstall matrix completed
- [ ] `.pdgproj` association and user-project preservation verified
- [x] Offline analysis and every export format covered by automated generation tests
- [ ] Updater manifest/signature and non-blocking failure verified
- [ ] Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome smoke matrix completed
- [x] Accessibility contracts and performance budgets reviewed
- [ ] Inkscape/commercial vector import checks completed
- [ ] GitHub source and public release assets published
- [ ] Published assets re-downloaded; hashes/signatures verified
