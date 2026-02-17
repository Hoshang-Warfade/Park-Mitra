# 🅿️ ParkMitra - Smart Parking Management System

A comprehensive full-stack parking management platform that enables organizations to efficiently manage parking operations with real-time booking, QR-based access control, automated billing, and penalty management.

## 📋 Overview

ParkMitra is a multi-tenant SaaS solution designed to digitize and automate parking operations for organizations. The system supports multiple parking lots per organization, various user roles, contactless entry/exit verification, and intelligent slot allocation with automated compliance enforcement.

## ✨ Key Features

### 🏢 Multi-Organization Support
- Complete data isolation per organization
- Multiple parking lots per organization
- Customizable parking rules and operating hours
- Independent pricing configuration

### 👥 Role-Based Access Control
- **Organization Admins** - Full parking management control
- **Members** - Free/discounted parking access
- **Visitors** - Hourly rate parking bookings
- **Watchmen** - Entry/exit verification and monitoring

### 🎫 Smart Booking System
- Real-time slot availability tracking
- Automated slot allocation across multiple parking lots
- Advance booking with time slot selection
- Conflict resolution and validation
- Booking history and management

### 📱 QR Code Integration
- Automatic QR code generation for each booking
- Contactless entry/exit verification
- Mobile-friendly QR scanner interface
- Digital parking pass system

### 💰 Payment & Billing
- Integrated payment processing
- Automated billing calculations
- Multiple payment methods support
- Transaction history tracking
- Invoice generation

### ⚠️ Overstay Management
- Automatic overstay detection
- Configurable penalty calculations
- Real-time monitoring
- Automated penalty record generation

### 🔒 Security Features
- JWT-based authentication
- Bcrypt password encryption
- Rate limiting per endpoint
- CORS protection
- Security headers (Helmet.js)
- Input validation and sanitization
- XSS and injection protection

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite3
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Security:** Helmet, express-rate-limit, CORS
- **Logging:** Morgan
- **QR Generation:** qrcode

### Frontend
- **Framework:** React 18
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios
- **QR Code:** qrcode.react, html5-qrcode
- **Notifications:** react-toastify
- **Icons:** react-icons
- **Date Handling:** date-fns
- **Styling:** Tailwind CSS

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Git**

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/park-mitra.git
cd park-mitra
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Database
DB_PATH=./parkmitra.db

# Payment Gateway (if applicable)
PAYMENT_API_KEY=your-payment-api-key
PAYMENT_SECRET=your-payment-secret

# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
```

### 5. Initialize Database
```bash
npm run setup-db
```

This will:
- Create the database schema
- Set up all necessary tables
- Seed initial data (optional demo data)

## 🎯 Usage

### Development Mode

#### Start Backend Server
```bash
npm run dev
```
Backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
npm run client
```
Frontend will run on `http://localhost:3000`

#### Run Both Concurrently
```bash
# In terminal 1
npm run dev

# In terminal 2
npm run client
```

### Production Mode

#### Build Frontend
```bash
npm run build
```

#### Start Production Server
```bash
npm start
```

The server will serve both API and built frontend files.

## 📝 Available Scripts

### Backend Scripts
```bash
npm start           # Start production server
npm run dev         # Start development server with nodemon
npm run init-db     # Initialize database schema
npm run seed-db     # Seed database with sample data
npm run setup-db    # Initialize and seed database
npm run reset-db    # Delete and recreate database
npm run test-db     # Test database connection
npm run view-db     # View database contents
npm run sync-slots  # Synchronize parking slots
```

### Frontend Scripts
```bash
npm run client      # Start React development server
npm run build       # Build frontend for production
npm run test        # Run frontend tests
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/profile           # Get user profile
PUT    /api/auth/profile           # Update user profile
```

### Bookings
```
GET    /api/bookings               # Get user bookings
POST   /api/bookings               # Create new booking
GET    /api/bookings/:id           # Get booking details
PUT    /api/bookings/:id           # Update booking
DELETE /api/bookings/:id           # Cancel booking
POST   /api/bookings/:id/entry     # Mark entry time
POST   /api/bookings/:id/exit      # Mark exit time
```

### Organizations
```
GET    /api/organizations          # Get all organizations
POST   /api/organizations          # Create organization (admin)
GET    /api/organizations/:id      # Get organization details
PUT    /api/organizations/:id      # Update organization
DELETE /api/organizations/:id      # Delete organization
GET    /api/organizations/:id/slots # Get available slots
```

### Parking Lots
```
GET    /api/parking-lots           # Get parking lots
POST   /api/parking-lots           # Create parking lot
GET    /api/parking-lots/:id       # Get parking lot details
PUT    /api/parking-lots/:id       # Update parking lot
DELETE /api/parking-lots/:id       # Delete parking lot
```

### Payments
```
GET    /api/payments               # Get payment history
POST   /api/payments               # Process payment
GET    /api/payments/:id           # Get payment details
```

### Watchmen
```
GET    /api/watchmen               # Get all watchmen
POST   /api/watchmen               # Add watchman
GET    /api/watchmen/:id           # Get watchman details
PUT    /api/watchmen/:id           # Update watchman
DELETE /api/watchmen/:id           # Remove watchman
POST   /api/watchmen/verify-qr     # Verify QR code
```

### Informal Parking
```
POST   /api/informal-parking       # Create walk-in booking
GET    /api/informal-parking       # Get informal bookings
```

## 🗄️ Database Schema

### Main Tables
- **organizations** - Parking service providers
- **parking_lots** - Multiple parking areas per organization
- **users** - All system users (members, visitors, walk-ins)
- **watchmen** - Parking attendants
- **bookings** - Parking reservations and active sessions
- **payments** - Payment transactions and records

### Key Relationships
- Organizations have multiple parking lots
- Users belong to organizations (for members)
- Bookings link users, organizations, and parking lots
- Payments track booking transactions
- Watchmen are assigned to organizations

## 📁 Project Structure

```
park-mitra/
├── backend/
│   ├── config/           # Configuration files (DB, Auth)
│   ├── controllers/      # Route controllers
│   ├── database/         # DB scripts, migrations, schema
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
├── frontend/
│   ├── public/           # Static files
│   └── src/
│       ├── assets/       # Images, fonts, etc.
│       ├── components/   # React components
│       ├── context/      # React context (state management)
│       ├── services/     # API service calls
│       ├── styles/       # CSS files
│       └── utils/        # Helper functions
├── .env                  # Environment variables
├── package.json          # Backend dependencies
├── server.js             # Express server entry point
└── README.md            # This file
```

## 🔐 Security Best Practices

- Always use HTTPS in production
- Keep JWT_SECRET secure and never commit to version control
- Regularly update dependencies
- Implement proper CORS policies
- Use environment variables for sensitive data
- Enable rate limiting for all endpoints
- Validate and sanitize all user inputs
- Use prepared statements for database queries
- Implement proper error handling without exposing system details

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend && npm test
```

## 📊 Default Demo Accounts

After seeding the database, you can use these demo accounts:

**Organization Admin:**
- Email: admin@viit.ac.in
- Password: admin123

**Member:**
- Email: member@viit.ac.in
- Password: member123

**Visitor:**
- Email: visitor@example.com
- Password: visitor123

**Watchman:**
- Email: watchman@viit.ac.in
- Employee ID: W001
- Password: watchman123

> ⚠️ **Important:** Change all default passwords in production!

## 🚧 Troubleshooting

### Database Issues
```bash
# Reset database completely
npm run reset-db

# Check database tables
npm run view-db

# Test database connection
npm run test-db
```

### Port Already in Use
```bash
# Change PORT in .env file or kill the process
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### CORS Errors
- Ensure FRONTEND_URL in `.env` matches your frontend URL
- Check CORS configuration in `server.js`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Express.js community for excellent documentation
- React team for the amazing framework
- All open-source contributors whose packages made this project possible

## 📞 Support

For support, email your.email@example.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Email/SMS notifications
- [ ] Multi-language support
- [ ] Integration with payment gateways (Stripe, PayPal)
- [ ] License plate recognition (LPR) integration
- [ ] Parking space sensors integration
- [ ] Mobile wallet integration
- [ ] Booking API for third-party integration

## 📈 Version History

- **1.0.0** (Current)
  - Initial release
  - Core parking management features
  - Multi-organization support
  - QR code integration
  - Payment processing
  - Overstay management

---

Made with ❤️ by Your Name
