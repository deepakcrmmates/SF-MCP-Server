# Salesforce Dev MCP Server v3.0

A **Model Context Protocol (MCP)** server that turns Claude into a full **Salesforce development assistant** — write, deploy, retrieve and manage Apex, LWC, Flows, Metadata and Experience Cloud directly from conversation.

Built with Node.js + jsforce + Metadata API.

---

## 🛠 Tools (53 total)

### Apex (11 tools)
| Tool | Description |
|------|-------------|
| `sf_list_apex_classes` | List all Apex classes with status & last modified |
| `sf_get_apex_class` | Get full source code of any Apex class |
| `sf_create_apex_class` | Write & deploy a new Apex class |
| `sf_update_apex_class` | Update existing Apex class source |
| `sf_list_apex_triggers` | List all triggers in the org |
| `sf_get_apex_trigger` | Get full trigger source code |
| `sf_create_apex_trigger` | Write & deploy a new trigger |
| `sf_execute_anonymous_apex` | Run anonymous Apex code |
| `sf_run_apex_tests` | Run test classes, get pass/fail results |
| `sf_get_apex_logs` | Get recent debug logs |
| `sf_get_apex_log_body` | Get full content of a debug log |

### Lightning Web Components (5 tools)
| Tool | Description |
|------|-------------|
| `sf_list_lwc_components` | List all LWC components |
| `sf_get_lwc_component` | Get component metadata & files |
| `sf_create_lwc_component` | Create new LWC (HTML + JS + CSS + meta) |
| `sf_update_lwc_file` | Update a specific file (html/js/css) |
| `sf_delete_lwc_component` | Delete component via destructive deploy |

### Flows & Process Builder (5 tools)
| Tool | Description |
|------|-------------|
| `sf_list_flows` | List all flows with status & type |
| `sf_get_flow_details` | Get flow variables, type, version |
| `sf_activate_flow` | Activate a draft flow |
| `sf_deactivate_flow` | Deactivate an active flow |
| `sf_invoke_flow` | Run a flow with input variables |

### Metadata API (7 tools)
| Tool | Description |
|------|-------------|
| `sf_list_metadata_types` | List all metadata types in the org |
| `sf_list_metadata_components` | List components by type |
| `sf_retrieve_metadata` | Retrieve components as base64 zip |
| `sf_deploy_metadata` | Deploy any metadata component |
| `sf_validate_deploy` | Check-only deploy with test run |
| `sf_delete_metadata_components` | Destructive delete of components |
| `sf_check_deploy_status` | Poll async deploy result by ID |

### Experience Cloud — Sites (6 tools)
| Tool | Description |
|------|-------------|
| `sf_list_experience_sites` | List all sites with status, URL, template |
| `sf_get_experience_site` | Full site details, settings, member count |
| `sf_publish_experience_site` | Publish / activate a site |
| `sf_get_site_pages` | List all pages in a site |
| `sf_get_network_settings` | Get all network/community settings |
| `sf_update_network_settings` | Update self-reg, Chatter, email templates, etc. |

### Experience Cloud — Portal Users (7 tools)
| Tool | Description |
|------|-------------|
| `sf_list_portal_users` | List portal users filtered by site, name, status |
| `sf_get_portal_user` | Get user details — profile, contact, last login |
| `sf_create_portal_user` | Register new portal user linked to Contact |
| `sf_set_portal_user_active` | Enable or disable portal user access |
| `sf_reset_portal_user_password` | Send password reset email |
| `sf_assign_permission_set` | Assign a Permission Set to a user |
| `sf_list_network_members` | List all members of a site |

### Experience Cloud — Navigation (4 tools)
| Tool | Description |
|------|-------------|
| `sf_list_navigation_menus` | List all nav menus in a site |
| `sf_get_navigation_menu` | Get full menu structure and items |
| `sf_create_navigation_menu_item` | Add a new item to a menu |
| `sf_update_navigation_menu_item` | Update label, target, position of an item |

### Experience Cloud — CMS (5 tools)
| Tool | Description |
|------|-------------|
| `sf_list_cms_spaces` | List all CMS workspaces |
| `sf_list_cms_content` | List content by type or search term |
| `sf_get_cms_content` | Get a specific CMS content item |
| `sf_create_cms_content` | Create new CMS content |
| `sf_publish_cms_content` | Publish content to channels |

### Experience Cloud — Branding & Analytics (3 tools)
| Tool | Description |
|------|-------------|
| `sf_get_site_branding` | Get site theme/branding settings |
| `sf_update_site_branding` | Update colours, logo, fonts |
| `sf_get_community_analytics` | Members, new signups, recent logins |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

**Dev / Sandbox:**
```env
SF_LOGIN_URL=https://test.salesforce.com
SF_USERNAME=your@email.com
SF_PASSWORD=yourpassword
SF_SECURITY_TOKEN=yourtoken
SF_API_VERSION=59.0
```

**Production (JWT Bearer):**
```env
SF_LOGIN_URL=https://login.salesforce.com
SF_CLIENT_ID=your_connected_app_consumer_key
SF_USERNAME=your@email.com
SF_PRIVATE_KEY_PATH=./private.pem
SF_API_VERSION=59.0
```

### 3. Run

```bash
npm start
```

---

## Connect to Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "salesforce-dev": {
      "command": "node",
      "args": ["/absolute/path/to/salesforce-dev-mcp/src/index.js"],
      "env": {
        "SF_LOGIN_URL": "https://test.salesforce.com",
        "SF_USERNAME": "your@email.com",
        "SF_PASSWORD": "yourpassword",
        "SF_SECURITY_TOKEN": "yourtoken",
        "SF_API_VERSION": "59.0"
      }
    }
  }
}
```

Config location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

---

## Example Prompts

**Experience Cloud:**
- *"List all Experience Cloud sites and their status"*
- *"Show me all portal users in the KICC Members Portal"*
- *"Create a portal user for John Smith linked to Contact 003xxx using the Customer Community User profile"*
- *"Disable portal access for john@example.com"*
- *"Add a new nav item called 'Resources' to the KICC Main Navigation menu"*
- *"Show me all active flows in the KICC site"*
- *"Get the CMS content from the Members workspace"*
- *"How many new members joined the KICC portal in the last 30 days?"*
- *"Update the KICC portal to enable self-registration"*

**Apex:**
- *"Create an Apex class called MembershipService with a method to check member status"*
- *"Run all test classes and show failures"*

**LWC:**
- *"Create a memberCard LWC for the KICC portal showing name, membership type and expiry"*
- *"Update the JS of memberCard to add a renewMembership method"*

---

## Project Structure

```
salesforce-dev-mcp/
├── src/
│   ├── index.js                  # MCP server entry point + router (53 tools)
│   ├── tools.js                  # Apex, LWC, Flow, Metadata tool definitions
│   ├── tools-experience.js       # Experience Cloud tool definitions
│   ├── connection.js             # Salesforce auth & connection manager
│   ├── metadata-utils.js         # Zip builder, deploy helpers, package.xml
│   ├── handlers-apex.js          # Apex implementations
│   ├── handlers-lwc.js           # LWC implementations
│   ├── handlers-flows.js         # Flow implementations
│   ├── handlers-metadata.js      # Metadata API implementations
│   └── handlers-experience.js    # Experience Cloud implementations
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

Built by **CRM Mates** | deepak@crmmates.com

A **Model Context Protocol (MCP)** server that turns Claude into a full **Salesforce development assistant** — write, deploy, retrieve and manage Apex, LWC, Flows and Metadata directly from conversation.

Built with Node.js + jsforce + Metadata API.

---

## 🛠 Tools (28 total)

### Apex (11 tools)
| Tool | Description |
|------|-------------|
| `sf_list_apex_classes` | List all Apex classes with status & last modified |
| `sf_get_apex_class` | Get full source code of any Apex class |
| `sf_create_apex_class` | Write & deploy a new Apex class |
| `sf_update_apex_class` | Update existing Apex class source |
| `sf_list_apex_triggers` | List all triggers in the org |
| `sf_get_apex_trigger` | Get full trigger source code |
| `sf_create_apex_trigger` | Write & deploy a new trigger |
| `sf_execute_anonymous_apex` | Run anonymous Apex code |
| `sf_run_apex_tests` | Run test classes, get pass/fail results |
| `sf_get_apex_logs` | Get recent debug logs |
| `sf_get_apex_log_body` | Get full content of a debug log |

### Lightning Web Components (5 tools)
| Tool | Description |
|------|-------------|
| `sf_list_lwc_components` | List all LWC components |
| `sf_get_lwc_component` | Get component metadata & files |
| `sf_create_lwc_component` | Create new LWC (HTML + JS + CSS + meta) |
| `sf_update_lwc_file` | Update a specific file (html/js/css) |
| `sf_delete_lwc_component` | Delete component via destructive deploy |

### Flows & Process Builder (5 tools)
| Tool | Description |
|------|-------------|
| `sf_list_flows` | List all flows with status & type |
| `sf_get_flow_details` | Get flow variables, type, version |
| `sf_activate_flow` | Activate a draft flow |
| `sf_deactivate_flow` | Deactivate an active flow |
| `sf_invoke_flow` | Run a flow with input variables |

### Metadata API (7 tools)
| Tool | Description |
|------|-------------|
| `sf_list_metadata_types` | List all metadata types in the org |
| `sf_list_metadata_components` | List components by type |
| `sf_retrieve_metadata` | Retrieve components as base64 zip |
| `sf_deploy_metadata` | Deploy any metadata component |
| `sf_validate_deploy` | Check-only deploy with test run |
| `sf_delete_metadata_components` | Destructive delete of components |
| `sf_check_deploy_status` | Poll async deploy result by ID |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

**Dev / Sandbox (Username + Password):**
```env
SF_LOGIN_URL=https://test.salesforce.com
SF_USERNAME=your@email.com
SF_PASSWORD=yourpassword
SF_SECURITY_TOKEN=yourtoken
SF_API_VERSION=59.0
```

**Production (JWT Bearer — recommended):**
```env
SF_LOGIN_URL=https://login.salesforce.com
SF_CLIENT_ID=your_connected_app_consumer_key
SF_USERNAME=your@email.com
SF_PRIVATE_KEY_PATH=./private.pem
SF_API_VERSION=59.0
```

### 3. Run

```bash
npm start
```

---

## Connect to Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "salesforce-dev": {
      "command": "node",
      "args": ["/absolute/path/to/salesforce-dev-mcp/src/index.js"],
      "env": {
        "SF_LOGIN_URL": "https://test.salesforce.com",
        "SF_USERNAME": "your@email.com",
        "SF_PASSWORD": "yourpassword",
        "SF_SECURITY_TOKEN": "yourtoken",
        "SF_API_VERSION": "59.0"
      }
    }
  }
}
```

Config file location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

---

## Example Prompts

**Apex:**
- *"Show me the source code of AccountService class"*
- *"Create an Apex trigger on Contact that sets the Salutation when a record is inserted"*
- *"Run all test classes and show me which ones are failing"*
- *"Execute this Apex: Account a = [SELECT Id FROM Account LIMIT 1]; System.debug(a);"*

**LWC:**
- *"Create an LWC component called memberCard that shows a member's name and status"*
- *"Update the JS file of myComponent to add a handleClick method"*
- *"List all LWC components that contain 'portal' in the name"*

**Flows:**
- *"List all active autolaunched flows"*
- *"Activate the Welcome_Email_Flow"*
- *"Run the Member_Onboarding flow with MemberId = '001xxx'"*

**Metadata:**
- *"Retrieve the AccountLayout page layout metadata"*
- *"Deploy a new Permission Set called KICC_Member_PS"*
- *"Validate this deployment against RunLocalTests before pushing"*
- *"Delete the old MyComponent LWC from the org"*

---

## Project Structure

```
salesforce-dev-mcp/
├── src/
│   ├── index.js              # MCP server entry point + router
│   ├── tools.js              # All 28 tool definitions
│   ├── connection.js         # Salesforce auth & connection manager
│   ├── metadata-utils.js     # Zip builder, deploy helpers, package.xml
│   ├── handlers-apex.js      # Apex tool implementations
│   ├── handlers-lwc.js       # LWC tool implementations
│   ├── handlers-flows.js     # Flow tool implementations
│   └── handlers-metadata.js  # Metadata API tool implementations
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

Built by **Deepak K Rana** | deepak@crmmates.com
