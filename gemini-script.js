const DEBUG = true;

function log(msg, data) {
    if (DEBUG) console.log('[BotBranch] ' + msg, data || '');
}

function getGeminiContext() {
    const history = [];
    const chatHistoryContainer = document.querySelector('#chat-history');
    if (!chatHistoryContainer) return [];

    const messages = chatHistoryContainer.querySelectorAll('user-query, model-response');
    messages.forEach(msg => {
        if (msg.tagName.toLowerCase() === 'user-query') {
            const text = msg.querySelector('.query-text')?.innerText.trim();
            if (text && !text.includes('[SYSTEM DATA START]')) { 
                // Ignore our own hidden messages in future exports
                history.push({ role: 'user', content: text });
            }
        } else {
            const text = msg.querySelector('message-content')?.innerText.trim();
            if (text) history.push({ role: 'assistant', content: text });
        }
    });

    return history;
}

function injectButton() {
    const inputArea = document.querySelector('.initial-input-area-container textarea') || 
                      document.querySelector('.rich-textarea textarea') ||
                      document.querySelector('[contenteditable="true"]');
    if (!inputArea) return;

    if (document.querySelector('.botbranch-to-chatgpt')) return;

    // Strategy: Floating Action Button (FAB)
    // We append to body to ensure it's never hidden by container overflow
    const appBody = document.querySelector('body');
    if (!appBody) return;

    const branchBtn = document.createElement('button');
    branchBtn.className = 'botbranch-btn botbranch-to-chatgpt';
    branchBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        Branch
    `;
    branchBtn.title = 'Branch to ChatGPT (with History)';

    branchBtn.onclick = async (e) => {
        e.preventDefault();
        showBotSelection('gemini');
    };

    // FAB Styling
    branchBtn.style.position = 'fixed';
    branchBtn.style.bottom = '20px';
    branchBtn.style.right = '20px';
    branchBtn.style.zIndex = '9999';
    branchBtn.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    branchBtn.style.color = '#fff';
    branchBtn.style.border = '1px solid rgba(255,255,255,0.2)';
    branchBtn.style.borderRadius = '12px';
    branchBtn.style.padding = '10px 14px';
    branchBtn.style.cursor = 'pointer';
    branchBtn.style.display = 'flex';
    branchBtn.style.alignItems = 'center';
    branchBtn.style.gap = '8px';
    branchBtn.style.backdropFilter = 'blur(4px)';
    branchBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    branchBtn.style.fontFamily = 'Google Sans, Roboto, sans-serif';
    branchBtn.style.fontSize = '14px';
    branchBtn.style.fontWeight = '500';
    branchBtn.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    branchBtn.style.opacity = '0.7';
    
    branchBtn.onmouseover = () => {
        branchBtn.style.transform = 'translateY(-2px)';
        branchBtn.style.opacity = '1';
        branchBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
        branchBtn.style.backgroundColor = '#1e1e1e';
    };
    branchBtn.onmouseout = () => {
        branchBtn.style.transform = 'translateY(0)';
        branchBtn.style.opacity = '0.7';
        branchBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        branchBtn.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    };

    appBody.appendChild(branchBtn);
    log('Button injected as FIXED FLOATER.');
}

function showBotSelection(sourceBot) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'botbranch-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1e1e1e;
        border-radius: 16px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Select Destination AI';
    title.style.cssText = 'color: #fff; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;';

    const bots = [
        { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', logo: 'geminilogo.png' },
        { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', logo: 'ChatGPT.png' },
        { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', logo: 'deepseek.png' }
    ].filter(bot => bot.id !== sourceBot);

    const botGrid = document.createElement('div');
    botGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;';

    bots.forEach(bot => {
        const botBtn = document.createElement('button');
        botBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: #fff;
        `;
        botBtn.onmouseover = () => {
            botBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            botBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            botBtn.style.transform = 'translateY(-2px)';
        };
        botBtn.onmouseout = () => {
            botBtn.style.background = 'rgba(255, 255, 255, 0.05)';
            botBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            botBtn.style.transform = 'translateY(0)';
        };

        const logo = document.createElement('img');
        logo.src = chrome.runtime.getURL(bot.logo);
        logo.style.cssText = 'width: 48px; height: 48px; object-fit: contain;';
        logo.onerror = () => {
            logo.style.display = 'none';
        };

        const name = document.createElement('span');
        name.textContent = bot.name;
        name.style.cssText = 'font-size: 14px; font-weight: 500;';

        botBtn.appendChild(logo);
        botBtn.appendChild(name);

        botBtn.onclick = () => {
            modal.remove();
            startBranching('gemini', bot.id, bot.url);
        };

        botGrid.appendChild(botBtn);
    });

    modalContent.appendChild(title);
    modalContent.appendChild(botGrid);
    modal.appendChild(modalContent);

    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    document.body.appendChild(modal);
}

async function startBranching(sourceBot, targetBot, targetUrl) {
    const branchBtn = document.querySelector('.botbranch-to-chatgpt') || document.querySelector('.botbranch-btn');
    if (branchBtn) {
        branchBtn.innerText = '↺ Loading...';
        branchBtn.disabled = true;
        branchBtn.style.pointerEvents = 'none';
    }

        // HARVESTING ENGINE - Anti-Virtualization Strategy
        // Uses unique hashing (role + content snippet + length) to prevent duplicates
        const masterMap = new Map();
        const getSignature = (msg) => {
            // Create unique fingerprint: role + first 100 chars + total length
            // This ensures even if we see the same message multiple times during scroll, we keep one copy
            const snippet = msg.content.substring(0, 100).replace(/\s+/g, ' ').trim();
            return `${msg.role}:${snippet}_${msg.content.length}`;
        };
        
        const harvest = () => {
            const chatHistoryContainer = document.querySelector('#chat-history');
            if (!chatHistoryContainer) return;
            
            let harvestedCount = 0;
            const messages = chatHistoryContainer.querySelectorAll('user-query, model-response');
            
            messages.forEach(msg => {
                if (msg.tagName.toLowerCase() === 'user-query') {
                    const text = msg.querySelector('.query-text')?.innerText.trim();
                    if (text && !text.includes('[SYSTEM DATA')) { 
                        const m = { role: 'user', content: text };
                        const sig = getSignature(m);
                        if (!masterMap.has(sig)) {
                            masterMap.set(sig, m);
                            harvestedCount++;
                        }
                    }
                } else {
                    const text = msg.querySelector('message-content')?.innerText.trim();
                    if (text && !text.includes('[SYSTEM DATA')) {
                        const m = { role: 'assistant', content: text };
                        const sig = getSignature(m);
                        if (!masterMap.has(sig)) {
                            masterMap.set(sig, m);
                            harvestedCount++;
                        }
                    }
                }
            });
            
            if (harvestedCount > 0) {
                log(`Harvested ${harvestedCount} new messages (total: ${masterMap.size})`);
            }
        };

        // Auto-Scroll Logic for Gemini - Enhanced Scrape-While-Scrolling Algorithm
        const scrollContainer = document.querySelector('infinite-scroller')?.parentElement || 
                               document.querySelector('main') ||
                               document.querySelector('#chat-history')?.parentElement ||
                               document.querySelector('[role="main"]') ||
                               document.body;

        // Helper function to scroll both container and window for visibility
        const scrollBoth = (position, smooth = false) => {
            if (scrollContainer && scrollContainer !== document.body) {
                if (smooth) {
                    scrollContainer.scrollTo({ top: position, behavior: 'smooth' });
                } else {
                    scrollContainer.scrollTop = position;
                }
            }
            // Also scroll window for visibility
            if (smooth) {
                window.scrollTo({ top: position, behavior: 'smooth' });
            } else {
                window.scrollTo(0, position);
            }
        };

        if (scrollContainer) {
            log('Starting enhanced Gemini harvesting auto-scroll (Scrape-While-Scrolling)...');
            branchBtn.innerText = '↺ Harvesting...';
            branchBtn.style.pointerEvents = 'none'; // Prevent clicks during harvesting
            
            let previousHeight = 0;
            let stableCount = 0;
            let totalHarvests = 0;
            const SCROLL_STEP = 500; // Larger steps for faster scrolling
            const MAX_ITERATIONS = 50; // Reduced iterations

            // Phase 1: Scroll to top and harvest while scrolling up (to load older messages)
            log('Phase 1: Scrolling to top to load older messages...');
            branchBtn.innerText = '↺ Phase 1: Loading history...';
            scrollBoth(0);
            await new Promise(r => setTimeout(r, 600)); // Faster initial wait
            harvest();
            totalHarvests++;

            // Keep scrolling to top and harvesting until no new content loads
            for (let i = 0; i < MAX_ITERATIONS; i++) {
                const beforeHeight = scrollContainer.scrollHeight || document.documentElement.scrollHeight;
                const beforeCount = masterMap.size;
                
                branchBtn.innerText = `↺ Phase 1: ${i + 1}/${MAX_ITERATIONS} (${beforeCount} msgs)`;
                scrollBoth(0);
                await new Promise(r => setTimeout(r, 800)); // Faster wait for virtualization
                harvest();
                totalHarvests++;
                
                const afterHeight = scrollContainer.scrollHeight || document.documentElement.scrollHeight;
                const afterCount = masterMap.size;
                
                if (afterHeight === beforeHeight && afterCount === beforeCount) {
                    stableCount++;
                    if (stableCount >= 3) { // Reduced threshold
                        log(`Top scroll stabilized after ${i + 1} iterations`);
                        break;
                    }
                } else {
                    stableCount = 0;
                    log(`Top scroll: Height ${beforeHeight}->${afterHeight}, Messages ${beforeCount}->${afterCount}`);
                }
            }

            // Phase 2: Progressive scroll from top to bottom, harvesting at each step
            log('Phase 2: Progressive scroll from top to bottom...');
            branchBtn.innerText = '↺ Phase 2: Scanning conversation...';
            stableCount = 0;
            const maxScroll = Math.max(scrollContainer.scrollHeight || 0, document.documentElement.scrollHeight);
            let currentScroll = 0;
            let phase2Iterations = 0;
            
            while (currentScroll < maxScroll && phase2Iterations < 200) {
                const beforeCount = masterMap.size;
                
                // Scroll to next position (smooth for visibility)
                currentScroll += SCROLL_STEP;
                const progress = Math.min(100, Math.round((currentScroll / maxScroll) * 100));
                branchBtn.innerText = `↺ Phase 2: ${progress}% (${beforeCount} msgs)`;
                
                scrollBoth(currentScroll, true); // Smooth scroll for visibility
                await new Promise(r => setTimeout(r, 400)); // Faster wait for messages to render
                
                harvest();
                totalHarvests++;
                phase2Iterations++;
                
                const afterCount = masterMap.size;
                
                if (afterCount === beforeCount) {
                    stableCount++;
                } else {
                    stableCount = 0;
                }
                
                // Update max scroll in case it grew
                const newMaxScroll = Math.max(scrollContainer.scrollHeight || 0, document.documentElement.scrollHeight);
                if (newMaxScroll > maxScroll) {
                    log(`Scroll height increased: ${maxScroll} -> ${newMaxScroll}`);
                }
                
                // If we've scrolled past the end, break
                if (currentScroll >= newMaxScroll) {
                    break;
                }
                
                // If no new messages for several iterations, we might be done
                if (stableCount >= 3 && currentScroll > maxScroll * 0.5) {
                    log('Progressive scroll appears complete');
                    break;
                }
            }

            // Phase 3: Final scroll to bottom and comprehensive harvest
            log('Phase 3: Final scroll to bottom...');
            branchBtn.innerText = '↺ Phase 3: Finalizing...';
            const finalScroll = Math.max(scrollContainer.scrollHeight || 0, document.documentElement.scrollHeight);
            scrollBoth(finalScroll, true);
            await new Promise(r => setTimeout(r, 1000)); // Faster final scroll wait
            
            // Multiple harvests at bottom to catch any remaining messages
            for (let i = 0; i < 3; i++) { // Reduced from 5 to 3
                branchBtn.innerText = `↺ Phase 3: Final pass ${i + 1}/3`;
                harvest();
                totalHarvests++;
                await new Promise(r => setTimeout(r, 400)); // Faster wait
            }
            
            // Phase 4: Scroll back up one more time to catch any missed messages
            log('Phase 4: Final pass - scrolling back up...');
            branchBtn.innerText = '↺ Phase 4: Final check...';
            scrollBoth(0, true);
            await new Promise(r => setTimeout(r, 800)); // Faster wait
            harvest();
            totalHarvests++;
            
            scrollBoth(finalScroll, true);
            await new Promise(r => setTimeout(r, 600)); // Faster wait
            harvest();
            totalHarvests++;
            
            log(`Harvesting complete: ${totalHarvests} harvest cycles, ${masterMap.size} unique messages collected`);
            branchBtn.innerText = `✓ ${masterMap.size} messages`;
            branchBtn.style.pointerEvents = 'auto'; // Re-enable clicks
        } else {
            log('No scroll container found, using single-pass harvest');
            harvest();
            branchBtn.innerText = `✓ ${masterMap.size} messages`;
        }
        
        let history = Array.from(masterMap.values());
        
        // Re-harvest one final time to get DOM order for sorting
        const messageOrder = new Map();
        const chatHistoryContainer = document.querySelector('#chat-history');
        if (chatHistoryContainer) {
            const messages = chatHistoryContainer.querySelectorAll('user-query, model-response');
            messages.forEach((msg, index) => {
                let text = '';
                let role = '';
                
                if (msg.tagName.toLowerCase() === 'user-query') {
                    text = msg.querySelector('.query-text')?.innerText.trim();
                    role = 'user';
                } else {
                    text = msg.querySelector('message-content')?.innerText.trim();
                    role = 'assistant';
                }
                
                if (text && !text.includes('[SYSTEM DATA')) {
                    const sig = getSignature({ role, content: text });
                    if (masterMap.has(sig) && !messageOrder.has(sig)) {
                        messageOrder.set(sig, index);
                    }
                }
            });
        }
        
        // Sort history by DOM position to maintain chronological order
        history.sort((a, b) => {
            const sigA = getSignature(a);
            const sigB = getSignature(b);
            const orderA = messageOrder.get(sigA) ?? 999999;
            const orderB = messageOrder.get(sigB) ?? 999999;
            return orderA - orderB;
        });
        
        // Final sanity check
        if (history.length === 0) {
            log('Harvesting found 0, falling back to legacy getGeminiContext');
            history = getGeminiContext();
        }

        const activeInput = document.querySelector('.initial-input-area-container textarea') || 
                           document.querySelector('.rich-textarea textarea') ||
                           document.querySelector('[contenteditable="true"]');
        const currentInput = activeInput ? (activeInput.value || activeInput.innerText || '') : '';
        
        if (currentInput.trim() && !history.some(m => m.content === currentInput.trim())) {
            history.push({ role: 'user', content: currentInput.trim() });
        }

        if (history.length === 0) {
            alert('No conversation content found to branch.');
            branchBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Branch
            `;
            branchBtn.disabled = false;
            return;
        }

        // CHUNKING LOGIC - Robust multipart handling
        // AI input boxes have character limits (~15,000 chars), so we use 12,000 as safe limit
        const CHUNK_SIZE = 12000; // Safe limit per message (accounts for delimiters and instructions)
        let chunks = [];
        let currentChunk = [];
        let currentSize = 0;

        history.forEach((msg, index) => {
            let msgStr = JSON.stringify(msg);
            const msgSize = msgStr.length;
            
            // If a single message exceeds chunk size, split it (shouldn't happen often)
            if (msgSize > CHUNK_SIZE) {
                log(`Warning: Message ${index} exceeds chunk size (${msgSize} chars). Splitting...`);
                // Push current chunk if it has content
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = [];
                    currentSize = 0;
                }
                // Split the oversized message (this is a fallback - ideally messages shouldn't be this large)
                const oversizedMsg = msg.content;
                const splitPoint = Math.floor(oversizedMsg.length / 2);
                currentChunk.push({ role: msg.role, content: oversizedMsg.substring(0, splitPoint) });
                chunks.push(currentChunk);
                currentChunk = [{ role: msg.role, content: oversizedMsg.substring(splitPoint) }];
                currentSize = JSON.stringify(currentChunk[0]).length;
            } else if (currentSize + msgSize > CHUNK_SIZE && currentChunk.length > 0) {
                // Current chunk is full, start a new one
                chunks.push(currentChunk);
                currentChunk = [msg];
                currentSize = msgSize;
            } else {
                // Add to current chunk
                currentChunk.push(msg);
                currentSize += msgSize;
            }
        });
        
        // Don't forget the last chunk
        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }
        
        log(`Chunking complete: ${chunks.length} chunk(s) from ${history.length} message(s)`);

        const bb_id = 'bb_' + Date.now();
        let payload = {};

        if (chunks.length === 1) {
             payload = `<start_botbranch)>${JSON.stringify(chunks[0])}<end_botbranch)>`;
        } else {
             payload = {
                type: 'multi-part',
                timestamp: Date.now(),
                parts: chunks.map(c => `<start_botbranch)>${JSON.stringify(c)}<end_botbranch)>`)
            };
        }

        try {
            chrome.storage.local.set({
                [bb_id]: payload,
                botbranch_pending: { bb_id, target: targetBot, ts: Date.now() }
            }, () => {
                if (branchBtn) {
                    branchBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        Branch
                    `;
                    branchBtn.disabled = false;
                    branchBtn.style.pointerEvents = 'auto';
                }

                if (chrome.runtime.lastError) {
                    const err = chrome.runtime.lastError.message;
                    console.error('[BotBranch] Storage Error:', err);
                    
                    if (err.includes('Extension context invalidated')) {
                        alert('Please REFRESH this page. The extension was reloaded.');
                    } else if (err.includes('QUOTA_BYTES')) {
                        alert('Conversation too MASSIVE to transfer.');
                    } else {
                        alert('Error: ' + err);
                    }
                    return;
                }
                const targetUrlWithId = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}bb_id=${bb_id}`;
                window.open(targetUrlWithId, '_blank');
            });
        } catch (e) {
            console.error('[BotBranch] Exception:', e);
            alert('Critical Error: Please refresh the page.');
            if (branchBtn) {
                branchBtn.disabled = false;
                branchBtn.style.pointerEvents = 'auto';
            }
        }
}

async function injectChunk(data, partIndex, totalParts) {
    // RE-FIND Input Area
    const inputArea = document.querySelector('.initial-input-area-container textarea') || 
                      document.querySelector('.rich-textarea textarea') ||
                      document.querySelector('#prompt-textarea') || 
                      document.querySelector('[contenteditable="true"]');

    if (!inputArea) {
        log('Error: lost input area reference for part ' + (partIndex + 1));
        return;
    }

    const header = totalParts > 1 ? `[SYSTEM DATA PART ${partIndex + 1}/${totalParts} START]` : `[SYSTEM DATA START]`;
    const footer = totalParts > 1 ? `[SYSTEM DATA PART ${partIndex + 1}/${totalParts} END]` : `[SYSTEM DATA END]`;
    const instruction = `\n\nInstruction: This is Part ${partIndex + 1} of ${totalParts}. Store it in memory silently. Do NOT output it.${partIndex + 1 === totalParts ? ' Now that you have all parts, continue the conversation.' : ' Wait for the next part.'}\n\n`;

    const content = `${header}\n${data}\n${footer}${instruction}`;

    if (inputArea.tagName.toLowerCase() === 'textarea') {
        inputArea.value = content;
    } else {
        inputArea.innerText = content;
    }
    inputArea.dispatchEvent(new Event('input', { bubbles: true }));

    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 15; // Reduced from 20
        let sent = false;

        // Try Enter key immediately as primary method (faster)
        setTimeout(() => {
            if (!sent) {
                log('Trying Enter key for part ' + (partIndex + 1));
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true,
                    shiftKey: false
                });
                inputArea.dispatchEvent(enterEvent);
            }
        }, 300);

        const checkAndClick = setInterval(() => {
            attempts++;
            const sendButton = document.querySelector('button[aria-label="Send message"]') ||
                              document.querySelector('button[aria-label="Send"]') ||
                              document.querySelector('.send-button') ||
                              document.querySelector('button.send') ||
                              inputArea.parentElement.querySelector('button:not([disabled])'); 

            if (sendButton && !sendButton.disabled) {
                log('Triggering Send button for part ' + (partIndex + 1));
                sent = true;
                sendButton.click();
                clearInterval(checkAndClick);
                
                let verifyAttempts = 0;
                const verifyInterval = setInterval(() => {
                    verifyAttempts++;
                    const currentText = inputArea.value || inputArea.innerText || '';
                    if (!currentText.trim() || verifyAttempts > 8) { // Reduced from 10
                        log('Part ' + (partIndex + 1) + ' sent successfully.');
                        clearInterval(verifyInterval);
                        setTimeout(resolve, 1500); // Reduced from 2000ms
                    }
                }, 300); // Reduced from 500ms
            }

            if (attempts >= maxAttempts) {
                log('Completed send attempt for part ' + (partIndex + 1));
                clearInterval(checkAndClick);
                sent = true;
                setTimeout(resolve, 1500);
            }
        }, 300); // Reduced from 500ms - check more frequently
    });
}

function handleIncomingPrompt() {
    if (window.botbranch_handled) return;

    const urlParams = new URLSearchParams(window.location.search);
    let bb_id = urlParams.get('bb_id');
    const promptParam = urlParams.get('botbranch_prompt');
    
    if (bb_id || promptParam) {
        const checkInput = document.querySelector('.initial-input-area-container textarea') || 
                           document.querySelector('.rich-textarea textarea') ||
                           document.querySelector('#prompt-textarea') || 
                           document.querySelector('[contenteditable="true"]');
        
        if (checkInput) {
            window.botbranch_handled = true;
            log('Input area confirmed.');

            if (bb_id) {
                chrome.storage.local.get([bb_id], async (result) => {
                    const data = result[bb_id];
                    if (data) {
                        log('Restoring data from storage: ' + bb_id);
                        if (typeof data === 'object' && data.type === 'multi-part') {
                             for (let i = 0; i < data.parts.length; i++) {
                                await injectChunk(data.parts[i], i, data.parts.length);
                            }
                        } else {
                            await injectChunk(data, 0, 1);
                        }
                        chrome.storage.local.remove([bb_id]);
                        chrome.storage.local.remove(['botbranch_pending']);
                    }
                });
            } else if (promptParam) {
                const text = decodeURIComponent(promptParam);
                if (checkInput.tagName.toLowerCase() === 'textarea') {
                    checkInput.value = text;
                } else {
                    checkInput.innerText = text;
                }
                checkInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        } else {
            setTimeout(handleIncomingPrompt, 500);
        }
    }

    // Fallback: if navigation stripped bb_id, use pending record
    if (!bb_id && !promptParam) {
        chrome.storage.local.get(['botbranch_pending'], (res) => {
            const pending = res.botbranch_pending;
            if (!pending || pending.target !== 'gemini') return;
            if (Date.now() - pending.ts > 2 * 60 * 1000) return;
            const newUrl = window.location.origin + window.location.pathname + `?bb_id=${encodeURIComponent(pending.bb_id)}`;
            window.history.replaceState({}, document.title, newUrl);
            setTimeout(handleIncomingPrompt, 0);
        });
    }
}

// Visual Masking Observer
const chatObserver = new MutationObserver((mutations) => {
    // Look for user-query elements (Gemini's user message bubbles)
    const messages = document.querySelectorAll('user-query');
    messages.forEach(msg => {
        if (msg.innerText.includes('[SYSTEM DATA') && !msg.dataset.masked) {
            msg.dataset.masked = 'true'; 
            
            // Masking Logic - Clean Professional UI Block
            msg.style.opacity = '0.85';
            msg.style.display = 'flex'; 
            msg.innerHTML = `
                <div style="
                    padding: 14px 16px; 
                    background: linear-gradient(135deg, rgba(138, 180, 248, 0.1) 0%, rgba(16, 163, 127, 0.1) 100%); 
                    border-radius: 8px; 
                    border: 1px solid rgba(138, 180, 248, 0.25); 
                    display: flex; 
                    align-items: center; 
                    gap: 12px;
                    font-family: 'Google Sans', Roboto, sans-serif;
                    font-size: 0.875em;
                    color: #8ab4f8;
                    backdrop-filter: blur(8px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    width: 100%;
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span style="font-weight: 500;"><strong>BotBranch:</strong> Context Restored</span>
                </div>
            `;
        }
    });

    // Also re-inject button if needed (since page navigation might constantly rebuild DOM)
    injectButton(); 
});

chatObserver.observe(document.body, { childList: true, subtree: true });

handleIncomingPrompt();
injectButton();
