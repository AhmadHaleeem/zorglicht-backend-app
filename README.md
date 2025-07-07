# Backend Admin App

A professional admin dashboard for employee and role management built with Node.js, Express, and MongoDB.

## Features

### 🔐 Authentication & Authorization
- Secure login system with bcrypt password hashing
- Role-based access control (Admin/User)
- Session management with express-session
- Protected routes with middleware
- Automatic redirect for unauthorized access

### 👥 Employee Management
- Complete CRUD operations for employees
- Employee profiles with detailed information
- Search and filter functionality
- Pagination for large datasets
- Role-based visibility controls
- Password management and updates

### 📁 File Management
- File upload with Cloudinary integration
- Secure file storage and retrieval
- File association with employees
- Download and delete capabilities
- File type validation and size limits

### 🎯 Role Management
- Dynamic role creation and management
- Permission-based access control
- Role assignment to employees
- Active/inactive role status

### 📊 Dashboard
- Overview statistics and metrics
- Recent employee activities
- Department-wise analytics
- File upload statistics
- Quick action buttons (admin only)

### 🎨 User Interface
- Responsive Bootstrap-based design
- Modern and clean interface
- Mobile-friendly layout
- Flash messages for user feedback
- Intuitive navigation

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with Local Strategy
- **File Storage**: Cloudinary
- **Template Engine**: EJS with EJS-Mate
- **Styling**: Bootstrap 5
- **Security**: bcryptjs, express-session
- **Development**: Nodemon for auto-restart

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MongoDB database (local or cloud)
- Cloudinary account for file storage
- Git for version control

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-admin-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory and configure the following variables:
   
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/admin-app
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Session Configuration
   SESSION_SECRET=your-super-secret-session-key-change-in-production
   
   # Application Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   
   The application will automatically create default data on first run:
   - Default admin user: `admin@example.com` / `admin123`
   - Default regular user: `user@example.com` / `user123`
   - Default roles: admin and user

5. **Start the application**
   
   For development:
   ```bash
   npm run dev
   ```
   
   For production:
   ```bash
   npm start
   ```

6. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## Usage

### Default Login Credentials

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`

**Regular User:**
- Email: `user@example.com`
- Password: `user123`

### Admin Features

As an admin, you can:
- View and manage all employees
- Create, edit, and delete employee records
- Upload and manage files
- Manage roles and permissions
- Access all dashboard statistics
- Change employee passwords

### User Features

As a regular user, you can:
- View your own profile
- View other employee profiles (read-only)
- Access basic dashboard information
- Cannot edit, delete, or create new records

## Project Structure

```
backend-admin-app/
├── config/
│   └── database.js          # Database connection configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── upload.js            # File upload middleware
├── models/
│   ├── Employee.js          # Employee data model
│   ├── File.js              # File data model
│   └── Role.js              # Role data model
├── views/
│   ├── auth/
│   │   └── login.ejs        # Login page
│   ├── employees/
│   │   ├── index.ejs        # Employee list
│   │   ├── show.ejs         # Employee profile
│   │   ├── edit.ejs         # Employee edit form
│   │   └── new.ejs          # New employee form
│   ├── files/
│   │   ├── index.ejs        # File management
│   │   └── upload.ejs       # File upload
│   ├── roles/
│   │   └── ...              # Role management views
│   ├── partials/
│   │   ├── header.ejs       # Header component
│   │   ├── sidebar.ejs      # Sidebar navigation
│   │   └── footer.ejs       # Footer component
│   ├── dashboard.ejs        # Main dashboard
│   ├── layout.ejs           # Base layout template
│   └── 404.ejs              # Error page
├── public/                  # Static assets (CSS, JS, images)
├── server.js                # Main application file
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variables template
```

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Process login
- `POST /logout` - Logout user

### Dashboard
- `GET /` - Main dashboard
- `GET /dashboard` - Dashboard redirect

### Employees
- `GET /werknemers` - List all employees
- `GET /werknemers/nieuw` - New employee form
- `POST /werknemers` - Create new employee
- `GET /werknemers/:id` - View employee profile
- `GET /werknemers/:id/bewerken` - Edit employee form
- `PUT /werknemers/:id` - Update employee
- `DELETE /werknemers/:id` - Delete employee

### Files
- `GET /bestanden` - File management
- `GET /bestanden/upload` - File upload form
- `POST /bestanden/upload` - Upload file
- `DELETE /bestanden/:id` - Delete file

### Roles
- `GET /rollen` - List all roles
- `GET /rollen/nieuw` - New role form
- `POST /rollen` - Create new role
- `GET /rollen/:id` - View role details
- `PUT /rollen/:id` - Update role
- `DELETE /rollen/:id` - Delete role

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs with salt
- **Session Management**: Secure session handling with configurable expiration
- **Route Protection**: Middleware-based route protection
- **Role-based Access**: Different access levels for admin and regular users
- **Input Validation**: Server-side validation for all forms
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **File Upload Security**: File type and size validation

## Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

### Adding New Features

1. **Models**: Add new data models in the `models/` directory
2. **Routes**: Add new routes in `server.js` or create separate route files
3. **Views**: Create new EJS templates in the `views/` directory
4. **Middleware**: Add custom middleware in the `middleware/` directory
5. **Static Assets**: Add CSS, JS, and images in the `public/` directory

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your MongoDB URI in the `.env` file
   - Ensure MongoDB is running (for local installations)
   - Verify network connectivity (for cloud databases)

2. **File Upload Issues**
   - Verify Cloudinary credentials in `.env`
   - Check file size limits
   - Ensure proper file types are being uploaded

3. **Authentication Problems**
   - Clear browser cookies and session data
   - Check session secret configuration
   - Verify user credentials

4. **Permission Denied**
   - Check user role assignments
   - Verify middleware configuration
   - Ensure proper route protection

### Logs and Debugging

- Check console output for error messages
- Enable debug mode by setting `NODE_ENV=development`
- Use browser developer tools for client-side debugging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This application is designed for internal use and should be deployed behind proper security measures in production environments.