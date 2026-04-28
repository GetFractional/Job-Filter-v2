/**
 * Job Filter - Content Script
 *
 * Runs on LinkedIn and Indeed job detail pages to:
 * - Detect when user is viewing a job posting
 * - Extract job data from the page DOM
 * - Inject "Send to Job Filter" and "Score This Job" overlay buttons
 * - Calculate job fit scores using the scoring engine
 * - Display results in a modal overlay
 * - Send extracted data to background script for Airtable submission
 */

// Storage key for user profile (must match profile-setup.js)
const PROFILE_STORAGE_KEY = 'jh_user_profile';

// Auto-scoring state (declared at top to avoid hoisting issues)
let autoScoreDebounceTimer = null;
let lastScoredUrl = '';
let lastScoredJobKey = '';
let pendingExtractionRetryUrl = '';
let extractionRetryTimer = null;
let extractionRetryAttempts = 0;
let extractionCooldownUrl = '';
let extractionCooldownUntil = 0;
const JOB_FILTER_PATCH_VERSION = '2026-04-17-extraction-v9';

const LINKEDIN_DETAIL_ROOT_SELECTORS = [
  '.jobs-search__job-details--container',
  '.jobs-search__job-details',
  '.jobs-search-two-pane__job-details',
  '.jobs-search-two-pane__wrapper',
  '.job-view-layout',
  '.jobs-details',
  '.scaffold-layout__detail',
  '.scaffold-layout__detail-inner',
  'main'
];

const LINKEDIN_TOP_CARD_SELECTORS = [
  '.job-details-jobs-unified-top-card',
  '.jobs-unified-top-card',
  '.jobs-details-top-card',
  '.job-details-jobs-unified-top-card__container--two-pane',
  '.job-details-jobs-unified-top-card__primary-description-container',
  '.jobs-unified-top-card__primary-description-container',
  '.jobs-search__job-details .job-details-jobs-unified-top-card',
  '.jobs-search__job-details .jobs-unified-top-card'
];

const LINKEDIN_SEARCH_LIST_SELECTORS = [
  '.jobs-search-results-list',
  '.jobs-search-results__list',
  '.jobs-search-results-list__list',
  '.scaffold-layout__list',
  '.scaffold-layout__list-container'
];

/**
 * Check if extension context is still valid
 * Returns false if extension was reloaded/updated
 */
function isExtensionContextValid() {
  try {
    // Try to access chrome.runtime - will throw if context invalidated
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (error) {
    console.warn('[Job Filter] Extension context invalidated - extension was likely reloaded');
    return false;
  }
}

/**
 * Show user-friendly message when extension context is invalidated
 */
function handleInvalidContext() {
  console.log('[Job Filter] Extension was reloaded. Please refresh this page to re-enable Job Filter.');
  // Optional: Show a subtle notification to the user
  if (typeof window.JobHunterSidebar !== 'undefined') {
    try {
      window.JobHunterSidebar.remove();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
  // Also try legacy floating panel
  if (typeof window.JobHunterFloatingPanel !== 'undefined') {
    try {
      window.JobHunterFloatingPanel.remove();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}

// Prevent multiple injections
if (window.jobHunterInjected) {
  console.log('[Job Filter] Already injected, skipping');
} else {
  window.jobHunterInjected = true;
  initJobHunter();
  // Mode detection and sidebar initialization are handled by mode-detection.js
  // which is loaded before this script via manifest.json content_scripts
}

/**
 * Main initialization function
 */
function initJobHunter() {
  console.log('[Job Filter] Content script loaded', JOB_FILTER_PATCH_VERSION);

  // Determine which site we're on
  const hostname = window.location.hostname;

  if (hostname.includes('linkedin.com')) {
    handleLinkedIn();
  } else if (hostname.includes('indeed.com')) {
    handleIndeed();
  }
}

// ============================================================================
// LINKEDIN HANDLER
// ============================================================================

/**
 * Safely initialize a MutationObserver with defensive error handling
 * Prevents "Failed to execute 'observe' on 'MutationObserver'" errors
 * @param {Element|null} targetElement - The element to observe
 * @param {Function} callback - MutationObserver callback
 * @param {Object} config - Observer configuration
 * @param {string} label - Label for logging
 * @returns {MutationObserver|null} The observer or null if failed
 */
function safeInitMutationObserver(targetElement, callback, config, label = 'unnamed') {
  try {
    // Validate target exists
    if (!targetElement) {
      console.log(`[Job Filter] MutationObserver target not found for ${label}`);
      return null;
    }

    // Validate target is a valid Node (not a disconnected element or iframe content)
    if (!(targetElement instanceof Node)) {
      console.log(`[Job Filter] MutationObserver target is not a valid Node for ${label}:`, typeof targetElement);
      return null;
    }

    // Check if the node is connected to the document
    if (!targetElement.isConnected) {
      console.log(`[Job Filter] MutationObserver target is not connected to document for ${label}`);
      return null;
    }

    // Additional check: ensure it's not inside an iframe
    if (targetElement.ownerDocument !== document) {
      console.log(`[Job Filter] MutationObserver target is in different document (possibly iframe) for ${label}`);
      return null;
    }

    const observer = new MutationObserver(callback);
    observer.observe(targetElement, config);
    console.log(`[Job Filter] MutationObserver initialized successfully for ${label}`);
    return observer;
  } catch (error) {
    console.error(`[Job Filter] Failed to initialize MutationObserver for ${label}:`, error.message);
    return null;
  }
}

/**
 * Initialize LinkedIn job page handling
 */
function handleLinkedIn() {
  // LinkedIn uses client-side routing, so we need to watch for URL changes
  let lastUrl = location.href;
  let lastJobId = extractLinkedInJobId(location.href);
  let contentChangeDebounce = null;
  let detailObserverMissingLogged = false;

  // Check immediately if we're on a job page
  if (isLinkedInJobPage()) {
    injectOverlay('LinkedIn');
  }

  // Watch for URL changes (LinkedIn is a SPA)
  const urlCallback = () => {
    const currentUrl = location.href;
    const currentJobId = extractLinkedInJobId(currentUrl);
    const jobChanged = currentJobId !== lastJobId;

    if (currentUrl !== lastUrl || jobChanged) {
      lastUrl = currentUrl;

      if (jobChanged) {
        lastJobId = currentJobId;
        lastScoredUrl = '';
        lastScoredJobKey = '';
        pendingExtractionRetryUrl = '';
        extractionRetryAttempts = 0;
        extractionCooldownUrl = '';
        extractionCooldownUntil = 0;
        if (extractionRetryTimer) {
          clearTimeout(extractionRetryTimer);
          extractionRetryTimer = null;
        }
      }

      if (jobChanged && isLinkedInJobPage()) {
        setTimeout(() => {
          triggerAutoScore('LinkedIn');
        }, 500);
      }
    }
  };

  // Safely observe document.body with validation
  const urlObserver = safeInitMutationObserver(
    document.body,
    urlCallback,
    { childList: true, subtree: true },
    'URL observer'
  );

  // Watch for job card clicks - LinkedIn loads job details in-place
  document.addEventListener('click', (e) => {
    const jobCard = e.target.closest('.jobs-search-results__list-item, .job-card-container, .scaffold-layout__list-item, [data-job-id]');
    if (jobCard) {
      // Delay to let the job detail panel update and avoid LinkedIn 999 rate limiting
      setTimeout(() => {
        if (isLinkedInJobPage()) {
          triggerAutoScore('LinkedIn');
        }
      }, 1200);
    }
  });

  // Watch for changes in the job detail panel content
  const jobDetailSelectors = [
    '.jobs-search__job-details--container',
    '.jobs-search__job-details',
    '.scaffold-layout__detail',
    '.jobs-details',
    '.job-details-jobs-unified-top-card',
    '.jobs-unified-top-card',
    '.jobs-description'
  ];

  // Track if we already have a detail observer attached
  let detailObserverActive = false;

  const setupDetailObserver = () => {
    // Don't set up multiple observers
    if (detailObserverActive) return;

    const detailContainer = getLinkedInDetailRoot() || document.querySelector(jobDetailSelectors.join(', '));
    if (!detailContainer) {
      if (!detailObserverMissingLogged) {
        console.log('[Job Filter] Detail observer waiting for LinkedIn detail container');
        detailObserverMissingLogged = true;
      }
      return;
    }
    detailObserverMissingLogged = false;

    // Use the safe observer initialization function
    const detailCallback = (mutations) => {
      // Check if meaningful content changed (not just minor DOM updates)
      const hasSignificantChange = mutations.some(m =>
        m.addedNodes.length > 0 ||
        m.removedNodes.length > 0 ||
        (m.type === 'characterData' && m.target.textContent?.length > 20)
      );

      if (hasSignificantChange) {
        // Debounce to avoid excessive re-scoring and LinkedIn 999 rate limiting
        // Increased from 600ms to 1000ms for better stability
        if (contentChangeDebounce) clearTimeout(contentChangeDebounce);
        contentChangeDebounce = setTimeout(() => {
          const currentJobId = extractLinkedInJobId(location.href);
          const currentJobKey = getAutoScoreKey('LinkedIn', location.href);
          const previousJobId = lastJobId;
          const shouldRetryCurrentJob = currentJobKey !== lastScoredJobKey;
          if (currentJobId && (currentJobId !== previousJobId || shouldRetryCurrentJob)) {
            lastJobId = currentJobId;
            if (currentJobId !== previousJobId) {
              lastScoredJobKey = '';
            }
            lastScoredUrl = '';
            triggerAutoScore('LinkedIn');
          }
        }, 1000);
      }
    };

    const detailObserver = safeInitMutationObserver(
      detailContainer,
      detailCallback,
      { childList: true, subtree: true, characterData: true },
      'Detail observer'
    );

    if (detailObserver) {
      detailObserverActive = true;
    }
  };

  // Try to set up detail observer after a delay
  setTimeout(setupDetailObserver, 1000);
  // Also retry when URL changes (but only if not already active)
  setInterval(() => {
    if (!detailObserverActive) {
      setupDetailObserver();
    }
  }, 3000);
}

/**
 * Extract LinkedIn job ID from URL
 * @param {string} url - The URL to parse
 * @returns {string|null} Job ID or null
 */
function extractLinkedInJobId(url) {
  // Match /jobs/view/123456/ pattern
  const viewMatch = url.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];

  // Match currentJobId=123456 query param
  const urlObj = new URL(url);
  const currentJobId = urlObj.searchParams.get('currentJobId');
  if (currentJobId) return currentJobId;

  return null;
}

/**
 * Check if current LinkedIn page is a job detail page
 * @returns {boolean}
 */
function isLinkedInJobPage() {
  const url = window.location.href;
  // LinkedIn job URLs typically contain /jobs/view/ or /jobs/search/ with a currentJobId
  return url.includes('/jobs/view/') ||
         (url.includes('/jobs/') && url.includes('currentJobId='));
}

function isVisibleLinkedInElement(element) {
  if (!(element instanceof Element)) return false;
  if (element.closest('#jh-sidebar-rail')) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return element.getClientRects().length > 0;
}

function getBestElementText(element) {
  if (!(element instanceof Element)) return '';
  const visibleText = element.innerText?.trim() || '';
  const rawText = element.textContent?.trim() || '';
  const normalize = (text) => text.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').replace(/[ \t]+/g, ' ').trim();
  const normalizedVisible = normalize(visibleText);
  const normalizedRaw = normalize(rawText);
  return normalizedRaw.length > normalizedVisible.length + 200 ? normalizedRaw : normalizedVisible;
}

function getLinkedInDetailRoot() {
  const preferredSelectors = [
    '.jobs-search__job-details--container',
    '.jobs-search__job-details',
    '.jobs-search-two-pane__job-details',
    '.scaffold-layout__detail',
    '.scaffold-layout__detail-inner',
    '.jobs-details',
    '.job-view-layout'
  ];

  for (const selector of preferredSelectors) {
    const matches = Array.from(document.querySelectorAll(selector));
    for (const candidate of matches) {
      if (!isVisibleLinkedInElement(candidate)) continue;
      const text = candidate.innerText?.trim() || '';
      const hasTopCard = !!candidate.querySelector(LINKEDIN_TOP_CARD_SELECTORS.join(', '));
      const hasJobBody = !!findLinkedInSectionByHeading(candidate, [/^about the job$/i, /^job description$/i, /^about the role$/i]);
      if ((hasTopCard || hasJobBody) && text.length >= 200) {
        return candidate;
      }
    }
  }

  const activeSearchCard = getActiveLinkedInSearchCard();
  const candidates = Array.from(document.querySelectorAll(LINKEDIN_DETAIL_ROOT_SELECTORS.join(', ')))
    .filter((element) => isVisibleLinkedInElement(element));

  if (candidates.length === 0) {
    return null;
  }

  const scoredCandidates = candidates.map((element) => {
    const text = element.innerText?.trim() || '';
    let score = Math.min(text.length, 1200) / 18;

    if (element.matches('.jobs-search__job-details--container, .jobs-search__job-details, .jobs-search-two-pane__job-details')) {
      score += 260;
    }
    if (element.matches('.scaffold-layout__detail, .scaffold-layout__detail-inner, .jobs-details, .job-view-layout')) {
      score += 180;
    }
    if (element.querySelector('h1, [role="heading"][aria-level="1"]')) {
      score += 220;
    }
    if (element.querySelector('a[href*="/company/"], a[href*="linkedin.com/company/"]')) {
      score += 120;
    }
    if (element.querySelector('.jobs-apply-button--top-card, #jobs-apply-button-id, .jobs-unified-top-card, .job-details-jobs-unified-top-card')) {
      score += 80;
    }
    if (/about the job|applicants?|easy apply|promoted by hirer|actively reviewing applicants/i.test(text)) {
      score += 60;
    }
    if (activeSearchCard && element.contains(activeSearchCard)) {
      score -= 500;
    }
    if (element.matches('main')) {
      score -= 180;
    }
    if (element.querySelectorAll('a[href*="/jobs/view/"]').length >= 6) {
      score -= 260;
    }
    if (/99\+ results|how promoted jobs are ranked|are these results helpful|get job alerts for this search|see more jobs like this/i.test(text)) {
      score -= 320;
    }

    return { element, score };
  });

  scoredCandidates.sort((left, right) => right.score - left.score);
  return scoredCandidates[0]?.element || null;
}

function findLinkedInTitleFromScope(scope) {
  if (!(scope instanceof Element || scope instanceof Document)) {
    return '';
  }

  const currentJobId = extractLinkedInJobId(window.location.href);
  const selectors = [];
  if (currentJobId) {
    selectors.push(`a[href*="/jobs/view/${currentJobId}"]`);
    selectors.push(`a[href*="currentJobId=${currentJobId}"]`);
  }
  selectors.push(
    '.job-card-list__title',
    '.job-card-container__link',
    '.job-card-container__title',
    '.jobs-unified-top-card__job-title a',
    '.job-details-jobs-unified-top-card__job-title a',
    'a[href*="/jobs/view/"]'
  );

  const seen = new Set();
  for (const selector of selectors) {
    const elements = scope.querySelectorAll(selector);
    for (const element of elements) {
      if (!(element instanceof Element)) continue;
      if (element.closest('a[href*="/company/"]')) continue;
      const text = normalizeLinkedInText(element.textContent);
      if (!text || seen.has(text)) continue;
      seen.add(text);
      if (isValidLinkedInJobTitle(text)) {
        return text;
      }
    }
  }

  return '';
}

function getActiveLinkedInSearchCard() {
  const currentJobId = extractLinkedInJobId(window.location.href);
  const searchListRoot = LINKEDIN_SEARCH_LIST_SELECTORS
    .map((selector) => document.querySelector(selector))
    .find((element) => element instanceof Element)
    || document;
  const directCandidates = [];

  if (currentJobId) {
    directCandidates.push(
      searchListRoot.querySelector(`[data-job-id="${currentJobId}"]`),
      searchListRoot.querySelector(`[data-occludable-job-id="${currentJobId}"]`),
      searchListRoot.querySelector(`a[href*="/jobs/view/${currentJobId}"]`),
      searchListRoot.querySelector(`a[href*="currentJobId=${currentJobId}"]`)
    );
  }

  directCandidates.push(
    searchListRoot.querySelector('[aria-current="true"]'),
    searchListRoot.querySelector('[aria-current="page"]'),
    searchListRoot.querySelector('.jobs-search-results__list-item--active'),
    searchListRoot.querySelector('.job-card-container--selected'),
    searchListRoot.querySelector('.scaffold-layout__list-item--active'),
    searchListRoot.querySelector('.jobs-search-results-list__list-item--active')
  );

  for (const candidate of directCandidates) {
    if (!(candidate instanceof Element)) continue;
    if (candidate.closest(LINKEDIN_DETAIL_ROOT_SELECTORS.join(', '))) continue;
    const anchorCard = findBestLinkedInSearchCardContainer(candidate);
    if (anchorCard) return anchorCard;
    const card = candidate.closest('.jobs-search-results__list-item, .job-card-container, .scaffold-layout__list-item, .jobs-search-results-list__list-item, li');
    if (card) return card;
    return candidate;
  }

  return null;
}

function findBestLinkedInSearchCardContainer(element) {
  if (!(element instanceof Element)) return null;
  const currentJobId = extractLinkedInJobId(window.location.href);
  let cursor = element;
  const candidates = [];
  for (let depth = 0; cursor && depth < 8; depth += 1, cursor = cursor.parentElement) {
    if (!(cursor instanceof Element)) continue;
    if (cursor.closest('#jh-sidebar-rail')) continue;
    if (cursor.closest(LINKEDIN_DETAIL_ROOT_SELECTORS.join(', '))) continue;
    const text = getBestElementText(cursor);
    if (!text || text.length < 20 || text.length > 2200) continue;
    const hasCurrentJobAnchor = currentJobId
      ? !!cursor.querySelector(`a[href*="/jobs/view/${currentJobId}"], a[href*="currentJobId=${currentJobId}"]`)
      : true;
    if (!hasCurrentJobAnchor) continue;
    let score = 0;
    if (findLinkedInTitleFromScope(cursor)) score += 50;
    if (/(remote|hybrid|on-site|onsite|united states|,\s*[A-Z]{2}\b)/i.test(text)) score += 35;
    if (/\$\s*[\d,]/.test(text)) score += 30;
    if (/\b(benefits?|easy apply|viewed|applicants?|ago)\b/i.test(text)) score += 15;
    score += Math.min(text.length, 800) / 40;
    candidates.push({ element: cursor, score });
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.element || null;
}

function extractLinkedInSearchCardFallbackData() {
  const card = getActiveLinkedInSearchCard();
  if (!card) return {};
  const anchorTitle = findLinkedInTitleFromScope(card);

  const jobTitle = getTextFromScopedSelectors(card, [
    '.job-card-list__title',
    '.job-card-container__link',
    '.job-card-container__title',
    '.artdeco-entity-lockup__title',
    'a[href*="/jobs/view/"] strong',
    'strong'
  ]) || '';

  const companyName = getTextFromScopedSelectors(card, [
    '.job-card-container__company-name',
    '.job-card-container__primary-description',
    '.job-card-container__subtitle',
    '.artdeco-entity-lockup__subtitle',
    'a[href*="/company/"]'
  ]) || '';

  const location = getTextFromScopedSelectors(card, [
    '.job-card-container__metadata-item',
    '.job-card-container__metadata-wrapper li',
    '.artdeco-entity-lockup__caption',
    '.artdeco-entity-lockup__metadata',
    '.job-card-container__footer-item'
  ]) || '';

  const companyLinkEl = card.querySelector('a[href*="/company/"], a[href*="linkedin.com/company/"]');

  const cardLines = Array.from(new Set(
    (card.innerText || '')
      .split('\n')
      .map(line => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  ));

  const titleFromLines = cardLines.find((line) => {
    if (/^(viewed|promoted|easy apply|actively reviewing applicants)/i.test(line)) return false;
    if (/\b(applicants?|benefits?|ago)\b/i.test(line)) return false;
    if (/^\$/.test(line)) return false;
    if (/(remote|hybrid|on-site|onsite|united states|, [A-Z]{2}\b)/i.test(line)) return false;
    return line.split(/\s+/).length >= 2;
  }) || '';

  const companyFromLines = cardLines.find((line) => {
    if (!line || line === jobTitle || line === titleFromLines) return false;
    if (/^(viewed|promoted|easy apply|actively reviewing applicants)/i.test(line)) return false;
    if (/\b(applicants?|benefits?|ago)\b/i.test(line)) return false;
    if (/^\$/.test(line)) return false;
    if (/(remote|hybrid|on-site|onsite|united states|, [A-Z]{2}\b)/i.test(line)) return false;
    return true;
  }) || '';

  const locationFromLines = cardLines.find((line) => (
    /(remote|hybrid|on-site|onsite|united states|united kingdom|canada|australia|germany|france|india|, [A-Z]{2}\b)/i.test(line)
  )) || '';

  const compensationLines = cardLines.filter((line) => (
    /\$\s*[\d,]/.test(line) || /(salary|compensation|pay range|base pay|base salary|bonus|equity|stock|rsu|option|espp)/i.test(line)
  ));
  const salaryText = compensationLines.find((line) => /\$\s*[\d,]/.test(line))
    || compensationLines.find((line) => /(salary|compensation|pay range|base pay|base salary)/i.test(line))
    || '';
  const compensationText = compensationLines.join(' · ');
  const benefitLines = cardLines.filter((line) => (
    /\bbenefits?\b/i.test(line) ||
    /(medical|health|dental|vision|401\s*\(?k\)?|pto|vacation|parental|tuition|commuter|relocation|disability)/i.test(line)
  ));
  const benefits = Array.from(new Set(benefitLines.flatMap((line) => extractBenefitItemsFromText(line))));

  return {
    jobTitle: anchorTitle || jobTitle || titleFromLines,
    companyName: companyName || companyFromLines,
    location: location || locationFromLines,
    companyPageUrl: companyLinkEl?.href ? cleanCompanyUrl(companyLinkEl.href) : '',
    salaryText,
    compensationText,
    benefits
  };
}

function normalizeLinkedInIdentityText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\(verified job\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function identityTextMatches(left, right) {
  const normalizedLeft = normalizeLinkedInIdentityText(left);
  const normalizedRight = normalizeLinkedInIdentityText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight
    || normalizedLeft.includes(normalizedRight)
    || normalizedRight.includes(normalizedLeft);
}

function isLinkedInSearchCardFallbackSafe(cardFallback, data) {
  return identityTextMatches(cardFallback?.jobTitle, data?.jobTitle)
    && identityTextMatches(cardFallback?.companyName, data?.companyName);
}

function getLinkedInTopCardRoot(detailRoot) {
  const scopedCandidates = detailRoot
    ? Array.from(detailRoot.querySelectorAll(LINKEDIN_TOP_CARD_SELECTORS.join(', ')))
    : Array.from(document.querySelectorAll(LINKEDIN_TOP_CARD_SELECTORS.join(', ')));
  const visibleScoped = scopedCandidates.find((candidate) => isVisibleLinkedInElement(candidate));
  if (visibleScoped) return visibleScoped;

  const genericTopCard = getLinkedInGenericTopCardRoot(detailRoot || getLinkedInDetailRoot());
  if (genericTopCard) return genericTopCard;

  if (detailRoot) return null;

  const detailRootCandidate = getLinkedInDetailRoot();
  if (!detailRootCandidate) return null;
  return Array.from(detailRootCandidate.querySelectorAll(LINKEDIN_TOP_CARD_SELECTORS.join(', ')))
    .find((candidate) => isVisibleLinkedInElement(candidate))
    || getLinkedInGenericTopCardRoot(detailRootCandidate)
    || null;
}

function getLinkedInGenericTopCardRoot(detailRoot) {
  if (!(detailRoot instanceof Element || detailRoot instanceof Document)) return null;

  const headings = Array.from(detailRoot.querySelectorAll('h1, [role="heading"][aria-level="1"]'))
    .filter((element) => element instanceof Element && isValidLinkedInJobTitle(element.textContent || element.innerText));

  const candidates = [];
  for (const heading of headings) {
    let cursor = heading;
    for (let depth = 0; cursor && depth < 8; depth += 1, cursor = cursor.parentElement) {
      if (!(cursor instanceof Element)) continue;
      if (cursor.closest('#jh-sidebar-rail')) continue;
      const text = getBestElementText(cursor);
      if (!text || text.length < 60 || text.length > 2600) continue;
      if (/use ai to assess how you fit|people you can reach out to|about the job|about the company|more jobs|see more jobs like this/i.test(text)) {
        continue;
      }

      let score = 0;
      if (isVisibleLinkedInElement(cursor)) score += 30;
      if (/\$\s*[\d,]/.test(text)) score += 35;
      if (/(remote|hybrid|on[-\s]?site|onsite|united states|,\s*[A-Z]{2}\b)/i.test(text)) score += 30;
      if (/\b(full[-\s]?time|part[-\s]?time|contract|internship)\b/i.test(text)) score += 20;
      if (/apply|save|applicants?|promoted by hirer|actively reviewing applicants/i.test(text)) score += 15;
      score += Math.max(0, 600 - text.length) / 20;
      candidates.push({ element: cursor, score });
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.element || null;
}

function getSalaryTextCandidatesFromScope(scope) {
  if (!(scope instanceof Element || scope instanceof Document)) return [];
  const values = [];
  const nodes = Array.from(scope.querySelectorAll('span, div, li, button, p'))
    .filter((element) => element instanceof Element && !element.closest('#jh-sidebar-rail'));

  for (const node of nodes) {
    const text = normalizeLinkedInText(node.textContent);
    if (!text || text.length > 220) continue;
    if (!/\$\s*[\d,]/.test(text)) continue;
    if (hasBudgetaryCompensationContext(text)) continue;
    values.push(text);
  }

  return Array.from(new Set(values));
}

function splitLinkedInTextLines(text) {
  return Array.from(new Set(
    (text || '')
      .split('\n')
      .map(line => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  ));
}

const LINKEDIN_UI_NOISE_PATTERNS = [
  /use ai to assess how you fit/i,
  /assessing your job match/i,
  /your profile and resume match some required qualifications/i,
  /get ai-powered advice/i,
  /show match details/i,
  /tailor my resume/i,
  /help me stand out/i,
  /people you can reach out to/i,
  /meet the hiring team/i,
  /featured benefits/i,
  /set alert for similar jobs/i,
  /more jobs/i,
  /see more jobs like this/i,
  /job search (?:faster|smarter) with premium/i,
  /reactivate premium/i,
  /cancel anytime\. no hidden fees\./i,
  /about the company/i,
  /interested in working with us in the future/i,
  /looking for talent\?/i,
  /company photos/i,
  /select language/i,
  /questions\?/i
];

function normalizeLinkedInText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isLinkedInUiNoiseLine(value) {
  const text = normalizeLinkedInText(value);
  if (!text) return false;
  return LINKEDIN_UI_NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

function isValidLinkedInJobTitle(value) {
  const text = normalizeLinkedInText(value);
  if (!text) return false;
  if (text.length < 3 || text.length > 160) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (isLinkedInUiNoiseLine(text)) return false;
  if (/^(about the job|about the role|responsibilities|qualifications|requirements|benefits|apply|save|show more|show less|job poster)$/i.test(text)) {
    return false;
  }
  return true;
}

function findLinkedInSectionByHeading(scope, patterns) {
  if (!(scope instanceof Element || scope instanceof Document)) {
    return null;
  }

  const headings = Array.from(scope.querySelectorAll('h1, h2, h3, h4, strong, span, div, p'))
    .filter((element) => {
      if (!(element instanceof Element)) return false;
      if (element.closest('#jh-sidebar-rail')) return false;
      const text = normalizeLinkedInText(element.textContent);
      if (!text || text.length > 120) return false;
      return patterns.some((pattern) => pattern.test(text));
    });

  for (const heading of headings) {
    const containers = [
      heading.closest('section'),
      heading.closest('article'),
      heading.closest('.artdeco-card'),
      heading.closest('.job-details-module'),
      heading.parentElement,
      heading.parentElement?.parentElement
    ].filter(Boolean);

    for (const container of containers) {
      const text = getBestElementText(container);
      if (text.length >= (heading.textContent?.trim().length || 0) + 20) {
        return container;
      }
    }
  }

  return null;
}

function normalizeLinkedInLocation(rawLocation) {
  const result = {
    location: '',
    workplaceType: '',
    postedDate: null,
    applicantCount: null
  };

  if (!rawLocation) {
    return result;
  }

  const text = rawLocation.replace(/\s+/g, ' ').trim();

  if (/remote/i.test(text)) result.workplaceType = 'Remote';
  else if (/hybrid/i.test(text)) result.workplaceType = 'Hybrid';
  else if (/on[-\s]?site|onsite/i.test(text)) result.workplaceType = 'On-site';

  const postedMatch = text.match(/(?:posted|reposted)?\s*(\d+\s+(?:hour|day|week|month)s?\s+ago)/i);
  if (postedMatch?.[1]) {
    result.postedDate = postedMatch[1].trim();
  }

  const applicantMatch = text.match(/(?:over\s+)?(\d+)\s+applicants?|be among the first\s+(\d+)/i);
  if (applicantMatch) {
    const count = applicantMatch[1] || applicantMatch[2];
    if (count) {
      result.applicantCount = parseInt(count, 10);
    }
  }

  const segments = text
    .split(/\s*[·•|]\s*/)
    .map(segment => segment.trim())
    .filter(Boolean);

  const locationSegment = segments.find((segment) => {
    if (/^(?:posted|reposted)?\s*\d+\s+(?:hour|day|week|month)s?\s+ago$/i.test(segment)) return false;
    if (/(?:over\s+)?\d+\s+applicants?|be among the first \d+/i.test(segment)) return false;
    if (/promoted by hirer|actively reviewing applicants|easy apply|viewed/i.test(segment)) return false;
    if (/^\$/.test(segment)) return false;
    return true;
  }) || '';

  let cleanedLocation = locationSegment
    .replace(/\((remote|hybrid|on[-\s]?site|onsite)\)/ig, '')
    .replace(/^location[:\s]*/i, '')
    .replace(/^(remote|hybrid|on[-\s]?site|onsite)\s+in\s+/i, '')
    .trim();

  const hadUnitedStatesSuffix = /,\s*United States( of America)?$/i.test(cleanedLocation);
  cleanedLocation = cleanedLocation.replace(/,\s*United States( of America)?$/i, '').trim();
  if (!cleanedLocation && (hadUnitedStatesSuffix || /\bUnited States( of America)?\b/i.test(text))) {
    cleanedLocation = 'United States';
  }
  if (/^united states( of america)?$/i.test(locationSegment)) {
    cleanedLocation = 'United States';
  }
  result.location = cleanedLocation;
  return result;
}

function chooseLinkedInLocationText(candidates) {
  const values = (Array.isArray(candidates) ? candidates : [])
    .map((value) => normalizeLinkedInText(value))
    .filter(Boolean);

  if (values.length === 0) return '';

  const hasRealLocation = (value) => (
    /\bUnited States( of America)?\b/i.test(value) ||
    /[A-Za-z .'-]+,\s*[A-Z]{2}\b/.test(value) ||
    /\b(Canada|United Kingdom|Australia|Germany|France|India)\b/i.test(value)
  );

  return values.find(hasRealLocation)
    || values.find((value) => !/^(remote|hybrid|on[-\s]?site|onsite)$/i.test(value))
    || values[0];
}

function extractLinkedInDetailMetadata(detailRoot) {
  const topCard = getLinkedInTopCardRoot(detailRoot);
  const lines = splitLinkedInTextLines(topCard?.innerText || '');

  const locationLine = lines.find((line) => {
    if (/^\$/.test(line)) return false;
    if (/promoted by hirer|actively reviewing applicants|easy apply|viewed/i.test(line)) return false;
    return /(remote|hybrid|on[-\s]?site|onsite|united states|united kingdom|canada|australia|germany|france|india|,\s*[A-Z]{2}\b|applicants?|ago)/i.test(line);
  }) || '';

  const compensationLines = lines.filter((line) => (
    /\$\s*[\d,]/.test(line) || /(salary|compensation|pay range|base pay|base salary|bonus|equity|stock|rsu|option|espp)/i.test(line)
  ));

  let salaryLine = compensationLines.find((line) => /\$\s*[\d,]/.test(line)) || '';
  if (!salaryLine) {
    const salaryLabelIndex = lines.findIndex((line) => /(salary|compensation|pay range|base pay|base salary)/i.test(line));
    if (salaryLabelIndex >= 0) {
      salaryLine = lines.slice(salaryLabelIndex, salaryLabelIndex + 3).join(' ');
    }
  }

  const employmentLine = lines.find((line) => (
    /\b(full[-\s]?time|part[-\s]?time|contract|internship|temporary)\b/i.test(line)
  )) || '';

  const normalizedLocation = normalizeLinkedInLocation(locationLine);

  return {
    topCard,
    lines,
    locationText: normalizedLocation.location,
    locationLine,
    workplaceType: normalizedLocation.workplaceType,
    postedDate: normalizedLocation.postedDate,
    applicantCount: normalizedLocation.applicantCount,
    salaryText: salaryLine,
    compensationText: compensationLines.join(' · '),
    employmentText: employmentLine
  };
}

function getLinkedInDescriptionRoot(detailRoot) {
  const scope = detailRoot || document;
  const aboutSection = findLinkedInSectionByHeading(scope, [/^about the job$/i, /^job description$/i, /^about the role$/i]);
  if (aboutSection instanceof Element) {
    const aboutText = getBestElementText(aboutSection);
    if (aboutText.length >= 120) {
      return { element: aboutSection, source: 'about_heading' };
    }
  }
  const directSelectors = [
    '.jobs-description__content',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    '.description__text',
    '.jobs-description__container',
    '#job-details',
    '.jobs-description',
    '[data-testid="job-details"]'
  ];

  const directCandidates = Array.from(scope.querySelectorAll(directSelectors.join(', ')))
    .filter((element) => element instanceof Element && !element.closest('#jh-sidebar-rail'));

  const scoreCandidate = (element) => {
    const text = getBestElementText(element);
    if (text.length < 120) return 0;
    if (element.querySelectorAll('a[href*="/jobs/view/"]').length >= 3) return 0;
    if (/are these results helpful|get job alerts for this search|select language|looking for talent\?/i.test(text)) {
      return 0;
    }

    let score = Math.min(text.length, 4000) / 10;
    if (/about the job|job description|qualifications|responsibilities|requirements|what you'll do|about us/i.test(text)) {
      score += 220;
    }
    if (/\$\s*[\d,]/.test(text)) score += 40;
    if (/\b(benefits|bonus|equity|remote|hybrid|full[-\s]?time|part[-\s]?time|contract|experience)\b/i.test(text)) {
      score += 40;
    }
    if (/about the company|more jobs|set alert for similar jobs|see more jobs like this/i.test(text)) {
      score -= 180;
    }
    if (/use ai to assess how you fit|assessing your job match|your profile and resume match some required qualifications|people you can reach out to|meet the hiring team/i.test(text)) {
      score -= 120;
    }
    return score;
  };

  const scoreElements = (elements) => elements
    .map((element) => ({ element, score: scoreCandidate(element) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const directScored = scoreElements(directCandidates);
  if (directScored[0]) {
    return { element: directScored[0].element, source: 'direct' };
  }

  const heuristicCandidates = Array.from(scope.querySelectorAll('section, article, div'))
    .filter((element) => {
      if (!(element instanceof Element)) return false;
      if (element.closest('#jh-sidebar-rail')) return false;
      const text = getBestElementText(element);
      return text.length >= 200;
    });

  const heuristicScored = scoreElements(heuristicCandidates);
  if (heuristicScored[0]) {
    return { element: heuristicScored[0].element, source: 'heuristic' };
  }

  return { element: null, source: 'none' };
}

function cleanLinkedInDescriptionText(text) {
  if (!text) return '';

  let cleaned = text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // LinkedIn often hides expanded description text in textContent without useful
  // line breaks. Restore common section boundaries so skill/tool extraction can
  // still find requirement and qualification sections.
  cleaned = cleaned.replace(
    /\s+(About the Company|About the Role|About The Role|Responsibilities|Qualifications|Requirements|Required Skills|Preferred Skills|Preferred Qualifications|Minimum Qualifications|What You'll Do|What You Will Do|Benefits Include:?|Benefits|Pay range and compensation package)\b/g,
    '\n\n$1'
  );

  const aboutMatch = cleaned.match(/(^|\n)\s*about the job\s*(\n|$)/i);
  if (aboutMatch) {
    cleaned = cleaned.slice(aboutMatch.index + (aboutMatch[1] ? aboutMatch[1].length : 0)).trim();
  }

  const trailingBoundaryPatterns = [
    /(^|\n)\s*use ai to assess how you fit\s*(\n|$)/i,
    /(^|\n)\s*assessing your job match\s*(\n|$)/i,
    /(^|\n)\s*your profile and resume match some required qualifications\s*(\n|$)/i,
    /(^|\n)\s*people you can reach out to\s*(\n|$)/i,
    /(^|\n)\s*meet the hiring team\s*(\n|$)/i,
    /(^|\n)\s*featured benefits\s*(\n|$)/i,
    /(^|\n)\s*benefits found in job post\s*(\n|$)/i,
    /(^|\n)\s*set alert for similar jobs\s*(\n|$)/i,
    /(^|\n)\s*about the company\s*(\n|$)/i,
    /(^|\n)\s*more jobs\s*(\n|$)/i,
    /(^|\n)\s*see more jobs like this\s*(\n|$)/i,
    /(^|\n)\s*job search (?:faster|smarter) with premium\s*(\n|$)/i,
    /(^|\n)\s*reactivate premium\s*(\n|$)/i,
    /(^|\n)\s*cancel anytime\. no hidden fees\.\s*(\n|$)/i,
    /(^|\n)\s*interested in working with us in the future\?\s*(\n|$)/i,
    /(^|\n)\s*looking for talent\?\s*(\n|$)/i,
    /(^|\n)\s*questions\?\s*(\n|$)/i,
    /(^|\n)\s*select language\s*(\n|$)/i
  ];

  let cutoff = cleaned.length;
  for (const pattern of trailingBoundaryPatterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    cutoff = Math.min(cutoff, match.index + (match[1] ? match[1].length : 0));
  }

  return cleaned.slice(0, cutoff).trim();
}

function extractLinkedInDetailHeaderFallbackData(detailRoot) {
  const topCard = getLinkedInTopCardRoot(detailRoot);

  if (!topCard) {
    return {};
  }

  const heading = Array.from(topCard.querySelectorAll('h1, [role="heading"][aria-level="1"], h2'))
    .find((element) => isValidLinkedInJobTitle(element.innerText));
  const anchorTitle = findLinkedInTitleFromScope(topCard);
  const companyLink = Array.from(topCard.querySelectorAll('a[href*="/company/"], a[href*="linkedin.com/company/"]'))
    .find((element) => element.textContent?.trim());
  const lines = splitLinkedInTextLines(topCard.innerText || '');
  const tokenCandidates = Array.from(topCard.querySelectorAll('button, a, span, li, div'))
    .map((element) => normalizeLinkedInText(element.textContent))
    .filter((text) => text && text.length <= 120 && !isLinkedInUiNoiseLine(text));
  const topCardTokens = Array.from(new Set([...lines, ...tokenCandidates]));

  const headerTitle = anchorTitle || heading?.innerText?.trim() || lines.find((line) => {
    if (/\b(applicants?|ago|easy apply|promoted by hirer|actively reviewing applicants)\b/i.test(line)) return false;
    if (/^\$/.test(line)) return false;
    return isValidLinkedInJobTitle(line);
  }) || '';

  const headerCompany = companyLink?.textContent?.trim() || lines.find((line) => {
    if (!line || line === headerTitle) return false;
    if (isLinkedInUiNoiseLine(line)) return false;
    if (/\b(applicants?|ago|easy apply|promoted by hirer|actively reviewing applicants)\b/i.test(line)) return false;
    if (/^\$/.test(line)) return false;
    if (/(remote|hybrid|on-site|onsite|united states|, [A-Z]{2}\b)/i.test(line)) return false;
    return true;
  }) || '';

  const headerLocation = topCardTokens.find((line) => (
    /(remote|hybrid|on-site|onsite|united states|united kingdom|canada|australia|germany|france|india|, [A-Z]{2}\b)/i.test(line)
  )) || '';
  const compensationLines = topCardTokens.filter((line) => (
    /\$\s*[\d,]/.test(line) || /(salary|compensation|pay range|base pay|base salary|bonus|equity|stock|rsu|option|espp)/i.test(line)
  ));
  const salaryText = compensationLines.find((line) => /\$\s*[\d,]/.test(line))
    || compensationLines.find((line) => /(salary|compensation|pay range|base pay|base salary)/i.test(line))
    || '';
  const employmentText = topCardTokens.find((line) => (
    /\b(full[-\s]?time|part[-\s]?time|contract|internship|temporary)\b/i.test(line)
  )) || '';
  const normalizedLocation = normalizeLinkedInLocation(headerLocation);

  return {
    jobTitle: headerTitle,
    companyName: headerCompany,
    location: headerLocation,
    companyPageUrl: companyLink?.href ? cleanCompanyUrl(companyLink.href) : '',
    salaryText,
    compensationText: compensationLines.join(' · '),
    employmentText,
    workplaceType: normalizedLocation.workplaceType || ''
  };
}

/**
 * Extract job data from LinkedIn job detail page
 * @returns {Object} Extracted job data
 */
function extractLinkedInJobData() {
  const data = {
    jobTitle: '',
    companyName: '',
    companyPageUrl: '',
    location: '',
    salaryMin: null,
    salaryMax: null,
    workplaceType: '',
    employmentType: '',
    equityMentioned: false,
    bonusMentioned: false,
    descriptionText: '',
    jobUrl: window.location.href,
    source: 'LinkedIn',
    detailContentReady: false,
    descriptionCharCount: 0,
    descriptionSource: 'none',
    // New extraction fields
    hiringManager: null,
    hiringManagerDetails: null, // { name, title }
    postedDate: null,
    applicantCount: null
  };

  try {
    const detailRoot = getLinkedInDetailRoot();
    const detailHeaderFallback = extractLinkedInDetailHeaderFallbackData(detailRoot);
    const detailMetadata = extractLinkedInDetailMetadata(detailRoot);
    const topCard = detailMetadata.topCard || getLinkedInTopCardRoot(detailRoot);
    const descriptionMatch = getLinkedInDescriptionRoot(detailRoot);
    const descriptionRoot = descriptionMatch?.element || null;
    const cardFallback = extractLinkedInSearchCardFallbackData();

    // Job Title - try multiple possible selectors
    const titleSelectors = [
      '.job-details-jobs-unified-top-card h1',
      '.jobs-unified-top-card h1',
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      'h1[class*="t-24"]',
      '.t-24.t-bold.inline',
      'h1.topcard__title',
      '.jobs-details-top-card__job-title'
    ];
    data.jobTitle = getTextFromScopedSelectors(detailRoot, titleSelectors) || '';
    if (!isValidLinkedInJobTitle(data.jobTitle)) {
      data.jobTitle = '';
    }
    if (!data.jobTitle && detailRoot) {
      const firstHeading = Array.from(detailRoot.querySelectorAll('h1, h2'))
        .find((el) => isValidLinkedInJobTitle(el.innerText));
      if (firstHeading?.innerText?.trim()) {
        data.jobTitle = firstHeading.innerText.trim();
      }
    }
    if (!data.jobTitle) {
      const scopedAnchorTitle = findLinkedInTitleFromScope(detailRoot || document);
      if (isValidLinkedInJobTitle(scopedAnchorTitle)) {
        data.jobTitle = scopedAnchorTitle;
      }
    }
    if (!data.jobTitle && isValidLinkedInJobTitle(cardFallback.jobTitle)) {
      data.jobTitle = cardFallback.jobTitle;
    }
    if (!data.jobTitle && topCard) {
      const anchorTitle = findLinkedInTitleFromScope(topCard);
      if (isValidLinkedInJobTitle(anchorTitle)) {
        data.jobTitle = anchorTitle;
      }
    }
    if (!data.jobTitle && isValidLinkedInJobTitle(detailHeaderFallback.jobTitle)) {
      data.jobTitle = detailHeaderFallback.jobTitle;
    }
    if (!data.jobTitle) {
      const documentHeading = Array.from(document.querySelectorAll(
        '.scaffold-layout__detail h1, .jobs-search__job-details h1, .jobs-search-two-pane__job-details h1, main h1, [role="heading"][aria-level="1"], h1'
      )).find((el) => isValidLinkedInJobTitle(el.innerText));
      if (documentHeading?.innerText?.trim()) {
        data.jobTitle = documentHeading.innerText.trim();
      }
    }

    // Company Name - try multiple possible selectors
    const companySelectors = [
      '.job-details-jobs-unified-top-card a[href*="/company/"]',
      '.jobs-unified-top-card a[href*="/company/"]',
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      '.jobs-details-top-card__company-url',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '.jobs-unified-top-card__subtitle-1 .app-aware-link'
    ];
    data.companyName = getTextFromScopedSelectors(detailRoot, companySelectors) || getTextFromSelectors(companySelectors) || '';
    const companyLinkSelectors = [
      '.job-details-jobs-unified-top-card__company-name a[href*="/company/"]',
      '.jobs-unified-top-card__company-name a[href*="/company/"]',
      '.jobs-details-top-card__company-url a[href*="/company/"]',
      'a[href*="linkedin.com/company/"]'
    ];
    const companyLinkEl = detailRoot?.querySelector(companyLinkSelectors.join(',')) || document.querySelector(companyLinkSelectors.join(','));
    if (companyLinkEl?.href) {
      data.companyPageUrl = cleanCompanyUrl(companyLinkEl.href);
    }
    if (!data.companyName) {
      // Wider fallbacks: any company link in the top card area
      const topCard = detailRoot?.querySelector('.job-details-jobs-unified-top-card, .jobs-unified-top-card, .job-details-jobs-unified-top-card__primary-description-container')
        || document.querySelector('.job-details-jobs-unified-top-card, .jobs-unified-top-card, .job-details-jobs-unified-top-card__primary-description-container');
      const companyLink = topCard?.querySelector(
        'a[href*="/company/"], a[data-tracking-control-name*="org-name"], a[data-tracking-control-name*="company-name"]'
      );
      if (companyLink?.textContent?.trim()) {
        data.companyName = companyLink.textContent.trim();
        if (!data.companyPageUrl && companyLink.href) {
          data.companyPageUrl = cleanCompanyUrl(companyLink.href);
        }
      }
    }
    if (!data.companyName) {
      // Final fallback: scan all obvious company links (company URLs / app-aware links) and pick the first non-empty text/aria-label
      const linkCandidates = Array.from(
        (detailRoot || document).querySelectorAll('a[href*="linkedin.com/company/"], a[href*="/company/"][data-test-app-aware-link]')
      );
      for (const link of linkCandidates) {
        const text = link.textContent?.trim();
        const aria = link.getAttribute('aria-label')?.replace(/ logo$/i, '').trim();
        if (text) {
          data.companyName = text;
          if (!data.companyPageUrl && link.href) {
            data.companyPageUrl = cleanCompanyUrl(link.href);
          }
          break;
        }
        if (!text && aria) {
          data.companyName = aria;
          if (!data.companyPageUrl && link.href) {
            data.companyPageUrl = cleanCompanyUrl(link.href);
          }
          break;
        }
      }
    }

    if (!data.companyName && cardFallback.companyName) {
      data.companyName = cardFallback.companyName;
    }
    if (!data.companyName && detailHeaderFallback.companyName) {
      data.companyName = detailHeaderFallback.companyName;
    }
    const rawLocationFallback = chooseLinkedInLocationText([
      getTextFromScopedSelectors(detailRoot, [
        '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
        '.jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__workplace-type',
        '.topcard__flavor--bullet',
        '.jobs-details-top-card__bullet',
        '.jobs-unified-top-card__primary-description'
      ]),
      detailMetadata.locationLine ||
      detailHeaderFallback.location ||
      cardFallback.location ||
      ''
    ]);

    const normalizedLinkedInLocation = normalizeLinkedInLocation(rawLocationFallback);
    if (!data.location && normalizedLinkedInLocation.location) {
      data.location = normalizedLinkedInLocation.location;
    } else if (!data.location && /\bUnited States( of America)?\b/i.test(rawLocationFallback)) {
      data.location = 'United States';
    }
    if (!data.workplaceType && normalizedLinkedInLocation.workplaceType) {
      data.workplaceType = normalizedLinkedInLocation.workplaceType;
    }
    if (!data.postedDate && normalizedLinkedInLocation.postedDate) {
      data.postedDate = normalizedLinkedInLocation.postedDate;
    }
    if ((data.applicantCount === null || data.applicantCount === undefined) && normalizedLinkedInLocation.applicantCount !== null) {
      data.applicantCount = normalizedLinkedInLocation.applicantCount;
    }
    if (!data.companyPageUrl && cardFallback.companyPageUrl) {
      data.companyPageUrl = cardFallback.companyPageUrl;
    }
    if (!data.companyPageUrl && detailHeaderFallback.companyPageUrl) {
      data.companyPageUrl = detailHeaderFallback.companyPageUrl;
    }

    // Salary and compensation signals from the LinkedIn detail pane
    const salarySelectors = [
      '.job-details-jobs-unified-top-card__job-insight span',
      '.jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__job-insight-view-model-secondary',
      'li.jobs-unified-top-card__job-insight',
      'span.jobs-unified-top-card__subtitle-secondary-grouping span',
      '.compensation__salary',
      '.salary-main-rail__data-item',
      '.job-details-fit-level-preferences button'
    ];
    const compensationSignalPattern = /\$\s*[\d,]|(?:salary|compensation|pay range|base pay|base salary|bonus|equity|stock|rsu|option|espp)/i;
    const searchCardSalaryCandidates = [
      cardFallback.salaryText,
      cardFallback.compensationText
    ]
      .map((value) => value?.replace(/\s+/g, ' ').trim())
      .filter((value) => value && compensationSignalPattern.test(value));
    const structuredSalaryCandidates = [
      detailHeaderFallback.salaryText,
      detailHeaderFallback.compensationText,
      detailMetadata.salaryText,
      ...detailMetadata.lines.filter((line) => compensationSignalPattern.test(line)),
      ...getSalaryTextCandidatesFromScope(topCard),
      ...(topCard ? getAllTextFromScopedSelectors(topCard, salarySelectors) : [])
    ]
      .map((value) => value?.replace(/\s+/g, ' ').trim())
      .filter((value) => value && compensationSignalPattern.test(value));
    const structuredSalaryText = Array.from(new Set(structuredSalaryCandidates)).join(' · ');

    // Job Description - scope extraction to LinkedIn job detail containers only
    data.descriptionText = cleanLinkedInDescriptionText(getBestElementText(descriptionRoot));
    if (isLikelyPromptContamination(data.descriptionText)) {
      console.warn('[Job Filter] Ignoring contaminated description text payload');
      data.descriptionText = '';
    }
    data.descriptionCharCount = data.descriptionText.length;
    data.descriptionSource = descriptionMatch?.source || 'none';
    const hasRichDescriptionSections = /\b(about the job|job description|qualifications|responsibilities|requirements|what you'll do|about us|preferred qualifications|minimum qualifications|you will|you'll)\b/i.test(data.descriptionText);
    data.detailContentReady =
      data.descriptionSource === 'direct' ||
      data.descriptionSource === 'about_heading' ||
      data.descriptionCharCount >= 1200 ||
      (data.descriptionCharCount >= 700 && hasRichDescriptionSections);

    // Lane detection based on apply button text
    data.lane = detectLinkedInApplyLane();

    // Multi-pass salary extraction with confidence levels
    let salaryResult = extractSalaryWithConfidence({
      structuredSalary: structuredSalaryText,
      structuredSalaryCandidates,
      descriptionText: data.descriptionText,
      allowLowConfidence: false
    });
    if (
      salaryResult.confidence === SALARY_CONFIDENCE.NONE
      && searchCardSalaryCandidates.length > 0
      && isLinkedInSearchCardFallbackSafe(cardFallback, data)
    ) {
      const cardSalaryResult = extractSalaryWithConfidence({
        structuredSalary: Array.from(new Set(searchCardSalaryCandidates)).join(' · '),
        structuredSalaryCandidates: searchCardSalaryCandidates,
        descriptionText: '',
        allowLowConfidence: false
      });
      if (cardSalaryResult.confidence !== SALARY_CONFIDENCE.NONE) {
        salaryResult = {
          ...cardSalaryResult,
          source: 'active_search_card'
        };
      }
    }
    data.salaryMin = salaryResult.min;
    data.salaryMax = salaryResult.max;
    data.salaryConfidence = salaryResult.confidence;
    data.salarySource = salaryResult.source;

    // Extract workplace type / job type / salary hints from preference buttons
    const preferenceButtons = Array.from((detailRoot || document).querySelectorAll('.job-details-fit-level-preferences button'));
    for (const btn of preferenceButtons) {
      const text = btn.innerText?.trim() || '';
      if (!text) continue;

      // Workplace type (Remote / Hybrid / On-site)
      if (/remote/i.test(text)) {
        data.workplaceType = 'Remote';
      } else if (/hybrid/i.test(text)) {
        data.workplaceType = 'Hybrid';
      } else if (/on[-\s]?site|onsite/i.test(text)) {
        data.workplaceType = 'On-site';
      }

      // Employment type (Full-time / Part-time / Contract)
      if (/full[-\s]?time/i.test(text)) {
        data.employmentType = 'Full-time';
      } else if (/part[-\s]?time/i.test(text)) {
        data.employmentType = 'Part-time';
      } else if (/contract/i.test(text)) {
        data.employmentType = 'Contract';
      } else if (/intern/i.test(text)) {
        data.employmentType = 'Internship';
      }

      // Salary from preference button (HIGH confidence - structured field)
      if (data.salaryConfidence !== SALARY_CONFIDENCE.HIGH) {
        const prefSalary = parseSalaryRange(text);
        if (prefSalary.min !== null && prefSalary.max !== null) {
          data.salaryMin = prefSalary.min;
          data.salaryMax = prefSalary.max;
          data.salaryConfidence = SALARY_CONFIDENCE.HIGH;
          data.salarySource = 'preference_button';
        }
      }
    }

    const metadataText = [detailMetadata.employmentText, detailMetadata.salaryText, rawLocationFallback]
      .filter(Boolean)
      .join(' · ');
    const compensationSignalText = [
      structuredSalaryText,
      detailMetadata.compensationText
    ]
      .filter(Boolean)
      .join(' · ');
    const descriptionBonusText = extractBonusRelevantDescriptionText(data.descriptionText);
    if (!data.workplaceType) {
      if (/remote/i.test(metadataText)) data.workplaceType = 'Remote';
      else if (/hybrid/i.test(metadataText)) data.workplaceType = 'Hybrid';
      else if (/on[-\s]?site|onsite/i.test(metadataText)) data.workplaceType = 'On-site';
      else if (detailHeaderFallback.workplaceType) data.workplaceType = detailHeaderFallback.workplaceType;
    }

    if (!data.employmentType) {
      if (/full[-\s]?time/i.test(metadataText)) data.employmentType = 'Full-time';
      else if (/part[-\s]?time/i.test(metadataText)) data.employmentType = 'Part-time';
      else if (/contract/i.test(metadataText)) data.employmentType = 'Contract';
      else if (/intern/i.test(metadataText)) data.employmentType = 'Internship';
      else if (detailHeaderFallback.employmentText) data.employmentType = detailHeaderFallback.employmentText;
    }

    // Flag bonus/equity from top-card compensation chips and the description body
    if (compensationSignalText || descriptionBonusText) {
      data.bonusMentioned = detectBonusFromCompensationSignals(compensationSignalText)
        || detectBonusWithProximityRule(descriptionBonusText);
      const structuredCompensationText = [
        structuredSalaryText,
        detailMetadata.compensationText
      ]
        .filter(Boolean)
        .join(' · ');
      data.equityMentioned = detectEquityFromCompensationSignals(structuredCompensationText)
        || detectGenericEquityInDescription(data.descriptionText);
    }

    // Extract Hiring Manager with name and job title from "Meet the hiring team" section
    // CRITICAL: First scope to the right-hand job detail pane ONLY
    // This prevents pulling data from left-hand search results
    const jobDetailPaneSelectors = [
      '.jobs-search__job-details--container',
      '.jobs-search__job-details',  // Primary right-hand detail pane
      '.jobs-search-two-pane__job-details',
      '.jobs-details',               // Fallback detail container
      '.job-details-jobs-unified-top-card',
      '.jobs-unified-top-card'
    ];

    let jobDetailPane = detailRoot;
    if (!jobDetailPane) {
      for (const selector of jobDetailPaneSelectors) {
        jobDetailPane = document.querySelector(selector);
        if (jobDetailPane) {
          console.log('[Job Filter] ✓ Found job detail pane:', selector);
          break;
        }
      }
    }

    // Now search for hiring team container within the job detail pane ONLY
    const hiringTeamContainerSelectors = [
      '.hirer-card__hirer-information',
      '.jobs-poster',
      '.hiring-team',
      '[data-test-hiring-team-card]',
      '.job-details-jobs-unified-top-card__hiring-team',
      '.jobs-hiring-team',
      '.job-details-hiring-team',
      '.hiring-insights',
      '[data-test-hiring-team]'
    ];

    let hiringTeamContainer = null;
    const searchScope = jobDetailPane || detailRoot || document;
    for (const selector of hiringTeamContainerSelectors) {
      hiringTeamContainer = searchScope.querySelector(selector);
      if (hiringTeamContainer) break;
    }

    const hiringSection = findLinkedInSectionByHeading(searchScope, [
      /meet the hiring team/i,
      /people you can reach out to/i,
      /job poster/i
    ]);
    const explicitHiringProfileLink = hiringSection?.querySelector(
      '.artdeco-entity-lockup__title a[href*="/in/"], [data-test-hiring-team-member-link][href*="/in/"], a[href*="/in/"]'
    ) || null;
    const explicitHiringCard = explicitHiringProfileLink?.closest('.artdeco-entity-lockup, li, .jobs-poster, .hiring-team, section, div') || null;

    // Hiring Manager Name selectors - expanded list with more robust patterns
    const hiringManagerNameSelectors = [
      // Primary selectors - LinkedIn's most common patterns
      '.hirer-card__hirer-information a',
      '.jobs-poster__name',
      '.jobs-poster__name a',
      '.jobs-poster a.app-aware-link',

      // Hiring team card patterns
      '.hiring-team__title a',
      '[data-test-hiring-team-card] a',
      '.job-details-jobs-unified-top-card__hiring-team-member-name',
      '.hiring-team-card-container__link',
      '.jobs-hiring-team__name a',
      '.hiring-team-member__name',
      '.hirer-info__name',
      'a[data-test-hiring-team-member-link]',

      // Additional fallback patterns
      '.jobs-poster-name',
      '.hiring-team-member a',
      '.job-poster__name',
      '[class*="hiring-team"] a[href*="/in/"]',
      '[class*="poster"] a[href*="/in/"]',
      '.artdeco-entity-lockup__title a',
      '.hirer-name',
      '.job-details-hiring-manager-name'
    ];

    // Hiring Manager Title selectors - expanded list with more robust patterns
    const hiringManagerTitleSelectors = [
      // Primary selectors - matching actual LinkedIn HTML structure
      '.hirer-card__hirer-information .linked-area .text-body-small',
      '.linked-area .text-body-small.t-black',
      '.hirer-card__hirer-information .t-14',
      '.jobs-poster__headline',
      '.jobs-poster .t-14',
      '.jobs-poster .t-12',

      // Hiring team card patterns
      '.hiring-team__subtitle',
      '.job-details-jobs-unified-top-card__hiring-team-member-subtitle',
      '.hiring-team-card-container__headline',
      '.jobs-hiring-team__subtitle',
      '.hiring-team-member__subtitle',
      '.hirer-info__subtitle',
      '[data-test-hiring-team-member-subtitle]',

      // Additional fallback patterns
      '.jobs-poster-subtitle',
      '.hiring-team-member .t-14',
      '.job-poster__headline',
      '.artdeco-entity-lockup__subtitle',
      '.hirer-subtitle',
      '.linked-area div',
      '[class*="hiring-team"] [class*="subtitle"]',
      '[class*="poster"] [class*="headline"]'
    ];

    let nameEl = null;
    let titleEl = null;

    if (explicitHiringProfileLink) {
      nameEl = explicitHiringProfileLink;
      titleEl = explicitHiringCard?.querySelector(
        '.artdeco-entity-lockup__subtitle, .text-body-small, .t-14, .t-12, [data-test-hiring-team-member-subtitle]'
      ) || null;
    }

    // Try to find name and title within the container first
    if (!nameEl && hiringTeamContainer) {
      for (const selector of hiringManagerNameSelectors) {
        nameEl = hiringTeamContainer.querySelector(selector);
        if (nameEl && nameEl.textContent?.trim()) break;
      }
    }

    if (!titleEl && hiringTeamContainer) {
      for (const selector of hiringManagerTitleSelectors) {
        titleEl = hiringTeamContainer.querySelector(selector);
        if (titleEl && titleEl.textContent?.trim()) break;
      }
    }

    // Fallback: search within job detail pane scope (not entire document)
    if (!nameEl || !nameEl.textContent?.trim()) {
      for (const selector of hiringManagerNameSelectors) {
        nameEl = searchScope.querySelector(selector);
        if (nameEl && nameEl.textContent?.trim()) break;
      }
    }

    if (!titleEl || !titleEl.textContent?.trim()) {
      for (const selector of hiringManagerTitleSelectors) {
        titleEl = searchScope.querySelector(selector);
        if (titleEl && titleEl.textContent?.trim()) break;
      }
    }

    if ((!nameEl || !nameEl.textContent?.trim()) && hiringSection) {
      const profileLinks = Array.from(hiringSection.querySelectorAll('a[href*="/in/"]'))
        .filter((link) => {
          const text = normalizeLinkedInText(link.textContent);
          return text && !isLinkedInUiNoiseLine(text);
        });
      if (profileLinks[0]) {
        nameEl = profileLinks[0];
      }

      if ((!titleEl || !titleEl.textContent?.trim()) && nameEl) {
        const profileCard = nameEl.closest('.artdeco-entity-lockup, li, .jobs-poster, .hiring-team, section, div');
        titleEl = profileCard?.querySelector(
          '.artdeco-entity-lockup__subtitle, .text-body-small, .t-14, .t-12, [data-test-hiring-team-member-subtitle]'
        ) || null;
      }
    }

    let hiringManagerName = cleanHiringManagerName(nameEl?.textContent?.trim() || null);
    let hiringManagerTitle = titleEl?.textContent?.trim() || null;

    // CRITICAL: Validate that we extracted a person's name, not company info
    if (hiringManagerName) {
      const isValidPersonName = (name) => {
        if (!name) return false;

        // Reject if contains "followers" (company info)
        if (/followers?/i.test(name)) {
          console.log('[Job Filter] ⚠ Rejected hiring manager name (contains "followers"):', name);
          return false;
        }

        // Reject if contains large numbers with commas (like "51,078" from follower counts)
        if (/\d{1,3}(?:,\d{3})+/.test(name)) {
          console.log('[Job Filter] ⚠ Rejected hiring manager name (contains large numbers):', name);
          return false;
        }

        // Reject if contains K/M suffix (follower counts like "1.2M")
        if (/\d+(?:\.\d+)?[KM]\b/i.test(name)) {
          console.log('[Job Filter] ⚠ Rejected hiring manager name (contains K/M suffix):', name);
          return false;
        }

        // Reject if too long (person names rarely exceed 50 chars)
        if (name.length > 50) {
          console.log('[Job Filter] ⚠ Rejected hiring manager name (too long):', name);
          return false;
        }

        // Reject if contains "employees" (company headcount info)
        if (/employees?/i.test(name)) {
          console.log('[Job Filter] ⚠ Rejected hiring manager name (contains "employees"):', name);
          return false;
        }

        return true;
      };

      if (!isValidPersonName(hiringManagerName) && explicitHiringProfileLink) {
        const refinedName = cleanHiringManagerName(
          explicitHiringProfileLink.textContent?.trim() ||
          explicitHiringCard?.querySelector('.artdeco-entity-lockup__title')?.textContent?.trim() ||
          null
        );
        if (isValidPersonName(refinedName)) {
          hiringManagerName = refinedName;
          nameEl = explicitHiringProfileLink;
        }
      }

      if (!isValidPersonName(hiringManagerName)) {
        hiringManagerName = null;
        titleEl = null;
        hiringManagerTitle = null;
      }
    }

    // Clean up hiring manager title - remove connection degree text
    if (hiringManagerTitle) {
      hiringManagerTitle = cleanHiringManagerTitle(hiringManagerTitle);
    }

    // CRITICAL: Extract LinkedIn URL from hiring manager link element
    let hiringManagerLinkedInUrl = null;
    if (nameEl && nameEl.tagName === 'A' && nameEl.href) {
      // Clean the LinkedIn profile URL
      const linkedInUrlMatch = nameEl.href.match(/linkedin\.com\/in\/([^/?]+)/);
      if (linkedInUrlMatch) {
        hiringManagerLinkedInUrl = `https://www.linkedin.com/in/${linkedInUrlMatch[1]}/`;
        console.log('[Job Filter] ✓ Hiring Manager LinkedIn URL extracted:', hiringManagerLinkedInUrl);
      }
    }

    // Store as structured object
    if (hiringManagerName) {
      data.hiringManager = hiringManagerTitle
        ? `${hiringManagerName}, ${hiringManagerTitle}`
        : hiringManagerName;
      data.hiringManagerDetails = {
        name: hiringManagerName,
        title: hiringManagerTitle
      };
      data.hiringManagerLinkedInUrl = hiringManagerLinkedInUrl; // NEW: Store LinkedIn URL
      console.log('[Job Filter] ✓ Hiring Manager extracted:', data.hiringManager);
      console.log('[Job Filter] Hiring Manager Details:', {
        name: hiringManagerName,
        title: hiringManagerTitle,
        linkedInUrl: hiringManagerLinkedInUrl,
        foundInContainer: !!hiringTeamContainer,
        nameSelector: nameEl?.className || 'unknown',
        titleSelector: titleEl?.className || 'unknown'
      });
    } else {
      console.log('[Job Filter] ⚠ Hiring Manager not found on page');
      console.log('[Job Filter] Debug info:', {
        hiringTeamContainerFound: !!hiringTeamContainer,
        hiringTeamContainerClass: hiringTeamContainer?.className || 'none',
        nameElementFound: !!nameEl,
        titleElementFound: !!titleEl,
        pageURL: window.location.href
      });
      // Try to help debug by logging any elements that might contain hiring manager info
      const possibleElements = Array.from(document.querySelectorAll('[class*="hiring"], [class*="poster"], [class*="hirer"]'))
        .filter(el => !el.closest('#jh-sidebar-rail'));
      if (possibleElements.length > 0) {
        console.log('[Job Filter] Possible hiring-related elements found:', possibleElements.length);
        possibleElements.forEach((el, idx) => {
          if (idx < 3) { // Log first 3 to avoid spam
            console.log(`  [${idx}] ${el.className}:`, el.textContent?.trim().substring(0, 100));
          }
        });
      }
    }

    // Extract Posted Date from job card metadata
    const postedSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-container time',
      '.jobs-unified-top-card__posted-date',
      '.posted-time-ago__text',
      '.jobs-details-top-card__time-badge',
      '.job-details-jobs-unified-top-card__job-insight span'
    ];
    for (const selector of postedSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        // Match patterns like "Posted 2 days ago", "Reposted 1 week ago", "3 hours ago"
        const postedMatch = text.match(/(?:posted|reposted)?\s*(\d+)\s+(hour|day|week|month)s?\s+ago/i);
        if (postedMatch) {
          data.postedDate = text;
          break;
        }
      }
      if (data.postedDate) break;
    }
    if (!data.postedDate && detailMetadata.postedDate) {
      data.postedDate = detailMetadata.postedDate;
    }

    // Extract Applicant Count (often Premium-only)
    // Also extract applicants in last 24h when available
    const applicantSelectors = [
      '.jobs-unified-top-card__applicant-count',
      '.job-details-jobs-unified-top-card__job-insight span',
      '.jobs-details-top-card__bullet',
      '[data-test-job-applicant-count]',
      '.jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__job-insight-view-model-secondary',
      'li.jobs-unified-top-card__job-insight',
      'span.jobs-unified-top-card__subtitle-secondary-grouping span'
    ];
    for (const selector of applicantSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim() || '';

        // Match patterns like "25 applicants", "Over 100 applicants", "Be among the first 25 applicants"
        const applicantMatch = text.match(/(?:over\s+)?(\d+)\s+applicants?|be\s+among\s+the\s+first\s+(\d+)/i);
        if (applicantMatch) {
          const count = applicantMatch[1] || applicantMatch[2];
          data.applicantCount = parseInt(count, 10);
        }

        // Match "X applicants in the past 24 hours" or similar
        const recent24hMatch = text.match(/(\d+)\s+applicants?\s+in\s+(?:the\s+)?(?:past|last)\s+24\s+hours?/i);
        if (recent24hMatch) {
          data.applicantsLast24h = parseInt(recent24hMatch[1], 10);
        }
      }
      if (data.applicantCount) break;
    }
    if ((data.applicantCount === null || data.applicantCount === undefined) && detailMetadata.applicantCount !== null) {
      data.applicantCount = detailMetadata.applicantCount;
    }

    // Additional check for 24h applicants in the page text
    if (!data.applicantsLast24h) {
      const pageText = document.body.textContent || '';
      const recent24hMatch = pageText.match(/(\d+)\s+applicants?\s+in\s+(?:the\s+)?(?:past|last)\s+24\s+hours?/i);
      if (recent24hMatch) {
        data.applicantsLast24h = parseInt(recent24hMatch[1], 10);
      }
    }

    // Clean up the job URL - remove unnecessary parameters
    data.jobUrl = cleanLinkedInUrl(window.location.href);

    // Extract Company Headcount, Growth, and Tenure Data
    const companyHeadcountData = extractCompanyHeadcountData();
    if (companyHeadcountData.currentHeadcount !== null) {
      data.companyHeadcount = companyHeadcountData.currentHeadcount;
      data.totalEmployees = companyHeadcountData.currentHeadcount; // Alias for Airtable
      console.log('[Job Filter] ✓ Total Employees extracted:', companyHeadcountData.currentHeadcount);
    }
    if (companyHeadcountData.headcountGrowthRate !== null) {
      data.companyHeadcountGrowth = `${companyHeadcountData.headcountGrowthRate >= 0 ? '+' : ''}${companyHeadcountData.headcountGrowthRate}%`;
      console.log('[Job Filter] ✓ Growth rate extracted:', data.companyHeadcountGrowth, '(2-year company-wide)');
    } else {
      // Explicitly set to null when no growth data exists
      data.companyHeadcountGrowth = null;
      console.log('[Job Filter] ⚠ No growth data found - companyHeadcountGrowth set to null');
    }
    if (companyHeadcountData.medianEmployeeTenure !== null) {
      data.medianEmployeeTenure = companyHeadcountData.medianEmployeeTenure;
      console.log('[Job Filter] ✓ Median Employee Tenure extracted:', data.medianEmployeeTenure, 'years');
    }

    // Extract Industry from LinkedIn company insights / about section
    const extractLinkedInIndustry = () => {
      const footer = document.querySelector('.jobs-company__company-description .t-14.mt5');
      if (footer?.textContent) return footer.textContent.trim();

      const about = document.querySelector('.jobs-company__company-description');
      if (about?.textContent) {
        const match = about.textContent.match(/Industry\s*[:·]\s*([^\n•|]+)/i);
        if (match?.[1]) return match[1].trim();
      }

      const dtNodes = document.querySelectorAll('dt');
      for (const dt of dtNodes) {
        const label = dt.textContent?.trim().toLowerCase();
        if (label === 'industry') {
          const dd = dt.nextElementSibling;
          const value = dd?.textContent?.trim();
          if (value) return value;
        }
      }

      return '';
    };

    const industryText = extractLinkedInIndustry();
    if (industryText) {
      data.industry = industryText;
      console.log('[Job Filter] ✓ Industry extracted:', data.industry);
    }

    // Extract company metadata from "About the company" section
    // Try multiple locations for followers count
    const followersSelectors = [
      '.jobs-company__company-description',
      '.org-top-card-summary-info-list__info-item',
      '.org-page-details__definition',
      'dt.mb1 + dd'
    ];

    for (const selector of followersSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const aboutText = el.textContent || '';

        // Extract Followers with K/M suffix support
        const followersMatch = aboutText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(K|M)?\s*followers?/i);
        if (followersMatch) {
          let followersValue = followersMatch[1].replace(/,/g, '');
          const suffix = followersMatch[2];

          // Handle K (thousands) and M (millions) suffixes
          if (suffix && suffix.toUpperCase() === 'K') {
            followersValue = parseFloat(followersValue) * 1000;
          } else if (suffix && suffix.toUpperCase() === 'M') {
            followersValue = parseFloat(followersValue) * 1000000;
          }
          data.companyFollowers = parseInt(followersValue, 10);
          console.log('[Job Filter] ✓ Followers extracted:', data.companyFollowers);
          break;
        }
      }
      if (data.companyFollowers) break;
    }

    // Extract other company metadata from "About the company" section
    const aboutCompanySection = document.querySelector('.jobs-company__company-description');
    if (aboutCompanySection) {
      const aboutText = aboutCompanySection.textContent || '';

      // Extract Company Type (Public, Private, etc.)
      // LinkedIn shows company type like "Public Company", "Privately Held", "Partnership", etc.
      const typePatterns = [
        /\b(Public Company|Publicly Traded)\b/i,
        /\b(Privately Held|Private Company)\b/i,
        /\b(Self-Owned|Self-employed)\b/i,
        /\b(Government Agency)\b/i,
        /\b(Nonprofit|Non-profit)\b/i,
        /\b(Educational Institution|Educational)\b/i,
        /\b(Partnership)\b/i,
        /\b(Sole Proprietorship)\b/i
      ];

      for (const pattern of typePatterns) {
        const typeMatch = aboutText.match(pattern);
        if (typeMatch) {
          data.companyType = typeMatch[1];
          console.log('[Job Filter] ✓ Company Type extracted:', data.companyType);
          break;
        }
      }

      // Extract Company Description (usually the first paragraph in the about section)
      const descriptionEl = aboutCompanySection.querySelector('p, div.inline-show-more-text');
      if (descriptionEl) {
        const description = descriptionEl.textContent?.trim();
        if (description && description.length > 30) { // Only capture if substantive
          data.companyDescription = description;
          console.log('[Job Filter] ✓ Company Description extracted:', description.substring(0, 100) + '...');
        }
      }
    }

    // Extract Website from company page link (if we have company page URL)
    if (data.companyPageUrl) {
      // Try to find website link in the "About" section or company card
      const websiteSelectors = [
        '.jobs-company__company-description a[href*="http"]:not([href*="linkedin.com"])',
        '.org-top-card-secondary-content__website a',
        'a[data-tracking-control-name="organization_guest_web-site-link"]'
      ];

      for (const selector of websiteSelectors) {
        const websiteEl = document.querySelector(selector);
        if (websiteEl && websiteEl.href && !websiteEl.href.includes('linkedin.com')) {
          data.website = websiteEl.href;
          console.log('[Job Filter] ✓ Website extracted:', data.website);
          break;
        }
      }
    }

    // Extract Featured Benefits from LinkedIn's dedicated benefits section
    // CRITICAL: This extracts from the "Featured benefits" module which shows actual benefits
    data.featuredBenefits = [];
    const benefitsSection = getLinkedInBenefitsSection(detailRoot);
    const benefitElements = benefitsSection
      ? benefitsSection.querySelectorAll('li, .featured-benefits__benefit, [class*="featured-benefits__benefit"], [class*="featured-benefits"] li, span, div, p')
      : [];

    benefitElements.forEach((el) => {
      const text = normalizeLinkedInText(el.textContent);
      if (!text || text.length > 120) return;
      extractBenefitItemsFromText(text).forEach((benefitText) => {
        if (!data.featuredBenefits.includes(benefitText)) {
          data.featuredBenefits.push(benefitText);
        }
      });
    });

    (cardFallback.benefits || []).forEach((benefitText) => {
      if (!data.featuredBenefits.includes(benefitText)) {
        data.featuredBenefits.push(benefitText);
      }
    });
    detailMetadata.lines
      .filter((line) => /\b(benefits?|insurance|401\s*\(?k\)?|pto|vacation|leave|reimbursement|stipend|wellness)\b/i.test(line))
      .flatMap((line) => extractBenefitItemsFromText(line))
      .forEach((benefitText) => {
        if (!data.featuredBenefits.includes(benefitText)) {
          data.featuredBenefits.push(benefitText);
        }
      });
    extractBenefitsFromDescriptionText(data.descriptionText).forEach((benefitText) => {
      if (!data.featuredBenefits.includes(benefitText)) {
        data.featuredBenefits.push(benefitText);
      }
    });

    if (data.featuredBenefits.length > 0) {
      console.log('[Job Filter] ✓ Featured Benefits extracted:', data.featuredBenefits.length, 'benefits');
      console.log('[Job Filter] Benefits:', data.featuredBenefits.join(', '));
    }

  } catch (error) {
    console.error('[Job Filter] Error extracting LinkedIn data:', error);
  }

  return data;
}

/**
 * Determine lane based on LinkedIn apply button text.
 * Easy Apply -> fast_apply
 * Apply -> full_court_press
 */
function detectLinkedInApplyLane() {
  try {
    const buttonSelectors = [
      '.jobs-apply-button--top-card button',
      'button#jobs-apply-button-id',
      '.jobs-apply-button button'
    ];
    const button = document.querySelector(buttonSelectors.join(','));
    if (!button) return null;

    const text = (button.innerText || button.textContent || '').trim();
    const aria = button.getAttribute('aria-label') || '';
    const combined = `${text} ${aria}`.toLowerCase();

    if (combined.includes('easy apply')) return 'fast_apply';
    if (combined.includes('apply')) return 'full_court_press';
  } catch (err) {
    console.warn('[Job Filter] Lane detection error:', err);
  }
  return null;
}

/**
 * Extract company headcount, growth, and tenure data from LinkedIn premium widget
 * CRITICAL: Extracts specific fields from .jobs-premium-company-growth container:
 *  - Total Employees: First .t-16 element
 *  - Growth: "Company-wide" percentage (not department-specific)
 *  - Median Employee Tenure: decimal from strong tag
 * @returns {Object} { currentHeadcount, headcountGrowthRate, medianEmployeeTenure, headcountDataFound }
 */
function extractCompanyHeadcountData() {
  const result = {
    currentHeadcount: null,
    headcountGrowthRate: null,
    headcountGrowthText: null,
    medianEmployeeTenure: null,
    headcountDataFound: false
  };

  try {
    // CRITICAL: LinkedIn Premium Company Growth Widget (.jobs-premium-company-growth)
    // This widget contains Total Employees, Growth %, and Median Tenure
    console.log('[Job Filter] Looking for LinkedIn premium company growth widget...');
    const growthWidget = document.querySelector('.jobs-premium-company-growth');

    if (growthWidget) {
      console.log('[Job Filter] ✓ Found premium company growth widget');

      // Extract Total Employees from the first .t-16 element
      const employeeCountEl = growthWidget.querySelector('p.t-16');
      if (employeeCountEl) {
        const employeeText = employeeCountEl.textContent?.trim() || '';
        const employeeMatch = employeeText.match(/(\d{1,3}(?:,\d{3})*)/);
        if (employeeMatch) {
          result.currentHeadcount = parseInt(employeeMatch[1].replace(/,/g, ''), 10);
          console.log('[Job Filter] ✓ Total Employees:', result.currentHeadcount);
          result.headcountDataFound = true;
        }
      }

      // Extract Growth from "Company-wide" stat (NOT department-specific)
      const companyGrowthItems = growthWidget.querySelectorAll('.jobs-premium-company-growth__stat-item');
      console.log('[Job Filter] Found', companyGrowthItems.length, 'growth stat items');

      for (const item of companyGrowthItems) {
        const labels = item.querySelectorAll('p');
        let isCompanyWide = false;

        // Check if this is the "Company-wide" growth stat (not department-specific)
        labels.forEach(label => {
          const text = label.textContent?.trim() || '';
          if (text.toLowerCase() === 'company-wide') {
            isCompanyWide = true;
          }
        });

        if (isCompanyWide) {
          // Extract the percentage from the bold text
          const percentageEl = item.querySelector('.t-16.t-black--light.t-bold');
          if (percentageEl) {
            const growthText = percentageEl.textContent?.trim() || '';
            const percentMatch = growthText.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
            if (percentMatch) {
              const rate = parseFloat(percentMatch[1]);
              // Check if it's an increase or decrease based on CSS class
              const hasIncrease = item.querySelector('.jobs-premium-company-growth__number-with-arrow--increase');
              const hasDecrease = item.querySelector('.jobs-premium-company-growth__number-with-arrow--decrease');

              result.headcountGrowthRate = hasDecrease ? -Math.abs(rate) : rate;
              result.headcountGrowthText = `Company-wide ${result.headcountGrowthRate >= 0 ? '+' : ''}${result.headcountGrowthRate}% (2yr)`;
              result.headcountDataFound = true;
              console.log('[Job Filter] ✓ Company-wide Growth:', result.headcountGrowthRate + '%');
              break;
            }
          }
        }
      }

      // Extract Median Employee Tenure from strong tag
      const tenureElements = growthWidget.querySelectorAll('strong');
      for (const strong of tenureElements) {
        const tenureText = strong.textContent?.trim() || '';
        const tenureMatch = tenureText.match(/(\d+(?:\.\d+)?)\s*(?:years?)?/);
        if (tenureMatch) {
          // Check if this is within a tenure context
          const parentText = strong.closest('div')?.textContent?.toLowerCase() || '';
          if (parentText.includes('tenure') || parentText.includes('employee')) {
            result.medianEmployeeTenure = parseFloat(tenureMatch[1]);
            console.log('[Job Filter] ✓ Median Employee Tenure:', result.medianEmployeeTenure, 'years');
            break;
          }
        }
      }
    } else {
      console.log('[Job Filter] ⚠ Premium company growth widget not found on page');
    }

    // FALLBACK METHODS: Only use non-premium fallback for company size.
    // Growth and tenure should stay empty when the Premium widget is unavailable.
    if (!result.currentHeadcount) {
      console.log('[Job Filter] Using fallback methods for missing data...');

      const companyInfoSelectors = [
        '[data-testid="company-info"]',
        '.job-details-jobs-unified-top-card__company-size',
        '.jobs-unified-top-card__company-size',
        '.jobs-company__company-description',
        '.job-details-premium-company-insights',
        '.job-details-company-insights',
        '.company-size',
        '.jobs-company-info',
        '.job-details-about-company',
        '[data-test-company-size]',
        '.jobs-unified-top-card__job-insight',
        '.job-details-jobs-unified-top-card__job-insight',
        '.t-14.t-black--light.t-normal' // Company size text on some pages
      ];

      let companySidebarText = '';
      for (const selector of companyInfoSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el?.innerText) {
            companySidebarText += ' ' + el.innerText;
          }
        });
      }

      const combinedText = companySidebarText;

      // Pattern 1: "1,001-5,000 employees" or "1,001 - 5,000 employees"
      const rangePattern = /(\d{1,3}(?:,\d{3})*)\s*(?:-|to)\s*(\d{1,3}(?:,\d{3})*)\s+employees?/i;
      const rangeMatch = combinedText.match(rangePattern);

      // Pattern 2: "500+ employees" or "250 employees"
      const singlePattern = /(\d{1,3}(?:,\d{3})*)\+?\s+employees?/i;
      const singleMatch = combinedText.match(singlePattern);

      // Extract headcount (use midpoint for ranges) - ONLY if not already found
      if (!result.currentHeadcount) {
        if (rangeMatch) {
          const lower = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
          const upper = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
          result.currentHeadcount = Math.floor((lower + upper) / 2);
          result.headcountDataFound = true;
          console.log('[Job Filter] Fallback: Extracted headcount from range:', result.currentHeadcount);
        } else if (singleMatch) {
          result.currentHeadcount = parseInt(singleMatch[1].replace(/,/g, ''), 10);
          result.headcountDataFound = true;
          console.log('[Job Filter] Fallback: Extracted headcount from single:', result.currentHeadcount);
        }
      }

    } // End of fallback methods conditional

  } catch (error) {
    console.error('[Job Filter] Error extracting headcount data:', error);
  }

  return result;
}

/**
 * Clean LinkedIn URL to just the essential parts
 * @param {string} url - Full URL
 * @returns {string} Cleaned URL
 */
function cleanLinkedInUrl(url) {
  try {
    const urlObj = new URL(url);
    // Keep only the job view path
    if (url.includes('/jobs/view/')) {
      const jobId = url.match(/\/jobs\/view\/(\d+)/)?.[1];
      if (jobId) {
        return `https://www.linkedin.com/jobs/view/${jobId}/`;
      }
    }
    // For search pages with currentJobId, extract the job ID
    const currentJobId = urlObj.searchParams.get('currentJobId');
    if (currentJobId) {
      return `https://www.linkedin.com/jobs/view/${currentJobId}/`;
    }
    return url;
  } catch {
    return url;
  }
}

function getAutoScoreKey(source, url = window.location.href) {
  return source === 'LinkedIn' ? cleanLinkedInUrl(url) : url;
}

/**
 * Normalize LinkedIn company URLs by stripping trailing "/life" or tracking params
 * @param {string} url - Full company URL
 * @returns {string} Cleaned URL
 */
function cleanCompanyUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove query/hash
    urlObj.search = '';
    urlObj.hash = '';

    // Strip trailing /life segment (LinkedIn sometimes links to the "Life" subpage)
    let pathname = urlObj.pathname.replace(/\/+$/, '');
    pathname = pathname.replace(/\/life\/?$/i, '');

    // Ensure trailing slash for canonical company URL
    urlObj.pathname = pathname.endsWith('/') ? pathname : `${pathname}/`;

    return urlObj.toString();
  } catch {
    return url;
  }
}

// ============================================================================
// INDEED HANDLER (Basic implementation - can be extended)
// ============================================================================

/**
 * Initialize Indeed job page handling
 */
function handleIndeed() {
  // Indeed often keeps you on the same page and swaps the job in-place.
  // Use a URL-aware poller so we only inject on actual job detail URLs.
  let lastUrl = location.href;

  const checkAndInject = () => {
    const isJob = isIndeedJobPage();
    if (isJob && !document.getElementById('job-hunter-overlay')) {
      // Small delay to let the right-rail job detail render
      setTimeout(() => {
        if (isIndeedJobPage() && !document.getElementById('job-hunter-overlay')) {
          injectOverlay('Indeed');
        }
      }, 300);
    } else if (!isJob) {
      removeOverlay();
    }
  };

  // Initial check
  checkAndInject();

  // Poll for URL changes that indicate a new job selection
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      removeOverlay();
      checkAndInject();
    } else {
      // Even without URL change, ensure overlay exists when on a job
      checkAndInject();
    }
  }, 1000);
}

/**
 * Check if current Indeed page is a job detail page
 * @returns {boolean}
 */
function isIndeedJobPage() {
  const url = window.location.href;
  return /\/viewjob/i.test(url) || /[?&]vjk=/i.test(url);
}

/**
 * Extract job data from Indeed job detail page
 * @returns {Object} Extracted job data
 */
function extractIndeedJobData() {
  const data = {
    jobTitle: '',
    companyName: '',
    companyPageUrl: '',
    location: '',
    salaryMin: null,
    salaryMax: null,
    descriptionText: '',
    workplaceType: '',
    employmentType: '',
    equityMentioned: false,
    bonusMentioned: false,
    jobUrl: window.location.href,
    source: 'Indeed',
    // New extraction fields
    hiringManager: null,
    postedDate: null,
    applicantCount: null
  };

  try {
    // Job Title: prefer modern data-testid selectors, then legacy class fallbacks (Indeed DOM changes frequently)
    const titleSelectors = [
      'h1[data-testid="jobDetailTitle"]',
      'h1[data-testid="jobTitle"]',
      '.jobsearch-JobInfoHeader-title',
      'h1.icl-u-xs-mb--xs',
      '.jobsearch-JobInfoHeader h1'
    ];
    data.jobTitle = getTextFromSelectors(titleSelectors) || '';

    // Company Name: data-testid first, then legacy company rating links
    const companySelectors = [
      'div[data-testid="company-name"]',
      'div[data-testid="inlineHeader-companyName"]',
      '[data-company-name="true"]',
      '.jobsearch-InlineCompanyRating-companyHeader a',
      '.icl-u-lg-mr--sm a'
    ];
    data.companyName = getTextFromSelectors(companySelectors) || '';
    const companyLinkEl = document.querySelector('div[data-testid="inlineHeader-companyName"] a, div[data-testid="company-name"] a, [data-company-name="true"] a');
    if (companyLinkEl?.href) {
      data.companyPageUrl = companyLinkEl.href;
    }

    // Location: data-testid location first, then legacy subtitle items
  const locationSelectors = [
      '#jobLocationText',
      'div[data-testid="text-location"]',
      'div[data-testid="inlineHeader-location"]',
      'div[data-testid="inlineHeader-companyLocation"]',
      '[data-testid="job-location"]',
      '.jobsearch-JobInfoHeader-subtitle > div:nth-child(2)',
      '.icl-u-xs-mt--xs'
    ];
    const rawLocation = getTextFromSelectors(locationSelectors) || '';
    const normalizedLocation = normalizeIndeedLocation(rawLocation);
    if (normalizedLocation.location) {
      data.location = normalizedLocation.location;
    }
    if (normalizedLocation.workplaceType && !data.workplaceType) {
      data.workplaceType = normalizedLocation.workplaceType;
    }

    // Salary: data-testid salary first, then legacy metadata items
    const salarySelectors = [
      'div[data-testid="jobDetailSalary"]',
      '[data-testid="attribute_snippet_testid"]',
      '.jobsearch-JobMetadataHeader-item',
      '#salaryInfoAndJobType span'
    ];
    const structuredSalaryCandidates = getAllTextFromSelectors(salarySelectors)
      .map((value) => normalizeLinkedInText(value))
      .filter((value) => /\$\s*[\d,]|(?:salary|compensation|pay range|base pay|base salary|annual|per year|\/yr)/i.test(value));
    const structuredSalaryText = structuredSalaryCandidates.join(' · ');

    // Job Description
    const descriptionSelectors = [
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      'div[data-testid="jobsearch-JobComponent-description"]',
      '[data-testid="jobDescriptionText"]'
    ];
    data.descriptionText = getTextFromSelectors(descriptionSelectors, true) || '';
    if (!data.descriptionText) {
      const indeedJobPane = document.querySelector('#jobsearch-ViewjobPaneWrapper, [data-testid="jobsearch-ViewJobLayout"], [data-testid="jobsearch-JobComponent"]');
      data.descriptionText = indeedJobPane?.innerText?.trim() || '';
    }

    // Multi-pass salary extraction with confidence levels
    const salaryResult = extractSalaryWithConfidence({
      structuredSalary: structuredSalaryText,
      structuredSalaryCandidates,
      descriptionText: data.descriptionText
    });
    data.salaryMin = salaryResult.min;
    data.salaryMax = salaryResult.max;
    data.salaryConfidence = salaryResult.confidence;
    data.salarySource = salaryResult.source;

    // Employment type: often near salary info
    const employmentSelectors = [
      '#salaryInfoAndJobType',
      'div[data-testid="jobsearch-OtherJobDetailsContainer"]',
      'div[data-testid="jobsearch-JobInfoHeader-title"] + div'
    ];
    const employmentText = getTextFromSelectors(employmentSelectors) || '';
    if (/full[-\s]?time/i.test(employmentText)) data.employmentType = 'Full-time';
    else if (/part[-\s]?time/i.test(employmentText)) data.employmentType = 'Part-time';
    else if (/contract/i.test(employmentText)) data.employmentType = 'Contract';
    else if (/intern/i.test(employmentText)) data.employmentType = 'Internship';

    // Workspace type from description if not already set
    if (!data.workplaceType) {
      if (/remote/i.test(employmentText)) data.workplaceType = 'Remote';
      else if (/hybrid/i.test(employmentText)) data.workplaceType = 'Hybrid';
      else if (/on[-\s]?site|onsite/i.test(employmentText)) data.workplaceType = 'On-site';
    }

    // Flag if equity is mentioned using contextual detection
    if (data.descriptionText) {
      data.equityMentioned = detectEquityWithContext(data.descriptionText);
    }

    // Flag if bonus is mentioned in the description using 15-word proximity rule
    if (data.descriptionText) {
      data.bonusMentioned = detectBonusWithProximityRule(data.descriptionText);
    }

    // Extract Posted Date from Indeed job metadata
    const postedSelectors = [
      '[data-testid="posted-date"]',
      '.jobsearch-JobMetadataFooter .date-span',
      '.date'
    ];
    for (const selector of postedSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        const text = el.textContent.trim();
        // Match patterns like "Posted 2 days ago", "Today", "Just posted"
        if (/posted|ago|today|just/i.test(text)) {
          data.postedDate = text;
          break;
        }
      }
    }

    // Indeed doesn't typically show hiring manager or applicant count prominently
    // But we can check for any available metadata
    const applicantSelectors = [
      '[data-testid="applicants-count"]',
      '.jobsearch-JobMetadataHeader-item'
    ];
    for (const selector of applicantSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        const applicantMatch = text.match(/(\d+)\s+applicants?/i);
        if (applicantMatch) {
          data.applicantCount = parseInt(applicantMatch[1], 10);
          break;
        }
      }
      if (data.applicantCount) break;
    }

  } catch (error) {
    console.error('[Job Filter] Error extracting Indeed data:', error);
  }

  return data;
}

// ============================================================================
// SHARED UTILITIES
// ============================================================================

/**
 * Clean up hiring manager title text by removing connection degree and other noise
 * Removes: "1st", "2nd", "3rd" degree connection, "• Hiring" badge, etc.
 * @param {string} rawTitle - The raw title text
 * @returns {string|null} Cleaned title or null if empty
 */
function cleanHiringManagerTitle(rawTitle) {
  if (!rawTitle) return null;

  let title = rawTitle.trim();

  // Remove connection degree patterns (1st, 2nd, 3rd, etc.)
  title = title.replace(/\b\d+(?:st|nd|rd|th)\s*(?:degree\s*)?(?:connection)?\b/gi, '');

  // Remove "• Hiring" or "Hiring" badge text
  title = title.replace(/[•·]\s*hiring\b/gi, '');
  title = title.replace(/\bhiring\s*$/gi, '');

  // Remove "at Company Name" suffix (we already have company separately)
  title = title.replace(/\s+at\s+[^|]+$/i, '');

  // Remove common LinkedIn artifacts
  title = title.replace(/^\s*[•·|-]\s*/, ''); // Leading bullets
  title = title.replace(/\s*[•·|-]\s*$/, ''); // Trailing bullets
  title = title.replace(/\s*\|\s*$/, ''); // Trailing pipes

  // Clean up extra whitespace
  title = title.replace(/\s+/g, ' ').trim();

  // If empty after cleaning, return null
  return title.length > 0 ? title : null;
}

function cleanHiringManagerName(rawName) {
  if (!rawName) return null;

  const segments = rawName
    .split(/\s*[|•]\s*|\n+/)
    .map((segment) => segment
      .replace(/^(?:1st|2nd|3rd|\d+(?:st|nd|rd|th))\b/gi, '')
      .replace(/\bjob poster\b/gi, '')
      .replace(/\bmessage\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean);

  const nameCandidate = segments.find((segment) => {
    if (segment.length > 60) return false;
    if (/president|founder|partner|executive|job poster|message/i.test(segment)) return false;
    return /^[A-Z][A-Za-z'`.-]+(?:\s+[A-Z][A-Za-z'`.-]+){1,3}$/.test(segment);
  });

  if (nameCandidate) {
    return nameCandidate;
  }

  const normalized = segments.join(' ');
  if (!normalized) return null;

  const leadingNameMatch = normalized.match(/\b([A-Z][A-Za-z'`.-]+(?:\s+[A-Z][A-Za-z'`.-]+){1,2})\b/);
  if (leadingNameMatch?.[1]) {
    return leadingNameMatch[1].trim();
  }

  return normalized.length > 0 ? normalized : null;
}

function isLikelyBenefitText(value) {
  const text = normalizeLinkedInText(value);
  if (!text) return false;
  if (/^benefits?\s+include:?$/i.test(text)) return false;
  if (isLinkedInUiNoiseLine(text)) return false;
  if (text.length > 80) return false;
  if (/[.!?]$/.test(text)) return false;
  if (/\s[-:]\s/.test(text)) return false;
  if (/^\+?\d+\s+benefits?$/i.test(text)) return false;
  if (/^benefits?$/i.test(text)) return false;
  if (/\b(responsibilities|qualifications|requirements|experience|partner with|design and execute|track record|strong focus|deep expertise|demonstrated use)\b/i.test(text)) {
    return false;
  }
  return true;
}

function extractKnownBenefitsFromText(value) {
  const text = normalizeLinkedInText(value);
  if (!text) return [];
  const lower = text.toLowerCase();
  const detected = [];
  const add = (label) => {
    if (!detected.includes(label)) detected.push(label);
  };

  if (/\bmedical\b|\bmedical insurance\b/.test(lower)) add('Medical');
  if (/\bhealth insurance\b|\bhealth benefits\b|\bhealthcare\b|\bhealth\b/.test(lower)) add('Health');
  if (/\bdental\b/.test(lower)) add('Dental');
  if (/\bvision\b/.test(lower)) add('Vision');
  if (/\b401\s*\(?k\)?\b|\bretirement plan\b|\bretirement match\b/.test(lower)) add('401(k)');
  if (/\bhsa\b|\bfsa\b|health savings|flexible spending/.test(lower)) add('HSA/FSA');
  if (/\bunlimited pto\b|\bflexible pto\b|\bpaid time off\b|\bpto\b/.test(lower)) add('PTO');
  if (/\bflexible vacation\b|\bvacation policy\b/.test(lower)) add('Flexible Vacation Policy');
  if (/\bvacation\b/.test(lower) && !detected.includes('Flexible Vacation Policy')) add('PTO');
  if (/parental leave|maternity leave|paternity leave/.test(lower)) add('Paid Parental');
  if (/tuition reimbursement|tuition assistance|education assistance|student loan/.test(lower)) add('Tuition Reimbursement');
  if (/learning stipend|professional development|training budget|conference budget/.test(lower)) add('Learning Stipend');
  if (/work from home|home office|remote work|equipment allowance|commuter benefits?/.test(lower)) add('WFH Reimbursement');
  if (/relocation assistance|relocation package|moving assistance/.test(lower)) add('Relocation');

  return detected;
}

function extractBenefitItemsFromText(value) {
  const text = normalizeLinkedInText(value);
  if (!text) return [];

  const canonicalMatches = extractKnownBenefitsFromText(text);
  if (canonicalMatches.length > 0) {
    return canonicalMatches;
  }

  const tokens = text
    .split(/\s*[•·]\s*|,\s*(?=[A-Z0-9(])|\s{2,}/)
    .map((token) => normalizeLinkedInText(token))
    .map((token) => token.replace(/,\s*\+\d+\s+benefits?$/i, '').trim())
    .map((token) => token.replace(/^\+\d+\s+benefits?$/i, '').trim())
    .filter((token) => isLikelyBenefitText(token));

  return Array.from(new Set(tokens));
}

function extractBenefitsFromDescriptionText(text) {
  const detected = [];
  const lines = splitLinkedInTextLines(text);
  for (const line of lines) {
    if (!line || line.length > 140) continue;
    if (!/\b(benefits?|insurance|401\s*\(?k\)?|pto|vacation|leave|reimbursement|stipend|wellness)\b/i.test(line)) continue;
    extractBenefitItemsFromText(line).forEach((benefit) => {
      if (!detected.includes(benefit)) detected.push(benefit);
    });
  }
  return detected;
}

function getLinkedInBenefitsSection(detailRoot) {
  const scope = detailRoot || document;
  const headings = Array.from(scope.querySelectorAll('h2, h3, h4, strong, span, div, p'))
    .filter((element) => {
      if (!(element instanceof Element)) return false;
      if (element.closest('#jh-sidebar-rail')) return false;
      const text = normalizeLinkedInText(element.textContent);
      return /^(featured benefits|benefits found in job post)$/i.test(text);
    });

  for (const heading of headings) {
    const containers = [
      heading.parentElement,
      heading.nextElementSibling,
      heading.closest('.job-details-module'),
      heading.closest('.artdeco-card'),
      heading.closest('section'),
      heading.closest('article')
    ].filter((container) => container instanceof Element);

    for (const container of containers) {
      const text = container.innerText?.trim() || '';
      const benefitNodes = container.querySelectorAll('li, .featured-benefits__benefit, [class*="featured-benefits"] li, span, div, p');
      const shortBenefitNodes = Array.from(benefitNodes).filter((node) => {
        const nodeText = normalizeLinkedInText(node.textContent);
        return nodeText && nodeText.length <= 100;
      });
      if (shortBenefitNodes.length === 0) continue;
      if (text.length > 1500) continue;
      return container;
    }
  }

  return null;
}

/**
 * Try multiple selectors and return the first matching text content
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {boolean} preserveWhitespace - Whether to preserve paragraph breaks
 * @returns {string|null} Text content or null
 */
function getTextFromSelectors(selectors, preserveWhitespace = false) {
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = preserveWhitespace
        ? element.innerText?.trim()
        : element.textContent?.trim();
      if (text) {
        return text;
      }
    }
  }
  return null;
}

/**
 * Try multiple selectors within a specific root node and return the first matching text.
 * Helps avoid accidentally scraping unrelated UI text from elsewhere on the page.
 * @param {Element} root - Root element to scope selector queries
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {boolean} preserveWhitespace - Whether to preserve paragraph breaks
 * @returns {string|null} Text content or null
 */
function getTextFromScopedSelectors(root, selectors, preserveWhitespace = false) {
  if (!root) return null;
  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const element of elements) {
      const text = preserveWhitespace
        ? element.innerText?.trim()
        : element.textContent?.trim();
      if (text) {
        return text;
      }
    }
  }
  return null;
}

function getAllTextFromScopedSelectors(root, selectors, preserveWhitespace = false) {
  if (!root) return [];
  const values = [];
  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const element of elements) {
      const text = preserveWhitespace
        ? element.innerText?.trim()
        : element.textContent?.trim();
      if (text) values.push(text);
    }
  }
  return Array.from(new Set(values));
}

function getAllTextFromSelectors(selectors, preserveWhitespace = false) {
  const values = [];
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = preserveWhitespace
        ? element.innerText?.trim()
        : element.textContent?.trim();
      if (text) values.push(text);
    }
  }
  return Array.from(new Set(values));
}

function isLikelyPromptContamination(text) {
  if (!text) return false;
  const signals = [
    'Plan mode ON.',
    'Objective:',
    'Inputs (all must be read):',
    'Hard rules:',
    'Verification output required:'
  ];
  const matches = signals.filter(signal => text.includes(signal)).length;
  return matches >= 2;
}

/**
 * Detect if bonus is mentioned in text using 15-word proximity rule
 * Excludes sign-on, referral, signing, hiring, and relocation bonuses
 * @param {string} text - Job description text
 * @returns {boolean} True if performance/annual bonus is mentioned
 */
function detectBonusWithProximityRule(text) {
  if (!text) return false;

  const lowerText = text.toLowerCase();
  if (hasNegativeBonusContext(lowerText) || hasNonCompensationBonusContext(lowerText)) {
    return false;
  }

  // Positive patterns that strongly indicate performance/annual bonus
  const positivePatterns = [
    /performance\s+bonus/i,
    /annual\s+bonus/i,
    /yearly\s+bonus/i,
    /target\s+bonus/i,
    /discretionary\s+bonus/i,
    /quarterly\s+bonus/i,
    /bonus\s+(of|up\s+to|target|structure|plan|program|eligibility)/i,
    /(\d+%|\d+\s*percent)\s+bonus/i,
    /bonus\s+(\d+%|\d+\s*percent)/i,
    /variable\s+(compensation|pay)/i,
    /incentive\s+bonus/i,
    /bonus\s+incentive/i,
    /bonus\s+compensation/i,
    /bonus\s+eligible/i,
    /eligible\s+for\s+(?:a\s+)?bonus/i,
    /cash\s+bonus/i
  ];

  // Check for positive patterns first
  for (const pattern of positivePatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }

  // If no clear positive match, look for "bonus" and apply 15-word proximity rule
  const bonusMatches = [...lowerText.matchAll(/\bbonus\b/gi)];
  if (bonusMatches.length === 0) return false;

  // Exclusionary words that invalidate a bonus mention if within 15 words
  const exclusionWords = ['sign-on', 'signon', 'sign on', 'signing', 'referral', 'hiring', 'relocation', 'new hire', 'joining'];

  for (const match of bonusMatches) {
    const bonusIndex = match.index;
    // Extract up to 15 words before the bonus mention
    const textBefore = lowerText.substring(Math.max(0, bonusIndex - 150), bonusIndex);
    const wordsBefore = textBefore.split(/\s+/).slice(-15).join(' ');

    // Check if any exclusion word appears within the 15 words before "bonus"
    let isExcluded = false;
    for (const exclusion of exclusionWords) {
      if (wordsBefore.includes(exclusion)) {
        isExcluded = true;
        break;
      }
    }

    const contextStart = Math.max(0, bonusIndex - 180);
    const contextEnd = Math.min(lowerText.length, bonusIndex + 180);
    const context = lowerText.substring(contextStart, contextEnd);
    const hasCompensationContext = /\b(compensation|salary|base pay|base salary|total rewards?|incentive|eligible|target|annual|performance|cash|variable pay|variable compensation)\b/.test(context);

    // If this "bonus" instance is not excluded and has comp context, it's valid.
    if (!isExcluded && hasCompensationContext && !hasNegativeBonusContext(context) && !hasNonCompensationBonusContext(context)) {
      return true;
    }
  }

  return false;
}

function hasNegativeBonusContext(text) {
  if (!text) return false;
  return /\b(no|not|without|neither|does not|doesn't|do not|don't|none)\b[^.]{0,60}\bbonus(?:es)?\b/i.test(text)
    || /\bbonus(?:es)?\b[^.]{0,60}\b(not included|not offered|not mentioned|unavailable|none)\b/i.test(text);
}

function hasNonCompensationBonusContext(text) {
  if (!text) return false;
  return /\bbonus\s+(points?|if|for|skills?|experience|qualifications?|nice[-\s]?to[-\s]?have)\b/i.test(text)
    || /\b(as\s+a\s+bonus|added\s+bonus|bonus\s+round)\b/i.test(text);
}

function extractBonusRelevantDescriptionText(text) {
  if (!text) return '';
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => /\bbonus(?:es)?\b|variable\s+(?:pay|compensation)|incentive\s+compensation/i.test(part))
    .filter((part) => /\b(compensation|salary|base pay|base salary|total rewards?|bonus(?:es)?|incentive|eligible|target|annual|performance|cash|variable pay|variable compensation)\b/i.test(part))
    .join('\n');
}

/**
 * Detect if equity/stock compensation is mentioned using contextual analysis
 * Only returns true for genuine compensation-related equity mentions
 * Excludes DEI/EEO "equity" and words like "pursuing" that contain "rsu"
 * @param {string} text - Job description text
 * @returns {boolean} True if compensation equity is mentioned
 */
function detectBonusFromCompensationSignals(text) {
  if (!text) return false;
  if (detectBonusWithProximityRule(text)) return true;

  const lowerText = text.toLowerCase();
  if (!/\bbonus\b/.test(lowerText)) return false;
  if (/\b(sign[-\s]?on|signing|referral|relocation|joining|new hire)\b/.test(lowerText)) return false;
  if (hasNegativeBonusContext(lowerText) || hasNonCompensationBonusContext(lowerText)) return false;
  return /\b(performance|annual|target|discretionary|quarterly|cash|incentive|eligible|variable compensation|variable pay)\b[^.]{0,80}\bbonus\b/i.test(lowerText)
    || /\bbonus\b[^.]{0,80}\b(eligible|target|plan|program|structure|incentive|compensation)\b/i.test(lowerText);
}

function detectStrongEquitySignals(text) {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  // STRONG positive patterns - these are unambiguous compensation terms
  const strongPatterns = [
    /stock\s+options?/i,
    /\brestricted\s+stock\s+units?\b/i,
    /\brsu\b/i,  // Standalone RSU only (not inside words)
    /\brsus\b/i, // Plural RSUs only
    /\bespp\b/i,  // Employee Stock Purchase Plan
    /\besop\b/i,
    /employee\s+stock\s+purchase/i,
    /stock[-\s]?based\s+compensation/i,
    /share[-\s]?based\s+compensation/i,
    /stock\s+(grant|award|compensation|package|units?|plan|program)/i,
    /equity\s+(grant|package|compensation|award|incentive|stake|plan|program|eligible|eligibility|upside|participation|ownership)/i,
    /(eligible|eligibility)\s+for\s+equity/i,
    /long[-\s]?term\s+incentive/i,
    /\blti\b/i,
    /option\s+plan/i,
    /share\s+options?/i,
    /meaningful\s+equity/i,
    /equity\s+opportunit/i,
    /ownership\s+(stake|interest|percentage)/i,
    /vesting\s+schedule/i,
    /(\d+\.?\d*)\s*%?\s*(equity|ownership)/i,  // "0.5% equity"
    /equity\s+in\s+the\s+company/i,
    /shares?\s+(of|in)\s+(the\s+)?company/i,
    /four[-\s]?year\s+vest/i,
    /cliff\s+(period|vesting)/i
  ];

  // Check strong patterns first - these are unambiguous
  for (const pattern of strongPatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }

  return false;
}

function detectGenericEquityInDescription(text) {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  // WEAK pattern: generic "equity" - requires compensation context
  if (/\bequity\b/i.test(lowerText)) {
    // Must NOT have DEI/EEO context
    const deiPatterns = [
      /diversity[^.]{0,60}equity[^.]{0,60}inclusion/i,
      /equity[^.]{0,30}inclusion[^.]{0,30}diversity/i,
      /equal\s+opportunity/i,
      /equity\s+in\s+(hiring|employment|workplace|opportunity|opportunities)/i,
      /promote\s+equity/i,
      /commitment\s+to\s+equity/i,
      /dei\b/i,
      /equity\s+and\s+(inclusion|diversity)/i,
      /internal\s+equity/i,
      /pay\s+equity/i,
      /market\s+equity/i,
      /equity\s+adjustment/i
    ];

    const hasDeiContext = deiPatterns.some(p => p.test(lowerText));
    if (hasDeiContext) {
      return false;
    }

    // Must HAVE compensation context nearby for generic "equity"
    const compensationKeywords = [
      'stock', 'vesting', 'vest', 'shares', 'ownership',
      'options', 'grant', 'fully diluted', 'cap table', 'rsu', 'espp'
    ];

    // Find each "equity" mention and check for compensation context within 100 chars
    const equityMatches = [...lowerText.matchAll(/\bequity\b/gi)];
    for (const match of equityMatches) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(lowerText.length, match.index + 100);
      const context = lowerText.substring(start, end);

      const hasCompContext = compensationKeywords.some(kw => context.includes(kw));
      if (hasCompContext) {
        return true;
      }
    }
  }

  return false;
}

function detectEquityWithContext(text) {
  return detectStrongEquitySignals(text) || detectGenericEquityInDescription(text);
}

/**
 * Salary extraction confidence levels
 */
const SALARY_CONFIDENCE = {
  HIGH: 'HIGH',       // Explicit structured field from job site
  MEDIUM: 'MEDIUM',   // Salary keyword + $ in description
  LOW: 'LOW',         // Inferred from description without keyword
  NONE: 'NONE'        // No salary data found
};

/**
 * Multi-pass salary extraction with confidence levels
 * Tries multiple sources in priority order and returns best match
 * @param {Object} options - Extraction options
 * @param {string} options.structuredSalary - Salary from structured UI elements (highest priority)
 * @param {string} options.descriptionText - Full job description text
 * @returns {{min: number|null, max: number|null, confidence: string, source: string}}
 */
function detectEquityFromCompensationSignals(text) {
  return detectStrongEquitySignals(text);
}

function extractSalaryWithConfidence(options) {
  const {
    structuredSalary,
    structuredSalaryCandidates = [],
    descriptionText,
    allowLowConfidence = false
  } = options;

  // Pass 1: Structured salary field (HIGH confidence)
  if (Array.isArray(structuredSalaryCandidates) && structuredSalaryCandidates.length > 0) {
    for (const candidate of structuredSalaryCandidates) {
      const parsed = parseSalaryRange(candidate);
      if (parsed.min !== null && parsed.max !== null) {
        return {
          ...parsed,
          confidence: SALARY_CONFIDENCE.HIGH,
          source: 'structured_field'
        };
      }
    }
  }
  if (structuredSalary) {
    const parsed = parseSalaryRange(structuredSalary);
    if (parsed.min !== null && parsed.max !== null) {
      return {
        ...parsed,
        confidence: SALARY_CONFIDENCE.HIGH,
        source: 'structured_field'
      };
    }
  }

  // Pass 2: Keyword-gated search in description (MEDIUM confidence)
  if (descriptionText) {
    const mediumResult = findSalaryWithKeyword(descriptionText);
    if (mediumResult.min !== null && mediumResult.max !== null) {
      return {
        ...mediumResult,
        confidence: SALARY_CONFIDENCE.MEDIUM,
        source: 'description_keyword'
      };
    }
  }

  // Pass 3: Any salary-like pattern in description (LOW confidence)
  if (allowLowConfidence && descriptionText) {
    const lowResult = findAnySalaryPattern(descriptionText);
    if (lowResult.min !== null && lowResult.max !== null) {
      return {
        ...lowResult,
        confidence: SALARY_CONFIDENCE.LOW,
        source: 'description_pattern'
      };
    }
  }

  // No salary found
  return {
    min: null,
    max: null,
    confidence: SALARY_CONFIDENCE.NONE,
    source: 'none'
  };
}

function hasBudgetaryCompensationContext(text) {
  if (!text) return false;
  return /\b(budget|budgets|budgeted|managed budget|manage a budget|marketing budget|media budget|advertising budget|paid media budget|spend|spending|ad spend|media spend|revenue|arr|mrr|pipeline|quota|gmv|book of business|p&l|ebitda|capex|opex|portfolio|account value|deal size|contract value|sales target)\b/i.test(text);
}

function isPlausibleAnnualSalary(min, max, mode = 'default') {
  if (min === null || max === null || Number.isNaN(min) || Number.isNaN(max)) return false;
  const maxCap = mode === 'low_confidence' ? 750000 : 1000000;
  return min >= 40000 && max >= min && max <= maxCap;
}

/**
 * Find salary information using keyword-gated search (MEDIUM confidence)
 * Requires salary-related keyword near the dollar amount
 * @param {string} text - Full description text
 * @returns {{min: number|null, max: number|null}}
 */
function findSalaryWithKeyword(text) {
  const result = { min: null, max: null };
  if (!text) return result;

  const keywordRegex = /(salary|compensation range|compensation package|base pay|base salary|pay range|salary range|total rewards|total comp)/i;
  const currencyRegex = /\$|usd/i;

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const tryParse = raw => {
    if (!raw || !currencyRegex.test(raw)) return null;
    if (hasBudgetaryCompensationContext(raw)) return null;
    const parsed = parseSalaryRange(raw);
    if (parsed.min !== null && parsed.max !== null) {
      if (isPlausibleAnnualSalary(parsed.min, parsed.max)) {
        return parsed;
      }
    }
    return null;
  };

  // Pass 1: keyword line plus following context (handles multi-line labels + amounts)
  for (let i = 0; i < lines.length; i++) {
    if (!keywordRegex.test(lines[i])) continue;
    const block = [lines[i]];
    if (lines[i + 1]) block.push(lines[i + 1]);
    if (lines[i + 2]) block.push(lines[i + 2]);
    if (lines[i + 3]) block.push(lines[i + 3]);
    const parsed = tryParse(block.join(' '));
    if (parsed) return parsed;
  }

  // Pass 2: bullet lines that include keyword + currency
  for (const line of lines) {
    if (!/^[-•*]/.test(line)) continue;
    if (!keywordRegex.test(line)) continue;
    const parsed = tryParse(line);
    if (parsed) return parsed;
  }

  // Pass 3: any single line containing keyword + currency
  for (const line of lines) {
    if (!keywordRegex.test(line)) continue;
    const parsed = tryParse(line);
    if (parsed) return parsed;
  }

  return result;
}

/**
 * Find any salary-like pattern (LOW confidence)
 * More permissive - finds $XXX,XXX patterns without requiring keywords
 * @param {string} text - Full description text
 * @returns {{min: number|null, max: number|null}}
 */
function findAnySalaryPattern(text) {
  const result = { min: null, max: null };
  if (!text) return result;

  // Look for dollar amounts that look like annual salaries
  // Match: $150,000 - $200,000, $150K-$200K, $150,000/year
  const patterns = [
    // Range pattern: $150,000 - $200,000
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:k|K)?\s*[-–to]+\s*\$?\s*([\d,]+(?:\.\d{2})?)\s*(?:k|K)?/g,
    // Single value with /yr or /year: $180,000/yr
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:k|K)?\s*(?:\/\s*(?:yr|year|annually))/gi
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const contextStart = Math.max(0, (match.index || 0) - 120);
      const contextEnd = Math.min(text.length, (match.index || 0) + match[0].length + 120);
      const context = text.slice(contextStart, contextEnd);
      if (hasBudgetaryCompensationContext(context)) continue;
      if (!/(salary|compensation|pay|base|annual|annually|per year|\/\s*(?:yr|year))/i.test(context)) continue;

      let min = parseFloat(match[1].replace(/,/g, ''));
      let max = match[2] ? parseFloat(match[2].replace(/,/g, '')) : min;

      // Handle K suffix
      if (match[0].toLowerCase().includes('k')) {
        if (min < 1000) min *= 1000;
        if (max < 1000) max *= 1000;
      }

      if (isPlausibleAnnualSalary(min, max, 'low_confidence')) {
        return { min, max };
      }
    }
  }

  return result;
}

/**
 * Find salary information in descriptive text, gated by salary-related keywords to avoid false positives
 * @param {string} text - Full description text
 * @returns {{min: number|null, max: number|null}}
 * @deprecated Use extractSalaryWithConfidence for better results
 */
function findSalaryInText(text) {
  const result = extractSalaryWithConfidence({ descriptionText: text });
  return { min: result.min, max: result.max };
}

/**
 * Parse salary range from text
 * @param {string} text - Text potentially containing salary info
 * @returns {Object} { min: number|null, max: number|null }
 */
function parseSalaryRange(text) {
  const result = { min: null, max: null };

  if (!text) return result;

  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\/?yr\.?|per year|a year/gi, '')
    .replace(/\b(usd|cad|gbp|eur|aud)\b/gi, '') // strip trailing currency words
    .replace(/[()]/g, '')
    .trim();

  if (hasBudgetaryCompensationContext(cleaned)) {
    return result;
  }

  // Match patterns like "$150,000 - $200,000", "$150K–$200K", or "$150K to $200K"
  const rangeMatch = cleaned.match(
    /\$?\s*([\d.,]+)\s*(K|k|M|m)?\s*(?:-|–|to)\s*\$?\s*([\d.,]+)\s*(K|k|M|m)?/i
  );
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1].replace(/,/g, ''));
    let max = parseFloat(rangeMatch[3].replace(/,/g, ''));

    const minSuffix = rangeMatch[2]?.toLowerCase();
    const maxSuffix = rangeMatch[4]?.toLowerCase();

    if (minSuffix === 'k') min *= 1000;
    if (maxSuffix === 'k') max *= 1000;
    if (minSuffix === 'm') min *= 1000000;
    if (maxSuffix === 'm') max *= 1000000;

    if (!isPlausibleAnnualSalary(min, max)) {
      return result;
    }

    result.min = min;
    result.max = max;
    return result;
  }

  // Match single salary like "$180,000" or "$180K" (guarded by currency and reasonable length)
  const singleMatch = cleaned.match(/\$\s*([\d.,]{3,})\s*(K|k|M|m)?/);
  if (singleMatch) {
    let salary = parseFloat(singleMatch[1].replace(/,/g, ''));
    const suffix = singleMatch[2]?.toLowerCase();
    if (suffix === 'k') salary *= 1000;
    if (suffix === 'm') salary *= 1000000;
    if (!isPlausibleAnnualSalary(salary, salary)) {
      return result;
    }
    result.min = salary;
    result.max = salary;
  }

  return result;
}

/**
 * Normalize Indeed location strings to "City, ST" and detect workplace type
 * @param {string} rawLocation
 * @returns {{ location: string, workplaceType: string }}
 */
function normalizeIndeedLocation(rawLocation) {
  const result = { location: '', workplaceType: '' };
  if (!rawLocation) return result;

  let text = rawLocation
    .replace(/\s+/g, ' ')
    .replace(/•/g, ' ')
    .trim();

  // Detect workplace type from the location string
  if (/remote/i.test(text)) result.workplaceType = 'Remote';
  else if (/hybrid/i.test(text)) result.workplaceType = 'Hybrid';
  else if (/on[-\s]?site|onsite/i.test(text)) result.workplaceType = 'On-site';

  // Drop leading workplace phrases like "Remote in", "Hybrid in", "On-site in"
  text = text.replace(/^(remote|hybrid|on[-\s]?site|onsite)(?:\s+work)?\s+in\s+/i, '');
  text = text.replace(/\b(remote|hybrid|on[-\s]?site|onsite)\s+work\b/gi, '').trim();

  // Remove trailing country tokens commonly appended
  const hadUnitedStatesSuffix = /,\s*United States( of America)?$/i.test(text);
  text = text.replace(/,\s*United States( of America)?$/i, '').trim();
  if (!text && (hadUnitedStatesSuffix || /\bUnited States( of America)?\b/i.test(rawLocation))) {
    text = 'United States';
  }

  // Remove ZIP codes (5-digit or ZIP+4)
  text = text.replace(/\s+\d{5}(?:-\d{4})?$/, '');

  // If the string still contains multiple tokens, take the first city, ST pair
  const match = text.match(/([A-Za-z .'-]+,\s*[A-Z]{2})(?:\b|$)/);
  if (match) {
    result.location = match[1].trim();
    return result;
  }

  // Fallback: if there is a comma-separated city/state without uppercase state
  const parts = text.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    result.location = `${parts[0]}, ${parts[1]}`;
    return result;
  }

  // Final fallback: return cleaned text
  result.location = text;
  return result;
}

// ============================================================================
// OVERLAY UI
// ============================================================================

/**
 * Initialize auto-scoring for a job page
 * The sidebar rail handles all UI - no overlay buttons needed
 * @param {string} source - 'LinkedIn' or 'Indeed'
 */
function injectOverlay(source) {
  console.log('[Job Filter] Initializing auto-scoring...');

  // Mode detection owns sidebar creation on current builds.
  if (
    typeof window.JobHunterSidebar !== 'undefined' &&
    !document.getElementById('jh-sidebar-rail') &&
    !window.JobHunterModeDetection
  ) {
    window.JobHunterSidebar.create('jobs');
  }

  // Trigger auto-scoring (if profile exists)
  triggerAutoScore(source);
}

// ============================================================================
// SCORING INTEGRATION
// ============================================================================

/**
 * Handle click on the "Score This Job" button
 * @param {string} source - 'LinkedIn' or 'Indeed'
 * @param {HTMLButtonElement} button - The button element
 */
async function handleScoreClick(source, button) {
  // Prevent double-clicks
  if (button.disabled) return;

  // Show loading state
  button.disabled = true;
  button.classList.add('loading');
  button.querySelector('span').textContent = 'Scoring...';

  try {
    // Extract job data based on source
    const jobData = source === 'LinkedIn'
      ? extractLinkedInJobData()
      : extractIndeedJobData();

    console.log('[Job Filter] Extracted job data for scoring:', jobData);

    // Validate we got essential data
    if (!jobData.jobTitle || !jobData.companyName) {
      throw new Error('Could not extract job title or company name');
    }

    // Get user profile from storage
    const userProfile = await getUserProfile();

    // Check if profile exists
    if (!userProfile || !userProfile.preferences) {
      // Prompt user to set up profile
      showProfileSetupPrompt();
      button.classList.remove('loading');
      button.querySelector('span').textContent = 'Score This Job';
      button.disabled = false;
      return;
    }

    // Calculate score using the scoring engine
    // The scoring engine is loaded as a content script (scoring-engine.js)
    if (typeof window.JobHunterScoring === 'undefined') {
      throw new Error('Scoring engine not loaded');
    }

    const scoreResult = await window.JobHunterScoring.calculateJobFitScore(jobData, userProfile);
    console.log('[Job Filter] Score result:', scoreResult);

    // Reset button state
    button.classList.remove('loading');
    button.querySelector('span').textContent = 'Score This Job';
    button.disabled = false;

    // Display results modal
    if (typeof window.JobHunterResults !== 'undefined') {
      window.JobHunterResults.showResultsModal(
        scoreResult,
        jobData,
        // onSendToAirtable callback
        async (job, score) => {
          return sendJobToAirtable(job, score);
        },
        // onEditProfile callback
        () => {
          openProfileSetup();
        }
      );
    } else {
      // Fallback: show basic alert with score
      alert(`Job Fit Score: ${scoreResult.overall_score}/100 (${scoreResult.overall_label})`);
    }

  } catch (error) {
    console.error('[Job Filter] Scoring error:', error);

    // Show error state
    button.classList.remove('loading');
    button.classList.add('error');
    button.querySelector('span').textContent = error.message || 'Error - Try Again';

    // Reset button after 3 seconds
    setTimeout(() => {
      button.classList.remove('error');
      button.querySelector('span').textContent = 'Score This Job';
      button.disabled = false;
    }, 3000);
  }
}

/**
 * Get user profile from Chrome storage
 * @returns {Promise<Object|null>} User profile or null
 */
async function getUserProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get([PROFILE_STORAGE_KEY], (result) => {
      resolve(result[PROFILE_STORAGE_KEY] || null);
    });
  });
}

/**
 * Show prompt to set up profile
 */
function showProfileSetupPrompt() {
  // Create a simple modal prompt
  const promptHtml = `
    <div id="jh-profile-prompt" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        padding: 24px;
        border-radius: 12px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1a1a2e;">Set Up Your Profile</h3>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #6c757d;">
          To score jobs against your preferences, please set up your Job Filter profile first. It only takes 3 minutes!
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="jh-prompt-cancel" style="
            padding: 10px 20px;
            font-size: 14px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: #e9ecef;
            color: #495057;
          ">Cancel</button>
          <button id="jh-prompt-setup" style="
            padding: 10px 20px;
            font-size: 14px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: #4361ee;
            color: white;
          ">Set Up Profile</button>
        </div>
      </div>
    </div>
  `;

  const promptContainer = document.createElement('div');
  promptContainer.innerHTML = promptHtml;
  document.body.appendChild(promptContainer);

  // Add event handlers
  document.getElementById('jh-prompt-cancel').addEventListener('click', () => {
    document.getElementById('jh-profile-prompt').remove();
  });

  document.getElementById('jh-prompt-setup').addEventListener('click', () => {
    document.getElementById('jh-profile-prompt').remove();
    openProfileSetup();
  });
}

/**
 * Open the profile setup page
 */
function openProfileSetup() {
  if (!isExtensionContextValid()) {
    handleInvalidContext();
    alert('Extension was reloaded. Please refresh this page to continue.');
    return;
  }
  const profileUrl = chrome.runtime.getURL('profile-setup.html');
  window.open(profileUrl, '_blank');
}

/**
 * Open the settings popup page (Airtable + Profile + Flags)
 */
function openSettings() {
  if (!isExtensionContextValid()) {
    handleInvalidContext();
    alert('Extension was reloaded. Please refresh this page to continue.');
    return;
  }

  chrome.runtime.sendMessage({ action: 'jobHunter.openSettings' }, (resp) => {
    const lastErr = chrome.runtime.lastError;
    if (lastErr) {
      console.warn('[Job Filter] Open settings failed via background:', lastErr.message);
    }

    if (resp?.success) {
      return;
    }

    const settingsUrl = chrome.runtime.getURL('popup.html');
    const width = 420;
    const height = 680;
    const left = Math.max(0, Math.round((screen.width - width) / 2));
    const top = Math.max(0, Math.round((screen.height - height) / 2));
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;

    const settingsWindow = window.open(settingsUrl, '_blank', features);
    if (!settingsWindow) {
      window.open(settingsUrl, '_blank');
    }
  });
}

/**
 * Open the Chrome side panel for this tab (if supported and enabled)
 */
function openSidePanel() {
  if (!isExtensionContextValid()) {
    handleInvalidContext();
    alert('Extension was reloaded. Please refresh this page to continue.');
    return;
  }

  chrome.runtime.sendMessage({ action: 'jobHunter.openSidePanel' }, (resp) => {
    const lastErr = chrome.runtime.lastError;
    if (lastErr || !resp?.success) {
      console.warn('[Job Filter] Side panel unavailable:', lastErr?.message || resp?.error);
      alert('Side panel is not available in this browser profile. Please update Chrome or use the in-page Job Filter rail.');
      return;
    }

    if (resp?.fallback === 'none') {
      if (resp?.reason === 'flag_disabled') {
        alert('Panel is optional and currently disabled. Continue using Capture Job in the in-page Job Filter rail.');
      } else {
        alert('Panel is unavailable in this Chrome context. Continue using Capture Job in the in-page Job Filter rail.');
      }
    }
  });
}

// Make functions available globally for sidebar and mode detection
window.openProfileSetup = openProfileSetup;
window.openSettings = openSettings;
window.openSidePanel = openSidePanel;
window.showProfileSetupPrompt = showProfileSetupPrompt;

// Export triggerJobScoring for mode-detection.js to call
window.triggerJobScoring = function() {
  const hostname = window.location.hostname;
  const source = hostname.includes('linkedin.com') ? 'LinkedIn' : 'Indeed';
  triggerAutoScore(source);
};

// ============================================================================
// AUTO-SCORING FUNCTIONALITY
// ============================================================================

/**
 * Trigger auto-scoring for the current job page
 * Uses a debounce to avoid scoring too frequently
 * @param {string} source - 'LinkedIn' or 'Indeed'
 */
async function triggerAutoScore(source) {
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    console.log('[Job Filter] Extension context invalidated, skipping auto-score');
    handleInvalidContext();
    return;
  }

  const currentUrl = window.location.href;
  const currentJobKey = getAutoScoreKey(source, currentUrl);
  if (pendingExtractionRetryUrl === currentJobKey) {
    return;
  }
  if (extractionCooldownUrl === currentJobKey && Date.now() < extractionCooldownUntil) {
    return;
  }

  // Don't re-score the same job
  if (currentJobKey === lastScoredJobKey) {
    console.log('[Job Filter] Already scored this job, skipping');
    return;
  }

  // Clear any pending auto-score
  if (autoScoreDebounceTimer) {
    clearTimeout(autoScoreDebounceTimer);
  }

  // Debounce to avoid scoring during rapid navigation
  autoScoreDebounceTimer = setTimeout(async () => {
    try {
      // Double-check context is still valid after timeout
      if (!isExtensionContextValid()) {
        console.log('[Job Filter] Extension context invalidated during debounce');
        handleInvalidContext();
        return;
      }

      console.log('[Job Filter] Auto-scoring job...');

      // Extract job data
      const jobData = source === 'LinkedIn'
        ? extractLinkedInJobData()
        : extractIndeedJobData();

      // Validate we got essential data
      if (!jobData.jobTitle || !jobData.companyName) {
        const currentJobKey = getAutoScoreKey(source, currentUrl);
        if (source === 'LinkedIn' && extractionRetryAttempts < 3) {
          extractionRetryAttempts += 1;
          pendingExtractionRetryUrl = currentJobKey;
          if (extractionRetryTimer) {
            clearTimeout(extractionRetryTimer);
          }
          extractionRetryTimer = setTimeout(() => {
            pendingExtractionRetryUrl = '';
            extractionRetryTimer = null;
            triggerAutoScore(source);
          }, 1200 * extractionRetryAttempts);
          console.log(`[Job Filter] Essential fields missing, retrying extraction ${JSON.stringify({
            jobKey: currentJobKey,
            attempt: extractionRetryAttempts,
            jobTitle: jobData.jobTitle || null,
            companyName: jobData.companyName || null
          })}`);
          return;
        }
        console.log(`[Job Filter] Not enough data to auto-score ${JSON.stringify({
          url: currentUrl,
          jobTitle: jobData.jobTitle || null,
          companyName: jobData.companyName || null
        })}`);
        extractionCooldownUrl = currentJobKey;
        extractionCooldownUntil = Date.now() + 5000;
        return;
      }

      if (source === 'LinkedIn' && jobData.detailContentReady === false) {
        const currentJobKey = getAutoScoreKey(source, currentUrl);
        if (extractionRetryAttempts < 4) {
          extractionRetryAttempts += 1;
          pendingExtractionRetryUrl = currentJobKey;
          if (extractionRetryTimer) {
            clearTimeout(extractionRetryTimer);
          }
          extractionRetryTimer = setTimeout(() => {
            pendingExtractionRetryUrl = '';
            extractionRetryTimer = null;
            triggerAutoScore(source);
          }, 1200 * extractionRetryAttempts);
          console.log(`[Job Filter] LinkedIn detail body not ready, retrying extraction ${JSON.stringify({
            jobKey: currentJobKey,
            attempt: extractionRetryAttempts,
            descriptionCharCount: jobData.descriptionCharCount || 0,
            salarySource: jobData.salarySource || 'none'
          })}`);
          return;
        }
        console.log(`[Job Filter] LinkedIn detail body still unavailable ${JSON.stringify({
          jobKey: currentJobKey,
          descriptionCharCount: jobData.descriptionCharCount || 0,
          salarySource: jobData.salarySource || 'none'
        })}`);
        extractionCooldownUrl = currentJobKey;
        extractionCooldownUntil = Date.now() + 5000;
        return;
      }

      pendingExtractionRetryUrl = '';
      extractionRetryAttempts = 0;
      extractionCooldownUrl = '';
      extractionCooldownUntil = 0;

      // Get user profile
      const userProfile = await getUserProfile();

      // If no profile, don't auto-score (user needs to set up profile first)
      if (!userProfile || !userProfile.preferences) {
        console.log('[Job Filter] No profile found, skipping auto-score');
        return;
      }

      // Check if scoring engine is available
      if (typeof window.JobHunterScoring === 'undefined') {
        console.error('[Job Filter] Scoring engine not loaded');
        return;
      }

      // Calculate score
      const scoreResult = await window.JobHunterScoring.calculateJobFitScore(jobData, userProfile);
      console.log('[Job Filter] Auto-score result:', scoreResult);

      // Update sidebar (new docked rail UI)
      if (typeof window.JobHunterSidebar !== 'undefined') {
        window.JobHunterSidebar.updateScore(scoreResult, jobData);
      }
      // Fallback: Update floating panel (legacy UI)
      else if (typeof window.JobHunterFloatingPanel !== 'undefined') {
        window.JobHunterFloatingPanel.updateScore(scoreResult, jobData);
      }

      // Remember this job was scored
      lastScoredUrl = currentUrl;
      lastScoredJobKey = currentJobKey;

    } catch (error) {
      // Check if error is due to extension context invalidation
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.log('[Job Filter] Extension was reloaded. Please refresh the page.');
        handleInvalidContext();
      } else {
        console.error('[Job Filter] Auto-score error:', error);
      }
    }
  }, 800); // 800ms debounce
}

/**
 * Send job data to Airtable (used by both direct send and from results modal)
 * @param {Object} jobData - Extracted job data
 * @param {Object} scoreResult - Optional score result to include
 * @returns {Promise<Object>} Response from background script
 */
window.sendJobToAirtable = async function sendJobToAirtable(jobData, scoreResult = null) {
  return new Promise((resolve, reject) => {
    let timeoutId = null;
    let isResolved = false;
    let messageListener = null;
    const captureRequestId = `capture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (messageListener) {
        chrome.runtime.onMessage.removeListener(messageListener);
        messageListener = null;
      }
    };

    const safeResolve = (value) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      resolve(value);
    };

    const safeReject = (error) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      reject(error);
    };

    timeoutId = setTimeout(() => {
      safeReject(new Error('Timed out talking to background script'));
    }, 30000);

    messageListener = (request) => {
      if (request?.action !== 'jobCaptureComplete') return;
      if (request?.captureRequestId !== captureRequestId) return;

      if (request.success) {
        safeResolve(request);
      } else {
        safeReject(new Error(request.error || 'Failed to save job'));
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    // Include score data if available
    const payload = {
      action: 'jobHunter.createAirtableRecord',
      job: jobData,
      captureRequestId
    };

    if (scoreResult) {
      payload.score = scoreResult;
    }

    try {
      // Check if extension context is still valid before making API call
      if (!isExtensionContextValid()) {
        handleInvalidContext();
        safeReject(new Error('Extension context invalidated. Please reload this page.'));
        return;
      }

      chrome.runtime.sendMessage(payload, (resp) => {
        // Check for Chrome runtime errors first
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          console.error('[Job Filter] Runtime error:', lastErr.message);
          safeReject(new Error(lastErr.message || 'Message failed'));
          return;
        }

        // Handle undefined response (background script didn't respond)
        if (resp === undefined) {
          safeReject(new Error('No response from background script'));
          return;
        }

        // Handle "processing in background" response (async processing)
        if (resp && resp.processing) {
          console.log('[Job Filter] Job capture processing in background...');
          return;
        }

        // Handle immediate success/failure response (legacy path)
        if (resp && resp.success) {
          safeResolve(resp);
        } else {
          safeReject(new Error(resp?.error || 'Failed to save job'));
        }
      });
    } catch (err) {
      safeReject(new Error(`Send message error: ${err.message}`));
    }
  });
}

/**
 * Remove the overlay from the page
 */
function removeOverlay() {
  const overlay = document.getElementById('job-hunter-overlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Handle click on the capture button
 * @param {string} source - 'LinkedIn' or 'Indeed'
 * @param {HTMLButtonElement} button - The button element
 */
async function handleCaptureClick(source, button) {
  // Prevent double-clicks
  if (button.disabled) return;

  if (source === 'LinkedIn' && !isLinkedInJobPage()) {
    alert('Open a LinkedIn job details page before capturing.');
    return;
  }

  // Show loading state
  button.disabled = true;
  button.classList.add('loading');
  button.querySelector('span').textContent = 'Capturing...';

  try {
    // Extract job data based on source
    const jobData = source === 'LinkedIn'
      ? extractLinkedInJobData()
      : extractIndeedJobData();

    console.log('[Job Filter] Extracted job data:', jobData);

    // Validate we got essential data
    if (!jobData.jobTitle || !jobData.companyName) {
      throw new Error('Could not extract job title or company name');
    }

    // Send to background script for Airtable submission with explicit error handling + timeout
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out talking to background script'));
      }, 8000);

      chrome.runtime.sendMessage(
        {
          action: 'jobHunter.createAirtableRecord',
          job: jobData
        },
        resp => {
          clearTimeout(timeout);
          const lastErr = chrome.runtime.lastError;
          if (lastErr) {
            reject(new Error(lastErr.message || 'Message failed'));
            return;
          }
          resolve(resp);
        }
      );
    });

    if (response && response.success) {
      console.log('[Job Filter] Airtable saved:', {
        recordId: response.recordId,
        baseId: response.baseId,
        table: response.table
      });
      // Show success state
      button.classList.remove('loading');
      button.classList.add('success');
      button.querySelector('span').textContent = 'Job Captured!';

      // Reset button after 3 seconds
      setTimeout(() => {
        button.classList.remove('success');
        button.querySelector('span').textContent = 'Send to Job Filter';
        button.disabled = false;
      }, 3000);
    } else {
      const statusNote = response?.status ? ` (status ${response.status})` : '';
      throw new Error((response && response.error ? `${response.error}${statusNote}` : 'Failed to save job'));
    }

  } catch (error) {
    console.error('[Job Filter] Capture error:', error);

    // Show error state
    button.classList.remove('loading');
    button.classList.add('error');
    button.querySelector('span').textContent = error.message || 'Error - Try Again';

    // Reset button after 3 seconds
    setTimeout(() => {
      button.classList.remove('error');
      button.querySelector('span').textContent = 'Send to Job Filter';
      button.disabled = false;
    }, 3000);
  }
}
