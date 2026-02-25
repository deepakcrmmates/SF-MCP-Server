import { getConnection, API_VERSION } from "./connection.js";
import { buildZip, deployZip, buildPackageXml, pollDeployStatus } from "./metadata-utils.js";

// ─── List Metadata Types ──────────────────────────────────────────────────────
export async function listMetadataTypes() {
  const conn = await getConnection();
  const result = await conn.metadata.describe(API_VERSION);
  return {
    count: result.metadataObjects.length,
    types: result.metadataObjects
      .sort((a, b) => a.xmlName.localeCompare(b.xmlName))
      .map((t) => ({
        name: t.xmlName,
        directoryName: t.directoryName,
        inFolder: t.inFolder,
        metaFile: t.metaFile,
        suffix: t.suffix,
        childXmlNames: t.childXmlNames || [],
      })),
  };
}

// ─── List Metadata Components ─────────────────────────────────────────────────
export async function listMetadataComponents({ metadata_type, folder }) {
  const conn = await getConnection();
  const query = folder
    ? { type: metadata_type, folder }
    : { type: metadata_type };

  const result = await conn.metadata.list([query], API_VERSION);
  const items = Array.isArray(result) ? result : result ? [result] : [];

  return {
    type: metadata_type,
    count: items.length,
    components: items.map((c) => ({
      fullName: c.fullName,
      id: c.id,
      lastModified: c.lastModifiedDate,
      createdBy: c.createdByName,
      lastModifiedBy: c.lastModifiedByName,
      namespacePrefix: c.namespacePrefix || null,
    })),
  };
}

// ─── Retrieve Metadata ────────────────────────────────────────────────────────
export async function retrieveMetadata({ metadata_type, component_names }) {
  const conn = await getConnection();
  const packageXml = buildPackageXml([
    { type: metadata_type, members: Array.isArray(component_names) ? component_names : [component_names] },
  ]);

  const retrieveRequest = {
    apiVersion: API_VERSION,
    unpackaged: {
      types: [
        {
          name: metadata_type,
          members: Array.isArray(component_names) ? component_names : [component_names],
        },
      ],
      version: API_VERSION,
    },
  };

  const result = await conn.metadata.retrieve(retrieveRequest).complete();

  return {
    success: !result.errorStatusCode,
    status: result.status,
    errorMessage: result.errorStatusCode ? `${result.errorStatusCode}: ${result.errorMessage}` : null,
    fileProperties: result.fileProperties?.map((f) => ({
      fullName: f.fullName,
      type: f.type,
      fileName: f.fileName,
      lastModified: f.lastModifiedDate,
    })) || [],
    zipFileBase64: result.zipFile, // base64 encoded zip
  };
}

// ─── Deploy Metadata (from raw content) ──────────────────────────────────────
export async function deployMetadata({ components, check_only, test_level, run_all_tests }) {
  // components = [{ type, name, content, meta_content }]
  const packageMembers = {};
  const files = {};

  for (const comp of components) {
    if (!packageMembers[comp.type]) packageMembers[comp.type] = [];
    packageMembers[comp.type].push(comp.name);

    // Determine directory and extension from type
    const typeMap = {
      ApexClass: { dir: "classes", ext: "cls", metaExt: "cls-meta.xml" },
      ApexTrigger: { dir: "triggers", ext: "trigger", metaExt: "trigger-meta.xml" },
      LightningComponentBundle: { dir: "lwc", ext: "js", metaExt: "js-meta.xml" },
      CustomObject: { dir: "objects", ext: "object", metaExt: "object-meta.xml" },
      CustomField: { dir: "objects", ext: "field-meta.xml", metaExt: null },
      Layout: { dir: "layouts", ext: "layout", metaExt: "layout-meta.xml" },
      PermissionSet: { dir: "permissionsets", ext: "permissionset", metaExt: "permissionset-meta.xml" },
      CustomLabel: { dir: "labels", ext: "labels", metaExt: null },
      StaticResource: { dir: "staticresources", ext: "resource", metaExt: "resource-meta.xml" },
      FlexiPage: { dir: "flexipages", ext: "flexipage", metaExt: "flexipage-meta.xml" },
    };

    const info = typeMap[comp.type] || { dir: comp.type.toLowerCase(), ext: "xml", metaExt: "xml-meta.xml" };
    files[`${info.dir}/${comp.name}.${info.ext}`] = comp.content;
    if (comp.meta_content && info.metaExt) {
      files[`${info.dir}/${comp.name}.${info.metaExt}`] = comp.meta_content;
    }
  }

  files["package.xml"] = buildPackageXml(
    Object.entries(packageMembers).map(([type, members]) => ({ type, members }))
  );

  const zip = await buildZip(files);
  const result = await deployZip(zip, {
    checkOnly: check_only || false,
    testLevel: test_level || "NoTestRun",
    runAllTests: run_all_tests || false,
  });

  return {
    success: result.success,
    status: result.status,
    checkOnly: result.checkOnly,
    numberComponentsDeployed: result.numberComponentsDeployed,
    numberComponentErrors: result.numberComponentErrors,
    numberTestsCompleted: result.numberTestsCompleted,
    numberTestErrors: result.numberTestErrors,
    errors: result.details?.componentFailures
      ? (Array.isArray(result.details.componentFailures)
          ? result.details.componentFailures
          : [result.details.componentFailures]
        ).map((e) => ({
          component: e.fullName,
          type: e.componentType,
          problem: e.problem,
          line: e.lineNumber,
          column: e.columnNumber,
        }))
      : [],
    deployed: result.details?.componentSuccesses
      ? (Array.isArray(result.details.componentSuccesses)
          ? result.details.componentSuccesses
          : [result.details.componentSuccesses]
        ).map((s) => ({ component: s.fullName, type: s.componentType }))
      : [],
  };
}

// ─── Check Deploy Status ──────────────────────────────────────────────────────
export async function checkDeployStatus({ deploy_id }) {
  const result = await pollDeployStatus(deploy_id);
  return {
    id: result.id,
    status: result.status,
    success: result.success,
    done: result.done,
    numberComponentsDeployed: result.numberComponentsDeployed,
    numberComponentErrors: result.numberComponentErrors,
    errors: result.details?.componentFailures || [],
  };
}

// ─── Destructive Deploy (delete components) ───────────────────────────────────
export async function deleteMetadataComponents({ components }) {
  // components = [{ type, name }]
  const packageMembers = {};
  for (const comp of components) {
    if (!packageMembers[comp.type]) packageMembers[comp.type] = [];
    packageMembers[comp.type].push(comp.name);
  }

  const destructiveXml = buildPackageXml(
    Object.entries(packageMembers).map(([type, members]) => ({ type, members }))
  );

  const files = {
    "destructiveChangesPre.xml": destructiveXml,
    "package.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n    <version>${API_VERSION}</version>\n</Package>`,
  };

  const zip = await buildZip(files);
  const result = await deployZip(zip, { ignoreWarnings: true });
  return {
    success: result.success,
    status: result.status,
    deleted: components,
    errors: result.details?.componentFailures || [],
  };
}

// ─── Validate Deploy (check only) ────────────────────────────────────────────
export async function validateDeploy({ components, test_level }) {
  return deployMetadata({ components, check_only: true, test_level: test_level || "RunLocalTests" });
}
