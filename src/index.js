/**
 * index.js  —  SF MCP Server v4.0
 *
 * DROP-IN REPLACEMENT for your existing src/index.js
 *
 * What changed vs v3.0:
 *  • Imports CRM_TOOLS from tools-crm.js  (+21 tools)
 *  • Imports handleCrmTool from handlers-crm.js
 *  • Merges CRM tools into the tool list alongside existing dev tools
 *  • Routes CRM tool calls to handleCrmTool
 *  • All existing Apex / LWC / Flow / Metadata / Experience tools unchanged
 *
 * Total tool count: 53 (dev) + 21 (CRM data) = 74 tools
 */

'use strict';

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// ── Existing tool definitions ───────────────────────────────────────────────
const { TOOLS } = require('./tools');                    // Apex + LWC + Flow + Metadata (28)
const { EXPERIENCE_TOOLS } = require('./tools-experience'); // Experience Cloud (25)

// ── NEW: CRM data tool definitions ─────────────────────────────────────────
const { CRM_TOOLS } = require('./tools-crm');            // CRM data (21)

// ── Existing handlers ───────────────────────────────────────────────────────
const { handleApexTool } = require('./handlers-apex');
const { handleLwcTool } = require('./handlers-lwc');
const { handleFlowTool } = require('./handlers-flows');
const { handleMetadataTool } = require('./handlers-metadata');
const { handleExperienceTool } = require('./handlers-experience');

// ── NEW: CRM data handlers ──────────────────────────────────────────────────
const { handleCrmTool } = require('./handlers-crm');

// ── Server setup ─────────────────────────────────────────────────────────────
const server = new Server(
  { name: 'salesforce-dev-mcp', version: '4.0.0' },
  { capabilities: { tools: {} } }
);

// ── Merge all tool lists ──────────────────────────────────────────────────────
const ALL_TOOLS = [
  ...TOOLS,
  ...EXPERIENCE_TOOLS,
  ...CRM_TOOLS,
];

// ── List tools handler ────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS,
}));

// ── Call tool handler ─────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // ── CRM data tools ────────────────────────────────────────────────────
    const CRM_TOOL_NAMES = new Set([
      'sf_query',
      'sf_search',
      'sf_get_record',
      'sf_create_record',
      'sf_update_record',
      'sf_delete_record',
      'sf_bulk_create',
      'sf_bulk_update',
      'sf_get_pipeline',
      'sf_get_forecast',
      'sf_get_account_overview',
      'sf_create_lead',
      'sf_convert_lead',
      'sf_log_activity',
      'sf_create_task',
      'sf_create_event',
      'sf_get_cases',
      'sf_add_case_comment',
      'sf_aggregate_query',
      'sf_get_recent_items',
      'sf_describe_object',
    ]);

    if (CRM_TOOL_NAMES.has(name)) {
      return await handleCrmTool(name, args);
    }

    // ── Apex tools ────────────────────────────────────────────────────────
    const APEX_TOOLS = new Set([
      'sf_list_apex_classes', 'sf_get_apex_class', 'sf_create_apex_class',
      'sf_update_apex_class', 'sf_list_apex_triggers', 'sf_get_apex_trigger',
      'sf_create_apex_trigger', 'sf_execute_anonymous_apex', 'sf_run_apex_tests',
      'sf_get_apex_logs', 'sf_get_apex_log_body',
    ]);
    if (APEX_TOOLS.has(name)) return await handleApexTool(name, args);

    // ── LWC tools ─────────────────────────────────────────────────────────
    const LWC_TOOLS = new Set([
      'sf_list_lwc_components', 'sf_get_lwc_component', 'sf_create_lwc_component',
      'sf_update_lwc_file', 'sf_delete_lwc_component',
    ]);
    if (LWC_TOOLS.has(name)) return await handleLwcTool(name, args);

    // ── Flow tools ────────────────────────────────────────────────────────
    const FLOW_TOOLS = new Set([
      'sf_list_flows', 'sf_get_flow_details', 'sf_activate_flow',
      'sf_deactivate_flow', 'sf_invoke_flow',
    ]);
    if (FLOW_TOOLS.has(name)) return await handleFlowTool(name, args);

    // ── Metadata tools ────────────────────────────────────────────────────
    const METADATA_TOOLS = new Set([
      'sf_list_metadata_types', 'sf_list_metadata_components', 'sf_retrieve_metadata',
      'sf_deploy_metadata', 'sf_validate_deploy', 'sf_delete_metadata_components',
      'sf_check_deploy_status',
    ]);
    if (METADATA_TOOLS.has(name)) return await handleMetadataTool(name, args);

    // ── Experience Cloud tools ────────────────────────────────────────────
    return await handleExperienceTool(name, args);

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ Error in ${name}: ${error.message}\n${error.stack || ''}`,
      }],
      isError: true,
    };
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Salesforce MCP Server v4.0 running (74 tools: dev + CRM data)');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
