# 🌉 Base64 Bridge

A modern, privacy-first web application for transferring files through plain text. No network overhead, no cloud storage—just pure Base64 encoding with SHA-256 integrity verification.

### 🌐 [Live Demo](https://ibrezm1.github.io/base64-bridge/)

![B64 Bridge Banner](https://raw.githubusercontent.com/placeholder-path/b64-bridge/main/docs/banner.png)

## 🚀 Key Features

- **Multi-File Encoding**: Pack multiple files into a single text payload effortlessly.
- **SHA-256 Integrity**: Every file is checksum-verified upon decoding to ensure zero corruption.
- **One-Click ZIP Restore**: Download all decoded files at once as a compressed `.zip` archive.
- **Air-Gapped Ready**: Perfect for transferring files to/from locked-down environments via copy-paste.
- **Privacy First**: 100% Client-side. Your files never leave your browser. No analytics, no server uploads.
- **Modern UI**: Dark-mode aesthetic with a responsive, grid-based layout and smooth animations.

## 🛠 How It Works

1.  **Encode**: Drag and drop your files. The app reads them as binary, calculates a SHA-256 hash, and wraps them in a `B64PACK` JSON structure.
2.  **Transfer**: Copy the resulting text payload (or save it as a `.txt` file).
3.  **Decode**: Paste the payload on the target machine. The app verifies the checksums and restores your original files for download.

## 💻 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom properties, Flexbox/Grid)
- **Logic**: ES6+ JavaScript
- **Security**: Web Crypto API (SubtleCrypto) for high-performance SHA-256 hashing
- **Typography**: [Syne](https://fonts.google.com/specimen/Syne) and [DM Mono](https://fonts.google.com/specimen/DM+Mono) via Google Fonts

## 📖 Usage

Since this is a static web application, you can run it anywhere:

1.  **Local Development**:
    ```bash
    # Simple Python server
    python3 -m http.server 8000
    ```
2.  **Deployment**: Just host `index.html`, `style.css`, and `app.js` on any static provider (GitHub Pages, Vercel, Netlify).

## 🔒 Security & Privacy

- **No Server Involved**: There is no backend. The "Bridge" happens entirely in your local browser memory.
- **Checksum Verification**: Prevents "bit rot" or accidental truncation during copy-pasting.

---

*Made with ⚡ for high-speed file bridging.*
