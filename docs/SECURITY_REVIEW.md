# Security Review

Release audit date: 2026-07-14.

## Completed controls

- Removed unused ChatGPT authentication, example API routes, D1/R2 bindings, database schemas, generation scripts, and Drizzle packages from the production graph.
- Confirmed the application has no accounts, application backend, database, or cloud project synchronization.
- Upgraded the supported dependency graph and reduced `npm audit --audit-level=low` to zero advisories.
- Added image, decoded-dimension, raster-export, archive-size, entry-count, expansion, compression-ratio, path-traversal, malformed-schema, and unsafe-content guards.
- Added worker timeout, structured failure, cancellation settlement, concurrent-job handling, listener cleanup, and lazy loading.
- Enforced desktop CSP and user-initiated, non-blocking update behavior.
- Added ignored PFX/P12 patterns and signing automation that avoids copying or logging secrets.
- Required signature-chain verification before production packaging.

## Threat-boundary notes

Source images and projects remain untrusted input. Rendering uses React/SVG construction instead of unsanitized HTML. Imported project text is schema-validated, bounded, and opened read-only when its newer version is recoverable. The user must still inspect physical dimensions and a manufactured prototype; visual inference is not a security or engineering guarantee.

No penetration test by an independent third party, mobile-device lab, or commercial vector-application certification was available in this execution environment. These remain external release-verification items.
