import { getConnection, API_VERSION } from "./connection.js";
import { buildZip, deployZip, buildPackageXml } from "./metadata-utils.js";

// ─── List LWC Components ──────────────────────────────────────────────────────
export async function listLwcComponents({ filter }) {
  const conn = await getConnection();
  const result = await conn.metadata.list([{ type: "LightningComponentBundle" }], API_VERSION);
  let components = Array.isArray(result) ? result : result ? [result] : [];
  if (filter) {
    const f = filter.toLowerCase();
    components = components.filter((c) => c.fullName.toLowerCase().includes(f));
  }
  return {
    count: components.length,
    components: components.map((c) => ({
      name: c.fullName,
      lastModified: c.lastModifiedDate,
      createdBy: c.createdByName,
      lastModifiedBy: c.lastModifiedByName,
    })),
  };
}

// ─── Get LWC Component ────────────────────────────────────────────────────────
export async function getLwcComponent({ name }) {
  const conn = await getConnection();
  const result = await conn.metadata.read("LightningComponentBundle", name);
  if (!result || !result.fullName) throw new Error(`LWC component '${name}' not found`);

  return {
    name: result.fullName,
    apiVersion: result.apiVersion,
    isExposed: result.isExposed,
    targets: result.targets,
    description: result.description,
    lwcResources: result.lwcResources?.lwcResource || [],
  };
}

// ─── Create LWC Component ─────────────────────────────────────────────────────
export async function createLwcComponent({ name, html, js, css, description, targets, api_version, is_exposed }) {
  const apiVer = api_version || API_VERSION;
  const exposed = is_exposed !== undefined ? is_exposed : true;

  // Build targets XML
  const targetsXml = targets && targets.length > 0
    ? `<targets>\n        ${targets.map((t) => `<target>${t}</target>`).join("\n        ")}\n    </targets>`
    : "<targets>\n        <target>lightning__AppPage</target>\n        <target>lightning__RecordPage</target>\n        <target>lightning__HomePage</target>\n    </targets>";

  const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVer}</apiVersion>
    <isExposed>${exposed}</isExposed>
    ${description ? `<description>${description}</description>` : ""}
    ${targetsXml}
</LightningComponentBundle>`;

  const defaultHtml = html || `<template>
    <div class="${name}">
        <p>Hello from ${name}</p>
    </div>
</template>`;

  const defaultJs = js || `import { LightningElement } from 'lwc';

export default class ${name.charAt(0).toUpperCase() + name.slice(1)} extends LightningElement {
    // Component logic here
}`;

  const files = {
    "package.xml": buildPackageXml([{ type: "LightningComponentBundle", members: [name] }]),
    [`lwc/${name}/${name}.html`]: defaultHtml,
    [`lwc/${name}/${name}.js`]: defaultJs,
    [`lwc/${name}/${name}.js-meta.xml`]: metaXml,
  };

  if (css) {
    files[`lwc/${name}/${name}.css`] = css;
  }

  const zip = await buildZip(files);
  const result = await deployZip(zip);
  return {
    success: result.success,
    status: result.status,
    componentName: name,
    errors: result.details?.componentFailures || [],
    deployed: result.details?.componentSuccesses || [],
  };
}

// ─── Update LWC File ──────────────────────────────────────────────────────────
export async function updateLwcFile({ component_name, file_type, content }) {
  // file_type: 'html' | 'js' | 'css'
  const apiVer = API_VERSION;

  const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVer}</apiVersion>
    <isExposed>true</isExposed>
</LightningComponentBundle>`;

  const files = {
    "package.xml": buildPackageXml([{ type: "LightningComponentBundle", members: [component_name] }]),
    [`lwc/${component_name}/${component_name}.${file_type}`]: content,
    [`lwc/${component_name}/${component_name}.js-meta.xml`]: metaXml,
  };

  const zip = await buildZip(files);
  const result = await deployZip(zip);
  return {
    success: result.success,
    status: result.status,
    file: `${component_name}.${file_type}`,
    errors: result.details?.componentFailures || [],
    deployed: result.details?.componentSuccesses || [],
  };
}

// ─── Delete LWC Component ─────────────────────────────────────────────────────
export async function deleteLwcComponent({ name }) {
  const conn = await getConnection();
  const destructiveXml = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>${name}</members>
        <n>LightningComponentBundle</n>
    </types>
    <version>${API_VERSION}</version>
</Package>`;

  const files = {
    "destructiveChangesPre.xml": destructiveXml,
    "package.xml": `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <version>${API_VERSION}</version>
</Package>`,
  };

  const zip = await buildZip(files);
  const result = await deployZip(zip);
  return {
    success: result.success,
    status: result.status,
    deleted: name,
    errors: result.details?.componentFailures || [],
  };
}
