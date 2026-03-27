/**
 * index.js — SF MCP Server v4.0 (ES Module)
 * 53 dev tools + 21 CRM data tools = 74 tools total
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { TOOLS } from './tools.js';
import { EXPERIENCE_TOOLS } from './tools-experience.js';
import { CRM_TOOLS } from './tools-crm.js';

import { handleApexTool } from './handlers-apex.js';
import { handleLwcTool } from './handlers-lwc.js';
import { handleFlowTool } from './handlers-flows.js';
import { handleMetadataTool } from './handlers-metadata.js';
import { handleExperienceTool } from './handlers-experience.js';
import { handleCrmTool } from './handlers-crm.js';

const server = new Server(
  { name: 'salesforce-dev-mcp', version: '4.0.0' },
  { capabilities: { tools: {} } }
);

const ALL_TOOLS = [...TOOLS, ...EXPERIENCE_TOOLS, ...CRM_TOOLS];

const CRM_TOOL_NAMES = new Set([
  'sf_query', 'sf_search', 'sf_get_record', 'sf_create_record', 'sf_update_record',
  'sf_delete_record', 'sf_bulk_create', 'sf_bulk_update', 'sf_get_pipeline',
  'sf_get_forecast', 'sf_get_account_overview', 'sf_create_lead', 'sf_convert_lead',
  'sf_log_activity', 'sf_create_task', 'sf_create_event', 'sf_get_cases',
  'sf_add_case_comment', 'sf_aggregate_query', 'sf_get_recent_items', 'sf_describe_object',
]);

const APEX_TOOLS = new Set([
  'sf_list_apex_classes', 'sf_get_apex_class', 'sf_create_apex_class', 'sf_update_apex_class',
  'sf_list_apex_triggers', 'sf_get_apex_trigger', 'sf_create_apex_trigger',
  'sf_execute_anonymous_apex', 'sf_run_apex_tests', 'sf_get_apex_logs', 'sf_get_apex_log_body',
]);

const LWC_TOOLS = new Set([
  'sf_list_lwc_components', 'sf_get_lwc_component', 'sf_create_lwc_component',
  'sf_update_lwc_file', 'sf_delete_lwc_component',
]);

const FLOW_TOOLS = new Set([
  'sf_list_flows', 'sf_get_flow_details', 'sf_activate_flow', 'sf_deactivate_flow', 'sf_invoke_flow',
]);

const METADATA_TOOLS = new Set([
  'sf_list_metadata_types', 'sf_list_metadata_components', 'sf_retrieve_metadata',
  'sf_deploy_metadata', 'sf_validate_deploy', 'sf_delete_metadata_components', 'sf_check_deploy_status',
]);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: ALL_TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (CRM_TOOL_NAMES.has(name))      return await handleCrmTool(name, args);
    if (APEX_TOOLS.has(name))          return await handleApexTool(name, args);
    if (LWC_TOOLS.has(name))           return await handleLwcTool(name, args);
    if (FLOW_TOOLS.has(name))          return await handleFlowTool(name, args);
    if (METADATA_TOOLS.has(name))      return await handleMetadataTool(name, args);
    return await handleExperienceTool(name, args);
  } catch (error) {
    return { content: [{ type: 'text', text: `❌ Error in ${name}: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Salesforce MCP Server v4.0 — 74 tools ready (dev + CRM data)');
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
