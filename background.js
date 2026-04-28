/**
 * Job Filter - Background Service Worker
 *
 * Handles communication between content scripts and Airtable API:
 * - Listens for messages from content.js
 * - Retrieves credentials from Chrome local storage
 * - Creates/updates records in Companies, Contacts, and Jobs Pipeline tables (CRM model)
 * - Handles Outreach Mode record fetching and updates
 * - Returns success/failure response to content script
 */

// Feature flags (loaded into service worker scope)
importScripts('feature-flags.js');

// Storage keys (must match popup.js)
const STORAGE_KEYS = {
  BASE_ID: 'jh_airtable_base_id',
  PAT: 'jh_airtable_pat'
};
const FEATURE_FLAGS_KEY = 'jh_feature_flags';
const RATE_LIMIT_MIN_DELAY_MS = 30000;
const RETRY_JITTER_MAX_MS = 750;

// Airtable API base URL
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

// Table names in Airtable (URL encoded)
const TABLES = {
  JOBS_PIPELINE: 'Jobs%20Pipeline',
  COMPANIES: 'Companies',
  CONTACTS: 'Contacts',
  OUTREACH_LOG: 'Outreach%20Log',
  APPLICATION_TRACKING: 'Application%20Tracking',
  GENERATED_ASSETS: 'Generated%20Assets'
};
const TABLE_IDS = {
  JOBS_PIPELINE: 'tblcY5odzvocdPMc6'
};

async function getFeatureFlags() {
  if (!self.JobFilterFlags) {
    return {
      enableSidePanel: false,
      enableApplicationEvents: false,
      enableJobMetadataFields: false,
      enableAutoAssetPipeline: true
    };
  }
  return self.JobFilterFlags.getFlags();
}

const orchestrationContractState = {
  checkedAt: 0,
  ok: false,
  error: null,
  fieldsByTable: {},
  fieldMetaByTable: {}
};

const CONTRACT_CHECK_TTL_MS = 5 * 60 * 1000;

const ORCHESTRATION_REQUIRED_FIELDS = {
  'Jobs Pipeline': [
    'orchestration_state',
    'orchestration_requested_at',
    'orchestration_run_id',
    'orchestration_error',
    'assets_ready_count',
    'assets_ready_at'
  ],
  'Application Tracking': [
    'event_key',
    'event_source',
    'event_payload'
  ],
  'Generated Assets': [
    'Job'
  ]
};

const schemaFieldCache = {
  checkedAt: 0,
  jobsPipelineFields: null
};
const SCHEMA_FIELD_CACHE_TTL_MS = 10 * 60 * 1000;

async function ensureJobsPipelineField(credentials, fieldName, fieldSpec) {
  const now = Date.now();
  if (schemaFieldCache.checkedAt && (now - schemaFieldCache.checkedAt) < SCHEMA_FIELD_CACHE_TTL_MS) {
    if (schemaFieldCache.jobsPipelineFields?.includes(fieldName)) return true;
  }

  const metaUrl = `https://api.airtable.com/v0/meta/bases/${credentials.baseId}/tables`;
  const metaResponse = await fetchWithRetry(metaUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!metaResponse.ok) {
    console.warn('[Job Filter BG] ⚠️ Schema read failed; cannot verify field:', fieldName);
    return false;
  }

  const meta = await metaResponse.json();
  const table = (meta.tables || []).find(t => t.id === TABLE_IDS.JOBS_PIPELINE);
  const fieldNames = (table?.fields || []).map(f => f.name);

  schemaFieldCache.checkedAt = now;
  schemaFieldCache.jobsPipelineFields = fieldNames;

  if (fieldNames.includes(fieldName)) return true;

  if (!fieldSpec) return false;

  const createUrl = `https://api.airtable.com/v0/meta/bases/${credentials.baseId}/tables/${TABLE_IDS.JOBS_PIPELINE}/fields`;
  const createResponse = await fetchWithRetry(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fieldSpec)
  });

  if (!createResponse.ok) {
    const details = await createResponse.text().catch(() => '');
    console.warn('[Job Filter BG] ⚠️ Failed to create field via API:', fieldName, details);
    return false;
  }

  console.log('[Job Filter BG] ✓ Field created via API:', fieldName);
  return true;
}

async function configureSidePanelBehavior(flags) {
  if (!chrome?.sidePanel?.setPanelBehavior) return;
  const openOnClick = !!flags?.enableSidePanel;
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: openOnClick });
  } catch (err) {
    console.warn('[Job Filter BG] Side panel behavior config failed:', err?.message || err);
  }
}

// Initialize side panel behavior and keep in sync with flag changes
getFeatureFlags()
  .then(configureSidePanelBehavior)
  .catch((error) => {
    console.warn('[Job Filter BG] Side panel init skipped:', error?.message || error);
  });
if (chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes[FEATURE_FLAGS_KEY]?.newValue) {
      configureSidePanelBehavior(changes[FEATURE_FLAGS_KEY].newValue);
    }
  });
}

async function openSettingsTab() {
  const url = chrome.runtime.getURL('popup.html');
  return chrome.tabs.create({ url });
}

async function openSidePanelForSender(sender) {
  const flags = await getFeatureFlags();
  const sidePanelAvailable = !!chrome?.sidePanel?.open;
  const sidePanelEnabled = !!flags?.enableSidePanel;

  if (!sidePanelAvailable || !sidePanelEnabled) {
    return { fallback: 'none', reason: sidePanelAvailable ? 'flag_disabled' : 'api_unavailable' };
  }

  const tabId = sender?.tab?.id;
  const windowId = sender?.tab?.windowId;
  if (tabId !== undefined) {
    try {
      await chrome.sidePanel.open({ tabId });
      return { fallback: null };
    } catch (error) {
      return { fallback: 'none', reason: `sidepanel_open_failed:${error?.message || 'unknown'}` };
    }
  }
  if (windowId !== undefined) {
    try {
      await chrome.sidePanel.open({ windowId });
      return { fallback: null };
    } catch (error) {
      return { fallback: 'none', reason: `sidepanel_open_failed:${error?.message || 'unknown'}` };
    }
  }
  throw new Error('No tab or window context available');
}

// ===========================
// AIRTABLE DATA SANITIZATION
// ===========================

/**
 * Sanitize string values for Airtable - removes quotes and escapes that cause 422 errors
 * CRITICAL: Handles multiple levels of stringification (e.g., "\"MODERATE FIT\"" → "MODERATE FIT")
 * @param {string} value - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;

  // Remove ALL quote characters (both regular and escaped) recursively
  let sanitized = value;
  let previousValue;

  // Keep removing quotes until no more are found (handles nested stringification)
  do {
    previousValue = sanitized;
    sanitized = sanitized
      .replace(/^["']+|["']+$/g, '')  // Remove leading/trailing quotes
      .replace(/\\"/g, '')             // Remove escaped quotes \"
      .replace(/\\'/g, '')             // Remove escaped single quotes \'
      .trim();
  } while (sanitized !== previousValue && sanitized.length > 0);

  return sanitized;
}

function sanitizeEventKeyPart(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  return raw.replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
}

function escapeFormulaString(value) {
  return String(value || '').replace(/'/g, "\\'");
}

function toIsoSeconds(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function buildEventKey(eventType, entityId, statusSnapshot, eventDate = new Date()) {
  const typePart = sanitizeEventKeyPart(eventType);
  const idPart = sanitizeEventKeyPart(entityId);
  const statusPart = sanitizeEventKeyPart(statusSnapshot || 'na');
  const dayPart = eventDate.toISOString().slice(0, 10);
  return `${typePart}:${idPart}:${statusPart}:${dayPart}`;
}

/**
 * Convert headcount number to size category for Airtable Single Select
 * CRITICAL: Must return EXACT Airtable option values (no "employees" suffix, no commas)
 * Valid options: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"
 * @param {number} headcount - Employee count
 * @returns {string|null} Size category matching Airtable dropdown options
 */
function mapHeadcountToSize(headcount) {
  if (!headcount || headcount <= 0) return null;
  if (headcount <= 10) return '1-10';
  if (headcount <= 50) return '11-50';
  if (headcount <= 200) return '51-200';
  if (headcount <= 500) return '201-500';
  if (headcount <= 1000) return '501-1000';
  if (headcount <= 5000) return '1001-5000';
  if (headcount <= 10000) return '5001-10000';
  return '10000+';
}

/**
 * Convert percentage string (e.g., "+11%") to decimal for Airtable Percent field
 * @param {string} percentString - Percentage string like "+11%" or "11%"
 * @returns {number|null} Decimal value (e.g., 0.11 for 11%)
 */
function parsePercentToDecimal(percentString) {
  if (!percentString || typeof percentString !== 'string') return null;
  const match = percentString.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const percentage = parseFloat(match[1]);
  return percentage / 100; // Convert to decimal
}

/**
 * Ensure value is a proper number for Airtable Number field
 * @param {any} value - Value to convert
 * @returns {number|null} Number or null
 */
function ensureNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Map company type to valid Airtable Single Select options
 * Valid options: "Startup", "SMB", "Enterprise", "Nonprofit", "Agency", "Other"
 * @param {string} companyType - Raw company type from LinkedIn
 * @returns {string|null} Valid Airtable option or null
 */
function mapCompanyType(companyType) {
  if (!companyType || typeof companyType !== 'string') return null;

  const normalized = companyType.toLowerCase().trim();

  const mapToAllowed = (value) => value || null;

  const directMap = {
    'startup': 'Startup',
    'start-up': 'Startup',
    'start up': 'Startup',
    'smb': 'SMB',
    'small business': 'SMB',
    'public company': 'Enterprise',
    'publicly held': 'Enterprise',
    'publicly traded': 'Enterprise',
    'enterprise': 'Enterprise',
    'non-profit': 'Nonprofit',
    'nonprofit': 'Nonprofit',
    'non profit': 'Nonprofit',
    'not-for-profit': 'Nonprofit',
    'ngo': 'Nonprofit',
    'agency': 'Agency'
  };

  if (directMap[normalized]) {
    return mapToAllowed(directMap[normalized]);
  }

  for (const [key, value] of Object.entries(directMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return mapToAllowed(value);
    }
  }

  const knownButUnmapped = [
    'privately held',
    'private',
    'partnership',
    'self-employed',
    'self employed',
    'government',
    'public sector',
    'educational',
    'education',
    'school',
    'university'
  ];

  for (const key of knownButUnmapped) {
    if (normalized.includes(key)) {
      console.log('[Job Filter BG] ℹ️ Company type mapped to Other:', companyType);
      return 'Other';
    }
  }

  console.log('[Job Filter BG] ⚠️ Unknown company type, skipping:', companyType);
  return null;
}

/**
 * Listen for messages from content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ping check for service worker health
  if (request.action === 'jobHunter.ping') {
    sendResponse({ alive: true });
    return true;
  }

  if (request.action === 'jobHunter.openSettings') {
    openSettingsTab()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'jobHunter.openSidePanel') {
    openSidePanelForSender(sender)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'jobHunter.sidePanelStatus') {
    getFeatureFlags()
      .then(flags => {
        const available = !!chrome?.sidePanel?.open;
        const enabled = !!flags?.enableSidePanel;
        sendResponse({
          available,
          enabled,
          fallback: !available || !enabled ? 'none' : null
        });
      })
      .catch(() => {
        sendResponse({
          available: !!chrome?.sidePanel?.open,
          enabled: false,
          fallback: 'none'
        });
      });
    return true;
  }

  // Handle job capture requests (with optional score data)
  if (request.action === 'jobHunter.createAirtableRecord') {
    console.log('[Job Filter BG] ⚡ Received job capture request');
    const captureRequestId = request.captureRequestId || null;

    // CRITICAL: Respond immediately to prevent timeout
    // Content script has 5-second timeout, but Airtable API calls can take longer
    sendResponse({
      success: null,
      processing: true,
      message: 'Processing job capture in background...',
      captureRequestId
    });

    // Process asynchronously in background (don't await)
    const startTime = Date.now();
    console.log('[Job Filter BG] 🚀 Starting background processing at', new Date().toISOString());

    handleCreateTripleRecord(request.job, request.score)
      .then(result => {
        const elapsed = Date.now() - startTime;
        console.log('[Job Filter BG] ✅ Background processing COMPLETE in', elapsed, 'ms');
        console.log('[Job Filter BG] Result:', result);

        if (!result?.success) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'jobCaptureComplete',
            success: false,
            captureRequestId,
            error: result?.error || 'Failed to save job to Airtable'
          }).catch(() => {
            console.log('[Job Filter BG] ⚠️ Could not notify content script of failure result (tab may be closed)');
          });
          return;
        }

        // CRITICAL: Notify content script of SUCCESS so button can update
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'jobCaptureComplete',
          success: true,
          captureRequestId,
          recordId: result.recordId,
          companyRecordId: result.companyRecordId,
          contactRecordId: result.contactRecordId,
          lane: result.lane || request?.job?.lane || null,
          baseId: result.baseId || null,
          pipeline: result.pipeline || null,
          message: 'Job successfully captured to Airtable!'
        }).catch(err => {
          console.log('[Job Filter BG] ⚠️ Could not notify content script of success (tab may be closed)');
        });
      })
      .catch(error => {
        const elapsed = Date.now() - startTime;
        console.error('[Job Filter BG] ❌ Background processing FAILED in', elapsed, 'ms');
        console.error('[Job Filter BG] ERROR:', error.message);

        // CRITICAL: Notify content script of FAILURE so button can show error
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'jobCaptureComplete',
          success: false,
          captureRequestId,
          error: error.message || 'Failed to save job to Airtable'
        }).catch(err => {
          console.log('[Job Filter BG] ⚠️ Could not notify content script of error (tab may be closed)');
        });
      });

    // Return true to indicate we handled the message
    return true;
  }

  if (request.action === 'jobHunter.fetchGeneratedAssets') {
    handleFetchGeneratedAssets(request.jobRecordId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message || 'Failed to fetch generated assets' }));
    return true;
  }

  // Handle Outreach Log record fetch
  if (request.action === 'jobHunter.fetchOutreachRecord') {
    console.log('[Job Filter BG] Fetching Outreach Log record:', request.recordId);
    handleFetchOutreachRecord(request.recordId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle Outreach Log "Mark as Sent" update
  if (request.action === 'jobHunter.markOutreachSent') {
    console.log('[Job Filter BG] Marking outreach as sent:', request.recordId);
    handleMarkOutreachSent(request.recordId, request.contactRecordId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle profile check requests
  if (request.action === 'jobHunter.checkProfile') {
    chrome.storage.local.get(['jh_user_profile'], (result) => {
      sendResponse({
        hasProfile: !!result.jh_user_profile,
        profile: result.jh_user_profile || null
      });
    });
    return true;
  }

  // ============================================================================
  // OUTREACH MODE - NEW MESSAGE HANDLERS
  // ============================================================================

  // Handle Upsert Contact (from /in/ profile pages)
  if (request.type === 'JH_UPSERT_CONTACT') {
    console.log('[Job Filter BG] Upserting contact from profile:', request.payload.fullName);
    handleUpsertContactFromProfile(request.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle Fetch Outreach Log by Contact LinkedIn URL
  if (request.type === 'JH_FETCH_OUTREACH_LOG') {
    console.log('[Job Filter BG] Fetching outreach log for:', request.payload.contactLinkedinUrl);
    handleFetchOutreachLogByContact(request.payload.contactLinkedinUrl)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle Create Outreach Log Entry
  if (request.type === 'JH_CREATE_OUTREACH_LOG') {
    console.log('[Job Filter BG] Creating outreach log entry');
    handleCreateOutreachLogEntry(request.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle Mark Outreach Sent (new type format)
  if (request.type === 'JH_MARK_OUTREACH_SENT') {
    console.log('[Job Filter BG] Marking outreach as sent:', request.payload.outreachLogRecordId);
    handleMarkOutreachSent(request.payload.outreachLogRecordId, null)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // ============================================================================
  // SKILL EXTRACTION - Message Handlers
  // ============================================================================

  // Handle skill extraction request
  if (request.action === 'jobHunter.extractSkills' || request.type === 'JH_EXTRACT_SKILLS') {
    console.log('[Job Filter BG] Skill extraction request received');
    handleSkillExtractionRequest(request.payload || request)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle skill analysis (extraction + matching) request
  if (request.action === 'jobHunter.analyzeSkills' || request.type === 'JH_ANALYZE_SKILLS') {
    console.log('[Job Filter BG] Full skill analysis request received');
    handleFullSkillAnalysis(request.payload || request)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle updating job record with skill data
  if (request.action === 'jobHunter.updateJobSkills' || request.type === 'JH_UPDATE_JOB_SKILLS') {
    console.log('[Job Filter BG] Update job skills request:', request.payload?.jobRecordId);
    handleUpdateJobSkills(request.payload || request)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * Create triple records in Airtable: Company, Contact (if hiring manager exists), and Job
 * Implements CRM-style relational data model
 *
 * @param {Object} jobData - Job data extracted from the page
 * @param {Object} scoreData - Optional score data from scoring engine
 * @returns {Promise<Object>} Result with success status and record IDs
 */
async function handleCreateTripleRecord(jobData, scoreData = null) {
  console.log('[Job Filter BG] Creating triple record', {
    source: jobData?.source,
    jobTitle: jobData?.jobTitle,
    companyName: jobData?.companyName,
    lane: jobData?.lane,
    descriptionLength: (jobData?.descriptionText || '').length
  });
  if (scoreData) {
    console.log('[Job Filter BG] Including score data:', scoreData.overall_score, scoreData.overall_label);
  }

  const flags = await getFeatureFlags();

  // Get credentials from storage
  const credentials = await getCredentials();

  if (!credentials.baseId || !credentials.pat) {
    console.error('[Job Filter BG] Missing credentials');
    return {
      success: false,
      error: 'Please configure Airtable settings in the extension popup'
    };
  }

  // Validate required fields
  if (!jobData.jobTitle) {
    return { success: false, error: 'Job title is required' };
  }
  if (!jobData.companyName) {
    return { success: false, error: 'Company name is required' };
  }

  try {
    // STEP A: Upsert Company record
    const companyRecordId = await upsertCompany(credentials, jobData);
    console.log('[Job Filter BG] ✓ Company record ID:', companyRecordId);

    // HUMAN-SPEED DELAY: Prevent LinkedIn throttling (critical for account safety)
    console.log('[Job Filter BG] ⏳ Waiting 1.5s before next API call...');
    await delay(1500);

    // STEP B: Upsert Contact record (if hiring manager data exists)
    let contactRecordId = null;
    if (jobData.hiringManagerDetails?.name) {
      try {
        contactRecordId = await upsertContact(credentials, jobData, companyRecordId);
        if (contactRecordId) {
          console.log('[Job Filter BG] ✓ Contact record ID:', contactRecordId);

          // HUMAN-SPEED DELAY: Prevent LinkedIn throttling
          console.log('[Job Filter BG] ⏳ Waiting 1.5s before next API call...');
          await delay(1500);
        } else {
          console.log('[Job Filter BG] ℹ️ Contact creation skipped (validation rejected fake contact)');
        }
      } catch (error) {
        console.warn('[Job Filter BG] ⚠️ Contact upsert failed, continuing without contact:', {
          message: error?.message || 'unknown error'
        });
        contactRecordId = null;
      }
    } else {
      console.log('[Job Filter BG] ℹ️ No hiring manager data, skipping Contact creation');
    }

    // STEP C: Create Job record with links to Company and Contact
    const jobRecordId = await createJob(credentials, jobData, scoreData, companyRecordId, contactRecordId, flags);
    console.log('[Job Filter BG] ✓ Job record created:', jobRecordId);

    await logCaptureEvents(credentials, flags, jobRecordId, jobData, scoreData);
    const pipeline = await queueAirtableOrchestration(credentials, flags, jobRecordId, jobData);

    return {
      success: true,
      recordId: jobRecordId,
      companyRecordId,
      contactRecordId,
      lane: jobData?.lane || null,
      pipeline,
      baseId: credentials.baseId,
      table: 'Jobs Pipeline'
    };

  } catch (error) {
    console.error('[Job Filter BG] Error creating triple record:', error);
    return {
      success: false,
      error: error.message || 'Failed to create records'
    };
  }
}

async function triggerAssetPipeline(credentials, flags, jobRecordId, jobData, companyRecordId, contactRecordId) {
  return queueAirtableOrchestration(credentials, flags, jobRecordId, jobData);
}

async function ensureOrchestrationContract(credentials, force = false) {
  const now = Date.now();
  if (!force && orchestrationContractState.checkedAt && (now - orchestrationContractState.checkedAt) < CONTRACT_CHECK_TTL_MS) {
    return orchestrationContractState;
  }

  const metaUrl = `https://api.airtable.com/v0/meta/bases/${credentials.baseId}/tables`;
  const metaResponse = await fetchWithRetry(metaUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!metaResponse.ok) {
    const details = await metaResponse.text().catch(() => '');
    orchestrationContractState.checkedAt = now;
    orchestrationContractState.ok = false;
    orchestrationContractState.error = `Schema read failed (${metaResponse.status}). Ensure token has schema.bases:read. ${details || ''}`.trim();
    orchestrationContractState.fieldsByTable = {};
    orchestrationContractState.fieldMetaByTable = {};
    return orchestrationContractState;
  }

  const meta = await metaResponse.json();
  const tableMap = new Map((meta.tables || []).map((table) => [table.name, table]));
  const missing = [];
  const fieldsByTable = {};
  const fieldMetaByTable = {};

  for (const [tableName, requiredFields] of Object.entries(ORCHESTRATION_REQUIRED_FIELDS)) {
    const table = tableMap.get(tableName);
    if (!table) {
      missing.push(`Missing table: ${tableName}`);
      continue;
    }
    const names = (table.fields || []).map((field) => field.name);
    fieldsByTable[tableName] = names;
    fieldMetaByTable[tableName] = Object.fromEntries((table.fields || []).map((field) => [field.name, field]));
    for (const fieldName of requiredFields) {
      if (!names.includes(fieldName)) {
        missing.push(`Missing field: ${tableName}.${fieldName}`);
      }
    }
  }

  orchestrationContractState.checkedAt = now;
  orchestrationContractState.ok = missing.length === 0;
  orchestrationContractState.error = missing.length ? missing.join('; ') : null;
  orchestrationContractState.fieldsByTable = fieldsByTable;
  orchestrationContractState.fieldMetaByTable = fieldMetaByTable;
  return orchestrationContractState;
}

async function queueAirtableOrchestration(credentials, flags, jobRecordId, jobData) {
  if (!flags?.enableAutoAssetPipeline) {
    return {
      state: 'disabled',
      run_id: null,
      error: 'Auto asset orchestration is disabled in feature flags.'
    };
  }

  const contract = await ensureOrchestrationContract(credentials);
  if (!contract.ok) {
    return {
      state: 'not_configured',
      run_id: null,
      error: contract.error || 'Orchestration contract validation failed.'
    };
  }

  const runId = `or_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${sanitizeEventKeyPart(jobRecordId)}_${Date.now()}`;
  const orchestrationFields = {
    orchestration_state: 'queued',
    orchestration_requested_at: toIsoSeconds(),
    orchestration_run_id: runId,
    orchestration_error: ''
  };

  const updateUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.JOBS_PIPELINE}/${jobRecordId}`;
  const updateResponse = await fetchWithRetry(updateUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: orchestrationFields })
  });

  if (!updateResponse.ok) {
    let errorMessage = `Failed to set orchestration state (${updateResponse.status})`;
    try {
      const errorBody = await updateResponse.json();
      errorMessage = errorBody?.error?.message || errorMessage;
    } catch (_) {
      // no-op
    }
    return {
      state: 'failed',
      run_id: runId,
      error: errorMessage
    };
  }

  if (flags.enableApplicationEvents) {
    await createApplicationEvent(credentials, jobRecordId, {
      eventType: 'Orchestration Queued',
      eventSource: 'Extension',
      details: 'Airtable-native orchestration queued after capture',
      eventKey: buildEventKey('orchestration_queued', jobRecordId, 'queued'),
      payload: {
        run_id: runId,
        jobTitle: jobData?.jobTitle || null,
        companyName: jobData?.companyName || null,
        lane: jobData?.lane || null
      },
      statusSnapshot: 'queued',
      laneSnapshot: jobData?.lane || null
    });
  }

  return {
    state: 'queued',
    run_id: runId,
    error: null
  };
}

async function fetchJobPipelineState(credentials, jobRecordId) {
  const jobUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.JOBS_PIPELINE}/${jobRecordId}`;
  const response = await fetchWithRetry(jobUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    return {
      state: 'unknown',
      run_id: null,
      error: `Failed to read pipeline status (${response.status})`
    };
  }

  const record = await response.json();
  const fields = record?.fields || {};
  const normalizedState = String(fields.orchestration_state || '').trim().toLowerCase();

  return {
    state: normalizedState || 'queued',
    run_id: fields.orchestration_run_id || null,
    error: fields.orchestration_error || null,
    assets_ready_count: Number(fields.assets_ready_count || 0) || 0,
    assets_ready_at: fields.assets_ready_at || null
  };
}

async function handleFetchGeneratedAssets(jobRecordId) {
  if (!jobRecordId) {
    return { success: false, error: 'jobRecordId is required' };
  }

  const credentials = await getCredentials();
  if (!credentials.baseId || !credentials.pat) {
    return { success: false, error: 'Airtable credentials are not configured' };
  }

  const formula = encodeURIComponent(`FIND('${escapeFormulaString(jobRecordId)}', ARRAYJOIN({Job}))`);
  const url = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.GENERATED_ASSETS}?filterByFormula=${formula}&maxRecords=50`;
  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let details = '';
    try {
      const err = await response.json();
      details = err?.error?.message || '';
    } catch (_) {
      details = '';
    }
    return {
      success: false,
      status: response.status,
      error: details || `Failed to fetch Generated Assets (${response.status})`
    };
  }

  const data = await response.json();
  const assets = (data.records || []).map(record => {
    const fields = record.fields || {};
    return {
      id: record.id,
      assetType: fields['Asset Type'] || fields['Asset'] || fields['Name'] || 'Asset',
      status: fields['Status'] || fields['Asset Status'] || '',
      url: fields['Google Drive Link'] || fields['Drive Link'] || fields['Asset Link'] || ''
    };
  });

  return {
    success: true,
    data: {
      pipeline: await fetchJobPipelineState(credentials, jobRecordId),
      count: assets.length,
      assets
    }
  };
}

/**
 * Upsert (create or update) a Company record in Airtable
 * Uses Company Name as the unique identifier for upsert logic
 *
 * @param {Object} credentials - Airtable credentials
 * @param {Object} jobData - Job data containing company info
 * @returns {Promise<string>} Company record ID
 */
async function upsertCompany(credentials, jobData) {
  const companyName = jobData.companyName.trim();

  // First, search for existing company by name
  const searchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.COMPANIES}?filterByFormula=${encodeURIComponent(`{Company Name}='${companyName.replace(/'/g, "\\'")}'`)}`;

  const searchResponse = await fetchWithRetry(searchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!searchResponse.ok) {
    throw new Error(`Failed to search for company: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const existingRecord = searchData.records?.[0];

  // Build company payload with ONLY fields that exist in Companies table schema
  const companyFields = {
    'Company Name': sanitizeString(companyName)
  };

  // CRITICAL: Only include fields that actually exist in your Companies Airtable schema
  // DO NOT send: Total Employees, Growth, Median Employee Tenure, Followers
  // Those fields don't exist in Companies table - they would cause 422 errors!

  // LinkedIn URL (exists in Companies schema)
  if (jobData.companyPageUrl) {
    companyFields['LinkedIn URL'] = sanitizeString(jobData.companyPageUrl);
    console.log('[Job Filter BG] ✓ LinkedIn URL:', jobData.companyPageUrl);
  }

  // Location (exists in Companies schema)
  if (jobData.location) {
    companyFields['Location'] = sanitizeString(jobData.location);
    console.log('[Job Filter BG] ✓ Location:', jobData.location);
  }

  // Industry (exists in Companies schema)
  if (jobData.industry) {
    companyFields['Industry'] = sanitizeString(jobData.industry);
    console.log('[Job Filter BG] ✓ Industry:', jobData.industry);
  }

  // Website (exists in Companies schema)
  if (jobData.website) {
    companyFields['Website'] = sanitizeString(jobData.website);
    console.log('[Job Filter BG] ✓ Website:', jobData.website);
  }

  // Company Type (exists in Companies schema - Single Select)
  // CRITICAL: Must map to valid Airtable dropdown options to avoid 422 errors
  if (jobData.companyType) {
    const mappedType = mapCompanyType(jobData.companyType);
    if (mappedType) {
      companyFields['Type'] = mappedType;
      console.log('[Job Filter BG] ✓ Company Type:', mappedType, '(from:', jobData.companyType, ')');
    } else {
      console.log('[Job Filter BG] ⚠️ Skipping invalid company type:', jobData.companyType);
    }
  }

  // Company Description (exists in Companies schema - Long Text)
  if (jobData.companyDescription) {
    companyFields['Company Description'] = sanitizeString(jobData.companyDescription);
    console.log('[Job Filter BG] ✓ Company Description:', jobData.companyDescription.substring(0, 100) + '...');
  }

  // Size (exists in Companies schema - Single Select)
  // Map from headcount if available
  const totalEmployees = ensureNumber(jobData.companyHeadcount || jobData.totalEmployees);
  if (totalEmployees !== null && totalEmployees > 0) {
    const sizeCategory = mapHeadcountToSize(totalEmployees);
    if (sizeCategory) {
      companyFields['Size'] = sizeCategory;
      console.log('[Job Filter BG] ✓ Size:', sizeCategory, '(from', totalEmployees, 'employees)');
    }
  }

  console.log('[Job Filter BG] === Companies Table Payload (schema-validated) ===');
  console.log(JSON.stringify(companyFields, null, 2));

  if (existingRecord) {
    // Update existing company record
    console.log('[Job Filter BG] Updating existing company:', existingRecord.id);
    const updateUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.COMPANIES}/${existingRecord.id}`;

    const updateResponse = await fetchWithRetry(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: companyFields })
    });

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.json().catch(() => ({}));
      console.error('[Job Filter BG] ❌ Company UPDATE failed (422):', {
        status: updateResponse.status,
        error: errorBody.error,
        sentPayload: companyFields
      });
      throw new Error(`Failed to update company: ${updateResponse.status} - ${JSON.stringify(errorBody.error)}`);
    }

    const updateData = await updateResponse.json();
    return updateData.id;

  } else {
    // Create new company record
    console.log('[Job Filter BG] Creating new company');
    const createUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.COMPANIES}`;

    // DEBUG: Log payload before sending to Airtable
    console.log('[Job Filter BG] Payload being sent to Airtable (Companies):', JSON.stringify({ fields: companyFields }, null, 2));

    const createResponse = await fetchWithRetry(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: companyFields })
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.json().catch(() => ({}));
      console.error('[Job Filter BG] ❌ Company CREATE failed (422):', {
        status: createResponse.status,
        error: errorBody.error,
        sentPayload: companyFields
      });
      throw new Error(`Failed to create company: ${createResponse.status} - ${JSON.stringify(errorBody.error)}`);
    }

    const createData = await createResponse.json();
    return createData.id;
  }
}

/**
 * Upsert (create or update) a Contact record in Airtable
 * Uses LinkedIn URL as unique identifier, falls back to First Name + Last Name + Company
 *
 * @param {Object} credentials - Airtable credentials
 * @param {Object} jobData - Job data containing hiring manager info
 * @param {string} companyRecordId - ID of the linked Company record
 * @returns {Promise<string>} Contact record ID
 */
async function upsertContact(credentials, jobData, companyRecordId) {
  const hiringManager = jobData.hiringManagerDetails;

  // CRITICAL: If no hiring manager found, return null - do NOT create fake "John Doe" contact
  if (!hiringManager?.name) {
    console.log('[Job Filter BG] No hiring manager found - skipping contact creation');
    return null;
  }

  // CRITICAL: Validate this is a real person name, not a generic placeholder or company name
  const invalidNames = [
    'hiring manager',
    'hiring team',
    'recruiter',
    'hr manager',
    'human resources',
    'talent acquisition',
    'john doe',
    'jane doe',
    'unknown',
    'n/a',
    'na',
    'not available'
  ];

  const normalizedName = hiringManager.name.toLowerCase().trim();
  const normalizedCompanyName = jobData.companyName.toLowerCase().trim();

  // CRITICAL: Reject if hiring manager name equals company name (fake contact detection)
  if (normalizedName === normalizedCompanyName) {
    console.log('[Job Filter BG] ❌ REJECTED fake contact - hiring manager name matches company name:', hiringManager.name);
    return null;
  }

  if (invalidNames.includes(normalizedName)) {
    console.log('[Job Filter BG] ❌ REJECTED invalid hiring manager name:', hiringManager.name);
    return null;
  }

  // Parse actual hiring manager name
  const nameParts = hiringManager.name.trim().split(' ');
  const firstName = sanitizeString(nameParts[0] || '');
  const lastName = sanitizeString(nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

  // CRITICAL: Reject if no last name (likely a company name, not a person)
  if (!lastName || lastName.length === 0) {
    console.log('[Job Filter BG] ❌ REJECTED potential fake contact - no last name (single word name):', hiringManager.name);
    return null;
  }

  // Validate we have at least a first name after sanitization
  if (!firstName || firstName.length < 2) {
    console.log('[Job Filter BG] ❌ REJECTED invalid hiring manager name after parsing:', hiringManager.name);
    return null;
  }

  // Search for existing contact by LinkedIn URL (if available) or by name + company
  let searchFormula;
  if (jobData.hiringManagerLinkedInUrl) {
    searchFormula = `{LinkedIn URL}='${jobData.hiringManagerLinkedInUrl.replace(/'/g, "\\'")}'`;
  } else {
    // Search by first name + last name + company link
    searchFormula = `AND({First Name}='${firstName.replace(/'/g, "\\'")}', {Last Name}='${lastName.replace(/'/g, "\\'")}')`;
  }

  const searchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}?filterByFormula=${encodeURIComponent(searchFormula)}`;

  const searchResponse = await fetchWithRetry(searchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!searchResponse.ok) {
    throw new Error(`Failed to search for contact: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const existingRecord = searchData.records?.[0];

  // Build contact payload
  const contactFields = {
    'First Name': firstName,
    'Last Name': lastName,
    'Companies': [companyRecordId], // LINKED RECORD - Links to Companies table
    'Contact Type': 'Hiring Manager' // Always set to Hiring Manager by default
  };

  // Add optional fields (all sanitized)
  if (hiringManager?.title) {
    contactFields['Role / Title'] = sanitizeString(hiringManager.title);
  }
  if (jobData.hiringManagerLinkedInUrl) {
    contactFields['LinkedIn URL'] = sanitizeString(jobData.hiringManagerLinkedInUrl);
  }
  if (jobData.hiringManagerEmail) {
    contactFields['Email'] = sanitizeString(jobData.hiringManagerEmail);
  }
  if (jobData.hiringManagerPhone) {
    contactFields['Phone / WhatsApp'] = sanitizeString(jobData.hiringManagerPhone);
  }

  if (existingRecord) {
    // Update existing contact record
    console.log('[Job Filter BG] Updating existing contact:', existingRecord.id);
    const updateUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}/${existingRecord.id}`;

    const updateResponse = await fetchWithRetry(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: contactFields })
    });

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.json().catch(() => ({}));
      console.error('[Job Filter BG] ❌ Contact update failed:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        errorMessage: errorBody.error?.message || 'No error message',
        invalidFields: errorBody.error?.invalidFieldsByName || {},
        sentPayload: contactFields
      });
      throw new Error(`Failed to update contact: ${updateResponse.status} - ${errorBody.error?.message || 'Unknown error'}`);
    }

    const updateData = await updateResponse.json();
    return updateData.id;

  } else {
    // Create new contact record
    console.log('[Job Filter BG] Creating new contact');
    const createUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}`;

    // DEBUG: Log payload before sending to Airtable
    console.log('[Job Filter BG] Payload being sent to Airtable (Contacts):', JSON.stringify({ fields: contactFields }, null, 2));

    const createResponse = await fetchWithRetry(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: contactFields })
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.json().catch(() => ({}));
      console.error('[Job Filter BG] ❌ Contact creation failed:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        errorMessage: errorBody.error?.message || 'No error message',
        invalidFields: errorBody.error?.invalidFieldsByName || {},
        sentPayload: contactFields
      });
      throw new Error(`Failed to create contact: ${createResponse.status} - ${errorBody.error?.message || 'Unknown error'}`);
    }

    const createData = await createResponse.json();
    return createData.id;
  }
}

/**
 * Create a Job record in Jobs Pipeline table with links to Company and Contact
 *
 * @param {Object} credentials - Airtable credentials
 * @param {Object} jobData - Job data
 * @param {Object} scoreData - Score data
 * @param {string} companyRecordId - ID of linked Company record
 * @param {string|null} contactRecordId - ID of linked Contact record (optional)
 * @returns {Promise<string>} Job record ID
 */
async function createJob(credentials, jobData, scoreData, companyRecordId, contactRecordId, flags = {}) {
  await ensureJobsPipelineField(credentials, 'Industry', {
    name: 'Industry',
    type: 'singleLineText'
  });

  // Build the Airtable record payload (all strings sanitized)
  // Field names must match exactly what's defined in Airtable
  const jobFields = {
    'Job Title': sanitizeString(jobData.jobTitle),
    'Company Name': sanitizeString(jobData.companyName), // TEXT field - company name as string
    'Companies': [companyRecordId], // LINKED RECORD field - array of record IDs
    'Job URL': sanitizeString(jobData.jobUrl || ''),
    'Location': sanitizeString(jobData.location || ''),
    'Source': sanitizeString(jobData.source || 'LinkedIn'),
    'Job Description': sanitizeString(jobData.descriptionText || ''),
    'Status': 'Captured'
  };

  if (flags.enableJobMetadataFields) {
    const today = new Date().toISOString().split('T')[0];
    jobFields['last_touch_date'] = today;
    jobFields['stale_status'] = 'fresh';
    if (jobData.nextFollowupDate) {
      jobFields['next_followup_date'] = jobData.nextFollowupDate;
    }
    if (jobData.lane) {
      jobFields['lane'] = jobData.lane;
    }
  }

  // Link to Contact record if available (OPTIONAL - job can exist without contact)
  if (contactRecordId) {
    jobFields['Contacts'] = [contactRecordId];
    console.log('[Job Filter BG] ✓ Linking job to contact:', contactRecordId);
  } else {
    console.log('[Job Filter BG] ℹ️ No contact to link - job will be created without hiring manager');
  }

  // Add salary fields only if they have valid numeric values (OPTIONAL - job can exist without salary)
  try {
    if (jobData.salaryMin !== null && jobData.salaryMin !== undefined) {
      const salaryMin = typeof jobData.salaryMin === 'number'
        ? jobData.salaryMin
        : parseFloat(String(jobData.salaryMin).replace(/[^0-9.-]/g, ''));

      if (!isNaN(salaryMin) && salaryMin > 0) {
        jobFields['Salary Min'] = salaryMin;
        console.log('[Job Filter BG] ✓ Salary Min:', salaryMin);
      }
    }
  } catch (e) {
    console.log('[Job Filter BG] ⚠️ Failed to parse Salary Min:', e.message);
  }

  try {
    if (jobData.salaryMax !== null && jobData.salaryMax !== undefined) {
      const salaryMax = typeof jobData.salaryMax === 'number'
        ? jobData.salaryMax
        : parseFloat(String(jobData.salaryMax).replace(/[^0-9.-]/g, ''));

      if (!isNaN(salaryMax) && salaryMax > 0) {
        jobFields['Salary Max'] = salaryMax;
        console.log('[Job Filter BG] ✓ Salary Max:', salaryMax);
      }
    }
  } catch (e) {
    console.log('[Job Filter BG] ⚠️ Failed to parse Salary Max:', e.message);
  }
  if (jobData.workplaceType) {
    jobFields['Workplace Type'] = jobData.workplaceType;
  }
  if (jobData.employmentType) {
    jobFields['Employment Type'] = jobData.employmentType;
  }
  if (jobData.equityMentioned !== undefined) {
    jobFields['Equity Mentioned'] = !!jobData.equityMentioned;
  }
  if (jobData.bonusMentioned !== undefined) {
    jobFields['Bonus Mentioned'] = !!jobData.bonusMentioned;
  }
  if (jobData.companyPageUrl) {
    jobFields['Company Page'] = jobData.companyPageUrl;
  }
  if (jobData.industry) {
    jobFields['Industry'] = sanitizeString(jobData.industry);
  }

  // Add score data if available (OPTIONAL - job can exist without scores)
  if (scoreData) {
    try {
      if (scoreData.overall_score !== undefined) {
        jobFields['Overall Fit Score'] = scoreData.overall_score;
        console.log('[Job Filter BG] ✓ Overall Fit Score:', scoreData.overall_score);
      }
    } catch (e) {
      console.log('[Job Filter BG] ⚠️ Failed to parse Overall Fit Score:', e.message);
    }

    try {
      if (scoreData.overall_label) {
        // CRITICAL: Sanitize FIRST to remove any quotes/escapes, then process
        let rawLabel = String(scoreData.overall_label);
        let fitLabel = sanitizeString(rawLabel).toUpperCase().trim();

        console.log('[Job Filter BG] 🔍 Processing Fit Recommendation:', {
          raw: rawLabel,
          afterSanitization: fitLabel
        });

        // Map the label to valid Airtable select options
        const validFitOptions = ['STRONG FIT', 'GOOD FIT', 'MODERATE FIT', 'FAIR FIT', 'WEAK FIT', 'POOR FIT', 'HARD NO'];

        if (!validFitOptions.includes(fitLabel)) {
          if (fitLabel.includes('STRONG')) fitLabel = 'STRONG FIT';
          else if (fitLabel.includes('GOOD')) fitLabel = 'GOOD FIT';
          else if (fitLabel.includes('MODERATE')) fitLabel = 'MODERATE FIT';
          else if (fitLabel.includes('FAIR')) fitLabel = 'FAIR FIT';
          else if (fitLabel.includes('WEAK')) fitLabel = 'WEAK FIT';
          else if (fitLabel.includes('POOR')) fitLabel = 'POOR FIT';
          else if (fitLabel.includes('HARD') || fitLabel.includes('NO')) fitLabel = 'HARD NO';
          else fitLabel = 'GOOD FIT';
          console.log(`[Job Filter BG] ℹ️ Mapped "${rawLabel}" → "${fitLabel}"`);
        }

        // CRITICAL: Do NOT sanitize again - it's already been sanitized above
        jobFields['Fit Recommendation'] = fitLabel;
        console.log('[Job Filter BG] ✓ Fit Recommendation:', fitLabel);
      }
    } catch (e) {
      console.log('[Job Filter BG] ⚠️ Failed to process Fit Recommendation:', e.message);
    }
    if (scoreData.job_to_user_fit?.score !== undefined) {
      jobFields['Preference Fit Score'] = scoreData.job_to_user_fit.score;
    }
    if (scoreData.user_to_job_fit?.score !== undefined) {
      jobFields['Role Fit Score'] = scoreData.user_to_job_fit.score;
    }

    // Extract matched and missing skills from breakdown
    const skillsBreakdown = scoreData.user_to_job_fit?.breakdown?.find(b => b.criteria === 'Skills Overlap');
    if (skillsBreakdown?.matched_skills && skillsBreakdown.matched_skills.length > 0) {
      // Convert array to comma-separated string for Long text field
      jobFields['Matched Skills'] = skillsBreakdown.matched_skills.join(', ');
    }
    if (skillsBreakdown?.unmatched_skills && skillsBreakdown.unmatched_skills.length > 0) {
      // Convert array to comma-separated string for Long text field
      jobFields['Missing Skills'] = skillsBreakdown.unmatched_skills.join(', ');
    }

    // Map matched benefits to Airtable multi-select values (Jobs Pipeline "Benefits")
    const benefitsBreakdown = scoreData.job_to_user_fit?.breakdown?.find(b => b.criteria === 'Benefits Package');
    if (benefitsBreakdown?.matched_benefits && benefitsBreakdown.matched_benefits.length > 0) {
      const normalizeBenefit = (value) => (value || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
      const benefitMap = {
        '401k': '401k',
        '401(k)': '401k',
        'medical': 'Medical insurance',
        'medical insurance': 'Medical insurance',
        'health insurance': 'Medical insurance',
        'dental': 'Dental insurance',
        'dental insurance': 'Dental insurance',
        'vision': 'Vision insurance',
        'vision insurance': 'Vision insurance',
        'disability': 'Disability insurance',
        'disability insurance': 'Disability insurance',
        'paid maternity': 'Paid maternity leave',
        'paid maternity leave': 'Paid maternity leave',
        'paid paternity': 'Paid paternity leave',
        'paid paternity leave': 'Paid paternity leave',
        'child care': 'Child care support',
        'child care support': 'Child care support',
        'childcare support': 'Child care support',
        'commuter': 'Commuter benefits',
        'commuter benefits': 'Commuter benefits',
        'relocation': 'Relocation',
        'student loan': 'Student loan assistance',
        'student loan assistance': 'Student loan assistance',
        'tuition': 'Tuition assistance',
        'tuition assistance': 'Tuition assistance'
      };

      const mapped = benefitsBreakdown.matched_benefits
        .map(label => benefitMap[normalizeBenefit(label)] || null)
        .filter(Boolean);

      if (mapped.length > 0) {
        jobFields['Benefits'] = Array.from(new Set(mapped));
      }
    }

    // Store deal-breaker reason if triggered
    if (scoreData.deal_breaker_triggered) {
      // Convert to comma-separated string for Long text field
      const dealbreakers = Array.isArray(scoreData.deal_breaker_triggered)
        ? scoreData.deal_breaker_triggered
        : [scoreData.deal_breaker_triggered];
      jobFields['Triggered Dealbreakers'] = dealbreakers.join(', ');
    }
  }

  const normalizedJobUrl = sanitizeString(jobData.jobUrl || '');
  if (normalizedJobUrl) {
    const jobFilterFormula = encodeURIComponent(`{Job URL}='${escapeFormulaString(normalizedJobUrl)}'`);
    const searchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.JOBS_PIPELINE}?maxRecords=1&filterByFormula=${jobFilterFormula}`;
    const searchResponse = await fetchWithRetry(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Failed to search for existing job: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json().catch(() => ({}));
    const existingRecord = searchData.records?.[0] || null;
    if (existingRecord?.id) {
      const updateFields = { ...jobFields };
      delete updateFields.Status;

      const updateUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.JOBS_PIPELINE}/${existingRecord.id}`;
      console.log('[Job Filter BG] Updating existing job by Job URL:', existingRecord.id);
      console.log('[Job Filter BG] Payload being sent to Airtable (Jobs Pipeline update):', JSON.stringify({ fields: updateFields }, null, 2));

      const updateResponse = await fetchWithRetry(updateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${credentials.pat}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: updateFields })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text().catch(() => '');
        console.error('[Job Filter BG] Job update error:', errorText);
        throw new Error(`Failed to update job: ${updateResponse.status}`);
      }

      const updateData = await updateResponse.json();
      return updateData.id;
    }
  }

  // Create the job record
  const createUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.JOBS_PIPELINE}`;

  // DEBUG: Log payload before sending to Airtable
  console.log('[Job Filter BG] Payload being sent to Airtable (Jobs Pipeline):', JSON.stringify({ fields: jobFields }, null, 2));

  const createResponse = await fetchWithRetry(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: jobFields })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('[Job Filter BG] Job creation error:', errorText);
    throw new Error(`Failed to create job: ${createResponse.status}`);
  }

  const createData = await createResponse.json();
  return createData.id;
}

async function logCaptureEvents(credentials, flags, jobRecordId, jobData, scoreData) {
  if (!flags.enableApplicationEvents) {
    return;
  }

  const basePayload = {
    jobTitle: jobData.jobTitle,
    companyName: jobData.companyName,
    jobUrl: jobData.jobUrl,
    source: jobData.source || 'LinkedIn'
  };

  await createApplicationEvent(credentials, jobRecordId, {
    eventType: 'Job Captured',
    eventSource: 'Extension',
    details: 'Job captured via extension',
    eventKey: buildEventKey('job_capture', jobRecordId, 'Captured'),
    payload: basePayload,
    statusSnapshot: 'Captured',
    laneSnapshot: jobData.lane
  });
}

async function findApplicationEventByKey(credentials, eventKey) {
  try {
    const escapedKey = String(eventKey).replace(/'/g, "\\'");
    const filterFormula = encodeURIComponent(`{event_key}='${escapedKey}'`);
    const searchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.APPLICATION_TRACKING}?maxRecords=1&filterByFormula=${filterFormula}`;
    const response = await fetchWithRetry(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => ({}));
    const records = data.records || [];
    return records.length ? records[0].id : null;
  } catch (error) {
    console.warn('[Job Filter BG] Application event lookup skipped:', error?.message || error);
    return null;
  }
}

async function createApplicationEvent(credentials, jobRecordId, {
  eventType,
  eventSource,
  details,
  eventKey,
  payload,
  statusSnapshot,
  laneSnapshot,
  rejectionReasonSnapshot
}) {
  try {
    const contract = await ensureOrchestrationContract(credentials);
    const appFields = new Set(contract.fieldsByTable?.['Application Tracking'] || []);
    const appFieldMeta = contract.fieldMetaByTable?.['Application Tracking'] || {};
    const requiredFields = ['event_key', 'event_source', 'event_payload', 'Event Type', 'Event Date'];
    const missingRequired = requiredFields.filter((fieldName) => !appFields.has(fieldName));
    if (missingRequired.length > 0) {
      console.warn('[Job Filter BG] Skipping application event create, schema incomplete:', missingRequired.join(', '));
      return;
    }

    const eventTypeField = appFieldMeta['Event Type'];
    const allowedEventTypes = new Set(
      (eventTypeField?.options?.choices || [])
        .map((choice) => choice?.name)
        .filter(Boolean)
    );
    if (allowedEventTypes.size === 0) {
      console.warn('[Job Filter BG] Skipping application event create, Event Type choices unavailable');
      return;
    }
    if (!allowedEventTypes.has(eventType)) {
      console.warn('[Job Filter BG] Skipping application event create, invalid Event Type option:', eventType);
      return;
    }

    const normalizedEventKey = eventKey || buildEventKey(eventType, jobRecordId, statusSnapshot);
    const existingEventId = await findApplicationEventByKey(credentials, normalizedEventKey);
    if (existingEventId) {
      console.log('[Job Filter BG] Skipping duplicate event_key:', normalizedEventKey, 'existing:', existingEventId);
      return;
    }

    const fields = {
      'Event Type': eventType,
      'Event Date': new Date().toISOString(),
      'event_source': eventSource,
      'event_payload': payload ? JSON.stringify(payload) : undefined,
      'event_key': normalizedEventKey,
      'Job': appFields.has('Job') ? [jobRecordId] : undefined,
      'Details': appFields.has('Details') && details ? sanitizeString(details) : undefined,
      'status_snapshot': appFields.has('status_snapshot') ? statusSnapshot : undefined,
      'lane_snapshot': appFields.has('lane_snapshot') ? laneSnapshot : undefined,
      'rejection_reason_snapshot': appFields.has('rejection_reason_snapshot') ? rejectionReasonSnapshot : undefined
    };

    const cleanFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    const createUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.APPLICATION_TRACKING}`;
    const response = await fetchWithRetry(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: cleanFields })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody?.error?.message
        || (typeof errorBody?.error === 'string' ? errorBody.error : '')
        || response.statusText
        || 'Unknown Airtable error';
      if (response.status === 422 && /create new select option/i.test(errorMessage)) {
        console.warn(`[Job Filter BG] Skipping application event create due to invalid single-select option: ${eventType}`);
        return;
      }
      console.error(`[Job Filter BG] Application event create failed: status=${response.status} error=${errorMessage}`);
    }
  } catch (error) {
    console.warn('[Job Filter BG] Application event error:', error?.message || error);
  }
}

/**
 * Fetch an Outreach Log record by ID
 * Used in Outreach Mode to display outreach message
 *
 * @param {string} recordId - Airtable record ID
 * @returns {Promise<Object>} Outreach Log record data
 */
async function handleFetchOutreachRecord(recordId) {
  const credentials = await getCredentials();

  if (!credentials.baseId || !credentials.pat) {
    return { success: false, error: 'Airtable credentials not configured' };
  }

  try {
    const url = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.OUTREACH_LOG}/${recordId}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch outreach record: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      record: data
    };

  } catch (error) {
    console.error('[Job Filter BG] Error fetching outreach record:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mark an Outreach Log record as sent
 * Updates both Outreach Log and linked Contact record
 *
 * @param {string} outreachRecordId - Outreach Log record ID
 * @param {string} contactRecordId - Contact record ID (from linked Contact field)
 * @returns {Promise<Object>} Success status
 */
async function handleMarkOutreachSent(outreachRecordId, contactRecordId) {
  const credentials = await getCredentials();
  const flags = await getFeatureFlags();

  if (!credentials.baseId || !credentials.pat) {
    return { success: false, error: 'Airtable credentials not configured' };
  }

  try {
    const now = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Update Outreach Log record
    const outreachUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.OUTREACH_LOG}/${outreachRecordId}`;

    const outreachResponse = await fetchWithRetry(outreachUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'Outreach Status': 'Sent',
          'Sent Date': now
        }
      })
    });

    if (!outreachResponse.ok) {
      throw new Error(`Failed to update outreach record: ${outreachResponse.status}`);
    }

    // Update Contact record if contactRecordId is provided
    if (contactRecordId) {
      const contactUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}/${contactRecordId}`;

      const contactResponse = await fetchWithRetry(contactUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${credentials.pat}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Last Outreach Date': now
            // Note: Next Follow-Up Date could be calculated based on Follow-Up Interval if needed
          }
        })
      });

      if (!contactResponse.ok) {
        console.warn('[Job Filter BG] Failed to update contact record, but outreach was marked as sent');
      }
    }

    await logOutreachSentEvent(credentials, flags, outreachRecordId);

    return {
      success: true,
      message: 'Outreach marked as sent'
    };

  } catch (error) {
    console.error('[Job Filter BG] Error marking outreach as sent:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function logOutreachSentEvent(credentials, flags, outreachRecordId) {
  if (!flags.enableApplicationEvents) {
    return;
  }

  try {
    const outreachUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.OUTREACH_LOG}/${outreachRecordId}`;
    const response = await fetchWithRetry(outreachUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('[Job Filter BG] Outreach fetch failed for event logging:', response.status);
      return;
    }

    const record = await response.json();
    const fields = record.fields || {};
    const jobFieldCandidates = ['Job', 'Jobs Pipeline', 'Jobs', 'Job Listings', 'Job Listing'];
    const jobRecordId = jobFieldCandidates
      .map(name => fields[name])
      .find(value => Array.isArray(value) && value.length > 0)?.[0];

    if (!jobRecordId) {
      console.warn('[Job Filter BG] No linked job found for outreach event logging');
      return;
    }

    await createApplicationEvent(credentials, jobRecordId, {
      eventType: 'Outreach Sent',
      eventSource: 'Extension',
      details: 'Outreach marked as sent',
      eventKey: buildEventKey('outreach_sent', outreachRecordId, fields['Outreach Status'] || 'Sent'),
      payload: {
        outreachRecordId,
        contactId: (fields['Contact'] || [])[0] || null,
        outreachStatus: fields['Outreach Status'] || null
      },
      statusSnapshot: fields['Outreach Status'] || undefined
    });
  } catch (error) {
    console.error('[Job Filter BG] Outreach event logging error:', error);
  }
}

/**
 * Retrieve Airtable credentials from Chrome local storage
 * @returns {Promise<Object>} { baseId: string, pat: string }
 */
async function getCredentials() {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.BASE_ID,
      STORAGE_KEYS.PAT
    ]);

    return {
      baseId: result[STORAGE_KEYS.BASE_ID] || '',
      pat: result[STORAGE_KEYS.PAT] || ''
    };
  } catch (error) {
    console.error('[Job Filter BG] Error reading credentials:', error);
    return {
      baseId: '',
      pat: ''
    };
  }
}

/**
 * Fetch with automatic retry for transient failures
 * Implements exponential backoff: 1s, 2s, 4s
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, options, maxRetries = 4) {
  let lastError;
  let lastResponse;
  const method = String(options?.method || 'GET').toUpperCase();
  const shouldRetry = method !== 'POST';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;

      // Don't retry client errors (4xx) - they won't succeed on retry
      // Do retry server errors (5xx) and rate limits (429)
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // Server error or rate limit - retry
      if (shouldRetry && (response.status === 429 || response.status >= 500)) {
        const retryAfterHeader = Number(response.headers?.get('Retry-After') || 0);
        const headerDelayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? retryAfterHeader * 1000
          : 0;
        const exponentialMs = Math.pow(2, attempt) * 1000;
        const baseDelayMs = response.status === 429
          ? Math.max(RATE_LIMIT_MIN_DELAY_MS, headerDelayMs)
          : Math.max(exponentialMs, headerDelayMs);
        const jitterMs = Math.floor(Math.random() * RETRY_JITTER_MAX_MS);
        const waitMs = baseDelayMs + jitterMs;

        if (attempt === maxRetries - 1) {
          return response;
        }

        console.log(`[Job Filter BG] Retry ${attempt + 1}/${maxRetries} after ${response.status}. Waiting ${waitMs}ms`);
        await delay(waitMs);
        continue;
      }

      return response;

    } catch (error) {
      lastError = error;
      if (!shouldRetry) {
        throw error;
      }

      const exponentialMs = Math.pow(2, attempt) * 1000;
      const jitterMs = Math.floor(Math.random() * RETRY_JITTER_MAX_MS);
      const waitMs = exponentialMs + jitterMs;
      console.log(`[Job Filter BG] Network error, retry ${attempt + 1}/${maxRetries}, waiting ${waitMs}ms`);

      if (attempt < maxRetries - 1) {
        await delay(waitMs);
      }
    }
  }

  // All retries exhausted
  if (lastResponse) {
    return lastResponse;
  }
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Simple delay helper
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// OUTREACH MODE - NEW IMPLEMENTATION FUNCTIONS
// ============================================================================

/**
 * Upsert Contact from LinkedIn profile page
 * Uses LinkedIn URL as unique identifier
 *
 * @param {Object} contactData - Contact data from profile scraping
 * @returns {Promise<Object>} { contactId, companyId }
 */
async function handleUpsertContactFromProfile(contactData) {
  const credentials = await getCredentials();

  if (!credentials.baseId || !credentials.pat) {
    throw new Error('Airtable credentials not configured');
  }

  const { firstName, lastName, fullName, roleTitle, companyName, linkedinUrl, email, phone, location } = contactData;

  // Validate required fields
  if (!linkedinUrl) {
    throw new Error('LinkedIn URL is required');
  }

  // Clean LinkedIn URL (remove query params)
  const cleanLinkedinUrl = linkedinUrl.split('?')[0];

  // 1. Search for existing contact by LinkedIn URL
  const contactFilterFormula = encodeURIComponent(`{LinkedIn URL} = '${cleanLinkedinUrl.replace(/'/g, "\\'")}'`);
  const contactSearchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}?filterByFormula=${contactFilterFormula}`;

  const contactSearchResponse = await fetchWithRetry(contactSearchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!contactSearchResponse.ok) {
    throw new Error(`Failed to search for contact: ${contactSearchResponse.status}`);
  }

  const contactSearchData = await contactSearchResponse.json();
  const existingContact = contactSearchData.records?.[0];

  // 2. Find or create Company
  let companyId = null;
  if (companyName) {
    const companyFilterFormula = encodeURIComponent(`{Company Name} = '${companyName.replace(/'/g, "\\'")}'`);
    const companySearchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.COMPANIES}?filterByFormula=${companyFilterFormula}`;

    const companySearchResponse = await fetchWithRetry(companySearchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      }
    });

    if (companySearchResponse.ok) {
      const companySearchData = await companySearchResponse.json();
      if (companySearchData.records?.length > 0) {
        companyId = companySearchData.records[0].id;
      } else {
        // Create new company
        const createCompanyUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.COMPANIES}`;
        const createCompanyResponse = await fetchWithRetry(createCompanyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.pat}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: { 'Company Name': sanitizeString(companyName) }
          })
        });

        if (createCompanyResponse.ok) {
          const newCompany = await createCompanyResponse.json();
          companyId = newCompany.id;
        }
      }
    }
  }

  // 3. Build contact payload
  const contactFields = {
    'First Name': sanitizeString(firstName || ''),
    'Last Name': sanitizeString(lastName || ''),
    'LinkedIn URL': sanitizeString(cleanLinkedinUrl),
    'Contact Type': 'Hiring Manager' // Default type (valid Airtable option)
  };

  if (roleTitle) contactFields['Role / Title'] = sanitizeString(roleTitle);
  if (email) contactFields['Email'] = sanitizeString(email);
  if (phone) contactFields['Phone / WhatsApp'] = sanitizeString(phone);
  // NOTE: Location field removed - Contacts table doesn't have this field
  if (companyId) contactFields['Companies'] = [companyId];

  // 4. Update or create contact
  let contactId;
  if (existingContact) {
    // Update existing
    const updateUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}/${existingContact.id}`;
    const updateResponse = await fetchWithRetry(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: contactFields })
    });

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.json().catch(() => ({}));
      throw new Error(`Failed to update contact: ${errorBody.error?.message || updateResponse.status}`);
    }

    contactId = existingContact.id;
    console.log('[Job Filter BG] Updated existing contact:', contactId);
  } else {
    // Create new
    const createUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}`;
    const createResponse = await fetchWithRetry(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: contactFields })
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.json().catch(() => ({}));
      throw new Error(`Failed to create contact: ${errorBody.error?.message || createResponse.status}`);
    }

    const newContact = await createResponse.json();
    contactId = newContact.id;
    console.log('[Job Filter BG] Created new contact:', contactId);
  }

  return { contactId, companyId };
}

/**
 * Fetch Outreach Log entries for a contact by LinkedIn URL
 *
 * @param {string} contactLinkedinUrl - LinkedIn profile URL
 * @returns {Promise<Array>} Array of outreach log entries
 */
async function handleFetchOutreachLogByContact(contactLinkedinUrl) {
  const credentials = await getCredentials();

  if (!credentials.baseId || !credentials.pat) {
    throw new Error('Airtable credentials not configured');
  }

  // Clean LinkedIn URL
  const cleanLinkedinUrl = contactLinkedinUrl.split('?')[0];

  // 1. Find Contact by LinkedIn URL
  const contactFilterFormula = encodeURIComponent(`{LinkedIn URL} = '${cleanLinkedinUrl.replace(/'/g, "\\'")}'`);
  const contactSearchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}?filterByFormula=${contactFilterFormula}`;

  const contactResponse = await fetchWithRetry(contactSearchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!contactResponse.ok) {
    throw new Error(`Failed to search for contact: ${contactResponse.status}`);
  }

  const contactData = await contactResponse.json();
  if (!contactData.records || contactData.records.length === 0) {
    return []; // No contact found, return empty array
  }

  const contactId = contactData.records[0].id;

  // 2. Fetch Outreach Log entries linked to this contact
  // Use SEARCH function to find records where Contact field contains this contact ID
  const outreachFilterFormula = encodeURIComponent(`SEARCH('${contactId}', ARRAYJOIN({Contact}, ',')) > 0`);
  const outreachSearchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.OUTREACH_LOG}?filterByFormula=${outreachFilterFormula}&sort[0][field]=Created%20Time&sort[0][direction]=desc`;

  const outreachResponse = await fetchWithRetry(outreachSearchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!outreachResponse.ok) {
    throw new Error(`Failed to fetch outreach log: ${outreachResponse.status}`);
  }

  const outreachData = await outreachResponse.json();

  // Map to simpler format for frontend
  return (outreachData.records || []).map(record => ({
    id: record.id,
    channel: record.fields['Outreach Channel'] || 'Unknown',
    status: record.fields['Outreach Status'] || 'Not Sent',
    message: record.fields['Outreach Message'] || '',
    sentDate: record.fields['Sent Date'] || null,
    responseDate: record.fields['Response Date'] || null,
    response: record.fields['Response'] || '',
    createdTime: record.createdTime
  }));
}

/**
 * Create a new Outreach Log entry
 *
 * @param {Object} payload - { contactLinkedinUrl, message, channel }
 * @returns {Promise<Object>} Created record
 */
async function handleCreateOutreachLogEntry(payload) {
  const credentials = await getCredentials();

  if (!credentials.baseId || !credentials.pat) {
    throw new Error('Airtable credentials not configured');
  }

  const { contactLinkedinUrl, message, channel } = payload;

  // Clean LinkedIn URL
  const cleanLinkedinUrl = contactLinkedinUrl.split('?')[0];

  // 1. Find Contact by LinkedIn URL
  const contactFilterFormula = encodeURIComponent(`{LinkedIn URL} = '${cleanLinkedinUrl.replace(/'/g, "\\'")}'`);
  const contactSearchUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.CONTACTS}?filterByFormula=${contactFilterFormula}`;

  const contactResponse = await fetchWithRetry(contactSearchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    }
  });

  if (!contactResponse.ok) {
    throw new Error(`Failed to search for contact: ${contactResponse.status}`);
  }

  const contactData = await contactResponse.json();
  if (!contactData.records || contactData.records.length === 0) {
    throw new Error('Contact not found. Please sync the contact first.');
  }

  const contactId = contactData.records[0].id;

  // 2. Create Outreach Log entry
  const createUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.OUTREACH_LOG}`;
  const createResponse = await fetchWithRetry(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        'Contact': [contactId],
        'Outreach Channel': channel || 'LinkedIn Message',
        'Outreach Status': 'Not Sent',
        'Outreach Message': message || ''
      }
    })
  });

  if (!createResponse.ok) {
    const errorBody = await createResponse.json().catch(() => ({}));
    throw new Error(`Failed to create outreach log: ${errorBody.error?.message || createResponse.status}`);
  }

  const newEntry = await createResponse.json();
  console.log('[Job Filter BG] Created outreach log entry:', newEntry.id);

  return {
    id: newEntry.id,
    createdTime: newEntry.createdTime
  };
}

// ============================================================================
// SKILL EXTRACTION - Handler Functions
// ============================================================================

/**
 * Handle skill extraction request (extraction only, no matching)
 * Used when you just want to see what skills are in a job description
 *
 * @param {Object} request - { jobDescription, jobUrl }
 * @returns {Promise<Object>} Extraction result
 */
async function handleSkillExtractionRequest(request) {
  const { jobDescription, jobUrl } = request;

  if (!jobDescription) {
    throw new Error('Job description is required');
  }

  console.log('[Job Filter BG] Extracting skills from job description...');

  // Use the skill extractor module
  // Note: These modules are loaded as content scripts, not available in service worker
  // We'll need to send a message to the content script to do the actual extraction
  // For now, return a basic extraction result

  // This is a fallback in case skill modules aren't loaded in service worker context
  const result = {
    required: [],
    desired: [],
    timestamp: Date.now(),
    jobUrl: jobUrl || '',
    confidence: 0,
    message: 'Skill extraction handled by content script'
  };

  return result;
}

/**
 * Handle full skill analysis (extraction + matching against user profile)
 *
 * @param {Object} request - { jobDescription, jobUrl, userSkills }
 * @returns {Promise<Object>} Full analysis result
 */
async function handleFullSkillAnalysis(request) {
  const { jobDescription, jobUrl, userSkills } = request;

  if (!jobDescription) {
    throw new Error('Job description is required');
  }

  console.log('[Job Filter BG] Performing full skill analysis...');

  // Get user skills from storage if not provided
  let profileSkills = userSkills || [];
  if (!profileSkills || profileSkills.length === 0) {
    try {
      const profile = await chrome.storage.local.get('jh_user_profile');
      profileSkills = profile?.jh_user_profile?.background?.core_skills || [];
      console.log('[Job Filter BG] Loaded', profileSkills.length, 'skills from user profile');
    } catch (e) {
      console.warn('[Job Filter BG] Could not load user profile:', e);
    }
  }

  // Since skill modules run in content script context, return a basic result
  // The actual analysis should be done by the content script using SkillExtractionService
  return {
    extraction: { required: [], desired: [], confidence: 0 },
    match: { matched: [], missing: [], matchRatio: 0 },
    desired: { has: [], missing: [] },
    skillFitScore: 0,
    skillFitLabel: 'Analysis pending',
    userSkillCount: profileSkills.length,
    airtablePayload: {},
    message: 'Full analysis should be performed by content script'
  };
}

/**
 * Update a job record in Airtable with skill extraction results
 *
 * @param {Object} request - { jobRecordId, skillData }
 * @returns {Promise<Object>} Update result
 */
async function handleUpdateJobSkills(request) {
  const { jobRecordId, skillData } = request;

  if (!jobRecordId) {
    throw new Error('Job record ID is required');
  }

  if (!skillData) {
    throw new Error('Skill data is required');
  }

  const credentials = await getCredentials();

  if (!credentials.baseId || !credentials.pat) {
    throw new Error('Airtable credentials not configured');
  }

  console.log('[Job Filter BG] Updating job record with skill data:', jobRecordId);

  // Build update payload
  const updateFields = {};

  if (skillData.matched && skillData.matched.length > 0) {
    updateFields['Matched Skills'] = skillData.matched.join(', ');
  }

  if (skillData.missing && skillData.missing.length > 0) {
    updateFields['Missing Skills'] = skillData.missing.join(', ');
  }

  if (skillData.matchRatio !== undefined) {
    // Format as percentage string for Airtable
    updateFields['Skill Match Ratio'] = `${(skillData.matchRatio * 100).toFixed(1)}%`;
  }

  if (skillData.desiredMissing && skillData.desiredMissing.length > 0) {
    updateFields['Desired Skills Missing'] = skillData.desiredMissing.join(', ');
  }

  if (skillData.requiredSkillCount !== undefined) {
    updateFields['Required Skills Count'] = skillData.requiredSkillCount;
  }

  if (skillData.skillFitScore !== undefined) {
    updateFields['Skill Fit Score'] = skillData.skillFitScore;
  }

  // Only update if we have fields to update
  if (Object.keys(updateFields).length === 0) {
    console.log('[Job Filter BG] No skill fields to update');
    return { success: true, message: 'No changes needed' };
  }

  // Update the job record
  const updateUrl = `${AIRTABLE_API_BASE}/${credentials.baseId}/${TABLES.JOBS_PIPELINE}/${jobRecordId}`;

  console.log('[Job Filter BG] Updating with fields:', updateFields);

  const updateResponse = await fetchWithRetry(updateUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${credentials.pat}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: updateFields })
  });

  if (!updateResponse.ok) {
    const errorBody = await updateResponse.json().catch(() => ({}));
    console.error('[Job Filter BG] ❌ Job skill update failed:', {
      status: updateResponse.status,
      error: errorBody.error
    });
    throw new Error(`Failed to update job skills: ${updateResponse.status}`);
  }

  const updateData = await updateResponse.json();
  console.log('[Job Filter BG] ✓ Job skills updated successfully');

  return {
    success: true,
    recordId: updateData.id,
    updatedFields: Object.keys(updateFields)
  };
}

// Log when service worker starts
console.log('[Job Filter BG] Background service worker initialized with CRM support + Outreach Mode + Skill Extraction');
