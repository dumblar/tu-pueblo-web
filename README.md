# Car Reservation System

A web application for managing car reservations between Tamesis and Medellin.

## Features

- Schedule management for car spots
- Fixed daily routes (Tamesis → Medellin at 5:00 AM, Medellin → Tamesis at 3:00 PM)
- Real-time seat availability
- Google Authentication
- Interactive calendar navigation
- Booking management system
- Email notifications

## Tech Stack

- Frontend: React.js
- Backend: Node.js
- Database: MySQL
- Authentication: Google OAuth
- Email Service: Nodemailer

## Project Structure

```
car-reservation/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── services/
│       └── utils/
├── server/                 # Node.js backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
└── database/              # Database scripts
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=car_reservation
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASSWORD=your_email_password
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/google` - Google authentication
- `POST /api/auth/verify-phone` - Phone number verification

### Reservation Endpoints

- `GET /api/routes` - Get available routes
- `GET /api/routes/:date` - Get route availability for a specific date
- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations/user` - Get user's reservations
- `DELETE /api/reservations/:id` - Cancel a reservation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 