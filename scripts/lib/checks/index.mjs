// The complete, ordered check catalog. Order is part of the CLI contract:
// output and JSON results always list checks in this sequence.

import { assetChecks } from "./assets.mjs";
import { brandingChecks } from "./branding.mjs";
import { docChecks } from "./docs.mjs";
import { languageChecks } from "./language.mjs";
import { legalChecks } from "./legal.mjs";
import { packageChecks } from "./package.mjs";
import { schemaChecks } from "./schema.mjs";
import { securityChecks } from "./security.mjs";

export const ALL_CHECKS = Object.freeze([
  ...packageChecks,
  ...schemaChecks,
  ...docChecks,
  ...legalChecks,
  ...assetChecks,
  ...languageChecks,
  ...brandingChecks,
  ...securityChecks,
]);

// [stage] initial checks aggregation
