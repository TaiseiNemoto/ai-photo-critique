# AI Photo Critique

AI-powered photo analysis web application that provides instant feedback on photography technique, composition, and color. Built with Next.js 15 and Google Gemini Vision API.

## ✨ Features

- **Instant AI Analysis**: Get comprehensive critique in <3 seconds
- **Three-Dimensional Feedback**: Technique, Composition, Color analysis
- **EXIF Data Extraction**: Detailed camera settings and metadata
- **Share System**: Generate shareable URLs with OGP images
- **Privacy First**: All data auto-deleted after 24 hours
- **Japanese Interface**: Tailored for Japanese photographers

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **AI**: Google Gemini Vision API (Gemini 1.5 Pro)
- **Storage**: Upstash Redis (24h TTL)
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Google AI Studio API key
- Upstash Redis database

### Environment Setup

1. Copy environment template:

```bash
cp .env.example .env.local
```

2. Configure environment variables:

```bash
# Google AI Studio API key
GOOGLE_AI_API_KEY=your_api_key_here

# Upstash Redis (get from Vercel Marketplace)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
```

## 🏗 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx        # Upload page
│   ├── report/[id]/    # Critique results
│   └── s/[id]/         # Shared results
├── components/         # React components
│   ├── upload/         # Upload flow components
│   ├── report/         # Report display components
│   └── share/          # Share system components
├── lib/                # Utility functions
│   ├── gemini.ts       # AI client
│   ├── kv.ts           # Redis client
│   ├── exif.ts         # EXIF extraction
│   └── image.ts        # Image processing
└── tests/              # Test files
```

## 🔧 Development Workflow

1. **UI Development**: Use v0.dev for component generation
2. **Backend Logic**: Implement via Server Actions
3. **Testing**: Write unit tests with Vitest, E2E with Playwright
4. **Code Quality**: ESLint + Prettier on every commit

## 📊 Data Flow

1. **Upload**: Image → Resize → EXIF extraction → Upstash Redis
2. **Analysis**: Gemini Vision API → Japanese critique generation
3. **Display**: Three-card UI (Technique/Composition/Color) + EXIF
4. **Share**: Generate short URL → OGP image → 24h TTL

## 🧪 Testing

- **Unit Tests**: 80%+ coverage target
- **E2E Tests**: Full user journey coverage
- **Performance**: <3s processing time per image

## 🚀 Deployment

Deploy to Vercel with automatic CI/CD:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-photo-critique)

## 📄 License

[MIT License](LICENSE)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For questions or issues, please [open an issue](https://github.com/your-username/ai-photo-critique/issues).
