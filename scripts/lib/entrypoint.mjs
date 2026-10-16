// Whether a script was started directly, as `node scripts/name.mjs`, rather than imported by a test.
//
// Node loads an ES module under its real path, while process.argv[1] keeps the path it was given. When the
// checkout is reached through a symbolic link or a junction the two differ, and a plain comparison would
// make every script do nothing and exit 0, which for the validator is a false pass. Comparing real paths
// closes that gap.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export function isMain(moduleFile, entry = process.argv[1]) {
  if (!entry) return false;
  const given = path.resolve(entry);
  const own = path.resolve(moduleFile);
  try {
    return fs.realpathSync(given) === fs.realpathSync(own);
  } catch {
    return given === own;
  }
}
