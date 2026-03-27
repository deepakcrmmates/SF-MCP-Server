# Salesforce MCP Server v4.0

A **Model Context Protocol (MCP)** server that connects Claude directly to any Salesforce org —
combining a full **CRM data layer** (read, write, search, pipeline, activities) with a complete
**Salesforce development assistant** (Apex, LWC, Flows, Metadata, Experience Cloud).

Built with **Node.js + jsforce + Metadata API**.

---

## 🔌 What you can do

| Capability | Details |
|---|---|
| 🔌 **Live CRM connection** | Direct authenticated access to any Salesforce org — sandbox or production |
| 🗣️ **Natural language → SOQL** | Ask questions in plain English; Claude writes and executes the SOQL |
| 📝 **Read & write records** | Query, create, update, delete Leads, Contacts, Accounts, Opportunities, Cases, Tasks, Events |
| 📊 **Pipeline & forecast** | Open pipeline by stage, quarterly revenue forecast, aggregate roll-ups |
| 🔍 **Cross-object search** | SOSL search across Accounts, Contacts, Leads, Opportunities in one call |
| 🗂️ **Account 360** | One call returns account + related contacts + opportunities + cases + activity |
| ⚡ **Log activities** | Log calls, create tasks, schedule events — straight from conversation |
| 🔒 **OAuth 2.0 / JWT** | Username+password (sandbox) or JWT Bearer (production) — credentials stay on your infra |
| 🛠️ **Full dev toolset** | Apex, LWC, Flows, Metadata API, Experience Cloud — 53 dev tools unchanged |

---

## 🛠 Tools — 74 total

### CRM Data (21 tools) ← **New in v4.0**

#### Query & Search
| Tool | Description |
|---|---|
| `sf_query` | Execute any SOQL — returns live records from the org |
| `sf_search` | SOSL search across multiple objects simultaneously |
| `sf_aggregate_query` | GROUP BY / SUM / COUNT for dashboards and revenue roll-ups |
| `sf_get_recent_items` | Recently viewed records across any object |
| `sf_describe_object` | Field schema + picklist values for any object |

#### Record CRUD
| Tool | Description |
|---|---|
| `sf_get_record` | Fetch a single record by Id |
| `sf_create_record` | Create any record (Lead, Contact, Account, Opportunity, Case, custom) |
| `sf_update_record` | Update specific fields on an existing record |
| `sf_delete_record` | Delete a record |
| `sf_bulk_create` | Create up to 200 records in one DML call |
| `sf_bulk_update` | Update up to 200 records in one DML call |

#### Pipeline & Revenue
| Tool | Description |
|---|---|
| `sf_get_pipeline` | Open opportunities grouped by stage with totals — filter by owner, date, amount |
| `sf_get_forecast` | Quarterly/monthly revenue forecast by ForecastCategory |
| `sf_get_account_overview` | Account 360: details + contacts + opps + cases + activities in one response |

#### Leads
| Tool | Description |
|---|---|
| `sf_create_lead` | Create a Lead with validation and sensible defaults |
| `sf_convert_lead` | Convert Lead → Account + Contact + Opportunity |

#### Activities
| Tool | Description |
|---|---|
| `sf_log_activity` | Log a completed activity (call, email, meeting note) against any record |
| `sf_create_task` | Create an open follow-up Task |
| `sf_create_event` | Create a calendar Event (meeting, demo, call) |

#### Cases
| Tool | Description |
|---|---|
| `sf_get_cases` | List cases filtered by account, status, priority |
| `sf_add_case_comment` | Add an internal or public comment to a Case |

---

### Apex (11 tools)

| Tool | Description |
|---|---|
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
|---|---|
| `sf_list_lwc_components` | List all LWC components |
| `sf_get_lwc_component` | Get component metadata & files |
| `sf_create_lwc_component` | Create new LWC (HTML + JS + CSS + meta) |
| `sf_update_lwc_file` | Update a specific file (html/js/css) |
| `sf_delete_lwc_component` | Delete component via destructive deploy |

### Flows & Process Builder (5 tools)

| Tool | Description |
|---|---|
| `sf_list_flows` | List all flows with status & type |
| `sf_get_flow_details` | Get flow variables, type, version |
| `sf_activate_flow` | Activate a draft flow |
| `sf_deactivate_flow` | Deactivate an active flow |
| `sf_invoke_flow` | Run a flow with input variables |

### Metadata API (7 tools)

| Tool | Description |
|---|---|
| `sf_list_metadata_types` | List all metadata types in the org |
| `sf_list_metadata_components` | List components by type |
| `sf_retrieve_metadata` | Retrieve components as base64 zip |
| `sf_deploy_metadata` | Deploy any metadata component |
| `sf_validate_deploy` | Check-only deploy with test run |
| `sf_delete_metadata_components` | Destructive delete of components |
| `sf_check_deploy_status` | Poll async deploy result by ID |

### Experience Cloud — Sites (6 tools)
### Experience Cloud — Portal Users (7 tools)
### Experience Cloud — Navigation (4 tools)
### Experience Cloud — CMS (5 tools)
### Experience Cloud — Branding & Analytics (3 tools)

*(Unchanged from v3.0 — see previous README for full tables)*

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

**Sandbox (Username + Password + Token):**

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

### 3. Add the new files

Copy these three new files into your `src/` folder:

```
src/
├── tools-crm.js        ← NEW  (21 tool definitions)
├── handlers-crm.js     ← NEW  (implementations)
└── index.js            ← REPLACE with v4.0 version
```

### 4. Run

```bash
npm start
```

---

## Connect to Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "node",
      "args": ["/absolute/path/to/SF-MCP-Server/src/index.js"],
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

**Config location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

---

## Example Prompts

### CRM Data (new)

```
"Show me all open opportunities closing this quarter above £50,000"
"Create a lead for John Smith at Acme Corp, email john@acme.com, source LinkedIn"
"What's our pipeline broken down by stage?"
"Give me a full 360 view of the account 001XXXXXXXXXXXXXXX"
"Log a 30-minute call with Sarah Jones at Acme — we discussed renewal pricing"
"Create a follow-up task for tomorrow: send proposal to Acme Corp"
"Find anything related to 'Barclays' across Accounts, Contacts and Leads"
"How many new leads came in this month, grouped by source?"
"Convert lead 00QXXXXXXXXXXXXXXX — create the opportunity too"
"Show me all open High priority cases for account ID 001XXXXXXXXXXXXXXX"
"What's our forecast for Q2? Break it down by owner."
```

### Apex

```
"Create an Apex class called MembershipService with a method to check member status"
"Run all test classes and show failures"
```

### LWC

```
"Create a memberCard LWC for the KICC portal showing name, membership type and expiry"
"Update the JS of memberCard to add a renewMembership method"
```

### Experience Cloud

```
"List all Experience Cloud sites and their status"
"Create a portal user for John Smith linked to Contact 003xxx"
"How many new members joined the KICC portal in the last 30 days?"
```

---

## Updated Project Structure

```
SF-MCP-Server/
├── src/
│   ├── index.js                  # v4.0 — router for 74 tools
│   ├── tools.js                  # Apex, LWC, Flow, Metadata definitions (28)
│   ├── tools-experience.js       # Experience Cloud definitions (25)
│   ├── tools-crm.js              # ← NEW: CRM data tool definitions (21)
│   ├── connection.js             # Salesforce auth & connection manager
│   ├── metadata-utils.js         # Zip builder, deploy helpers, package.xml
│   ├── handlers-apex.js          # Apex implementations
│   ├── handlers-lwc.js           # LWC implementations
│   ├── handlers-flows.js         # Flow implementations
│   ├── handlers-metadata.js      # Metadata API implementations
│   ├── handlers-experience.js    # Experience Cloud implementations
│   └── handlers-crm.js           # ← NEW: CRM data implementations
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

Built by **CRM Mates** | [deepak@crmmates.com](mailto:deepak@crmmates.com)
