# Gemini Backend Configuration

This file provides context to the Gemini AI assistant for the `backend` of the "fittingz" application.

## Backend Technology Stack

-   **Framework**: Node.js with Express.js
-   **Database**: PostgreSQL (using Prisma ORM)
-   **Authentication**: Passport.js for authentication.
-   **API Documentation**: Swagger

## Instructions

-   When adding new routes, please follow the existing structure in the `routes` directory.
-   Ensure that any new database schema changes are accompanied by a new Prisma migration.
-   Use the existing controllers and services for business logic.
