export const TOOLS = [

  // ══════════════════════════════════════════════
  // APEX TOOLS
  // ══════════════════════════════════════════════
  {
    name: "sf_list_apex_classes",
    description: "List all Apex classes in the org with status and last modified info.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Optional name filter (partial match)" },
      },
    },
  },
  {
    name: "sf_get_apex_class",
    description: "Retrieve the full source code of an Apex class by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "API name of the Apex class" },
      },
      required: ["name"],
    },
  },
  {
    name: "sf_create_apex_class",
    description: "Create a new Apex class and deploy it to Salesforce via Metadata API.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "API name for the new class (no spaces)" },
        body: { type: "string", description: "Full Apex class source code" },
        api_version: { type: "string", description: "API version (default: 59.0)" },
      },
      required: ["name", "body"],
    },
  },
  {
    name: "sf_update_apex_class",
    description: "Update/overwrite an existing Apex class with new source code.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "API name of the existing Apex class" },
        body: { type: "string", description: "New full source code for the class" },
      },
      required: ["name", "body"],
    },
  },
  {
    name: "sf_list_apex_triggers",
    description: "List all Apex triggers in the org.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Optional name filter" },
      },
    },
  },
  {
    name: "sf_get_apex_trigger",
    description: "Retrieve the full source code of an Apex trigger by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "API name of the trigger" },
      },
      required: ["name"],
    },
  },
  {
    name: "sf_create_apex_trigger",
    description: "Create a new Apex trigger and deploy it to Salesforce.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "API name for the new trigger" },
        object_name: { type: "string", description: "The SObject the trigger fires on (e.g. Account)" },
        body: { type: "string", description: "Full trigger source code" },
        api_version: { type: "string", description: "API version (default: 59.0)" },
      },
      required: ["name", "object_name", "body"],
    },
  },
  {
    name: "sf_execute_anonymous_apex",
    description: "Execute anonymous Apex code in the org. Great for testing logic or running one-off scripts.",
    inputSchema: {
      type: "object",
      properties: {
        apex_code: { type: "string", description: "The Apex code to execute anonymously" },
      },
      required: ["apex_code"],
    },
  },
  {
    name: "sf_run_apex_tests",
    description: "Run Apex test classes and return pass/fail results with error details.",
    inputSchema: {
      type: "object",
      properties: {
        class_names: {
          type: "array",
          items: { type: "string" },
          description: "List of test class names to run",
        },
        all_tests: { type: "boolean", description: "Set true to run all tests in org" },
      },
    },
  },
  {
    name: "sf_get_apex_logs",
    description: "Get recent Apex debug logs from the org.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of logs to return (default 10)" },
        user_name: { type: "string", description: "Filter logs by user name" },
      },
    },
  },
  {
    name: "sf_get_apex_log_body",
    description: "Get the full content of a specific Apex debug log by ID.",
    inputSchema: {
      type: "object",
      properties: {
        log_id: { type: "string", description: "The Apex log record ID" },
      },
      required: ["log_id"],
    },
  },

  // ══════════════════════════════════════════════
  // LWC TOOLS
  // ══════════════════════════════════════════════
  {
    name: "sf_list_lwc_components",
    description: "List all Lightning Web Components (LWC) in the org.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Optional name filter" },
      },
    },
  },
  {
    name: "sf_get_lwc_component",
    description: "Retrieve metadata and file details of an LWC component.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "API name of the LWC component" },
      },
      required: ["name"],
    },
  },
  {
    name: "sf_create_lwc_component",
    description: "Create a new Lightning Web Component and deploy it to Salesforce.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "camelCase component name (e.g. myComponent)" },
        html: { type: "string", description: "HTML template content" },
        js: { type: "string", description: "JavaScript controller content" },
        css: { type: "string", description: "Optional CSS styles" },
        description: { type: "string", description: "Component description" },
        targets: {
          type: "array",
          items: { type: "string" },
          description: "Deployment targets e.g. ['lightning__RecordPage', 'lightning__AppPage']",
        },
        is_exposed: { type: "boolean", description: "Whether visible in App Builder (default true)" },
        api_version: { type: "string", description: "API version (default 59.0)" },
      },
      required: ["name"],
    },
  },
  {
    name: "sf_update_lwc_file",
    description: "Update a specific file (html, js, or css) within an existing LWC component.",
    inputSchema: {
      type: "object",
      properties: {
        component_name: { type: "string", description: "API name of the LWC component" },
        file_type: {
          type: "string",
          enum: ["html", "js", "css"],
          description: "Which file to update",
        },
        content: { type: "string", description: "New file content" },
      },
      required: ["component_name", "file_type", "content"],
    },
  },
  {
    name: "sf_delete_lwc_component",
    description: "Delete an LWC component from Salesforce via destructive deployment.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "API name of the LWC component to delete" },
      },
      required: ["name"],
    },
  },

  // ══════════════════════════════════════════════
  // FLOW TOOLS
  // ══════════════════════════════════════════════
  {
    name: "sf_list_flows",
    description: "List all Flows in the org with status, type and last modified.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter by name or label" },
        status: {
          type: "string",
          enum: ["Active", "Draft", "Obsolete", "InvalidDraft"],
          description: "Filter by flow status",
        },
      },
    },
  },
  {
    name: "sf_get_flow_details",
    description: "Get full details of a Flow including variables, process type and version.",
    inputSchema: {
      type: "object",
      properties: {
        api_name: { type: "string", description: "API name of the Flow" },
      },
      required: ["api_name"],
    },
  },
  {
    name: "sf_activate_flow",
    description: "Activate a draft Flow version.",
    inputSchema: {
      type: "object",
      properties: {
        api_name: { type: "string", description: "API name of the Flow to activate" },
      },
      required: ["api_name"],
    },
  },
  {
    name: "sf_deactivate_flow",
    description: "Deactivate (set to Obsolete) an active Flow.",
    inputSchema: {
      type: "object",
      properties: {
        api_name: { type: "string", description: "API name of the Flow to deactivate" },
      },
      required: ["api_name"],
    },
  },
  {
    name: "sf_invoke_flow",
    description: "Invoke an autolaunched Flow by API name with optional input variables.",
    inputSchema: {
      type: "object",
      properties: {
        flow_api_name: { type: "string", description: "API name of the Flow to invoke" },
        inputs: { type: "object", description: "Input variable key-value pairs for the flow" },
      },
      required: ["flow_api_name"],
    },
  },

  // ══════════════════════════════════════════════
  // METADATA API TOOLS
  // ══════════════════════════════════════════════
  {
    name: "sf_list_metadata_types",
    description: "List all available Metadata API types in the org (ApexClass, LWC, CustomObject, etc.)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "sf_list_metadata_components",
    description: "List all components of a specific metadata type in the org.",
    inputSchema: {
      type: "object",
      properties: {
        metadata_type: { type: "string", description: "Metadata type name e.g. ApexClass, CustomObject, Layout" },
        folder: { type: "string", description: "Optional folder name (for types like Report, Document)" },
      },
      required: ["metadata_type"],
    },
  },
  {
    name: "sf_retrieve_metadata",
    description: "Retrieve metadata components from Salesforce as a base64 zip.",
    inputSchema: {
      type: "object",
      properties: {
        metadata_type: { type: "string", description: "Metadata type e.g. ApexClass" },
        component_names: {
          type: "array",
          items: { type: "string" },
          description: "List of component API names to retrieve",
        },
      },
      required: ["metadata_type", "component_names"],
    },
  },
  {
    name: "sf_deploy_metadata",
    description: "Deploy one or more metadata components to Salesforce via Metadata API.",
    inputSchema: {
      type: "object",
      properties: {
        components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", description: "Metadata type e.g. ApexClass" },
              name: { type: "string", description: "Component API name" },
              content: { type: "string", description: "Main file content" },
              meta_content: { type: "string", description: "Meta XML content (optional)" },
            },
            required: ["type", "name", "content"],
          },
          description: "Array of components to deploy",
        },
        check_only: { type: "boolean", description: "If true, validates without deploying" },
        test_level: {
          type: "string",
          enum: ["NoTestRun", "RunSpecifiedTests", "RunLocalTests", "RunAllTestsInOrg"],
        },
        run_all_tests: { type: "boolean", description: "Run all tests during deploy" },
      },
      required: ["components"],
    },
  },
  {
    name: "sf_validate_deploy",
    description: "Validate a deployment without making changes (check-only deploy with tests).",
    inputSchema: {
      type: "object",
      properties: {
        components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              name: { type: "string" },
              content: { type: "string" },
              meta_content: { type: "string" },
            },
            required: ["type", "name", "content"],
          },
        },
        test_level: {
          type: "string",
          enum: ["RunLocalTests", "RunAllTestsInOrg", "RunSpecifiedTests"],
          description: "Test level for validation (default: RunLocalTests)",
        },
      },
      required: ["components"],
    },
  },
  {
    name: "sf_delete_metadata_components",
    description: "Delete metadata components from Salesforce using destructive deployment.",
    inputSchema: {
      type: "object",
      properties: {
        components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", description: "Metadata type" },
              name: { type: "string", description: "Component API name" },
            },
            required: ["type", "name"],
          },
        },
      },
      required: ["components"],
    },
  },
  {
    name: "sf_check_deploy_status",
    description: "Check the status of an async metadata deployment by deploy ID.",
    inputSchema: {
      type: "object",
      properties: {
        deploy_id: { type: "string", description: "The deployment ID to check" },
      },
      required: ["deploy_id"],
    },
  },
];
