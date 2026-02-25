import { getConnection, API_VERSION } from "./connection.js";

// ─── List Flows ───────────────────────────────────────────────────────────────
export async function listFlows({ filter, status }) {
  const conn = await getConnection();
  let soql = `SELECT Id, ApiName, Label, ProcessType, TriggerType, Status, Description, LastModifiedDate, LastModifiedBy.Name, VersionNumber FROM Flow`;
  const conditions = [];
  if (filter) conditions.push(`(ApiName LIKE '%${filter}%' OR Label LIKE '%${filter}%')`);
  if (status) conditions.push(`Status = '${status}'`);
  if (conditions.length > 0) soql += ` WHERE ${conditions.join(" AND ")}`;
  soql += " ORDER BY Label LIMIT 200";

  const result = await conn.query(soql);
  return {
    count: result.totalSize,
    flows: result.records.map((f) => ({
      id: f.Id,
      apiName: f.ApiName,
      label: f.Label,
      processType: f.ProcessType,
      triggerType: f.TriggerType,
      status: f.Status,
      version: f.VersionNumber,
      description: f.Description,
      lastModified: f.LastModifiedDate,
      lastModifiedBy: f.LastModifiedBy?.Name,
    })),
  };
}

// ─── Get Flow Details ─────────────────────────────────────────────────────────
export async function getFlowDetails({ api_name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id, ApiName, Label, ProcessType, TriggerType, Status, Description, VersionNumber,
            InterviewLabel, StartElementReference, LastModifiedDate, LastModifiedBy.Name
     FROM Flow WHERE ApiName = '${api_name}' ORDER BY VersionNumber DESC LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Flow '${api_name}' not found`);

  const flow = result.records[0];

  // Get flow variable definitions
  const vars = await conn.query(
    `SELECT Name, DataType, IsCollection, IsInput, IsOutput, Description FROM FlowVariable WHERE FlowVersionId = '${flow.Id}'`
  ).catch(() => ({ records: [] }));

  return {
    ...flow,
    variables: vars.records,
  };
}

// ─── Activate Flow ────────────────────────────────────────────────────────────
export async function activateFlow({ api_name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id FROM Flow WHERE ApiName = '${api_name}' AND Status = 'Draft' ORDER BY VersionNumber DESC LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`No draft version of flow '${api_name}' found`);

  const flowId = result.records[0].Id;
  await conn.sobject("Flow").update({ Id: flowId, Status: "Active" });
  return { success: true, apiName: api_name, status: "Active" };
}

// ─── Deactivate Flow ──────────────────────────────────────────────────────────
export async function deactivateFlow({ api_name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id FROM Flow WHERE ApiName = '${api_name}' AND Status = 'Active' ORDER BY VersionNumber DESC LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`No active version of flow '${api_name}' found`);

  const flowId = result.records[0].Id;
  await conn.sobject("Flow").update({ Id: flowId, Status: "Obsolete" });
  return { success: true, apiName: api_name, status: "Obsolete" };
}

// ─── Invoke Flow ──────────────────────────────────────────────────────────────
export async function invokeFlow({ flow_api_name, inputs }) {
  const conn = await getConnection();
  const body = { inputs: [inputs || {}] };
  const result = await conn.requestPost(
    `/services/data/v${API_VERSION}/actions/custom/flow/${flow_api_name}`,
    body
  );
  return result;
}

// ─── Get Flow Interviews (running instances) ──────────────────────────────────
export async function getFlowInterviews({ flow_api_name }) {
  const conn = await getConnection();
  let soql = `SELECT Id, Name, CurrentElement, CreatedDate, CreatedBy.Name, InterviewLabel FROM FlowInterview`;
  if (flow_api_name) soql += ` WHERE Definition.ApiName = '${flow_api_name}'`;
  soql += " ORDER BY CreatedDate DESC LIMIT 50";
  const result = await conn.query(soql);
  return { count: result.totalSize, interviews: result.records };
}
