# API Testing Tool - Frontend

A Next.js 16 frontend for the REST API testing tool.

## Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Update `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if needed.

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

Build for production:
```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Validation**: Zod
- **HTTP Client**: Axios

## Folder Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable UI components
- `src/services/` - API service layer
- `src/store/` - Redux store and slices
- `src/contexts/` - React Context providers
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/validations/` - Zod validation schemas
- `src/utils/` - Utility functions
- `src/constants/` - App constants
