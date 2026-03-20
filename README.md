# Apico

Open-source REST API testing tool. Test, debug, and document your APIs with ease.

## Features

- **REST API Testing** - Send HTTP requests with full support for all HTTP methods
- **Request Builder** - Intuitive interface with params, headers, body, and authentication support
- **Response Viewer** - Beautiful syntax-highlighted response viewing with headers
- **Request History** - Auto-saved request history for quick access
- **Collections** - Organize requests into collections within workspaces
- **Environment Variables** - Define variables and use them across requests with `{{VARIABLE}}` syntax
- **Workspaces** - Collaborate with team members in isolated workspaces
- **Role-Based Access** - Owner, Editor, and Viewer roles for workspace members
- **Dark Theme** - Modern dark theme optimized for extended use
- **Keyboard Shortcuts** - Powerful keyboard shortcuts for efficient workflow
- **Request Sharing** - Generate shareable links for requests
- **Authentication Types** - Support for Bearer, Basic Auth, and API Key authentication

## Tech Stack

### Frontend
- **Next.js 16** - React framework with server and client components
- **React 19** - Latest React with Concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - Global state management
- **Zod** - Runtime schema validation

### Backend
- **Express.js** - Fast and minimal Node.js web framework
- **TypeScript** - Type-safe server code
- **Prisma** - Type-safe ORM with migrations
- **MySQL** - Relational database
- **JWT** - Secure authentication with tokens
- **Bcryptjs** - Password hashing

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (for Docker setup)
- MySQL (for manual setup)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/apico.git
cd apico

# Build and start services
docker-compose up --build

# The app will be available at http://localhost:3000
# API will be available at http://localhost:5000
```

### Manual Setup

#### 1. Backend Setup

```bash
cd api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Set up your environment variables
# DATABASE_URL=mysql://user:password@localhost:3306/apico
# JWT_SECRET=your-secret-key
# JWT_REFRESH_SECRET=your-refresh-secret

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start the server
npm run dev
# Server will run on http://localhost:5000
```

#### 2. Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Set API URL (if running locally)
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Start the development server
npm run dev
# App will run on http://localhost:3000
```

## Project Structure

```
apico/
├── api/                           # Express.js backend
│   ├── src/
│   │   ├── config/               # Configuration
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/           # Express middleware
│   │   ├── queries/              # Database queries
│   │   ├── services/             # Business logic
│   │   ├── types/                # TypeScript types
│   │   ├── validations/          # Zod schemas
│   │   ├── utils/                # Utilities
│   │   └── proxy/                # HTTP executor
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   └── package.json
│
├── apps/
│   └── web/                       # Next.js frontend
│       ├── src/
│       │   ├── app/              # App Router pages
│       │   ├── components/       # React components
│       │   ├── hooks/            # Custom React hooks
│       │   ├── services/         # API service layer
│       │   ├── store/            # Redux store
│       │   ├── types/            # TypeScript types
│       │   ├── utils/            # Utilities
│       │   └── validations/      # Zod schemas
│       ├── public/               # Static assets
│       └── package.json
│
├── docker-compose.yml            # Docker Compose configuration
├── package.json                  # Root package for monorepo
└── README.md                     # This file
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send request |
| `Ctrl+N` | New request |
| `Ctrl+S` | Save request |
| `Ctrl+L` | Load request |
| `?` / `Ctrl+/` | Show keyboard shortcuts |
| `Esc` | Close modal |

## Configuration

### Backend Environment Variables

```env
DATABASE_URL=mysql://user:password@localhost:3306/apico
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## API Documentation

The API follows RESTful conventions and uses JWT authentication.

### Authentication
All protected routes require an `Authorization` header with a Bearer token:
```
Authorization: Bearer <access_token>
```

### Key Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - List user's workspaces
- `POST /api/requests/execute` - Execute HTTP request
- `POST /api/collections` - Create collection
- `POST /api/environments` - Create environment

See API documentation for complete endpoint reference.

## Development

### Running Tests

```bash
# Backend tests
cd api
npm test

# Frontend tests
cd apps/web
npm test
```

### Building for Production

```bash
# Backend
cd api
npm run build

# Frontend
cd apps/web
npm run build
```

## Deployment

See [SELF_HOSTING.md](./docs/SELF_HOSTING.md) for detailed deployment instructions including:
- Docker deployment
- Railway.app deployment
- Manual VPS deployment
- Environment configuration
- Database setup
- Reverse proxy setup

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Your code follows the existing code style
- You add tests for new features
- You update documentation as needed
- All tests pass before submitting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation** - Check out our docs folder for guides
- **Issues** - Report bugs and request features on GitHub
- **Discussions** - Join our community discussions

## Roadmap

- [ ] GraphQL support
- [ ] WebSocket support
- [ ] Request templates
- [ ] Mock server
- [ ] API documentation generator
- [ ] Performance analytics
- [ ] Custom themes
- [ ] Team collaboration features
- [ ] Request scheduling
- [ ] CI/CD integration

## Credits

Built with ❤️ using modern web technologies.
