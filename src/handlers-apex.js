import { getConnection, API_VERSION } from "./connection.js";
import { buildZip, deployZip, buildPackageXml } from "./metadata-utils.js";

// ─── List Apex Classes ────────────────────────────────────────────────────────
export async function listApexClasses({ filter }) {
  const conn = await getConnection();
  let soql = "SELECT Id, Name, Status, IsValid, LengthWithoutComments, LastModifiedDate, LastModifiedBy.Name FROM ApexClass";
  if (filter) soql += ` WHERE Name LIKE '%${filter}%'`;
  soql += " ORDER BY Name LIMIT 200";
  const result = await conn.query(soql);
  return { count: result.totalSize, classes: result.records };
}

// ─── Get Apex Class Source ────────────────────────────────────────────────────
export async function getApexClass({ name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id, Name, Body, Status, ApiVersion, LastModifiedDate, LastModifiedBy.Name FROM ApexClass WHERE Name = '${name}' LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Apex class '${name}' not found`);
  return result.records[0];
}

// ─── Create Apex Class ────────────────────────────────────────────────────────
export async function createApexClass({ name, body, api_version }) {
  const apiVer = api_version || API_VERSION;
  const files = {
    "package.xml": buildPackageXml([{ type: "ApexClass", members: [name] }]),
    [`classes/${name}.cls`]: body,
    [`classes/${name}.cls-meta.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVer}</apiVersion>
    <status>Active</status>
</ApexClass>`,
  };

  const zip = await buildZip(files);
  const result = await deployZip(zip);
  return {
    success: result.success,
    status: result.status,
    errors: result.details?.componentFailures || [],
    deployed: result.details?.componentSuccesses || [],
  };
}

// ─── Update Apex Class ────────────────────────────────────────────────────────
export async function updateApexClass({ name, body }) {
  // Same as create — Metadata API upserts
  return createApexClass({ name, body });
}

// ─── List Apex Triggers ───────────────────────────────────────────────────────
export async function listApexTriggers({ filter }) {
  const conn = await getConnection();
  let soql = "SELECT Id, Name, TableEnumOrId, Status, IsValid, LastModifiedDate, LastModifiedBy.Name FROM ApexTrigger";
  if (filter) soql += ` WHERE Name LIKE '%${filter}%'`;
  soql += " ORDER BY Name LIMIT 200";
  const result = await conn.query(soql);
  return { count: result.totalSize, triggers: result.records };
}

// ─── Get Apex Trigger Source ──────────────────────────────────────────────────
export async function getApexTrigger({ name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id, Name, Body, TableEnumOrId, Status, ApiVersion, LastModifiedDate FROM ApexTrigger WHERE Name = '${name}' LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Apex trigger '${name}' not found`);
  return result.records[0];
}

// ─── Create / Update Apex Trigger ────────────────────────────────────────────
export async function createApexTrigger({ name, object_name, body, api_version }) {
  const apiVer = api_version || API_VERSION;
  const files = {
    "package.xml": buildPackageXml([{ type: "ApexTrigger", members: [name] }]),
    [`triggers/${name}.trigger`]: body,
    [`triggers/${name}.trigger-meta.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVer}</apiVersion>
    <status>Active</status>
</ApexTrigger>`,
  };

  const zip = await buildZip(files);
  const result = await deployZip(zip);
  return {
    success: result.success,
    status: result.status,
    errors: result.details?.componentFailures || [],
    deployed: result.details?.componentSuccesses || [],
  };
}

// ─── Execute Anonymous Apex ───────────────────────────────────────────────────
export async function executeAnonymousApex({ apex_code }) {
  const conn = await getConnection();
  const result = await conn.tooling.executeAnonymous(apex_code);
  return {
    compiled: result.compiled,
    success: result.success,
    compileProblem: result.compileProblem || null,
    exceptionMessage: result.exceptionMessage || null,
    exceptionStackTrace: result.exceptionStackTrace || null,
  };
}

// ─── Run Apex Tests ───────────────────────────────────────────────────────────
export async function runApexTests({ class_names, all_tests }) {
  const conn = await getConnection();

  let testRequest;
  if (all_tests) {
    testRequest = { testLevel: "RunAllTestsInOrg" };
  } else {
    testRequest = {
      testLevel: "RunSpecifiedTests",
      tests: class_names.map((name) => ({ className: name })),
    };
  }

  const runResult = await conn.tooling.runTestsAsynchronous(testRequest);
  // runResult is a job ID — poll it
  let status;
  let attempts = 0;
  do {
    await new Promise((r) => setTimeout(r, 3000));
    status = await conn.tooling.query(
      `SELECT Id, Status, TestTime, MethodsCompleted, MethodsFailed, MethodsEnqueued FROM ApexTestRunResult WHERE AsyncApexJobId = '${runResult}'`
    );
    attempts++;
  } while (
    status.records[0]?.Status !== "Completed" &&
    status.records[0]?.Status !== "Failed" &&
    attempts < 20
  );

  // Get individual test results
  const testResults = await conn.tooling.query(
    `SELECT MethodName, Outcome, Message, StackTrace, ApexClass.Name, RunTime FROM ApexTestResult WHERE AsyncApexJobId = '${runResult}' ORDER BY ApexClass.Name, MethodName`
  );

  const summary = status.records[0] || {};
  return {
    jobId: runResult,
    status: summary.Status,
    methodsCompleted: summary.MethodsCompleted,
    methodsFailed: summary.MethodsFailed,
    testTime: summary.TestTime,
    results: testResults.records.map((r) => ({
      class: r.ApexClass?.Name,
      method: r.MethodName,
      outcome: r.Outcome,
      runTime: r.RunTime,
      message: r.Message || null,
      stackTrace: r.StackTrace || null,
    })),
  };
}

// ─── Get Apex Debug Logs ──────────────────────────────────────────────────────
export async function getApexLogs({ limit, user_name }) {
  const conn = await getConnection();
  let soql = `SELECT Id, Application, DurationMilliseconds, Location, LogLength, LogUser.Name, Operation, Request, StartTime, Status FROM ApexLog`;
  if (user_name) soql += ` WHERE LogUser.Name = '${user_name}'`;
  soql += ` ORDER BY StartTime DESC LIMIT ${limit || 10}`;
  const result = await conn.query(soql);
  return { count: result.totalSize, logs: result.records };
}

// ─── Get Apex Log Body ────────────────────────────────────────────────────────
export async function getApexLogBody({ log_id }) {
  const conn = await getConnection();
  const body = await conn.request(`/services/data/v${API_VERSION}/tooling/sobjects/ApexLog/${log_id}/Body`);
  return { log_id, body };
}
