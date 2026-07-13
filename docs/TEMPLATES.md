# Packaging templates

Each template declares required parameters, bounds, human-readable constraints, a candidate-scoring hook, deterministic generation, semantic panels, cut/crease geometry, glue allowance, bleed, safe guides, and validators.

- Rectangular carton: four unequal body panels with balanced closures.
- Cube box: equal-sided body and closure geometry.
- Straight tuck end: aligned top and bottom tuck direction.
- Reverse tuck end: opposed closure direction.
- Simple sleeve: open-ended four-panel sleeve and glue seam.
- Basic mailer: hinged body with protective side flaps.
- Triangular closure: reference-inspired triangular petal top.
- Custom: editable starting topology for irregular structures.

All measurements are canonical millimetres. Material thickness and fold allowance remain explicit parameters and should be tuned to the actual board, grain direction, scoring rule, and converter tolerances.
