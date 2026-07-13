# Troubleshooting

- **No package found:** crop closer, use a simpler background, improve focus/contrast, or place corners manually.
- **Generation disabled:** confirm every required dimension; inferred values do not count.
- **Export disabled:** open Validation and resolve all errors.
- **Wrong physical size:** import SVG at 100%, preserve document units, and disable printer scaling.
- **Desktop blank window:** repair/install Microsoft Edge WebView2 Runtime and relaunch.
- **SmartScreen warning:** v1 is not Authenticode-signed; verify the published SHA-256 checksum before running.
- **Project will not open:** confirm it is an intact `.pdgproj` created by a supported version. Newer versions open read-only by policy and must not be silently rewritten.
- **Recovery missing:** browser privacy cleanup can remove IndexedDB. Use explicit project downloads for durable saves.
