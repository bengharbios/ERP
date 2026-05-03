# Frontend

Institute ERP Frontend built with React, Vite, and TypeScript.

## Setup

### Prerequisites
- Node.js 20+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   ├── features/      # Feature-based modules
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── store/         # Zustand state management
│   ├── utils/         # Utility functions
│   ├── i18n/          # Internationalization
│   ├── App.tsx        # Main App component
│   ├── App.css        # App styles
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Features

- ⚡ Vite for fast development
- ⚛️ React 18
- 🎨 Vanilla CSS with modern design
- 🌐 RTL & LTR Support (Arabic + English)
- 📱 Fully Responsive
- 🔄 React Query for data fetching
- 📋 React Hook Form for forms
- 🎯 TypeScript for type safety
- 🌍 i18next for internationalization

##التصميم

The UI follows modern web design principles:
- Clean and intuitive interface
- Gradient backgrounds and shadows
- Smooth transitions and hover effects
- Premium, professional aesthetic
- Full RTL support for Arabic

## API Integration

The frontend is configured to proxy API requests to the backend:
- Development: Proxied through Vite to `http://localhost:3000`
- Production: Configure via environment variables
