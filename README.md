# Expense Tracker Web Application

A full-stack personal finance application developed as part of the Auspify Technologies Full Stack Development Internship task.

## Overview

Expense Tracker helps users manage their personal finances by recording income and expenses, monitoring their financial balance, and reviewing financial reports through an interactive dashboard.

## Features

- **User Authentication:** Register, log in, and log out securely.
- **Dashboard:** View total balance, income, expenses, and transaction count.
- **Transaction Management:** Add, view, edit, and delete financial records.
- **Monthly Reports:** Filter financial records by month and view income, expenses, and net savings.
- **Data Visualization:** View financial summaries and expense categories through charts.
- **CSV Export:** Download transaction records for spreadsheet analysis.
- **PDF Reports:** Generate printable financial reports and save them as PDF files.
- **Database Persistence:** Store user accounts and financial records in MongoDB.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose
- bcrypt
- Express Session
- connect-mongo
- Chart.js

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- A MongoDB database, either local MongoDB or MongoDB Atlas
- Git (optional, for cloning the repository)

### Installation

1. Clone the repository or download the project files.
2. Open a terminal in the project directory.
3. Install the dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root using `.env.example` as a guide.
5. Configure the environment variables:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secure_random_secret
   PORT=3000
   ```

6. Start the application using the start script configured in `package.json`:

   ```bash
   npm start
   ```

7. Open `http://localhost:3000` in your browser.

> If the project does not yet have a `start` script in `package.json`, add one that runs `server.js` before using `npm start`.

## How to Use

1. Register an account or log in.
2. Open the dashboard to review your financial summary.
3. Add income or expense transactions.
4. Edit or delete records as needed.
5. Use the monthly report selector to review a specific month or view all transactions.
6. Export transaction data to CSV or generate a printable PDF report.
7. Log out when finished.

## Security

- Passwords are hashed using bcrypt.
- Session cookies use HTTP-only settings.
- Environment variables are used for database configuration and the session secret.
- The `.env` file should not be committed to the repository.

## Project Status

The core dashboard, authentication, transaction management, financial reports, and export features have been tested locally.

## Author

Etim Etim Frank
