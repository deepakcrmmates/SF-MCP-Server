/**
 * licence.js — CRM Mates SF-MCP Server
 * Phase 1: Hardcoded key validation (local, no API call)
 * Phase 2: Will swap VALID_KEYS lookup for a live API call to api.crmmates.com
 */

import { createHash } from 'crypto';

// ── Plan definitions ──────────────────────────────────────────────────────────

const PLANS = {
  free: {
    name: 'Free',
    toolLimit: null, // enforced by PLAN_TOOLS below
    callLimit: 50,
  },
  starter: {
    name: 'Starter',
    toolLimit: null,
    callLimit: 500,
  },
  professional: {
    name: 'Professional',
    toolLimit: null,
    callLimit: 5000,
  },
  developer: {
    name: 'Developer',
    toolLimit: null,
    callLimit: 20000,
  },
  team: {
    name: 'Team',
    toolLimit: null,
    callLimit: 50000,
  },
  enterprise: {
    name: 'Enterprise',
    toolLimit: null,
    callLimit: Infinity,
  },
};

// ── Tools allowed per plan ────────────────────────────────────────────────────

const PLAN_TOOLS = {
  free: new Set([
    'sf_query',
    'sf_search',
    'sf_describe_object',
  ]),

  starter: new Set([
    'sf_query', 'sf_search', 'sf_describe_object',
    'sf_get_record', 'sf_aggregate_query', 'sf_get_recent_items',
    'sf_get_cases', 'sf_get_account_overview',
  ]),

  professional: new Set([
    // All starter tools
    'sf_query', 'sf_search', 'sf_describe_object',
    'sf_get_record', 'sf_aggregate_query', 'sf_get_recent_items',
    'sf_get_cases', 'sf_get_account_overview',
    // Plus full CRM data layer
    'sf_create_record', 'sf_update_record', 'sf_delete_record',
    'sf_bulk_create', 'sf_bulk_update',
    'sf_get_pipeline', 'sf_get_forecast',
    'sf_create_lead', 'sf_convert_lead',
    'sf_log_activity', 'sf_create_task', 'sf_create_event',
    'sf_add_case_comment',
  ]),

  developer: 'ALL', // all 74 tools
  team:       'ALL',
  enterprise: 'ALL',
};

// ── Phase 1: Hardcoded valid keys ─────────────────────────────────────────────
// Format: CRMM-{PLAN}-{RANDOM8}
// Phase 2: Replace this lookup with a fetch() to api.crmmates.com/licence/validate

const VALID_KEYS = {
  // ── TEST KEYS (Phase 1) ──
  'CRMM-FREE-TEST0001':  { plan: 'free',         expiresAt: '2099-12-31', owner: 'Test User — Free' },
  'CRMM-STRT-TEST0001':  { plan: 'starter',      expiresAt: '2099-12-31', owner: 'Test User — Starter' },
  'CRMM-PROF-TEST0001':  { plan: 'professional', expiresAt: '2099-12-31', owner: 'Test User — Professional' },
  'CRMM-DEVL-TEST0001':  { plan: 'developer',    expiresAt: '2099-12-31', owner: 'Test User — Developer' },
  'CRMM-TEAM-TEST0001':  { plan: 'team',         expiresAt: '2099-12-31', owner: 'Test User — Team' },
  'CRMM-ENTP-TEST0001':  { plan: 'enterprise',   expiresAt: '2099-12-31', owner: 'Test User — Enterprise' },

  // ── FOUNDER KEY ──
  'CRMM-ENTP-DEEPAK001': { plan: 'enterprise',   expiresAt: '2099-12-31', owner: 'Deepak K. Rana — CRM Mates' },
};

// ── Cache: store last valid check to allow 24hr offline grace ─────────────────

const CACHE_TTL_MS  = 24 * 60 * 60 * 1000; // 24 hours
let   licenceCache  = null;
let   callCount     = 0;

// ── Main validation function ──────────────────────────────────────────────────

export async function validateLicence(toolName) {
  const key = process.env.CRMMATES_LICENCE_KEY;

  // 1. No key at all
  if (!key || key.trim() === '') {
    throw new LicenceError(
      'NO_KEY',
      `❌ No licence key found.\n\n` +
      `Add your key to .env:\n` +
      `   CRMMATES_LICENCE_KEY=CRMM-XXXX-XXXX-XXXX\n\n` +
      `Get a licence at: https://crmmates.com/sf-mcp-pricing\n` +
      `Questions? deepak@crmmates.com`
    );
  }

  // 2. Lookup key (Phase 1: local — Phase 2: API call)
  let licence;
  try {
    licence = await resolveLicence(key.trim());
  } catch (networkErr) {
    // Offline grace period
    if (licenceCache && Date.now() - licenceCache.checkedAt < CACHE_TTL_MS) {
      console.error(`⚠️  Licence API unreachable — using cached validation (grace period active)`);
      licence = licenceCache.licence;
    } else {
      throw new LicenceError(
        'NETWORK_ERROR',
        `⚠️  Could not verify licence (network error).\n\n` +
        `The server requires a valid licence check every 24 hours.\n` +
        `Check your connection or contact deepak@crmmates.com`
      );
    }
  }

  // 3. Expired
  if (new Date(licence.expiresAt) < new Date()) {
    throw new LicenceError(
      'EXPIRED',
      `❌ Your CRM Mates licence has expired.\n\n` +
      `Plan: ${PLANS[licence.plan].name} · Expired: ${licence.expiresAt}\n` +
      `Renew at: https://crmmates.com/account\n\n` +
      `Your Salesforce data is untouched — only Claude access is paused.`
    );
  }

  // 4. Tool not on plan
  const planTools = PLAN_TOOLS[licence.plan];
  if (toolName && planTools !== 'ALL' && !planTools.has(toolName)) {
    const required = requiredPlanForTool(toolName);
    throw new LicenceError(
      'PLAN_LIMIT',
      `❌ ${toolName} requires the ${required} plan or above.\n\n` +
      `Your current plan: ${PLANS[licence.plan].name}\n` +
      `Upgrade at: https://crmmates.com/sf-mcp-pricing`
    );
  }

  // 5. Monthly call limit
  callCount++;
  const limit = PLANS[licence.plan].callLimit;
  if (callCount > limit) {
    throw new LicenceError(
      'CALL_LIMIT',
      `❌ Monthly call limit reached (${limit.toLocaleString()}/${limit.toLocaleString()} on ${PLANS[licence.plan].name} plan).\n\n` +
      `Resets on the 1st of next month.\n` +
      `Upgrade for more calls: https://crmmates.com/sf-mcp-pricing`
    );
  }

  // 6. All good — update cache
  licenceCache = { licence, checkedAt: Date.now() };
  return licence;
}

// ── Phase 1: local key resolution ────────────────────────────────────────────
// Phase 2: replace with fetch() to https://api.crmmates.com/licence/validate

async function resolveLicence(key) {
  const record = VALID_KEYS[key];
  if (!record) {
    throw new LicenceError(
      'INVALID_KEY',
      `❌ Licence key not recognised.\n\n` +
      `Key: ${maskKey(key)}\n\n` +
      `Check your key or visit https://crmmates.com/account\n` +
      `Questions? deepak@crmmates.com`
    );
  }
  return record;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function requiredPlanForTool(toolName) {
  for (const [plan, tools] of Object.entries(PLAN_TOOLS)) {
    if (tools === 'ALL') continue;
    if (tools.has(toolName)) return capitalise(plan);
  }
  return 'Developer';
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 8) + '****';
}

// ── Custom error class ────────────────────────────────────────────────────────

export class LicenceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LicenceError';
    this.code = code;
  }
}

// ── Startup banner ─────────────────────────────────────────────────────────────

export async function printLicenceBanner() {
  const key = process.env.CRMMATES_LICENCE_KEY;
  if (!key) {
    console.error('⚠️  No CRMMATES_LICENCE_KEY found — tool calls will be blocked until a key is set.');
    return;
  }
  try {
    const licence = await resolveLicence(key.trim());
    const plan    = PLANS[licence.plan];
    const tools   = PLAN_TOOLS[licence.plan] === 'ALL' ? '74' : PLAN_TOOLS[licence.plan].size;
    console.error(`✅ Licence valid — ${licence.owner}`);
    console.error(`   Plan: ${plan.name} · Tools: ${tools} · Calls/mo: ${plan.callLimit === Infinity ? 'Unlimited' : plan.callLimit.toLocaleString()}`);
    console.error(`   Expires: ${licence.expiresAt}`);
  } catch (e) {
    console.error(`⚠️  Licence check at startup: ${e.message.split('\n')[0]}`);
  }
}
