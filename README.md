# Video Segmenter

A local-first, high-performance video splitting application built with Vue 3 and FFmpeg.wasm. Split large video files into sequential segments entirely in your browser - no uploads, no servers, 100% privacy.

![Video Segmenter Demo](https://img.shields.io/badge/Vue-3.4-4FC08D?style=flat&logo=vue.js)
![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg-WASM-007808?style=flat&logo=ffmpeg)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

## Features

- **100% Local Processing** - All video processing happens in your browser. Your files never leave your device.
- **Lossless Splitting** - Uses `-c copy` (stream copying) to preserve original video quality with zero degradation.
- **Lightning Fast** - No re-encoding means splitting completes in seconds, not minutes.
- **Large File Support** - Handle video files up to 2GB using WebAssembly virtual filesystem.
- **Multithreaded** - Leverages SharedArrayBuffer for near-native performance.
- **Drag & Drop** - Simple, intuitive file upload interface.
- **One-Click Download** - Bundle all segments into a ZIP file for easy downloading.
- **Real-time Progress** - Visual progress tracking with segment-by-segment updates.
- **Sequential Naming** - Segments are automatically named (`part_001.mp4`, `part_002.mp4`, etc.).

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Vue 3 + Vite | Reactive UI with fast HMR |
| State | Pinia | Centralized state management |
| Core Engine | @ffmpeg/ffmpeg | WASM-based video manipulation |
| Concurrency | Web Workers | Offload processing from UI thread |
| Archiving | client-zip | Streaming ZIP generation |
| Styling | Tailwind CSS | Rapid UI development |

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/rpatil6158/video-segmenter.git

# Navigate to project directory
cd video-segmenter

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Upload Video** - Drag and drop a video file or click to browse (supports MP4, WebM, MKV, AVI, MOV, and more)

2. **Set Duration** - Choose segment duration using presets (30s, 45s, 60s, 90s, 2m, 5m) or enter a custom value

3. **Start Splitting** - Click "Start Splitting" and watch the real-time progress

4. **Download** - Download individual segments or click "Download All (ZIP)" to get everything in one file

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Video File    │────▶│  FFmpeg.wasm     │────▶│   Segments      │
│   (up to 2GB)   │     │  (Stream Copy)   │     │  (Lossless)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  -c copy flag    │
                        │  No re-encoding  │
                        │  100% quality    │
                        └──────────────────┘
```

### Why Stream Copy?

Traditional video splitting re-encodes the video, which:
- Takes significant CPU time
- May reduce quality
- Generates heat and drains battery

**Stream copy** (`-c copy`) directly copies the video/audio streams without re-encoding:
- Completes in seconds
- Zero quality loss
- Minimal CPU usage

## Cross-Origin Isolation

This app requires Cross-Origin Isolation for SharedArrayBuffer support. The Vite config includes the necessary headers:

```javascript
// vite.config.js
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  }
}
```

For production deployment, ensure your server sends these headers.

## Supported Formats

| Format | Extension |
|--------|-----------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| Matroska | `.mkv` |
| AVI | `.avi` |
| QuickTime | `.mov` |
| M4V | `.m4v` |
| FLV | `.flv` |
| WMV | `.wmv` |
| MPEG-TS | `.ts`, `.mts` |

## Project Structure

```
video-segmenter/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.js
    ├── App.vue
    ├── style.css
    ├── components/
    │   ├── FileDropZone.vue
    │   ├── VideoInfo.vue
    │   ├── DurationSelector.vue
    │   ├── ProgressBar.vue
    │   └── SegmentList.vue
    ├── services/
    │   ├── ffmpeg.js
    │   └── zipper.js
    └── stores/
        └── segmenter.js
```

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 92+ | ✅ Full |
| Edge 92+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15.2+ | ✅ Full |
| Opera 78+ | ✅ Full |

> **Note:** Requires browsers with SharedArrayBuffer support and Cross-Origin Isolation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - FFmpeg for the browser
- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [client-zip](https://github.com/Touffy/client-zip) - Client-side ZIP generation

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/rpatil6158">Rohit Patil</a>
</p>
