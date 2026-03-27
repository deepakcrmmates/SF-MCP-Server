/**
 * tools-crm.js
 * Tool definitions for Salesforce CRM DATA access.
 * These complement the existing metadata/dev tools by adding
 * real record-level read/write against live org data.
 */

const CRM_TOOLS = [
  // ─────────────────────────────────────────
  // QUERY & SEARCH
  // ─────────────────────────────────────────
  {
    name: 'sf_query',
    description:
      'Execute a SOQL query and return matching records. Use this for any ' +
      'natural-language question about CRM data: leads, contacts, accounts, ' +
      'opportunities, cases, tasks, or any custom object.',
    inputSchema: {
      type: 'object',
      properties: {
        soql: {
          type: 'string',
          description:
            'Full SOQL query, e.g. "SELECT Id, Name, StageName, Amount FROM Opportunity WHERE StageName != \'Closed Lost\' ORDER BY Amount DESC LIMIT 20"',
        },
        maxRecords: {
          type: 'number',
          description: 'Cap on rows returned (default 200, max 2000)',
          default: 200,
        },
      },
      required: ['soql'],
    },
  },

  {
    name: 'sf_search',
    description:
      'Run a SOSL (Salesforce Object Search Language) query to search ' +
      'across multiple objects at once — great for "find anything about Acme Corp".',
    inputSchema: {
      type: 'object',
      properties: {
        searchTerm: {
          type: 'string',
          description: 'The text to search for, e.g. "Acme" or "john@example.com"',
        },
        objects: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Objects to search in, e.g. ["Account","Contact","Lead","Opportunity"]. ' +
            'Defaults to the four most common CRM objects.',
          default: ['Account', 'Contact', 'Lead', 'Opportunity'],
        },
        fields: {
          type: 'object',
          description:
            'Map of object → field list to return, e.g. {"Account":["Id","Name","Phone"]}. ' +
            'Defaults to sensible field sets per object.',
        },
        limit: {
          type: 'number',
          description: 'Max results per object (default 10)',
          default: 10,
        },
      },
      required: ['searchTerm'],
    },
  },

  // ─────────────────────────────────────────
  // SINGLE-RECORD CRUD
  // ─────────────────────────────────────────
  {
    name: 'sf_get_record',
    description:
      'Retrieve a single Salesforce record by its 15- or 18-character ID, ' +
      'returning the fields you specify (or all fields if none given).',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name of the object, e.g. "Account", "Contact", "Opportunity"',
        },
        recordId: {
          type: 'string',
          description: 'Salesforce record Id (15 or 18 chars)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of field API names to fetch. Omit to return all fields.',
        },
      },
      required: ['objectType', 'recordId'],
    },
  },

  {
    name: 'sf_create_record',
    description:
      'Create a new Salesforce record on any object — Lead, Contact, Account, ' +
      'Opportunity, Case, Task, or any custom object.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name of the object to create, e.g. "Lead"',
        },
        data: {
          type: 'object',
          description:
            'Field values for the new record, e.g. {"FirstName":"Jane","LastName":"Doe","Company":"Acme","Email":"jane@acme.com"}',
        },
      },
      required: ['objectType', 'data'],
    },
  },

  {
    name: 'sf_update_record',
    description:
      'Update one or more fields on an existing Salesforce record. ' +
      'Only the fields you pass are changed — others are untouched.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name of the object, e.g. "Opportunity"',
        },
        recordId: {
          type: 'string',
          description: 'Id of the record to update',
        },
        data: {
          type: 'object',
          description:
            'Fields and their new values, e.g. {"StageName":"Closed Won","CloseDate":"2025-12-31"}',
        },
      },
      required: ['objectType', 'recordId', 'data'],
    },
  },

  {
    name: 'sf_delete_record',
    description: 'Delete a single Salesforce record by Id. Use with caution.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name of the object',
        },
        recordId: {
          type: 'string',
          description: 'Id of the record to delete',
        },
      },
      required: ['objectType', 'recordId'],
    },
  },

  // ─────────────────────────────────────────
  // BULK OPERATIONS
  // ─────────────────────────────────────────
  {
    name: 'sf_bulk_create',
    description:
      'Create multiple records of the same object type in one call (up to 200 at a time). ' +
      'Returns success/failure per record.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name of the object',
        },
        records: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of field-value objects, one per record to create',
        },
      },
      required: ['objectType', 'records'],
    },
  },

  {
    name: 'sf_bulk_update',
    description:
      'Update multiple records in one call. Each record must include its Id field. ' +
      'Returns success/failure per record.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name of the object',
        },
        records: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of objects each containing Id + fields to update',
        },
      },
      required: ['objectType', 'records'],
    },
  },

  // ─────────────────────────────────────────
  // PIPELINE & REVENUE INTELLIGENCE
  // ─────────────────────────────────────────
  {
    name: 'sf_get_pipeline',
    description:
      'Return open pipeline opportunities grouped by stage, with totals. ' +
      'Optionally filter by owner, close date range, or minimum amount.',
    inputSchema: {
      type: 'object',
      properties: {
        ownerId: {
          type: 'string',
          description: 'Filter by Salesforce User Id or "me" for the authenticated user',
        },
        closeDateFrom: {
          type: 'string',
          description: 'ISO date string, e.g. "2025-01-01"',
        },
        closeDateTo: {
          type: 'string',
          description: 'ISO date string, e.g. "2025-12-31"',
        },
        minAmount: {
          type: 'number',
          description: 'Minimum opportunity amount to include',
        },
        currency: {
          type: 'string',
          description: 'Currency ISO code to display totals in, e.g. "GBP"',
        },
      },
    },
  },

  {
    name: 'sf_get_forecast',
    description:
      'Return a revenue forecast summary: Commit, Best Case, Pipeline and Closed totals ' +
      'for a given time period, broken down by stage and (optionally) owner.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: '"this_quarter", "next_quarter", "this_month", or an ISO year e.g. "2025"',
          default: 'this_quarter',
        },
        groupByOwner: {
          type: 'boolean',
          description: 'If true, break down forecast by opportunity owner',
          default: false,
        },
      },
    },
  },

  // ─────────────────────────────────────────
  // ACCOUNT 360
  // ─────────────────────────────────────────
  {
    name: 'sf_get_account_overview',
    description:
      'Return a full 360° view of an Account: core details, related contacts, ' +
      'open opportunities, recent cases, and recent activity — all in one call.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Salesforce Account Id',
        },
        includeClosedOpps: {
          type: 'boolean',
          description: 'Include closed opportunities (default false)',
          default: false,
        },
        activityDays: {
          type: 'number',
          description: 'How many days back to fetch activity (default 90)',
          default: 90,
        },
      },
      required: ['accountId'],
    },
  },

  // ─────────────────────────────────────────
  // LEADS
  // ─────────────────────────────────────────
  {
    name: 'sf_create_lead',
    description:
      'Create a new Lead with all standard fields. Shorthand for sf_create_record ' +
      'but with Lead-specific validation and sensible defaults.',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string', description: 'Required' },
        company: { type: 'string', description: 'Required' },
        email: { type: 'string' },
        phone: { type: 'string' },
        title: { type: 'string' },
        leadSource: {
          type: 'string',
          description:
            'e.g. "Web", "Phone Enquiry", "Partner Referral", "LinkedIn", "Event"',
        },
        status: {
          type: 'string',
          description: 'Lead status picklist value (defaults to org default)',
        },
        description: { type: 'string' },
        additionalFields: {
          type: 'object',
          description: 'Any extra standard or custom fields',
        },
      },
      required: ['lastName', 'company'],
    },
  },

  {
    name: 'sf_convert_lead',
    description:
      'Convert a Lead into an Account, Contact, and optionally an Opportunity. ' +
      'Returns the IDs of the created records.',
    inputSchema: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'Id of the Lead to convert',
        },
        convertedStatus: {
          type: 'string',
          description: 'Lead status to set on conversion (must be a "Converted" type status)',
        },
        accountName: {
          type: 'string',
          description: 'Account name to use (defaults to Lead Company name)',
        },
        createOpportunity: {
          type: 'boolean',
          description: 'Whether to create an Opportunity (default true)',
          default: true,
        },
        opportunityName: {
          type: 'string',
          description: 'Opportunity name (defaults to "AccountName - converted")',
        },
        ownerId: {
          type: 'string',
          description: 'User Id to assign the converted records to',
        },
      },
      required: ['leadId', 'convertedStatus'],
    },
  },

  // ─────────────────────────────────────────
  // ACTIVITIES (Tasks & Events)
  // ─────────────────────────────────────────
  {
    name: 'sf_log_activity',
    description:
      'Log a completed activity (call, email, meeting note) as a Task against ' +
      'a Contact, Lead, Account or Opportunity. This is "Log a Call" in the UI.',
    inputSchema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'Activity subject, e.g. "Call", "Follow-up email", "Discovery meeting"',
        },
        description: {
          type: 'string',
          description: 'Notes / call summary',
        },
        whoId: {
          type: 'string',
          description: 'Contact or Lead Id to link the activity to',
        },
        whatId: {
          type: 'string',
          description: 'Account, Opportunity, or other object Id to link to',
        },
        activityDate: {
          type: 'string',
          description: 'ISO date the activity occurred (defaults to today)',
        },
        callType: {
          type: 'string',
          enum: ['Inbound', 'Outbound', 'Internal'],
          description: 'Type of call (if relevant)',
        },
        callDurationInSeconds: {
          type: 'number',
          description: 'Call duration in seconds',
        },
        ownerId: {
          type: 'string',
          description: 'User who performed the activity (defaults to authenticated user)',
        },
      },
      required: ['subject'],
    },
  },

  {
    name: 'sf_create_task',
    description:
      'Create an open (future) Task — a follow-up, to-do, or reminder — ' +
      'linked to any CRM record.',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Task subject (required)' },
        dueDate: { type: 'string', description: 'ISO date for the due date' },
        priority: {
          type: 'string',
          enum: ['High', 'Normal', 'Low'],
          default: 'Normal',
        },
        status: {
          type: 'string',
          description: 'Task status (defaults to org default open status)',
        },
        whoId: { type: 'string', description: 'Contact or Lead Id' },
        whatId: { type: 'string', description: 'Account, Opportunity, etc.' },
        description: { type: 'string', description: 'Task notes' },
        ownerId: { type: 'string', description: 'Assigned user Id' },
      },
      required: ['subject'],
    },
  },

  {
    name: 'sf_create_event',
    description: 'Create a calendar Event (meeting, call, demo) in Salesforce.',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Event subject (required)' },
        startDateTime: {
          type: 'string',
          description: 'ISO 8601 datetime, e.g. "2025-06-15T14:00:00.000Z"',
        },
        endDateTime: {
          type: 'string',
          description: 'ISO 8601 datetime',
        },
        description: { type: 'string' },
        whoId: { type: 'string', description: 'Contact or Lead Id' },
        whatId: { type: 'string', description: 'Account, Opportunity, etc.' },
        location: { type: 'string' },
        ownerId: { type: 'string' },
      },
      required: ['subject', 'startDateTime', 'endDateTime'],
    },
  },

  // ─────────────────────────────────────────
  // CASES (Support)
  // ─────────────────────────────────────────
  {
    name: 'sf_get_cases',
    description:
      'List support Cases, optionally filtered by account, status, priority, or date range.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Filter by Account Id' },
        status: {
          type: 'string',
          description: 'e.g. "Open", "In Progress", "Escalated", "Closed"',
        },
        priority: {
          type: 'string',
          enum: ['High', 'Medium', 'Low'],
        },
        openOnly: {
          type: 'boolean',
          description: 'Return only cases that are not closed (default true)',
          default: true,
        },
        limit: { type: 'number', default: 50 },
      },
    },
  },

  {
    name: 'sf_add_case_comment',
    description: 'Add a comment to an existing Case.',
    inputSchema: {
      type: 'object',
      properties: {
        caseId: { type: 'string', description: 'Salesforce Case Id' },
        comment: { type: 'string', description: 'Comment text' },
        isPublic: {
          type: 'boolean',
          description: 'True = visible to portal/community users (default false)',
          default: false,
        },
      },
      required: ['caseId', 'comment'],
    },
  },

  // ─────────────────────────────────────────
  // REPORTING / AGGREGATES
  // ─────────────────────────────────────────
  {
    name: 'sf_aggregate_query',
    description:
      'Run an aggregate SOQL query (GROUP BY with COUNT, SUM, AVG, MAX, MIN) and ' +
      'return the grouped results — useful for dashboards and revenue summaries.',
    inputSchema: {
      type: 'object',
      properties: {
        soql: {
          type: 'string',
          description:
            'Aggregate SOQL, e.g. "SELECT StageName, SUM(Amount) Total, COUNT(Id) Count ' +
            'FROM Opportunity WHERE IsClosed = false GROUP BY StageName"',
        },
      },
      required: ['soql'],
    },
  },

  {
    name: 'sf_get_recent_items',
    description:
      'Return the most recently viewed or modified CRM records across any object type.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name e.g. "Lead", "Opportunity". Omit to return across all objects.',
        },
        limit: { type: 'number', default: 20 },
      },
    },
  },

  // ─────────────────────────────────────────
  // OBJECT SCHEMA (lightweight — for context)
  // ─────────────────────────────────────────
  {
    name: 'sf_describe_object',
    description:
      'Return field names, types, labels, and picklist values for any Salesforce object. ' +
      'Useful before creating or updating records to know what fields are available.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'API name of the object, e.g. "Lead", "Opportunity__c"',
        },
        includePicklistValues: {
          type: 'boolean',
          description: 'Include full picklist option lists (default true)',
          default: true,
        },
      },
      required: ['objectType'],
    },
  },
];

module.exports = { CRM_TOOLS };
