(function() {
    function setIcon() {
        const iconEl = document.getElementById('icon');
        if (!iconEl) {
            setTimeout(setIcon, 10);
            return;
        }
        
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.getURL) {
            console.error('[BotBranch] chrome.runtime not available');
            iconEl.style.display = 'none';
            const fallback = document.getElementById('icon-fallback');
            if (fallback) fallback.style.display = 'inline-block';
            return;
        }
        
        try {
            const iconUrl = chrome.runtime.getURL('icon-48.png');
            if (iconUrl) {
                iconEl.src = iconUrl;
                iconEl.onerror = function() {
                    console.error('[BotBranch] Failed to load icon from:', iconUrl);
                    iconEl.style.display = 'none';
                    const fallback = document.getElementById('icon-fallback');
                    if (fallback) fallback.style.display = 'inline-block';
                };
            } else {
                throw new Error('getURL returned empty');
            }
        } catch (e) {
            console.error('[BotBranch] Error setting icon:', e);
            iconEl.style.display = 'none';
            const fallback = document.getElementById('icon-fallback');
            if (fallback) fallback.style.display = 'inline-block';
        }
    }
    
    // Wait for DOM and chrome API
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setIcon);
    } else {
        // Small delay to ensure chrome.runtime is available
        setTimeout(setIcon, 0);
    }
})();
