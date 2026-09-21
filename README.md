# Personal Finance Application

Personal finance management application with full accounting capabilities, investment tracking, and reporting.

## Project Structure

```
web-investment/
├── personal-finance-app/       # Personal Finance Application
│   ├── backend/              # Spring Boot Java Backend
│   │   ├── src/
│   │   │   ├── main/        # Main application code
│   │   │   │   ├── java/    # Java source code
│   │   │   │   └── resources/ # Configuration files
│   │   │   └── test/        # Test code
│   │   ├── pom.xml          # Maven dependencies
│   │   └── Dockerfile       # Docker configuration
│   ├── frontend/            # React + TypeScript Frontend
│   │   ├── src/             # React components
│   │   │   ├── api/        # API queries
│   │   │   ├── components/ # UI components
│   │   │   ├── lib/        # Utilities (api, auth, format)
│   │   │   ├── pages/      # Page components
│   │   │   └── types/      # TypeScript types
│   │   ├── package.json     # Node dependencies
│   │   └── vite.config.ts   # Vite configuration
│   ├── docker-compose.yml  # Docker services
│   └── database/            # Database migrations (Flyway)
├── tests/                     # Shared tests
├── test_reports/             # Test reports
└── memory/                   # Memory storage
```

## Tech Stack

### Backend (Java/Spring Boot)
- Framework: Spring Boot 3.3.5
- Java Version: 21
- Database: PostgreSQL with Flyway migrations
- Authentication: Spring Security + JWT (jjwt)
- Build Tool: Maven
- Testing: JUnit, H2 (test database), JaCoCo (code coverage)
- Lombok: Boilerplate reduction

### Frontend (React + TypeScript)
- Framework: React 18.3.1 with TypeScript
- Build Tool: Vite 5.4.10
- Styling: TailwindCSS 3.4.14
- State Management: TanStack Query
- Routing: React Router DOM 6.27.0
- Forms: React Hook Form + Zod validation
- Charts: Recharts 2.13.0
- Icons: Lucide React

## Features

- **Account Management**: Chart of accounts, balance tracking
- **Transactions**: Income, expense, transfer recording
- **Investments**: Stock lots, bonds, dividends tracking
- **Budgeting**: Budget planning and tracking
- **Reports**: Balance sheet, income/expense, cash flow, net worth
- **Reconciliation**: Bank statement reconciliation

## Getting Started

### Prerequisites
- Java 21
- Maven
- Node.js 18+
- PostgreSQL

### Database Setup

Create PostgreSQL database and user (replace with your credentials):
```sql
CREATE DATABASE personal_finance;
CREATE USER personal_finance WITH PASSWORD 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE personal_finance TO personal_finance;
```

### Using Docker Compose

```bash
cd personal-finance-app
docker-compose up
```

### Manual Setup

**Backend:**
```bash
cd personal-finance-app/backend
mvn spring-boot:run
```

Backend runs on: http://localhost:8080

**Frontend:**
```bash
cd personal-finance-app/frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Environment Variables

Create `.env` file in the project root or set environment variables:

Backend (application.yml):
- `DB_URL`: PostgreSQL connection URL
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: JWT secret key
- `CORS_ALLOWED_ORIGINS`: Allowed CORS origins

Frontend:
- `VITE_API_URL`: Backend API URL (default: http://localhost:8080)

## Testing

```bash
cd personal-finance-app/backend
mvn test
```

## Database Migrations

Flyway migrations are located in `backend/src/main/resources/db/migration/`. They run automatically on application startup.

## Development Tools

**Code Quality**
- Backend (Java): JaCoCo for code coverage
- Frontend: TypeScript strict mode

**Package Managers**
- Frontend: npm
- Backend: Maven

**How to kill port?**
- netstat -ano | findstr :8080
- taskkill /PID 12345 /F