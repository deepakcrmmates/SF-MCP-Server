import archiver from "archiver";
import { PassThrough } from "stream";
import { getConnection, API_VERSION } from "./connection.js";

/**
 * Build an in-memory zip buffer from a map of { filePath: fileContent }
 */
export async function buildZip(files) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip");
    const chunks = [];
    const passThrough = new PassThrough();

    passThrough.on("data", (chunk) => chunks.push(chunk));
    passThrough.on("end", () => resolve(Buffer.concat(chunks)));
    passThrough.on("error", reject);
    archive.on("error", reject);

    archive.pipe(passThrough);

    for (const [filePath, content] of Object.entries(files)) {
      archive.append(Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8"), {
        name: filePath,
      });
    }

    archive.finalize();
  });
}

/**
 * Deploy a zip buffer via Metadata API and poll for result
 */
export async function deployZip(zipBuffer, options = {}) {
  const conn = await getConnection();
  const deployOptions = {
    allowMissingFiles: false,
    autoUpdatePackage: false,
    checkOnly: options.checkOnly || false,
    ignoreWarnings: options.ignoreWarnings || true,
    rollbackOnError: true,
    runAllTests: options.runAllTests || false,
    singlePackage: true,
    testLevel: options.testLevel || "NoTestRun",
    ...options,
  };

  const result = await conn.metadata.deploy(zipBuffer, deployOptions).complete();
  return result;
}

/**
 * Build package.xml string
 */
export function buildPackageXml(members) {
  // members = [{ type: 'ApexClass', members: ['MyClass'] }, ...]
  const types = members
    .map(
      ({ type, members: m }) => `
    <types>
        ${m.map((name) => `<members>${name}</members>`).join("\n        ")}
        <name>${type}</name>
    </types>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    ${types}
    <version>${API_VERSION}</version>
</Package>`;
}

/**
 * Poll a deploy ID until complete
 */
export async function pollDeployStatus(deployId) {
  const conn = await getConnection();
  const result = await conn.metadata.checkDeployStatus(deployId, true);
  return result;
}
