/**
 * handlers-crm.js — ES Module
 * Live CRM record access using the jsforce connection.
 */

import { getConnection } from './connection.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function quarterBounds(label = 'this_quarter') {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const offset = label === 'next_quarter' ? 1 : 0;
  const qIdx = (q + offset) % 4;
  const year = now.getFullYear() + (q + offset > 3 ? 1 : 0);
  const start = new Date(year, qIdx * 3, 1);
  const end = new Date(year, qIdx * 3 + 3, 0);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function periodToDates(period) {
  if (!period || period === 'this_quarter') return quarterBounds('this_quarter');
  if (period === 'next_quarter') return quarterBounds('next_quarter');
  if (period === 'this_month') {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    };
  }
  return { from: `${period}-01-01`, to: `${period}-12-31` };
}

function err(msg, detail) {
  return { content: [{ type: 'text', text: `❌ ${msg}${detail ? `\n\nDetail: ${detail}` : ''}` }], isError: true };
}

function ok(data) {
  return { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
}

const DEFAULT_FIELDS = {
  Account:     'Id, Name, Phone, Website, Industry, AnnualRevenue, BillingCity, BillingCountry, OwnerId, Owner.Name, LastActivityDate',
  Contact:     'Id, FirstName, LastName, Email, Phone, Title, AccountId, Account.Name, OwnerId, Owner.Name, LastActivityDate',
  Lead:        'Id, FirstName, LastName, Company, Email, Phone, Status, LeadSource, OwnerId, Owner.Name, CreatedDate, IsConverted',
  Opportunity: 'Id, Name, AccountId, Account.Name, StageName, Amount, CloseDate, Probability, OwnerId, Owner.Name, IsClosed, IsWon',
  Case:        'Id, CaseNumber, Subject, Status, Priority, AccountId, Account.Name, ContactId, Contact.Name, CreatedDate, ClosedDate',
  Task:        'Id, Subject, Status, Priority, ActivityDate, Description, WhoId, WhatId, OwnerId, Owner.Name',
  Event:       'Id, Subject, StartDateTime, EndDateTime, Description, Location, WhoId, WhatId, OwnerId',
};

function defaultFieldsFor(obj) { return DEFAULT_FIELDS[obj] || 'Id, Name, CreatedDate, LastModifiedDate'; }

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleQuery({ soql, maxRecords = 200 }) {
  if (!soql) return err('soql is required');
  try {
    const conn = await getConnection();
    const result = await conn.query(soql, { autoFetch: true, maxFetch: Math.min(maxRecords, 2000) });
    return ok({ totalSize: result.totalSize, records: result.records, done: result.done });
  } catch (e) { return err('SOQL query failed', e.message); }
}

async function handleSearch({ searchTerm, objects, fields, limit = 10 }) {
  if (!searchTerm) return err('searchTerm is required');
  const safeObjects = (objects?.length > 0) ? objects : ['Account', 'Contact', 'Lead', 'Opportunity'];
  const returning = safeObjects.map((obj) => {
    const fieldList = fields?.[obj] ? fields[obj].join(', ') : defaultFieldsFor(obj);
    return `${obj}(${fieldList} LIMIT ${limit})`;
  }).join(', ');
  const sosl = `FIND {${searchTerm.replace(/['"{}\\]/g, '\\$&')}} IN ALL FIELDS RETURNING ${returning}`;
  try {
    const conn = await getConnection();
    const result = await conn.search(sosl);
    return ok(result.searchRecords || result);
  } catch (e) { return err('SOSL search failed', e.message); }
}

async function handleGetRecord({ objectType, recordId, fields }) {
  if (!objectType || !recordId) return err('objectType and recordId are required');
  try {
    const conn = await getConnection();
    const record = fields?.length > 0
      ? await conn.sobject(objectType).retrieve(recordId, fields)
      : await conn.sobject(objectType).retrieve(recordId);
    return ok(record);
  } catch (e) { return err(`Could not fetch ${objectType} ${recordId}`, e.message); }
}

async function handleCreateRecord({ objectType, data }) {
  if (!objectType || !data) return err('objectType and data are required');
  try {
    const conn = await getConnection();
    const result = await conn.sobject(objectType).create(data);
    if (!result.success) return err('Record creation failed', JSON.stringify(result.errors));
    return ok({ success: true, id: result.id, message: `✅ ${objectType} created: ${result.id}` });
  } catch (e) { return err(`Failed to create ${objectType}`, e.message); }
}

async function handleUpdateRecord({ objectType, recordId, data }) {
  if (!objectType || !recordId || !data) return err('objectType, recordId and data are required');
  try {
    const conn = await getConnection();
    const result = await conn.sobject(objectType).update({ Id: recordId, ...data });
    if (!result.success) return err('Record update failed', JSON.stringify(result.errors));
    return ok({ success: true, id: recordId, message: `✅ ${objectType} ${recordId} updated` });
  } catch (e) { return err(`Failed to update ${objectType} ${recordId}`, e.message); }
}

async function handleDeleteRecord({ objectType, recordId }) {
  if (!objectType || !recordId) return err('objectType and recordId are required');
  try {
    const conn = await getConnection();
    const result = await conn.sobject(objectType).delete(recordId);
    if (!result.success) return err('Delete failed', JSON.stringify(result.errors));
    return ok({ success: true, message: `✅ ${objectType} ${recordId} deleted` });
  } catch (e) { return err(`Failed to delete ${objectType} ${recordId}`, e.message); }
}

async function handleBulkCreate({ objectType, records }) {
  if (!objectType || !records?.length) return err('objectType and records are required');
  try {
    const conn = await getConnection();
    const results = await conn.sobject(objectType).create(records);
    return ok({ created: results.filter(r => r.success).length, failedCount: results.filter(r => !r.success).length, results });
  } catch (e) { return err(`Bulk create failed for ${objectType}`, e.message); }
}

async function handleBulkUpdate({ objectType, records }) {
  if (!objectType || !records?.length) return err('objectType and records are required');
  try {
    const conn = await getConnection();
    const results = await conn.sobject(objectType).update(records);
    return ok({ updated: results.filter(r => r.success).length, failedCount: results.filter(r => !r.success).length, results });
  } catch (e) { return err(`Bulk update failed for ${objectType}`, e.message); }
}

async function handleGetPipeline({ ownerId, closeDateFrom, closeDateTo, minAmount, currency }) {
  const conditions = ['IsClosed = false'];
  if (ownerId && ownerId !== 'me') conditions.push(`OwnerId = '${ownerId}'`);
  if (closeDateFrom) conditions.push(`CloseDate >= ${closeDateFrom}`);
  if (closeDateTo) conditions.push(`CloseDate <= ${closeDateTo}`);
  if (minAmount) conditions.push(`Amount >= ${minAmount}`);
  const where = conditions.join(' AND ');
  try {
    const conn = await getConnection();
    const [summary, detail] = await Promise.all([
      conn.query(`SELECT StageName, Probability, COUNT(Id) RecordCount, SUM(Amount) TotalAmount FROM Opportunity WHERE ${where} GROUP BY StageName, Probability ORDER BY Probability DESC`),
      conn.query(`SELECT Id, Name, Account.Name, StageName, Amount, CloseDate, Probability, Owner.Name FROM Opportunity WHERE ${where} ORDER BY CloseDate ASC, Amount DESC LIMIT 200`, { autoFetch: true, maxFetch: 200 }),
    ]);
    const grandTotal = (summary.records || []).reduce((sum, r) => sum + (r.TotalAmount || 0), 0);
    const cur = currency || '';
    return ok({
      summary: (summary.records || []).map(r => ({ stage: r.StageName, probability: `${r.Probability}%`, count: r.RecordCount, total: `${cur}${(r.TotalAmount || 0).toLocaleString()}` })),
      grandTotal: `${cur}${grandTotal.toLocaleString()}`,
      opportunities: detail.records || [],
    });
  } catch (e) { return err('Pipeline query failed', e.message); }
}

async function handleGetForecast({ period = 'this_quarter', groupByOwner = false }) {
  const { from, to } = periodToDates(period);
  const select = groupByOwner ? 'Owner.Name OwnerName, ForecastCategoryName, SUM(Amount) Total, COUNT(Id) Count' : 'ForecastCategoryName, SUM(Amount) Total, COUNT(Id) Count';
  const groupByClause = groupByOwner ? 'GROUP BY ForecastCategoryName, OwnerId, Owner.Name' : 'GROUP BY ForecastCategoryName';
  try {
    const conn = await getConnection();
    const result = await conn.query(`SELECT ${select} FROM Opportunity WHERE CloseDate >= ${from} AND CloseDate <= ${to} AND IsDeleted = false ${groupByClause} ORDER BY ForecastCategoryName`);
    return ok({ period: `${from} → ${to}`, forecast: result.records || [] });
  } catch (e) { return err('Forecast query failed', e.message); }
}

async function handleGetAccountOverview({ accountId, includeClosedOpps = false, activityDays = 90 }) {
  if (!accountId) return err('accountId is required');
  const activitySince = new Date(Date.now() - activityDays * 86400000).toISOString().slice(0, 10);
  const oppFilter = includeClosedOpps ? '' : ' AND IsClosed = false';
  try {
    const conn = await getConnection();
    const [account, contacts, opps, cases, tasks] = await Promise.all([
      conn.sobject('Account').retrieve(accountId),
      conn.query(`SELECT Id, FirstName, LastName, Email, Phone, Title FROM Contact WHERE AccountId = '${accountId}' LIMIT 50`),
      conn.query(`SELECT Id, Name, StageName, Amount, CloseDate, Probability FROM Opportunity WHERE AccountId = '${accountId}'${oppFilter} ORDER BY CloseDate ASC LIMIT 50`),
      conn.query(`SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate FROM Case WHERE AccountId = '${accountId}' ORDER BY CreatedDate DESC LIMIT 20`),
      conn.query(`SELECT Id, Subject, Status, ActivityDate, Description FROM Task WHERE WhatId = '${accountId}' AND ActivityDate >= ${activitySince} ORDER BY ActivityDate DESC LIMIT 30`),
    ]);
    return ok({ account, contacts: contacts.records || [], opportunities: opps.records || [], cases: cases.records || [], recentActivities: tasks.records || [] });
  } catch (e) { return err(`Account overview failed for ${accountId}`, e.message); }
}

async function handleCreateLead({ firstName, lastName, company, email, phone, title, leadSource, status, description, additionalFields = {} }) {
  if (!lastName) return err('lastName is required for Lead');
  if (!company) return err('company is required for Lead');
  const data = { LastName: lastName, Company: company, ...(firstName && { FirstName: firstName }), ...(email && { Email: email }), ...(phone && { Phone: phone }), ...(title && { Title: title }), ...(leadSource && { LeadSource: leadSource }), ...(status && { Status: status }), ...(description && { Description: description }), ...additionalFields };
  try {
    const conn = await getConnection();
    const result = await conn.sobject('Lead').create(data);
    if (!result.success) return err('Lead creation failed', JSON.stringify(result.errors));
    return ok({ success: true, id: result.id, message: `✅ Lead created: ${firstName ? firstName + ' ' : ''}${lastName} at ${company} (${result.id})` });
  } catch (e) { return err('Failed to create Lead', e.message); }
}

async function handleConvertLead({ leadId, convertedStatus, accountName, createOpportunity = true, opportunityName, ownerId }) {
  if (!leadId || !convertedStatus) return err('leadId and convertedStatus are required');
  try {
    const conn = await getConnection();
    const result = await conn.soap.convertLead({ leadId, convertedStatus, ...(accountName && { accountName }), doNotCreateOpportunity: !createOpportunity, ...(opportunityName && { opportunityName }), ...(ownerId && { ownerId }) });
    return ok(result);
  } catch (e) { return err('Lead conversion failed', e.message); }
}

async function handleLogActivity({ subject, description, whoId, whatId, activityDate, callType, callDurationInSeconds, ownerId }) {
  if (!subject) return err('subject is required');
  const data = { Subject: subject, Status: 'Completed', ActivityDate: activityDate || today(), ...(description && { Description: description }), ...(whoId && { WhoId: whoId }), ...(whatId && { WhatId: whatId }), ...(callType && { CallType: callType }), ...(callDurationInSeconds && { CallDurationInSeconds: callDurationInSeconds }), ...(ownerId && { OwnerId: ownerId }) };
  try {
    const conn = await getConnection();
    const result = await conn.sobject('Task').create(data);
    if (!result.success) return err('Activity log failed', JSON.stringify(result.errors));
    return ok({ success: true, id: result.id, message: `✅ Activity logged: "${subject}" (${result.id})` });
  } catch (e) { return err('Failed to log activity', e.message); }
}

async function handleCreateTask({ subject, dueDate, priority = 'Normal', status, whoId, whatId, description, ownerId }) {
  if (!subject) return err('subject is required');
  const data = { Subject: subject, Priority: priority, ...(dueDate && { ActivityDate: dueDate }), ...(status && { Status: status }), ...(whoId && { WhoId: whoId }), ...(whatId && { WhatId: whatId }), ...(description && { Description: description }), ...(ownerId && { OwnerId: ownerId }) };
  try {
    const conn = await getConnection();
    const result = await conn.sobject('Task').create(data);
    if (!result.success) return err('Task creation failed', JSON.stringify(result.errors));
    return ok({ success: true, id: result.id, message: `✅ Task created: "${subject}" (${result.id})` });
  } catch (e) { return err('Failed to create Task', e.message); }
}

async function handleCreateEvent({ subject, startDateTime, endDateTime, description, whoId, whatId, location, ownerId }) {
  if (!subject || !startDateTime || !endDateTime) return err('subject, startDateTime, and endDateTime are required');
  const data = { Subject: subject, StartDateTime: startDateTime, EndDateTime: endDateTime, ...(description && { Description: description }), ...(whoId && { WhoId: whoId }), ...(whatId && { WhatId: whatId }), ...(location && { Location: location }), ...(ownerId && { OwnerId: ownerId }) };
  try {
    const conn = await getConnection();
    const result = await conn.sobject('Event').create(data);
    if (!result.success) return err('Event creation failed', JSON.stringify(result.errors));
    return ok({ success: true, id: result.id, message: `✅ Event created: "${subject}" (${result.id})` });
  } catch (e) { return err('Failed to create Event', e.message); }
}

async function handleGetCases({ accountId, status, priority, openOnly = true, limit = 50 }) {
  const conditions = [];
  if (accountId) conditions.push(`AccountId = '${accountId}'`);
  if (status) conditions.push(`Status = '${status}'`);
  if (priority) conditions.push(`Priority = '${priority}'`);
  if (openOnly) conditions.push('IsClosed = false');
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const conn = await getConnection();
    const result = await conn.query(`SELECT Id, CaseNumber, Subject, Status, Priority, AccountId, Account.Name, ContactId, Contact.Name, CreatedDate, ClosedDate, Description FROM Case ${where} ORDER BY Priority, CreatedDate DESC LIMIT ${Math.min(limit, 200)}`);
    return ok({ totalSize: result.totalSize, cases: result.records || [] });
  } catch (e) { return err('Cases query failed', e.message); }
}

async function handleAddCaseComment({ caseId, comment, isPublic = false }) {
  if (!caseId || !comment) return err('caseId and comment are required');
  try {
    const conn = await getConnection();
    const result = await conn.sobject('CaseComment').create({ ParentId: caseId, CommentBody: comment, IsPublished: isPublic });
    if (!result.success) return err('Comment failed', JSON.stringify(result.errors));
    return ok({ success: true, id: result.id, message: `✅ Comment added to Case ${caseId}` });
  } catch (e) { return err('Failed to add case comment', e.message); }
}

async function handleAggregateQuery({ soql }) {
  if (!soql) return err('soql is required');
  try {
    const conn = await getConnection();
    const result = await conn.query(soql);
    return ok({ totalSize: result.totalSize, records: result.records || [] });
  } catch (e) { return err('Aggregate query failed', e.message); }
}

async function handleGetRecentItems({ objectType, limit = 20 }) {
  const typeFilter = objectType ? `AND Type = '${objectType}'` : '';
  try {
    const conn = await getConnection();
    const result = await conn.query(`SELECT Id, Name, Type, LastViewedDate FROM RecentlyViewed WHERE LastViewedDate != null ${typeFilter} ORDER BY LastViewedDate DESC LIMIT ${Math.min(limit, 200)}`);
    return ok({ records: result.records || [] });
  } catch (e) { return err('Recent items query failed', e.message); }
}

async function handleDescribeObject({ objectType, includePicklistValues = true }) {
  if (!objectType) return err('objectType is required');
  try {
    const conn = await getConnection();
    const meta = await conn.sobject(objectType).describe();
    const fields = meta.fields.map(f => ({
      name: f.name, label: f.label, type: f.type,
      required: !f.nillable && !f.defaultedOnCreate,
      updateable: f.updateable, createable: f.createable,
      ...(includePicklistValues && f.picklistValues?.length > 0 ? { picklistValues: f.picklistValues.filter(v => v.active).map(v => v.value) } : {}),
    }));
    return ok({ name: meta.name, label: meta.label, fields, fieldCount: fields.length });
  } catch (e) { return err(`Could not describe ${objectType}`, e.message); }
}

// ─── Router ──────────────────────────────────────────────────────────────────

const CRM_HANDLERS = {
  sf_query: handleQuery, sf_search: handleSearch,
  sf_get_record: handleGetRecord, sf_create_record: handleCreateRecord,
  sf_update_record: handleUpdateRecord, sf_delete_record: handleDeleteRecord,
  sf_bulk_create: handleBulkCreate, sf_bulk_update: handleBulkUpdate,
  sf_get_pipeline: handleGetPipeline, sf_get_forecast: handleGetForecast,
  sf_get_account_overview: handleGetAccountOverview,
  sf_create_lead: handleCreateLead, sf_convert_lead: handleConvertLead,
  sf_log_activity: handleLogActivity, sf_create_task: handleCreateTask,
  sf_create_event: handleCreateEvent, sf_get_cases: handleGetCases,
  sf_add_case_comment: handleAddCaseComment, sf_aggregate_query: handleAggregateQuery,
  sf_get_recent_items: handleGetRecentItems, sf_describe_object: handleDescribeObject,
};

export async function handleCrmTool(toolName, args) {
  const handler = CRM_HANDLERS[toolName];
  if (!handler) return { content: [{ type: 'text', text: `Unknown CRM tool: ${toolName}` }], isError: true };
  return handler(args || {});
}
