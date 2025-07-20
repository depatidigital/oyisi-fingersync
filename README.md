# Finger Sync - Unified Next.js Application

A unified Next.js application that combines frontend and backend functionality for user mapping and fingerprint data management.

## Features

- **User Search**: Search users by name or email
- **User Mapping**: Map users to device IDs
- **Import/Export**: Import and export fingerprint data
- **Real-time Updates**: Live feedback for user actions
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Next.js 15** - Full-stack React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MySQL** - Database
- **mysql2** - Database driver

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database
- Database tables: `users`, `user_profile`, `device_user_mapping`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

- `GET /api/users?q=search` - Search users
- `GET /api/device-users` - Get all device user mappings
- `POST /api/device-users/map` - Map/unmap users to devices
- `POST /api/device-users/import` - Import device data
- `GET /api/device-users/export` - Export device data

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255)
);
```

### User Profile Table
```sql
CREATE TABLE user_profile (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userid INT,
  phone VARCHAR(20),
  FOREIGN KEY (userid) REFERENCES users(id)
);
```

### Device User Mapping Table
```sql
CREATE TABLE device_user_mapping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_user_id INT UNIQUE,
  user_id INT,
  fingerprint_data TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm start` - Start production server

## Deployment

The app can be deployed to Vercel, Netlify, or any Node.js hosting platform.

For production, make sure to:
1. Set up environment variables
2. Configure database connection
3. Build the application: `npm run build`
4. Start the server: `npm start`
