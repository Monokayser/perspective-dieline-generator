# User guide

## Workflow

1. **Source** - Upload a JPG/JPEG, PNG, or WEBP no larger than 25 MiB or 50 megapixels. Rotate, flip, and adjust brightness, contrast, or saturation as needed. These settings create a prepared bitmap for display and analysis; the original remains in the project. Visual previews are display-only.
2. **Analyze** - Run local detection, compare the ranked package candidates, drag uncertain numbered corners directly on the image, and approve the visible face. Automatic geometry is a proposal, not a manufacturing measurement.
3. **Measure** - Calibrate a known edge or enter dimensions, select a package template, and confirm every required parameter.
4. **Design** - Generate deterministic millimetre geometry, edit objects and layers, and review the print preview. Regenerating a custom structure discards structural overrides only after confirmation.
5. **Deliver** - Run validation, select issues to highlight affected objects, and export. Production formats remain blocked while validation has errors.

## Export and Save As

SVG is the primary editable output. PDF and DXF are grouped as production formats; PNG, JPG, and JSON are in **Other formats**. `.pdgproj` is saved from the top application bar so project saves are not duplicated in export controls.

Web exports follow the browser's download settings. In the Windows app, every export opens the native Save dialog first. Choose any available drive or folder, edit the suggested filename, then select **Save** or **Cancel**. Windows asks before replacing an existing file. Cancel writes nothing. Invalid, missing, read-only, full, permission-restricted, or locked destinations produce a specific recovery message while the project stays open.

The first **Save project** action also opens the Windows Save dialog; later saves reuse that project path. Use **Save as** to choose another filename or location. Uninstallation does not remove user-selected projects or exports.

## Keyboard and compact screens

Use `Ctrl+Z` and `Ctrl+Y` for undo/redo, `Ctrl+S` to save the current project, `Ctrl+Shift+S` for Save As, `+`/`-` to zoom, `0` to fit, `Delete` to remove a selected object, and `Esc` to close a drawer or dialog.

At 1100 px and below, tools and the inspector become focus-managed drawers. At 600 px and below, commands use icon buttons with tooltips, inputs retain 16 px text, and the five-phase bar scrolls independently without creating page overflow.
