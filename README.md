# Voice Gesture Instrument

**Your voice, controlled by gesture.** A browser-based, real-time vocal effects instrument that uses hand gestures to control reverb and harmony effects.

- 🎤 Works entirely in your browser using Web Audio API
- 🖐️ Hand tracking powered by MediaPipe
- 🎨 Cyberpunk-style HUD with neon visuals
- ⚡ Real-time processing with zero latency
- 🔒 Your voice never leaves your machine

## Features

- **Webcam Hand Tracking**: One-hand gesture control with 21-point landmarks
- **Pinch to Reverb**: Bring thumb and index finger together to increase reverb amount
- **Hand Height to Harmony**: Raise your hand higher to blend in harmony/effects
- **Live Cyberpunk HUD**: Neon skeleton visualization, motion trails, meters, and status indicators
- **Web Audio Effects**: Reverb convolver, chorus, stereo delay, and harmonic blending
- **Fully Responsive**: Works on desktop, tablet, and mobile (when permitted)

## Tech Stack

- **React 18** + **Vite** (blazingly fast bundler)
- **TypeScript** for type safety
- **MediaPipe Hand Landmarker** for gesture detection
- **Web Audio API** for real-time audio processing
- **Canvas** for HUD visualization

## Setup

### Prerequisites

- Node.js 16+ and npm
- Modern browser (Chrome, Firefox, Edge) with:
  - Webcam support
  - Microphone support
  - Web Audio API support

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/voice-gesture-instrument-web.git
cd voice-gesture-instrument-web
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

## Development

### Project Structure

```
src/
├── main.tsx                 # React entry point
├── App.tsx                  # Main app component
├── components/
│   ├── Hero.tsx            # Landing page hero section
│   ├── Instrument.tsx      # Main instrument interface
│   ├── HowItWorks.tsx      # Feature cards
│   ├── About.tsx           # About section
│   └── Footer.tsx          # Footer
├── lib/
│   ├── handTracking.ts     # MediaPipe hand detection
│   ├── audioEngine.ts      # Web Audio API effects
│   └── mappings.ts         # Gesture mapping and smoothing
└── styles.css              # Global styles
```

### Building

Build for production:

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

Preview the build locally:

```bash
npm run preview
```

## Deployment

### GitHub Pages

1. Fork the repository on GitHub and push your code to a repository named `voice-gesture-instrument-web`.
2. Configure the `base` option in `vite.config.ts` only if you are deploying to a repository page and want absolute paths:
   ```typescript
   export default defineConfig({
     base: './',
     plugins: [react()],
     server: {
       open: true,
     },
   })
   ```
3. Deploy with:
   ```bash
   npm run deploy:github
   ```

The project already includes `gh-pages` as a dev dependency, so install dependencies once with:
```bash
npm install
```

### Optional: GitHub Actions Deployment

If you want continuous deployment from `main` to GitHub Pages, add a workflow like this:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  build-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          publish_dir: ./dist
          publish_branch: gh-pages
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

Then enable GitHub Pages in your repository settings to publish the `gh-pages` branch.

### Vercel

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com)
3. Vercel auto-detects Vite and uses the correct build settings
4. Deploy with one click

### Other Hosting (Netlify, etc.)

Build the project and deploy the `dist/` folder to any static hosting service.

```bash
npm run build
# Then upload the dist/ folder to your hosting provider
```

## Usage

1. **Allow Permissions**: Grant webcam and microphone access when prompted
2. **Click "Start Microphone"**: Begin audio input
3. **Raise Your Hand**: Get detected in the video feed
4. **Control Effects**:
   - **Pinch** (bring thumb and index finger close) → Increase reverb
   - **Raise Hand** → Increase harmony/effect blend
5. **Watch the HUD**: See real-time meters, hand skeleton, and effect levels

## Troubleshooting

### Webcam Permission Denied

- Check your browser settings: Settings → Privacy → Camera
- Ensure this is not a blocked site
- Try a different browser (Chrome typically works best)
- For HTTPS, your certificate must be valid

### Microphone Not Working

- Check browser permissions: Settings → Privacy → Microphone
- Ensure microphone is enabled in your OS settings
- **Recommended: Use headphones** to avoid feedback
- If using a USB microphone, ensure it's the default input device

### Poor Hand Tracking

- Ensure good lighting in your space
- Position your hand clearly within the camera frame
- Keep your hand between waist and shoulder height for best results
- Try adjusting camera angle

### Audio Feedback / Distortion

- **Always use headphones** to prevent microphone feedback
- Lower your system microphone level
- Use the app in a quiet room
- If distortion occurs, lower the microphone gain or move the microphone farther from speakers

### Webcam/Microphone Unavailable

- Check if your camera/mic is in use by another application
- Restart your browser
- Reboot your computer
- Try a different browser

### MediaPipe Model Loading Issue

- Check your internet connection (models are downloaded from CDN)
- Disable browser extensions (some block scripts)
- Check the browser console for detailed error messages
- Try clearing browser cache and cookies

### App Freezes or Crashes

- Check browser console for JavaScript errors
- Ensure your browser is up to date
- Try a fresh page reload
- If on mobile, ensure sufficient RAM is available

## Performance Tips

- Use Chrome for best performance
- Close unnecessary browser tabs
- Use a modern computer (hand tracking is CPU-intensive)
- Use a wired microphone for better audio quality
- Position your hand within the center of the video frame

## Known Limitations

- **Browser-Based Harmony**: The "harmony/effect mix" is a browser-friendly approximation using chorus, delay, and filtering. It is **not professional autotune**. For production vocal effects, use a DAW like Logic Pro, Ableton Live, or Reaper.
- **Single Hand**: Currently supports tracking one hand at a time
- **Hand Height Accuracy**: Gesture detection depends on good lighting and camera positioning
- **Latency**: Web Audio latency depends on your OS and hardware. Typical latency is 50-200ms.

## Contributing

Contributions are welcome! If you find bugs or want to improve the instrument, please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **MediaPipe** for hand detection models
- **Web Audio API** for real-time audio processing
- **React** and **Vite** for the development stack
- Inspired by polished startup landing pages and interactive music tools

## Support

- 🐛 Found a bug? Open an [issue](https://github.com/yourusername/voice-gesture-instrument-web/issues)
- 💡 Have an idea? Share it in [discussions](https://github.com/yourusername/voice-gesture-instrument-web/discussions)
- 📧 Questions? Check the troubleshooting section above

---

**Made with ❤️ for expressive, hands-free vocal effects.**