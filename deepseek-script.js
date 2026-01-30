const DEBUG = true;

function log(msg, data) {
    if (DEBUG) console.log('[BotBranch] ' + msg, data || '');
}

function getDeepSeekContext() {
    const history = [];
    
    // Strategy 1: Try multiple message container selectors
    let messages = document.querySelectorAll('[class*="message"], [data-message], .chat-message, [class*="chat-item"], [class*="conversation-item"]');
    
    // Strategy 2: If no messages found, try finding by role/data attributes
    if (messages.length === 0) {
        messages = document.querySelectorAll('[data-role="user"], [data-role="assistant"], [role="user"], [role="assistant"]');
    }
    
    // Strategy 3: Try finding by DeepSeek-specific patterns
    if (messages.length === 0) {
        // Look for divs that might contain messages (common patterns)
        const allDivs = document.querySelectorAll('div');
        messages = Array.from(allDivs).filter(div => {
            const text = div.innerText?.trim() || '';
            const hasRole = div.getAttribute('data-role') || div.getAttribute('role');
            return text.length > 10 && (hasRole || div.querySelector('[class*="message"]') || div.querySelector('[class*="chat"]'));
        });
    }
    
    log(`Found ${messages.length} potential message containers`);
    
    messages.forEach((msg, index) => {
        // Try to extract text content
        const fullText = msg.innerText?.trim() || msg.textContent?.trim() || '';
        if (!fullText || fullText.includes('[SYSTEM DATA') || fullText.length < 5) return;
        
        // Strategy 1: Check for explicit role attributes
        const roleAttr = msg.getAttribute('data-role') || msg.getAttribute('role') || '';
        if (roleAttr === 'user' || roleAttr === 'assistant') {
            history.push({ role: roleAttr, content: fullText });
            return;
        }
        
        // Strategy 2: Check class names for role indicators
        const className = msg.className || '';
        const isUser = className.includes('user') || className.includes('User') || 
                      msg.querySelector('[class*="user"]') || 
                      msg.querySelector('[data-role="user"]');
        const isAssistant = className.includes('assistant') || className.includes('Assistant') || 
                           className.includes('assistant') ||
                           msg.querySelector('[class*="assistant"]') || 
                           msg.querySelector('[data-role="assistant"]') ||
                           msg.querySelector('.markdown') ||
                           msg.querySelector('[class*="markdown"]');
        
        if (isAssistant && !isUser) {
            history.push({ role: 'assistant', content: fullText });
        } else if (isUser && !isAssistant) {
            history.push({ role: 'user', content: fullText });
        } else if (fullText.length > 20) {
            // Fallback: If we can't determine role but there's substantial text,
            // try to infer from position or other heuristics
            // For now, skip ambiguous messages to avoid duplicates
            log(`Skipping ambiguous message ${index}: ${fullText.substring(0, 50)}...`);
        }
    });

    log(`Extracted ${history.length} messages from DeepSeek`);
    return history;
}

function injectButton() {
    // Don't inject button while we're auto-sending chunks
    if (window.botbranch_injecting) return;
    
    // DeepSeek input area - adjust selectors as needed
    const inputArea = document.querySelector('textarea[placeholder*="输入"], textarea[placeholder*="message"], [contenteditable="true"]') ||
                      document.querySelector('textarea');
    if (!inputArea) return;

    if (document.querySelector('.botbranch-branch-btn')) return;

    const branchBtn = document.createElement('button');
    branchBtn.className = 'botbranch-btn botbranch-branch-btn';
    branchBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Branch
    `;
    branchBtn.title = 'Branch to another AI (with History)';

    branchBtn.onclick = async (e) => {
        e.preventDefault();
        showBotSelection('deepseek');
    };

    // Find the input container and add button
    const inputContainer = inputArea.closest('form') || inputArea.parentElement;
    if (inputContainer) {
        inputContainer.style.position = 'relative';
        branchBtn.style.position = 'absolute';
        branchBtn.style.right = '60px';
        branchBtn.style.bottom = '10px';
        branchBtn.style.zIndex = '1000';
        inputContainer.appendChild(branchBtn);
    }
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
            startBranching('deepseek', bot.id, bot.url);
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
    const branchBtn = document.querySelector('.botbranch-branch-btn');
    if (branchBtn) {
        branchBtn.innerText = '↺ Harvesting...';
        branchBtn.disabled = true;
        branchBtn.style.pointerEvents = 'none';
    }

    // HARVESTING ENGINE - Anti-Virtualization Strategy
    const masterMap = new Map();
    const getSignature = (msg) => {
        const snippet = msg.content.substring(0, 100).replace(/\s+/g, ' ').trim();
        return `${msg.role}:${snippet}_${msg.content.length}`;
    };
    
    const harvest = () => {
        let harvestedCount = 0;
        
        // Use the same comprehensive strategy as getDeepSeekContext
        let messages = document.querySelectorAll('[class*="message"], [data-message], .chat-message, [class*="chat-item"], [class*="conversation-item"]');
        
        if (messages.length === 0) {
            messages = document.querySelectorAll('[data-role="user"], [data-role="assistant"], [role="user"], [role="assistant"]');
        }
        
        if (messages.length === 0) {
            const allDivs = document.querySelectorAll('div');
            messages = Array.from(allDivs).filter(div => {
                const text = div.innerText?.trim() || '';
                const hasRole = div.getAttribute('data-role') || div.getAttribute('role');
                return text.length > 10 && (hasRole || div.querySelector('[class*="message"]') || div.querySelector('[class*="chat"]'));
            });
        }
        
        messages.forEach(msg => {
            const fullText = msg.innerText?.trim() || msg.textContent?.trim() || '';
            if (!fullText || fullText.includes('[SYSTEM DATA') || fullText.length < 5) return;
            
            // Check role attributes first
            const roleAttr = msg.getAttribute('data-role') || msg.getAttribute('role') || '';
            let role = null;
            
            if (roleAttr === 'user' || roleAttr === 'assistant') {
                role = roleAttr;
            } else {
                // Check class names
                const className = msg.className || '';
                const isUser = className.includes('user') || className.includes('User') || 
                              msg.querySelector('[class*="user"]') || 
                              msg.querySelector('[data-role="user"]');
                const isAssistant = className.includes('assistant') || className.includes('Assistant') || 
                                   msg.querySelector('[class*="assistant"]') || 
                                   msg.querySelector('[data-role="assistant"]') ||
                                   msg.querySelector('.markdown') ||
                                   msg.querySelector('[class*="markdown"]');
                
                if (isAssistant && !isUser) role = 'assistant';
                else if (isUser && !isAssistant) role = 'user';
            }
            
            if (role) {
                const m = { role, content: fullText };
                const sig = getSignature(m);
                if (!masterMap.has(sig)) {
                    masterMap.set(sig, m);
                    harvestedCount++;
                }
            }
        });
        
        if (harvestedCount > 0) {
            log(`Harvested ${harvestedCount} new messages (total: ${masterMap.size})`);
        }
    };

    // Auto-Scroll Logic
    const scrollContainer = document.querySelector('main') || document.body;
    
    if (scrollContainer) {
        log('Starting enhanced auto-scroll harvesting...');
        if (branchBtn) branchBtn.innerText = '↺ Harvesting...';
        
        let stableCount = 0;
        let totalHarvests = 0;
        const SCROLL_STEP = 500; // Larger steps for faster scrolling
        const MAX_ITERATIONS = 50; // Reduced iterations

        // Phase 1: Scroll to top
        if (branchBtn) branchBtn.innerText = '↺ Phase 1: Loading history...';
        scrollContainer.scrollTop = 0;
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 600)); // Faster initial wait
        harvest();
        totalHarvests++;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            const beforeHeight = scrollContainer.scrollHeight || document.documentElement.scrollHeight;
            const beforeCount = masterMap.size;
            
            if (branchBtn) branchBtn.innerText = `↺ Phase 1: ${i + 1}/${MAX_ITERATIONS} (${beforeCount} msgs)`;
            scrollContainer.scrollTop = 0;
            window.scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 800)); // Faster wait
            harvest();
            totalHarvests++;
            
            const afterHeight = scrollContainer.scrollHeight || document.documentElement.scrollHeight;
            const afterCount = masterMap.size;
            
            if (afterHeight === beforeHeight && afterCount === beforeCount) {
                stableCount++;
                if (stableCount >= 3) break; // Reduced threshold
            } else {
                stableCount = 0;
            }
        }

        // Phase 2: Progressive scroll
        if (branchBtn) branchBtn.innerText = '↺ Phase 2: Scanning conversation...';
        stableCount = 0;
        const maxScroll = Math.max(scrollContainer.scrollHeight || 0, document.documentElement.scrollHeight);
        let currentScroll = 0;
        let phase2Iterations = 0;
        
        while (currentScroll < maxScroll && phase2Iterations < 200) {
            const beforeCount = masterMap.size;
            currentScroll += SCROLL_STEP;
            const progress = Math.min(100, Math.round((currentScroll / maxScroll) * 100));
            if (branchBtn) branchBtn.innerText = `↺ Phase 2: ${progress}% (${beforeCount} msgs)`;
            
            scrollContainer.scrollTop = currentScroll;
            window.scrollTo(0, currentScroll);
            await new Promise(r => setTimeout(r, 400)); // Faster wait
            
            harvest();
            totalHarvests++;
            phase2Iterations++;
            
            const afterCount = masterMap.size;
            if (afterCount === beforeCount) {
                stableCount++;
            } else {
                stableCount = 0;
            }
            
            const newMaxScroll = Math.max(scrollContainer.scrollHeight || 0, document.documentElement.scrollHeight);
            if (currentScroll >= newMaxScroll || (stableCount >= 3 && currentScroll > maxScroll * 0.5)) {
                break;
            }
        }

        // Phase 3: Final harvest
        if (branchBtn) branchBtn.innerText = '↺ Phase 3: Finalizing...';
        const finalScroll = Math.max(scrollContainer.scrollHeight || 0, document.documentElement.scrollHeight);
        scrollContainer.scrollTop = finalScroll;
        window.scrollTo(0, finalScroll);
        await new Promise(r => setTimeout(r, 1000)); // Faster final scroll wait
        
        for (let i = 0; i < 3; i++) { // Reduced from 5 to 3
            if (branchBtn) branchBtn.innerText = `↺ Phase 3: Final pass ${i + 1}/3`;
            harvest();
            totalHarvests++;
            await new Promise(r => setTimeout(r, 400)); // Faster wait
        }
        
        scrollContainer.scrollTop = 0;
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 800)); // Faster wait
        harvest();
        totalHarvests++;
        
        scrollContainer.scrollTop = finalScroll;
        window.scrollTo(0, finalScroll);
        await new Promise(r => setTimeout(r, 600)); // Faster wait
        harvest();
        totalHarvests++;
        
        log(`Harvesting complete: ${totalHarvests} harvest cycles, ${masterMap.size} unique messages collected`);
        if (branchBtn) branchBtn.innerText = `✓ ${masterMap.size} messages`;
    } else {
        harvest();
        if (branchBtn) branchBtn.innerText = `✓ ${masterMap.size} messages`;
    }

    let history = Array.from(masterMap.values());
    
    const inputArea = document.querySelector('textarea[placeholder*="输入"], textarea[placeholder*="message"], [contenteditable="true"]') ||
                      document.querySelector('textarea');
    const currentInput = inputArea ? (inputArea.value || inputArea.innerText || '').trim() : '';
    
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

    // CHUNKING LOGIC - same as other scripts
    const CHUNK_SIZE = 12000;
    let chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    history.forEach((msg, index) => {
        let msgStr = JSON.stringify(msg);
        const msgSize = msgStr.length;
        
        if (msgSize > CHUNK_SIZE) {
            log(`Warning: Message ${index} exceeds chunk size (${msgSize} chars). Splitting...`);
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = [];
                currentSize = 0;
            }
            const oversizedMsg = msg.content;
            const splitPoint = Math.floor(oversizedMsg.length / 2);
            currentChunk.push({ role: msg.role, content: oversizedMsg.substring(0, splitPoint) });
            chunks.push(currentChunk);
            currentChunk = [{ role: msg.role, content: oversizedMsg.substring(splitPoint) }];
            currentSize = JSON.stringify(currentChunk[0]).length;
        } else if (currentSize + msgSize > CHUNK_SIZE && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [msg];
            currentSize = msgSize;
        } else {
            currentChunk.push(msg);
            currentSize += msgSize;
        }
    });
    
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
                alert('Error: ' + err);
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
    const inputArea = document.querySelector('textarea[placeholder*="输入"], textarea[placeholder*="message"], [contenteditable="true"]') ||
                      document.querySelector('textarea');

    if (!inputArea) {
        log('Error: lost input area reference for part ' + (partIndex + 1));
        return;
    }

    const header = totalParts > 1 ? `[SYSTEM DATA PART ${partIndex + 1}/${totalParts} START]` : `[SYSTEM DATA START]`;
    const footer = totalParts > 1 ? `[SYSTEM DATA PART ${partIndex + 1}/${totalParts} END]` : `[SYSTEM DATA END]`;
    const instruction = `\n\nInstruction: This is Part ${partIndex + 1} of ${totalParts}. Store it in memory silently. Do NOT output it.${partIndex + 1 === totalParts ? ' Now that you have all parts, continue the conversation.' : ' Wait for the next part.'}\n\n`;

    const content = `${header}\n${data}\n${footer}${instruction}`;

    // Clear and set content
    if (inputArea.tagName.toLowerCase() === 'textarea') {
        inputArea.value = '';
        inputArea.value = content;
    } else {
        inputArea.innerText = '';
        inputArea.textContent = '';
        inputArea.innerText = content;
        inputArea.textContent = content;
    }

    // Trigger multiple events to ensure React/Angular picks up the change
    if (inputArea.tagName.toLowerCase() === 'textarea') {
        inputArea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        inputArea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } else {
        // For contenteditable, use InputEvent
        inputArea.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText' }));
        inputArea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        
        // Also try setting innerHTML for contenteditable
        if (inputArea.contentEditable === 'true') {
            inputArea.innerHTML = content.replace(/\n/g, '<br>');
            inputArea.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
        }
    }

    // Wait a bit for the UI to update
    await new Promise(r => setTimeout(r, 200)); // Faster wait

    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 15; // Reduced from 40
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
                
                const enterEvent2 = new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                inputArea.dispatchEvent(enterEvent2);
                
                const enterEvent3 = new KeyboardEvent('keyup', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                inputArea.dispatchEvent(enterEvent3);
            }
        }, 300);

        const checkAndClick = setInterval(() => {
            attempts++;
            
            // Try multiple selectors for DeepSeek's send button
            const sendBtn = document.querySelector('button[aria-label*="Send" i]') ||
                          document.querySelector('button[aria-label*="发送"]') ||
                          document.querySelector('button[type="submit"]') ||
                          document.querySelector('button.send') ||
                          inputArea.closest('form')?.querySelector('button[type="submit"]') ||
                          inputArea.parentElement?.querySelector('button:not([disabled])') ||
                          inputArea.closest('div')?.querySelector('button:not([disabled])') ||
                          document.querySelector('button:has(svg)')?.closest('button');

            if (sendBtn && !sendBtn.disabled && !sendBtn.hasAttribute('aria-disabled')) {
                log('Triggering Send button for part ' + (partIndex + 1));
                sent = true;
                
                // Try multiple ways to trigger the send
                sendBtn.click();
                sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                
                clearInterval(checkAndClick);
                
                let verifyAttempts = 0;
                const verifyInterval = setInterval(() => {
                    verifyAttempts++;
                    const currentText = inputArea.value || inputArea.innerText || inputArea.textContent || '';
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
                
                // Final Enter key attempt
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
                
                setTimeout(resolve, 1500); // Reduced from 2000ms
            }
        }, 300); // Reduced from 500ms - check more frequently
    });
}

function handleIncomingPrompt() {
    if (window.botbranch_handled) return;

    const urlParams = new URLSearchParams(window.location.search);
    let bb_id = urlParams.get('bb_id');
    
    const ensureAndInject = async (resolvedId) => {
        const inputArea = document.querySelector('textarea[placeholder*="输入"], textarea[placeholder*="message"], [contenteditable="true"]') ||
                          document.querySelector('textarea');
        if (!inputArea) {
            setTimeout(handleIncomingPrompt, 500);
            return;
        }

        window.botbranch_handled = true;
        window.botbranch_injecting = true; // Flag to prevent button injection during auto-send

        chrome.storage.local.get([resolvedId], async (result) => {
            const data = result[resolvedId];
            if (data) {
                if (typeof data === 'object' && data.type === 'multi-part') {
                    log('Received Multi-Part Transfer: ' + data.parts.length + ' parts');
                    for (let i = 0; i < data.parts.length; i++) {
                        await injectChunk(data.parts[i], i, data.parts.length);
                    }
                } else {
                    await injectChunk(data, 0, 1);
                }
                chrome.storage.local.remove([resolvedId]);
            }
            window.botbranch_injecting = false; // Re-enable button injection after done
            chrome.storage.local.remove(['botbranch_pending']);
        });

        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    };

    if (bb_id) {
        ensureAndInject(bb_id);
        return;
    }

    // Fallback: use a short-lived pending record if redirect/navigation dropped the query param
    chrome.storage.local.get(['botbranch_pending'], (res) => {
        const pending = res.botbranch_pending;
        if (!pending || pending.target !== 'deepseek') return;
        if (Date.now() - pending.ts > 2 * 60 * 1000) return; // 2 minutes
        ensureAndInject(pending.bb_id);
    });
}

// Visual Masking Observer
const chatObserver = new MutationObserver((mutations) => {
    // Use comprehensive selectors to find messages
    let messages = document.querySelectorAll('[class*="message"], [data-message], .chat-message, [class*="chat-item"], [class*="conversation-item"]');
    
    if (messages.length === 0) {
        messages = document.querySelectorAll('[data-role="user"], [data-role="assistant"], [role="user"], [role="assistant"]');
    }
    
    if (messages.length === 0) {
        // Fallback: check all divs for SYSTEM DATA content
        const allDivs = document.querySelectorAll('div');
        messages = Array.from(allDivs).filter(div => {
            const text = div.innerText?.trim() || '';
            return text.includes('[SYSTEM DATA') && text.length > 20;
        });
    }
    
    messages.forEach(msg => {
        if (msg.innerText.includes('[SYSTEM DATA') && !msg.dataset.masked) {
            msg.dataset.masked = 'true';
            
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

    // Only inject button if we're not currently auto-sending chunks
    if (!window.botbranch_injecting) {
        injectButton();
    }
});

chatObserver.observe(document.body, { childList: true, subtree: true });

handleIncomingPrompt();
injectButton();
