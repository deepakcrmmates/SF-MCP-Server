export const EXPERIENCE_TOOLS = [

  // ══════════════════════════════════════════════
  // SITES
  // ══════════════════════════════════════════════
  {
    name: "sf_list_experience_sites",
    description: "List all Experience Cloud sites in the org with status, URL, template and type.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter by site name (partial match)" },
        status: {
          type: "string",
          enum: ["Live", "DownForMaintenance", "UnderConstruction"],
          description: "Filter by site status",
        },
      },
    },
  },
  {
    name: "sf_get_experience_site",
    description: "Get full details of an Experience Cloud site including settings, guest user, template and member count.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
      },
      required: ["site_name"],
    },
  },
  {
    name: "sf_publish_experience_site",
    description: "Publish / activate an Experience Cloud site to make it live.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site to publish" },
      },
      required: ["site_name"],
    },
  },
  {
    name: "sf_get_site_pages",
    description: "List all pages (FlexiPages and SitePages) in an Experience Cloud site.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
      },
      required: ["site_name"],
    },
  },
  {
    name: "sf_get_network_settings",
    description: "Get all network/community settings for an Experience Cloud site — self-registration, Chatter, email templates, etc.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
      },
      required: ["site_name"],
    },
  },
  {
    name: "sf_update_network_settings",
    description: "Update settings on an Experience Cloud site such as self-registration, Chatter, guest access.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
        settings: {
          type: "object",
          description: "Key-value pairs of Network field API names to update. E.g. { OptionsAllowNewSelfRegistrations: true }",
        },
      },
      required: ["site_name", "settings"],
    },
  },

  // ══════════════════════════════════════════════
  // PORTAL USERS
  // ══════════════════════════════════════════════
  {
    name: "sf_list_portal_users",
    description: "List portal/community users. Optionally filter by site, name, email or active status.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Filter to users in a specific site" },
        filter: { type: "string", description: "Filter by name or email (partial match)" },
        is_active: { type: "boolean", description: "Filter by active status" },
        limit: { type: "number", description: "Max results (default 50)" },
      },
    },
  },
  {
    name: "sf_get_portal_user",
    description: "Get full details of a portal user by username or email — profile, contact, account, last login.",
    inputSchema: {
      type: "object",
      properties: {
        username_or_email: { type: "string", description: "Username or email of the portal user" },
      },
      required: ["username_or_email"],
    },
  },
  {
    name: "sf_create_portal_user",
    description: "Register a new portal/community user linked to a Contact record.",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Salesforce Contact Id to link the user to" },
        profile_name: { type: "string", description: "Profile name e.g. 'Customer Community User', 'Partner Community User'" },
        username: { type: "string", description: "Username (must be unique, email format). Defaults to email if not provided." },
        email: { type: "string", description: "User email address" },
        first_name: { type: "string", description: "First name (defaults to Contact first name)" },
        last_name: { type: "string", description: "Last name (defaults to Contact last name)" },
        send_welcome_email: { type: "boolean", description: "Send welcome email (default true)" },
      },
      required: ["contact_id", "profile_name"],
    },
  },
  {
    name: "sf_set_portal_user_active",
    description: "Enable or disable a portal user's access.",
    inputSchema: {
      type: "object",
      properties: {
        username_or_email: { type: "string", description: "Username or email of the portal user" },
        is_active: { type: "boolean", description: "true to enable, false to disable" },
      },
      required: ["username_or_email", "is_active"],
    },
  },
  {
    name: "sf_reset_portal_user_password",
    description: "Send a password reset email to a portal user.",
    inputSchema: {
      type: "object",
      properties: {
        username_or_email: { type: "string", description: "Username or email of the portal user" },
      },
      required: ["username_or_email"],
    },
  },
  {
    name: "sf_assign_permission_set",
    description: "Assign a Permission Set to a portal or internal user.",
    inputSchema: {
      type: "object",
      properties: {
        username_or_email: { type: "string", description: "Username or email of the user" },
        permission_set_name: { type: "string", description: "API name of the Permission Set" },
      },
      required: ["username_or_email", "permission_set_name"],
    },
  },
  {
    name: "sf_list_network_members",
    description: "List all members (users) who belong to a specific Experience Cloud site.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
        limit: { type: "number", description: "Max results (default 50)" },
      },
      required: ["site_name"],
    },
  },

  // ══════════════════════════════════════════════
  // NAVIGATION MENUS
  // ══════════════════════════════════════════════
  {
    name: "sf_list_navigation_menus",
    description: "List all navigation menus in an Experience Cloud site.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Filter menus by site name" },
      },
    },
  },
  {
    name: "sf_get_navigation_menu",
    description: "Get all items and structure of a navigation menu.",
    inputSchema: {
      type: "object",
      properties: {
        menu_name: { type: "string", description: "Label or developer name of the navigation menu" },
      },
      required: ["menu_name"],
    },
  },
  {
    name: "sf_create_navigation_menu_item",
    description: "Add a new item to a navigation menu in an Experience Cloud site.",
    inputSchema: {
      type: "object",
      properties: {
        menu_name: { type: "string", description: "Label or developer name of the menu" },
        label: { type: "string", description: "Display label for the new item" },
        target: { type: "string", description: "URL or page reference target" },
        type: {
          type: "string",
          enum: ["InternalLink", "ExternalLink", "Event", "SalesforceObject", "GlobalAction", "NavigationalTopic"],
          description: "Type of navigation item (default: InternalLink)",
        },
        position: { type: "number", description: "Position in the menu (1 = first)" },
        parent_label: { type: "string", description: "Label of parent menu item (for sub-items)" },
      },
      required: ["menu_name", "label", "target"],
    },
  },
  {
    name: "sf_update_navigation_menu_item",
    description: "Update an existing navigation menu item (label, target, position, status).",
    inputSchema: {
      type: "object",
      properties: {
        menu_name: { type: "string", description: "Label or developer name of the menu" },
        item_label: { type: "string", description: "Current label of the item to update" },
        updates: {
          type: "object",
          description: "Fields to update e.g. { Label: 'New Label', Target: '/new-page', Status: 'Draft' }",
        },
      },
      required: ["menu_name", "item_label", "updates"],
    },
  },

  // ══════════════════════════════════════════════
  // CMS CONTENT
  // ══════════════════════════════════════════════
  {
    name: "sf_list_cms_spaces",
    description: "List all CMS Workspaces (spaces) in the org.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "sf_list_cms_content",
    description: "List CMS content items in a workspace. Filter by content type or search term.",
    inputSchema: {
      type: "object",
      properties: {
        space_id: { type: "string", description: "CMS Workspace ID to list content from" },
        managed_content_type: { type: "string", description: "Content type filter e.g. cms_document, cms_image, news" },
        filter: { type: "string", description: "Search term to filter content by title" },
      },
    },
  },
  {
    name: "sf_get_cms_content",
    description: "Get a specific CMS content item by its content key.",
    inputSchema: {
      type: "object",
      properties: {
        content_key: { type: "string", description: "The CMS content key/ID" },
      },
      required: ["content_key"],
    },
  },
  {
    name: "sf_create_cms_content",
    description: "Create a new CMS content item in a workspace.",
    inputSchema: {
      type: "object",
      properties: {
        space_id: { type: "string", description: "CMS Workspace ID" },
        title: { type: "string", description: "Content title" },
        content_type: { type: "string", description: "Content type e.g. cms_document, news (default: cms_document)" },
        content_body: { type: "object", description: "Content body as key-value pairs for the content type fields" },
        channel_ids: {
          type: "array",
          items: { type: "string" },
          description: "Channel IDs to publish this content to",
        },
      },
      required: ["space_id", "title"],
    },
  },
  {
    name: "sf_publish_cms_content",
    description: "Publish a CMS content item to one or more channels.",
    inputSchema: {
      type: "object",
      properties: {
        content_key: { type: "string", description: "The CMS content key to publish" },
        channel_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of channel IDs to publish to",
        },
      },
      required: ["content_key"],
    },
  },

  // ══════════════════════════════════════════════
  // BRANDING & ANALYTICS
  // ══════════════════════════════════════════════
  {
    name: "sf_get_site_branding",
    description: "Get branding and theme settings for an Experience Cloud site.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
      },
      required: ["site_name"],
    },
  },
  {
    name: "sf_update_site_branding",
    description: "Update branding and theme settings for an Experience Cloud site (colours, logo, fonts).",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
        branding: {
          type: "object",
          description: "Branding properties to update e.g. { primaryColor: '#FF5733', siteLogo: 'resourceName' }",
        },
      },
      required: ["site_name", "branding"],
    },
  },
  {
    name: "sf_get_community_analytics",
    description: "Get analytics summary for an Experience Cloud site — total members, new members, recent logins.",
    inputSchema: {
      type: "object",
      properties: {
        site_name: { type: "string", description: "Name of the Experience Cloud site" },
      },
      required: ["site_name"],
    },
  },
];
