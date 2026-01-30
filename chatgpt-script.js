const DEBUG = true;

function log(msg, data) {
    if (DEBUG) console.log('[BotBranch] ' + msg, data || '');
}

function getChatGPTContext() {
    const history = [];
    
    // Strategy 1: Articles (Standard)
    let turns = document.querySelectorAll('article');
    
    // Strategy 2: TestID (Robust)
    if (turns.length === 0) {
        turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
    }

    log(`Found ${turns.length} turns`);

    if (turns.length > 0) {
        turns.forEach((turn, index) => {
            // Assistant Detection
            const assistantSelector = '.markdown, .prose, [data-message-author-role="assistant"]';
            const assistantElement = turn.querySelector(assistantSelector);
            
            // User Detection
            const userSelector = '[data-message-author-role="user"], [data-testid*="user-message"], .whitespace-pre-wrap';
            const userElement = turn.querySelector(userSelector);

            if (assistantElement) {
                const text = assistantElement.innerText.trim();
                if (text) history.push({ role: 'assistant', content: text });
            } else if (userElement) {
                // If it's a user message, sometimes it is wrapped separately
                const text = userElement.innerText.trim();
                if (text) history.push({ role: 'user', content: text });
            } else {
                // Heuristic Fallback: Try to guess based on class names or structure? 
                // In some layouts, the container IS the message.
                // But safer to skip if unknown.
                log(`Turn ${index} skipped: No user or assistant content found.`, turn);
            }
        });
    }

    // Strategy 3: Single giant text dump (Fallback if separate messages fail)
    if (history.length === 0) {
        log('Strategy 3: Fallback text dump');
        const main = document.querySelector('main');
        if (main) {
             const allText = main.innerText;
             // Limit this to avoid sending garbage
             if (allText.length < 50000) {
                 history.push({ role: 'system', content: 'History extraction failed. Full page context: ' + allText.substring(0, 10000) });
             }
        }
    }

    return history;
}

function injectButton() {
    const inputArea = document.querySelector('#prompt-textarea');
    if (!inputArea) return;

    if (document.querySelector('.botbranch-to-gemini')) return;

    const buttonContainer = document.querySelector('.flex.items-center.gap-2.trailing') || 
                           document.querySelector('form.group\\/composer div.flex.items-center.gap-2') ||
                           inputArea.parentElement; // Fallback container
    
    if (!buttonContainer) return;

    const branchBtn = document.createElement('button');
    branchBtn.className = 'botbranch-btn botbranch-to-gemini';
    branchBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Branch
    `;
    branchBtn.title = 'Branch to Gemini (with History)';
    branchBtn.style.marginRight = '8px'; // Ensure spacing

    branchBtn.onclick = async (e) => {
        e.preventDefault();
        showBotSelection('chatgpt');
    };

    buttonContainer.prepend(branchBtn);
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
            startBranching('chatgpt', bot.id, bot.url);
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
    const branchBtn = document.querySelector('.botbranch-to-gemini') || document.querySelector('.botbranch-btn');
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
            const turns = document.querySelectorAll('article, [data-testid^="conversation-turn-"]');
            let harvestedCount = 0;
            
            turns.forEach(turn => {
                const assistant = turn.querySelector('.markdown, .prose, [data-message-author-role="assistant"]');
                const user = turn.querySelector('[data-message-author-role="user"], [data-testid*="user-message"], .whitespace-pre-wrap');

                if (assistant) {
                    const text = assistant.innerText.trim();
                    if (text && !text.includes('[SYSTEM DATA')) {
                        const m = { role: 'assistant', content: text };
                        const sig = getSignature(m);
                        if (!masterMap.has(sig)) {
                            masterMap.set(sig, m);
                            harvestedCount++;
                        }
                    }
                } else if (user) {
                    const text = user.innerText.trim();
                    if (text && !text.includes('[SYSTEM DATA')) {
                        const m = { role: 'user', content: text };
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

        // Auto-Scroll Logic for ChatGPT - Enhanced Scrape-While-Scrolling Algorithm
        const scrollContainer = document.querySelector('div[class*="react-scroll-to-bottom"] > div > div') || 
                               document.querySelector('main .overflow-y-auto') || 
                               document.querySelector('main');
        
        // Helper function to scroll both container and window for visibility
        const scrollBoth = (position, smooth = false) => {
            if (scrollContainer) {
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
            log('Starting enhanced auto-scroll harvesting (Scrape-While-Scrolling)...');
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
                const beforeHeight = scrollContainer.scrollHeight;
                const beforeCount = masterMap.size;
                
                branchBtn.innerText = `↺ Phase 1: ${i + 1}/${MAX_ITERATIONS} (${beforeCount} msgs)`;
                scrollBoth(0);
                await new Promise(r => setTimeout(r, 800)); // Faster wait for virtualization
                harvest();
                totalHarvests++;
                
                const afterHeight = scrollContainer.scrollHeight;
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
            const maxScroll = Math.max(scrollContainer.scrollHeight, document.documentElement.scrollHeight);
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
                const newMaxScroll = Math.max(scrollContainer.scrollHeight, document.documentElement.scrollHeight);
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
            const finalScroll = Math.max(scrollContainer.scrollHeight, document.documentElement.scrollHeight);
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

        // 1. Get History (Now from masterMap) - Sort by DOM position for chronological order
        let history = Array.from(masterMap.values());
        
        // Re-harvest one final time to get DOM order for sorting
        const messageOrder = new Map();
        const turns = document.querySelectorAll('article, [data-testid^="conversation-turn-"]');
        turns.forEach((turn, index) => {
            const assistant = turn.querySelector('.markdown, .prose, [data-message-author-role="assistant"]');
            const user = turn.querySelector('[data-message-author-role="user"], [data-testid*="user-message"], .whitespace-pre-wrap');
            
            let text = '';
            let role = '';
            if (assistant) {
                text = assistant.innerText.trim();
                role = 'assistant';
            } else if (user) {
                text = user.innerText.trim();
                role = 'user';
            }
            
            if (text && !text.includes('[SYSTEM DATA')) {
                const sig = getSignature({ role, content: text });
                if (masterMap.has(sig) && !messageOrder.has(sig)) {
                    messageOrder.set(sig, index);
                }
            }
        });
        
        // Sort history by DOM position to maintain chronological order
        history.sort((a, b) => {
            const sigA = getSignature(a);
            const sigB = getSignature(b);
            const orderA = messageOrder.get(sigA) ?? 999999;
            const orderB = messageOrder.get(sigB) ?? 999999;
            return orderA - orderB;
        });
        
        const inputArea = document.querySelector('#prompt-textarea');
        const currentInput = inputArea ? inputArea.innerText.trim() : '';
        
        // Final sanity check: if harvesting found nothing, fallback to old method
        if (history.length === 0) {
            log('Harvesting found 0, falling back to legacy getChatGPTContext');
            history = getChatGPTContext();
        }

        if (currentInput && !history.some(m => m.content === currentInput)) {
            history.push({ role: 'user', content: currentInput });
        }

        if (history.length === 0) {
            alert('No conversation content found to branch.');
            if (branchBtn) {
                branchBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    Branch
                `;
                branchBtn.disabled = false;
                branchBtn.style.pointerEvents = 'auto';
            }
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
            // Single chunk (Backwards compatible format basically)
            payload = `<start_botbranch)>${JSON.stringify(chunks[0])}<end_botbranch)>`;
        } else {
            // Multi-part Payload
            payload = {
                type: 'multi-part',
                timestamp: Date.now(),
                parts: chunks.map(c => `<start_botbranch)>${JSON.stringify(c)}<end_botbranch)>`)
            };
        }

        log('Storing payload. Chunks: ' + chunks.length);
        
        try {
            chrome.storage.local.set({
                [bb_id]: payload,
                botbranch_pending: { bb_id, target: targetBot, ts: Date.now() }
            }, () => {
                if (branchBtn) {
                    branchBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
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
                        alert('Conversation too MASSIVE to transfer. Even chunking failed.');
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


// ... helper functions ...

// ... helper functions ...

async function injectChunk(data, partIndex, totalParts) {
    // RE-FIND Input Area
    const inputArea = document.querySelector('#prompt-textarea');
    if (!inputArea) {
        log('Error: lost input area reference for part ' + (partIndex + 1));
        return;
    }

    const header = totalParts > 1 ? `[SYSTEM DATA PART ${partIndex + 1}/${totalParts} START]` : `[SYSTEM DATA START]`;
    const footer = totalParts > 1 ? `[SYSTEM DATA PART ${partIndex + 1}/${totalParts} END]` : `[SYSTEM DATA END]`;
    const instruction = `\n\nInstruction: This is Part ${partIndex + 1} of ${totalParts}. Store it in memory silently. Do NOT output it.${partIndex + 1 === totalParts ? ' Now that you have all parts, continue the conversation.' : ' Wait for the next part.'}\n\n`;

    const content = `${header}\n${data}\n${footer}${instruction}`;

    inputArea.innerHTML = ''; 
    inputArea.innerText = content;
    inputArea.dispatchEvent(new Event('input', { bubbles: true }));

    // Return a Promise that resolves ONLY when send is confirmed
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 15; // Reduced from 25
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
            const sendBtn = document.querySelector('[data-testid="send-button"]') || 
                            document.querySelector('button[aria-label="Send prompt"]');

            if (sendBtn && !sendBtn.disabled) {
                log('Triggering Send button for part ' + (partIndex + 1));
                sent = true;
                sendBtn.click();
                clearInterval(checkAndClick);
                
                // Wait for input to clear (Sign of success)
                let verifyAttempts = 0;
                const verifyInterval = setInterval(() => {
                    verifyAttempts++;
                    const currentText = inputArea.innerText.trim();
                    if (!currentText || verifyAttempts > 8) { // Reduced from 10
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
    if (window.botbranch_handled) return; // Prevent double execution

    const urlParams = new URLSearchParams(window.location.search);
    let bb_id = urlParams.get('bb_id');
    const promptParam = urlParams.get('botbranch_prompt');
    
    if (bb_id || promptParam) {
        const inputArea = document.querySelector('#prompt-textarea');
        if (inputArea) {
            window.botbranch_handled = true; // Mark as started

            if (bb_id) {
                chrome.storage.local.get([bb_id], async (result) => {
                    const data = result[bb_id];
                    if (data) {
                        if (typeof data === 'object' && data.type === 'multi-part') {
                            log('Received Multi-Part Transfer: ' + data.parts.length + ' parts');
                            for (let i = 0; i < data.parts.length; i++) {
                                await injectChunk(data.parts[i], i, data.parts.length);
                            }
                        } else {
                            // Legacy Single Part
                            await injectChunk(data, 0, 1);
                        }
                        chrome.storage.local.remove([bb_id]);
                        chrome.storage.local.remove(['botbranch_pending']);
                    }
                });
            } else if (promptParam) {
                inputArea.innerText = decodeURIComponent(promptParam);
                inputArea.dispatchEvent(new Event('input', { bubbles: true }));
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
            if (!pending || pending.target !== 'chatgpt') return;
            if (Date.now() - pending.ts > 2 * 60 * 1000) return;
            const newUrl = window.location.origin + window.location.pathname + `?bb_id=${encodeURIComponent(pending.bb_id)}`;
            window.history.replaceState({}, document.title, newUrl);
            setTimeout(handleIncomingPrompt, 0);
        });
    }
}

// Visual Masking Observer
const chatObserver = new MutationObserver((mutations) => {
    // Look for user message containers
    const messages = document.querySelectorAll('[data-message-author-role="user"], div[data-testid*="user-message"]');
    
    messages.forEach(msg => {
        if (msg.innerText.includes('[SYSTEM DATA') && !msg.dataset.masked) {
            msg.dataset.masked = 'true';
            
            // Masking Logic - Clean Professional UI Block
            msg.style.opacity = '0.85';
            msg.innerHTML = `
                <div style="
                    padding: 14px 16px; 
                    background: linear-gradient(135deg, rgba(138, 180, 248, 0.08) 0%, rgba(16, 163, 127, 0.08) 100%); 
                    border-radius: 8px; 
                    border: 1px solid rgba(138, 180, 248, 0.2); 
                    display: flex; 
                    align-items: center; 
                    gap: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 0.875em;
                    color: #8ab4f8;
                    backdrop-filter: blur(8px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span style="font-weight: 500;"><strong>BotBranch:</strong> Context Restored</span>
                </div>
            `;
        }
    });

    // Re-inject button if navigation happened
    injectButton();
});

chatObserver.observe(document.body, { childList: true, subtree: true });

handleIncomingPrompt();
injectButton();
