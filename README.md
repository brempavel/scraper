# Node.js Web Scraper

## Overview

This Node.js application scrapes data from the Interaction Design Association Conference website. It targets people listed under the FAQ section on the homepage, extracting details such as names, roles, avatar images, and social media links. The scraped data can be exported in JSON, CSV formats, and directly to Google Spreadsheets.

## How to run application

1. Create a Google Cloud Service Account (https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create and Download the Service Account Key
3. Rename the downloaded key file to `credentials.json`.
4. Move or copy this file into the root directory of your project where your docker-compose.yml file is located.
5. Run Your Docker Containers:

```
docker-compose up --build
```

> may require sudo to run

## Features

- **Data Scraping**: Extracts names, roles, avatar images, and social media links.
- **Data Export**: Supports data export in JSON, CSV, and directly into Google Spreadsheets.
- **Authentication**: Utilizes JWT for secure access to the API endpoints.
- **Data Storage**: Uses PostgreSQL for storing users.
- **Error Handling**: Implements structured error handling for reliability and ease of debugging.

## Prerequisites

Before you begin, ensure you have the following installed:

- Docker Compose
- A Google Cloud account for access to Google Sheets API

## API Endpoints

- POST /auth/signup: Register a new user.
- POST /auth/login: Login to receive a JWT token.
- POST /auth/logout: Logout to invalidate the session.
- GET /auth/refresh: Refresh the session by validating the refresh token and issuing new access and refresh tokens.
- GET /parse?format=json|csv|gsheet: Trigger data scraping and get results in the specified format.
- GET /parse-requests: Retrieve the authenticated users that made a parse request.

## Technologies Used

- Node.js and Express.js: Server setup and API management.
- Cheerio: HTML parsing for data scraping.
- Google APIs: Integration with Google Sheets for data export.
- PostgreSQL: Database for storing user and session data.
- JWT: Handling authentication and session management.
- PapaParse: Converting JSON data to CSV format.
- TypeORM: ORM tool for database interaction in a structured way.

## Project Structure

```
/src
    /core
        /entities
        /repositories
        /services
    /infrastructure
        /controllers
            /AuthController
            /ParseController
        /db
            /postgres
        /decorators
        /errors
        /middlewares
```
