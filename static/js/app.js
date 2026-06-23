// State Management
let appState = {
    releaseNotes: [],
    filteredNotes: [],
    selectedUpdateId: null,
    selectedUpdate: null,
    selectedEntry: null,
    currentTemplate: 'standard',
    searchQuery: '',
    activeFilter: 'all'
};

// SVG Circle Constants for Character Counter
const CIRCLE_CIRCUMFERENCE = 88; // 2 * pi * r (r=14)

// DOM Elements Cache
const DOM = {
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.querySelector('#refresh-btn .btn-icon'),
    lastUpdatedText: document.getElementById('last-updated-text'),
    statusDot: document.querySelector('.status-indicator-dot'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    tagFilters: document.getElementById('tag-filters'),
    feedContainer: document.getElementById('feed-container'),
    loadingSkeletons: document.getElementById('loading-skeletons'),
    noResults: document.getElementById('no-results'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    
    // Sidebar/Composer Elements
    composerSidebar: document.getElementById('composer-sidebar'),
    composerPlaceholder: document.getElementById('composer-placeholder'),
    composerPanel: document.getElementById('composer-panel'),
    composerSourceDate: document.getElementById('composer-source-date'),
    closeComposerBtn: document.getElementById('close-composer-btn'),
    templateSelect: document.getElementById('template-select'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    resetTweetBtn: document.getElementById('reset-tweet-btn'),
    xPostPreviewText: document.getElementById('x-post-preview-text'),
    tweetIntentBtn: document.getElementById('tweet-intent-btn'),
    
    // Char Counter Elements
    progressRingIndicator: document.querySelector('.progress-ring-indicator'),
    charCounterNumber: document.getElementById('char-counter-number'),
    charStatusMessage: document.getElementById('char-status-message'),
    
    // Toast Notification
    toast: document.getElementById('toast'),
    toastMessage: document.querySelector('#toast .toast-message')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupEventListeners();
    fetchReleaseNotes(false);
}

// Set up Event Listeners
function setupEventListeners() {
    // Refresh button
    DOM.refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Search input
    DOM.searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.trim().toLowerCase();
        
        if (appState.searchQuery.length > 0) {
            DOM.clearSearchBtn.classList.remove('hidden');
        } else {
            DOM.clearSearchBtn.classList.add('hidden');
        }
        
        applyFiltersAndSearch();
    });

    // Clear search
    DOM.clearSearchBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        appState.searchQuery = '';
        DOM.clearSearchBtn.classList.add('hidden');
        applyFiltersAndSearch();
        DOM.searchInput.focus();
    });

    // Reset filters
    DOM.resetFiltersBtn.addEventListener('click', resetFilters);

    // Tag filter click
    DOM.tagFilters.addEventListener('click', (e) => {
        const targetTag = e.target.closest('.filter-tag');
        if (!targetTag) return;
        
        // Remove active class from all tags
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.classList.remove('active');
        });
        
        // Add active class to clicked tag
        targetTag.classList.add('active');
        appState.activeFilter = targetTag.dataset.type;
        
        applyFiltersAndSearch();
    });

    // Select release note item (event delegation on feed container)
    DOM.feedContainer.addEventListener('click', (e) => {
        const updateItem = e.target.closest('.update-item');
        const selectBtn = e.target.closest('.btn-select-tweet');
        
        // If clicking an update item or clicking the tweet button specifically
        if (updateItem || selectBtn) {
            const item = updateItem || selectBtn.closest('.update-item');
            const updateId = item.dataset.id;
            const entryId = item.dataset.entryId;
            
            selectUpdateItem(entryId, updateId);
        }
    });

    // Close composer panel
    DOM.closeComposerBtn.addEventListener('click', closeComposer);

    // Change sharing template
    DOM.templateSelect.addEventListener('change', (e) => {
        appState.currentTemplate = e.target.value;
        loadTemplateText();
    });

    // Customize tweet textarea
    DOM.tweetTextarea.addEventListener('input', () => {
        updateTweetTextState(DOM.tweetTextarea.value);
    });

    // Reset tweet to template default
    DOM.resetTweetBtn.addEventListener('click', () => {
        loadTemplateText();
        showToast("Text reset to template default");
    });

    // Post to X button (intent launcher)
    DOM.tweetIntentBtn.addEventListener('click', launchXShareIntent);
}

// Fetch Release Notes
async function fetchReleaseNotes(forceRefresh = false) {
    showLoading(true);
    DOM.statusDot.classList.add('syncing');
    DOM.refreshIcon.classList.add('spinning');
    DOM.refreshBtn.disabled = true;

    try {
        const response = await fetch(`/api/feed?refresh=${forceRefresh}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        appState.releaseNotes = data.entries;
        DOM.lastUpdatedText.textContent = `Last synced: ${data.last_updated}`;
        
        applyFiltersAndSearch();
        
        if (forceRefresh) {
            showToast("Release notes refreshed successfully!");
        }
    } catch (error) {
        console.error("Error fetching release notes:", error);
        showToast("Failed to fetch release notes. Using cached data if available.", true);
        DOM.lastUpdatedText.textContent = "Sync failed. Offline mode.";
    } finally {
        showLoading(false);
        DOM.statusDot.classList.remove('syncing');
        DOM.refreshIcon.classList.remove('spinning');
        DOM.refreshBtn.disabled = false;
    }
}

// Show/Hide Skeletons & Containers
function showLoading(isLoading) {
    if (isLoading) {
        DOM.loadingSkeletons.classList.remove('hidden');
        DOM.feedContainer.classList.add('hidden');
        DOM.noResults.classList.add('hidden');
    } else {
        DOM.loadingSkeletons.classList.add('hidden');
        DOM.feedContainer.classList.remove('hidden');
    }
}

// Apply Search & Group Filters
function applyFiltersAndSearch() {
    const searchVal = appState.searchQuery;
    const filterType = appState.activeFilter;
    
    // Deep clone release notes and filter individual updates within entries
    const processedEntries = [];
    
    appState.releaseNotes.forEach(entry => {
        const matchingUpdates = entry.updates.filter(update => {
            // Check tag type filter first
            const typeMatch = filterType === 'all' || 
                (filterType === 'other' && !['feature', 'changed', 'deprecated', 'fixed'].includes(update.type.toLowerCase())) ||
                update.type.toLowerCase() === filterType;
                
            if (!typeMatch) return false;
            
            // Check search text filter
            if (searchVal.length > 0) {
                const titleMatch = entry.title.toLowerCase().includes(searchVal);
                const textMatch = update.text.toLowerCase().includes(searchVal);
                const badgeMatch = update.type.toLowerCase().includes(searchVal);
                return titleMatch || textMatch || badgeMatch;
            }
            
            return true;
        });
        
        // Only include entries that have matching updates after filter is applied
        if (matchingUpdates.length > 0) {
            processedEntries.push({
                ...entry,
                updates: matchingUpdates
            });
        }
    });
    
    appState.filteredNotes = processedEntries;
    renderFeed();
}

// Reset Search & Filters
function resetFilters() {
    DOM.searchInput.value = '';
    appState.searchQuery = '';
    DOM.clearSearchBtn.classList.add('hidden');
    
    document.querySelectorAll('.filter-tag').forEach(tag => {
        if (tag.dataset.type === 'all') {
            tag.classList.add('active');
        } else {
            tag.classList.remove('active');
        }
    });
    appState.activeFilter = 'all';
    
    applyFiltersAndSearch();
    DOM.searchInput.focus();
}

// Render Release Notes Feed
function renderFeed() {
    DOM.feedContainer.innerHTML = '';
    
    if (appState.filteredNotes.length === 0) {
        DOM.noResults.classList.remove('hidden');
        return;
    }
    
    DOM.noResults.classList.add('hidden');
    
    appState.filteredNotes.forEach(entry => {
        const card = document.createElement('article');
        card.className = 'feed-entry-card';
        card.id = `card-${entry.id}`;
        
        let updatesHtml = '';
        entry.updates.forEach(update => {
            const badgeClass = getBadgeClass(update.type);
            const isSelectedClass = appState.selectedUpdateId === update.id ? 'active' : '';
            
            updatesHtml += `
                <div class="update-item ${isSelectedClass}" data-id="${update.id}" data-entry-id="${entry.id}">
                    <div class="update-item-header">
                        <span class="badge ${badgeClass}">${update.type}</span>
                        <div class="update-actions">
                            <button class="btn-select-tweet" title="Compose X tweet for this update">
                                <svg class="icon-sm" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                <span>Tweet Update</span>
                            </button>
                        </div>
                    </div>
                    <div class="update-content">
                        ${update.html}
                    </div>
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="entry-header">
                <div class="entry-title-group">
                    <h2>${entry.title}</h2>
                </div>
                ${entry.link ? `
                    <a href="${entry.link}" target="_blank" rel="noopener noreferrer" class="entry-meta-link" title="Open official GCP release notes page">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                ` : ''}
            </div>
            <div class="entry-updates-list">
                ${updatesHtml}
            </div>
        `;
        
        DOM.feedContainer.appendChild(card);
    });
}

// Get appropriate CSS badge class based on update type
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t === 'feature') return 'badge-feature';
    if (t === 'changed') return 'badge-changed';
    if (t === 'deprecated') return 'badge-deprecated';
    if (t === 'fixed') return 'badge-fixed';
    return 'badge-other';
}

// Select Release Note item for Composer
function selectUpdateItem(entryId, updateId) {
    // Find entry and update
    const entry = appState.releaseNotes.find(e => e.id === entryId);
    if (!entry) return;
    
    const update = entry.updates.find(u => u.id === updateId);
    if (!update) return;
    
    appState.selectedUpdateId = updateId;
    appState.selectedUpdate = update;
    appState.selectedEntry = entry;
    
    // Update timeline selection highlights
    document.querySelectorAll('.update-item').forEach(item => {
        if (item.dataset.id === updateId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Configure composer header
    DOM.composerSourceDate.textContent = `Selected update from ${entry.date}`;
    
    // Switch panels
    DOM.composerPlaceholder.classList.add('hidden');
    DOM.composerPanel.classList.remove('hidden');
    
    // Add drawer class for mobile layout
    DOM.composerSidebar.classList.add('drawer-open');
    
    // Pre-populate tweet contents based on selected template
    loadTemplateText();
    
    showToast(`Loaded details for "${update.type}" update`);
}

// Close Tweet Composer Sidebar
function closeComposer() {
    appState.selectedUpdateId = null;
    appState.selectedUpdate = null;
    appState.selectedEntry = null;
    
    // Remove active styles on feed
    document.querySelectorAll('.update-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Reset Composer panel states
    DOM.composerSidebar.classList.remove('drawer-open');
    DOM.composerPanel.classList.add('hidden');
    DOM.composerPlaceholder.classList.remove('hidden');
}

// Generate Tweet template text
function generateTweetText(entry, update, templateType) {
    const date = entry.date;
    const type = update.type;
    const link = entry.link || 'https://cloud.google.com/bigquery/docs/release-notes';
    
    // Clean and normalize spacing
    let rawText = update.text
        .replace(/\s+/g, ' ')
        .replace(/•/g, '-') // Replace bullets
        .trim();
        
    let templateFn;
    
    switch (templateType) {
        case 'hype':
            templateFn = (content) => `🚀 New BigQuery update (${date})!\n\n${type}: ${content}\n\nRead more: ${link} #GoogleCloud #BigQuery`;
            break;
        case 'detailed':
            templateFn = (content) => `🆕 BigQuery Release Notes\n📅 Date: ${date}\n📌 Type: ${type}\n\n📝 ${content}\n\n👉 Link: ${link}`;
            break;
        case 'minimal':
            templateFn = (content) => `BigQuery [${type}] (${date}): ${content}\n${link}`;
            break;
        case 'standard':
        default:
            templateFn = (content) => `BigQuery Release (${date}): ${type} - ${content} ${link} #BigQuery`;
            break;
    }
    
    // X counts any URL (http:// or https://) as exactly 23 characters
    const emptyContentTweet = templateFn('');
    const emptyCount = countTwitterChars(emptyContentTweet);
    const maxContentChars = 280 - emptyCount;
    
    let content = rawText;
    if (rawText.length > maxContentChars) {
        content = rawText.substring(0, maxContentChars - 3) + '...';
    }
    
    return templateFn(content);
}

// Count characters accurately based on X/Twitter logic
function countTwitterChars(text) {
    if (!text) return 0;
    // URL matching regex
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    
    // Strip URLs out of the length count
    const textWithoutUrls = text.replace(urlRegex, '');
    
    // Total count = clean text length + (23 characters per URL)
    return textWithoutUrls.length + (urls.length * 23);
}

// Render generated template text into composer textarea
function loadTemplateText() {
    if (!appState.selectedUpdate || !appState.selectedEntry) return;
    
    const formattedText = generateTweetText(
        appState.selectedEntry, 
        appState.selectedUpdate, 
        appState.currentTemplate
    );
    
    DOM.tweetTextarea.value = formattedText;
    updateTweetTextState(formattedText);
}

// Update Tweet composition state (indicators, previews, buttons)
function updateTweetTextState(text) {
    // 1. Live preview text rendering (with styling for tags/links)
    DOM.xPostPreviewText.innerHTML = formatPreviewText(text);
    
    // 2. Character counter updates
    const charCount = countTwitterChars(text);
    const charLimit = 280;
    const charsRemaining = charLimit - charCount;
    
    DOM.charCounterNumber.textContent = charsRemaining;
    
    // Calculate SVG Stroke Offset
    const percentage = Math.min(charCount / charLimit, 1);
    const offset = CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * percentage);
    
    DOM.progressRingIndicator.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
    DOM.progressRingIndicator.style.strokeDashoffset = offset;
    
    // State-based styling (colors & alerts)
    DOM.charCounterNumber.classList.remove('warning', 'danger');
    DOM.progressRingIndicator.setAttribute('stroke', '#38BDF8'); // Blue (default)
    DOM.charStatusMessage.textContent = "";
    DOM.charStatusMessage.className = "char-warning-msg";
    DOM.tweetIntentBtn.disabled = charCount === 0 || charCount > charLimit;
    
    if (charsRemaining <= 40 && charsRemaining >= 0) {
        // Warning state (yellow)
        DOM.charCounterNumber.classList.add('warning');
        DOM.progressRingIndicator.setAttribute('stroke', '#f59e0b');
        DOM.charStatusMessage.textContent = `${charsRemaining} characters left`;
        DOM.charStatusMessage.classList.add('warning');
    } else if (charsRemaining < 0) {
        // Danger state (red)
        DOM.charCounterNumber.classList.add('danger');
        DOM.progressRingIndicator.setAttribute('stroke', '#ef4444');
        DOM.charStatusMessage.textContent = `Character limit exceeded by ${Math.abs(charsRemaining)}!`;
        DOM.charStatusMessage.classList.add('danger');
    }
}

// Helper to highlight links/hashtags inside the live preview box
function formatPreviewText(text) {
    if (!text) return '<span style="color:var(--text-muted);">Draft text will preview here...</span>';
    
    // Escape HTML first
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
        
    // Format hashtags
    escaped = escaped.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="hashtag">$1</span>');
    
    // Format links
    escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, '<span class="url-link">$1</span>');
    
    return escaped;
}

// Open Tweet Share Intent in a new browser tab
function launchXShareIntent() {
    const text = DOM.tweetTextarea.value.trim();
    if (!text) return;
    
    const charCount = countTwitterChars(text);
    if (charCount > 280) {
        showToast("Error: Tweet text exceeds character limits!", true);
        return;
    }
    
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
    
    showToast("Launching Tweet composer on X!");
}

// Toast notification display helper
let toastTimeout;
function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    
    DOM.toastMessage.textContent = message;
    DOM.toast.classList.remove('hidden', 'error');
    
    if (isError) {
        DOM.toast.classList.add('error');
    }
    
    toastTimeout = setTimeout(() => {
        DOM.toast.classList.add('hidden');
    }, 4000);
}
