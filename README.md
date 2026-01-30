<div align="center">
    <img src="https://github.com/SBP359/SBP359/blob/d838082b466801261eb50bb453deaf27b7b4f9cc/assets/botbranch/botbranch.gif" alt="Logo" width="450" height="300">
</div>

> **Seamlessly transfer conversations between ChatGPT, Gemini, and DeepSeek with full context preservation**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/SBP359)

**BotBranch** is a powerful Chrome extension that bridges the gap between the world's leading AI platforms. Never lose context again when switching between ChatGPT, Gemini, and DeepSeek. Transfer entire conversation histories with a single click, complete with anti-virtualization technology and intelligent chunking for massive conversations.

---

## ✨ Features

### 🔄 **Seamless Conversation Transfer**
- Transfer entire chat histories between ChatGPT, Gemini, and DeepSeek
- One-click branching to any supported AI platform
- Preserves full conversation context

### 🛡️ **Anti-Virtualization Technology**
- **Scrape-While-Scrolling Algorithm**: Automatically scrolls and harvests messages as they appear
- **Unique Fingerprinting**: Uses advanced hashing (role + content snippet + length) to eliminate duplicates
- **Comprehensive Harvesting**: Captures all messages, even those hidden by DOM virtualization

### 📦 **Massive History Support**
- **Multipart Chunking**: Automatically splits large conversations into manageable chunks
- **Sequential Injection**: Methodically injects chunks one at a time with UI confirmation
- **Smart Limits**: Respects platform character limits (~12,000 characters per chunk)

### 🎭 **Stealth Context Masking**
- **Clean UI**: Transferred history is wrapped in `[SYSTEM DATA]` delimiters
- **Visual Masking**: MutationObserver instantly replaces system data with a clean "BotBranch: Context Restored" UI block
- **Zero Clutter**: You see a professional interface, the AI sees the full context

### ⚡ **Performance Optimized**
- Fast harvesting with visible scrolling feedback
- Real-time progress updates during transfer
- Optimized chunk injection with smart send detection

---

## 🚀 Installation

### From Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/SBP359/botbranch.git
   cd botbranch
   ```

2. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `botbranch` directory

3. **Verify installation**
   - You should see the BotBranch icon in your Chrome toolbar
   - Visit any supported AI platform to see the Branch button

### From Chrome Web Store
*Coming soon!*

---

## 📖 Usage

### Basic Branching

1. **Start a conversation** on any supported platform (ChatGPT, Gemini, or DeepSeek)

2. **Click the Branch button**
   - On **ChatGPT**: Button appears in the input area
   - On **Gemini**: Floating Action Button (FAB) in bottom-right
   - On **DeepSeek**: Floating button in bottom-right

3. **Select destination AI**
   - A modal appears with available AI platforms
   - Click on your desired destination

4. **Automatic transfer**
   - BotBranch harvests all messages (with visible scrolling)
   - Chunks large conversations automatically
   - Injects context into the new platform
   - Sends messages sequentially with progress updates

### Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| 🤖 ChatGPT | ✅ Supported | Full support with native button integration |
| 🌟 Gemini | ✅ Supported | FAB-style button, optimized for infinite scroll |
| 🔍 DeepSeek | ✅ Supported | Comprehensive message extraction |

---

## 🏗️ Architecture

### Core Components

```
botbranch/
├── manifest.json           # Extension configuration
├── popup.html              # Extension popup UI
├── popup.js                # Popup logic
├── background.js           # Service worker
├── styles.css              # Shared styles
├── chatgpt-script.js       # ChatGPT content script
├── gemini-script.js        # Gemini content script
├── deepseek-script.js      # DeepSeek content script
└── icons/                  # Extension icons
```

### Key Technologies

- **Chrome Extension Manifest V3**: Modern extension architecture
- **Content Scripts**: Platform-specific message extraction
- **Chrome Storage API**: Secure data persistence
- **MutationObserver**: Real-time DOM monitoring for context masking
- **Anti-Virtualization**: Scrape-while-scrolling algorithm

---

## 🔧 Technical Details

### Harvesting Strategy

BotBranch uses a **4-phase aggressive scrolling strategy**:

1. **Phase 1: Top Scroll** - Scrolls to top and harvests initial messages
2. **Phase 2: Progressive Scroll** - Incrementally scrolls through conversation
3. **Phase 3: Bottom Harvest** - Final scroll to bottom to capture remaining messages
4. **Phase 4: Final Pass** - Verification pass to ensure completeness

### Message Fingerprinting

Each message is fingerprinted using:
```
signature = role + content_snippet(100 chars) + content_length
```

This ensures no duplicates, even if the same message appears multiple times during scrolling.

### Chunking Algorithm

- **Safe Limit**: 12,000 characters per chunk
- **Smart Splitting**: Splits at message boundaries (never mid-message)
- **Sequential Injection**: Waits for UI confirmation before next chunk

### State Management

- Uses `chrome.storage.local` for secure data transfer
- Short-lived pending records for redirect-safe handoff
- Automatic cleanup after successful transfer

---

## 🎨 UI/UX Features

- **Glassmorphism Design**: Modern, semi-transparent UI elements
- **Platform-Specific Colors**: Each AI platform has its own color scheme
- **Real-Time Progress**: Live updates during harvesting and injection
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Responsive Design**: Works across different screen sizes

---

## 🐛 Troubleshooting

### Branch button not appearing?
- **Refresh the page** after installing/updating the extension
- Check that you're on a supported platform (chatgpt.com, gemini.google.com, chat.deepseek.com)
- Verify the extension is enabled in `chrome://extensions/`

### Messages not transferring?
- Ensure you have messages in the conversation
- Check browser console (F12) for `[BotBranch]` error messages
- Try refreshing both source and destination pages

### Chunk injection fails?
- Check your internet connection
- Verify the destination AI platform is accessible
- Look for error messages in the browser console

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**SBP359**

- 🌐 Website: [sbp359.github.io](https://sbp359.github.io)
- 💼 LinkedIn: [in/sbp359](https://www.linkedin.com/in/sbp359)
- 🐙 GitHub: [@SBP359](https://github.com/SBP359)
- 📺 YouTube: [@SBP359](https://youtube.com/@SBP359)

---

## 🙏 Acknowledgments

- Built with ❤️ for the AI community
- Inspired by the need for seamless AI platform interoperability
- Thanks to all contributors and users!

---

## 📊 Project Status

- ✅ ChatGPT integration
- ✅ Gemini integration  
- ✅ DeepSeek integration
- ✅ Anti-virtualization harvesting
- ✅ Multipart chunking
- ✅ Stealth context masking
- ✅ Performance optimizations
- 🔄 Chrome Web Store submission (coming soon)

---

<div align="center">

**Made with ❤️ by [SBP359](https://github.com/SBP359)**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/SBP359/botbranch/issues) · [Request Feature](https://github.com/SBP359/botbranch/issues)

</div>
