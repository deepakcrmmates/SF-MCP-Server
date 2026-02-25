import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOLS } from "./tools.js";
import { EXPERIENCE_TOOLS } from "./tools-experience.js";

// Apex
import {
  listApexClasses, getApexClass, createApexClass, updateApexClass,
  listApexTriggers, getApexTrigger, createApexTrigger,
  executeAnonymousApex, runApexTests, getApexLogs, getApexLogBody,
} from "./handlers-apex.js";

// LWC
import {
  listLwcComponents, getLwcComponent, createLwcComponent,
  updateLwcFile, deleteLwcComponent,
} from "./handlers-lwc.js";

// Flows
import {
  listFlows, getFlowDetails, activateFlow, deactivateFlow,
  invokeFlow,
} from "./handlers-flows.js";

// Metadata
import {
  listMetadataTypes, listMetadataComponents, retrieveMetadata,
  deployMetadata, validateDeploy, deleteMetadataComponents, checkDeployStatus,
} from "./handlers-metadata.js";

// Experience Cloud
import {
  listExperienceSites, getExperienceSite, publishExperienceSite,
  getSitePages, getNetworkSettings, updateNetworkSettings,
  listPortalUsers, getPortalUser, createPortalUser, setPortalUserActive,
  resetPortalUserPassword, assignPermissionSet, listNetworkMembers,
  listNavigationMenus, getNavigationMenu, createNavigationMenuItem, updateNavigationMenuItem,
  listCmsSpaces, listCmsContent, getCmsContent, createCmsContent, publishCmsContent,
  getSiteBranding, updateSiteBranding, getCommunityAnalytics,
} from "./handlers-experience.js";

// ─── Server Setup ─────────────────────────────────────────────────────────────
const ALL_TOOLS = [...TOOLS, ...EXPERIENCE_TOOLS];

const server = new Server(
  { name: "salesforce-dev-mcp", version: "3.0.0" },
  { capabilities: { tools: {} } }
);

// ─── List Tools ───────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: ALL_TOOLS }));

// ─── Call Tool ────────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      // ── Apex ──
      case "sf_list_apex_classes":       result = await listApexClasses(args); break;
      case "sf_get_apex_class":          result = await getApexClass(args); break;
      case "sf_create_apex_class":       result = await createApexClass(args); break;
      case "sf_update_apex_class":       result = await updateApexClass(args); break;
      case "sf_list_apex_triggers":      result = await listApexTriggers(args); break;
      case "sf_get_apex_trigger":        result = await getApexTrigger(args); break;
      case "sf_create_apex_trigger":     result = await createApexTrigger(args); break;
      case "sf_execute_anonymous_apex":  result = await executeAnonymousApex(args); break;
      case "sf_run_apex_tests":          result = await runApexTests(args); break;
      case "sf_get_apex_logs":           result = await getApexLogs(args); break;
      case "sf_get_apex_log_body":       result = await getApexLogBody(args); break;

      // ── LWC ──
      case "sf_list_lwc_components":     result = await listLwcComponents(args); break;
      case "sf_get_lwc_component":       result = await getLwcComponent(args); break;
      case "sf_create_lwc_component":    result = await createLwcComponent(args); break;
      case "sf_update_lwc_file":         result = await updateLwcFile(args); break;
      case "sf_delete_lwc_component":    result = await deleteLwcComponent(args); break;

      // ── Flows ──
      case "sf_list_flows":              result = await listFlows(args); break;
      case "sf_get_flow_details":        result = await getFlowDetails(args); break;
      case "sf_activate_flow":           result = await activateFlow(args); break;
      case "sf_deactivate_flow":         result = await deactivateFlow(args); break;
      case "sf_invoke_flow":             result = await invokeFlow(args); break;

      // ── Metadata ──
      case "sf_list_metadata_types":       result = await listMetadataTypes(); break;
      case "sf_list_metadata_components":  result = await listMetadataComponents(args); break;
      case "sf_retrieve_metadata":         result = await retrieveMetadata(args); break;
      case "sf_deploy_metadata":           result = await deployMetadata(args); break;
      case "sf_validate_deploy":           result = await validateDeploy(args); break;
      case "sf_delete_metadata_components":result = await deleteMetadataComponents(args); break;
      case "sf_check_deploy_status":        result = await checkDeployStatus(args); break;

      // ── Experience Cloud — Sites ───────────────
      case "sf_list_experience_sites":      result = await listExperienceSites(args); break;
      case "sf_get_experience_site":        result = await getExperienceSite(args); break;
      case "sf_publish_experience_site":    result = await publishExperienceSite(args); break;
      case "sf_get_site_pages":             result = await getSitePages(args); break;
      case "sf_get_network_settings":       result = await getNetworkSettings(args); break;
      case "sf_update_network_settings":    result = await updateNetworkSettings(args); break;

      // ── Experience Cloud — Portal Users ────────
      case "sf_list_portal_users":          result = await listPortalUsers(args); break;
      case "sf_get_portal_user":            result = await getPortalUser(args); break;
      case "sf_create_portal_user":         result = await createPortalUser(args); break;
      case "sf_set_portal_user_active":     result = await setPortalUserActive(args); break;
      case "sf_reset_portal_user_password": result = await resetPortalUserPassword(args); break;
      case "sf_assign_permission_set":      result = await assignPermissionSet(args); break;
      case "sf_list_network_members":       result = await listNetworkMembers(args); break;

      // ── Experience Cloud — Navigation ──────────
      case "sf_list_navigation_menus":      result = await listNavigationMenus(args); break;
      case "sf_get_navigation_menu":        result = await getNavigationMenu(args); break;
      case "sf_create_navigation_menu_item":result = await createNavigationMenuItem(args); break;
      case "sf_update_navigation_menu_item":result = await updateNavigationMenuItem(args); break;

      // ── Experience Cloud — CMS ─────────────────
      case "sf_list_cms_spaces":            result = await listCmsSpaces(); break;
      case "sf_list_cms_content":           result = await listCmsContent(args); break;
      case "sf_get_cms_content":            result = await getCmsContent(args); break;
      case "sf_create_cms_content":         result = await createCmsContent(args); break;
      case "sf_publish_cms_content":        result = await publishCmsContent(args); break;

      // ── Experience Cloud — Branding & Analytics ─
      case "sf_get_site_branding":          result = await getSiteBranding(args); break;
      case "sf_update_site_branding":       result = await updateSiteBranding(args); break;
      case "sf_get_community_analytics":    result = await getCommunityAnalytics(args); break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("🚀 Salesforce Dev MCP Server v3.0 running");
console.error("📦 Apex (11) | LWC (5) | Flows (5) | Metadata (7) | Experience Cloud (25) = 53 tools total");
