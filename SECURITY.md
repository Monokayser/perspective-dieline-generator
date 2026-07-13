# Security Policy

## Supported version

Security fixes are provided for the latest published 1.x release.

## Reporting a vulnerability

Do not open a public issue for an unpatched vulnerability or include private customer artwork in a report. Use GitHub's private vulnerability-reporting feature for this repository. Include the affected version, reproduction steps, impact, and a minimal non-sensitive fixture.

## Security model

- Image analysis and geometry generation run locally; there is no application account, image-upload API, database, or cloud project storage.
- Web persistence is limited to recovery snapshots and local preferences. Desktop files are saved only where the user chooses, with private recovery data in application storage.
- Project imports enforce safe paths, strict schemas, entry and expansion limits, compression-ratio limits, and unsafe SVG/text rejection. Recoverable newer versions open read-only.
- The desktop content security policy restricts code, image, worker, and network origins. Update checks are user-initiated and failures never block offline use.
- Production Windows releases require verified Authenticode signatures. PFX files, passwords, and updater private keys must stay outside source control and CI logs.

See [Security review](docs/SECURITY_REVIEW.md) for the release audit scope.
