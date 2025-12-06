# Fittingz App API

This is the backend API for the Fashion Designer Web Application. It provides a robust system for managing clients, orders, measurements, projects, and style inspirations, tailored for fashion designers and tailoring businesses.

## Key Features

*   **Client Management**: Handle client information, including personal details and style preferences.
*   **Order & Project Tracking**: Manage client orders and larger projects from initiation to completion.
*   **Measurements**: Store detailed client measurements.
*   **Style Inspiration**: Upload and categorize style images for clients or general inspiration.
*   **Event Management**: Track events and link clients and orders to them.
*   **Authentication**: Secure JWT-based authentication for administrators with email verification and password reset.
*   **Real-time Updates**: Socket.io integration for real-time communication.
*   **API Documentation**: Interactive API documentation powered by Swagger.

## Table of Contents

*   [Installation](#installation)
*   [Usage](#usage)
*   [API Documentation](#api-documentation)
*   [Authentication Features](#authentication-features)
*   [Project Structure](#project-structure)
*   [Configuration](#configuration)
*   [GitHub](#github)
*   [Contributing](#contributing)
*   [License](#license)

## Installation

Follow these steps to set up the project locally.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [pnpm](https://pnpm.io/installation)
*   [PostgreSQL](https://www.postgresql.org/download/)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/davytun/fittingz-backend.git
    cd fittingz-backend
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the necessary environment variables. You can use the `.env.example` file as a template if one is available. Key variables include:
    *   `DATABASE_URL`: Connection string for your PostgreSQL database.
    *   `JWT_SECRET`: Secret key for signing JWTs.
    *   `PORT`: Port for the server to run on (e.g., 5000).
    *   `CORS_ALLOWED_ORIGIN`: The frontend URL for CORS.
    *   Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
    *   Email service credentials.

4.  **Set up the database:**
    Run the following commands to apply database migrations and seed initial data:
    ```bash
    pnpm prisma:migrate:dev
    pnpm prisma:seed
    ```

## Usage

To run the application in development mode with live-reloading:

```bash
pnpm dev
```

To run the application in production mode:

```bash
pnpm start
```

The server will start on the port specified in your `.env` file (defaulting to 5000).

## API Documentation

The API is documented using Swagger. Once the server is running, you can access the interactive API documentation at `http://localhost:5000/api/v1/docs` (or your configured base URL).

## Authentication Features

The API includes a complete authentication system with the following features:

### Email Verification
*   6-digit verification codes sent via email
*   15-minute code expiration
*   Resend verification option

### Password Reset (Forgot Password)
*   Secure password reset flow with 6-digit codes
*   Email-based verification
*   Strong password requirements
*   Rate limiting to prevent abuse

For detailed documentation on the forgot password feature, see:
*   **[Forgot Password Guide](FORGOT_PASSWORD_GUIDE.md)** - Complete implementation guide
*   **[Forgot Password Summary](FORGOT_PASSWORD_SUMMARY.md)** - Quick reference

### Authentication Endpoints
*   `POST /api/v1/auth/register` - Register new admin
*   `POST /api/v1/auth/login` - Admin login
*   `POST /api/v1/auth/verify-email` - Verify email with code
*   `POST /api/v1/auth/resend-verification` - Resend verification code
*   `POST /api/v1/auth/forgot-password` - Request password reset
*   `POST /api/v1/auth/verify-reset-code` - Verify reset code
*   `POST /api/v1/auth/reset-password` - Reset password

## Project Structure

The project follows a modular structure to separate concerns:

```
.
├── config/         # Configuration files (Cloudinary, Passport, Swagger)
├── controllers/    # Express controllers for handling request logic
├── loaders/        # Application loaders (Express, Passport, Routes, etc.)
├── middlewares/    # Custom Express middlewares
├── prisma/         # Prisma schema, migrations, and seed scripts
├── routes/         # Express route definitions
├── services/       # Business logic and database interactions
├── swagger/        # Swagger documentation definitions
├── templates/      # Email templates
├── utils/          # Utility functions (caching, mailing)
├── server.js       # Main application entry point
└── package.json    # Project metadata and dependencies
```

## Configuration

The application is configured through environment variables defined in a `.env` file. See the [Installation](#installation) section for more details.

## GitHub

**Repository:** [https://github.com/davytun/fittingz-backend](https://github.com/davytun/fittingz-backend)

### Quick Links
*   [Issues](https://github.com/davytun/fittingz-backend/issues) - Report bugs or request features
*   [Pull Requests](https://github.com/davytun/fittingz-backend/pulls) - View or submit code contributions
*   [Releases](https://github.com/davytun/fittingz-backend/releases) - View version history and changelogs

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature`).
6.  Open a pull request.

## License

This project is licensed under the ISC License.
