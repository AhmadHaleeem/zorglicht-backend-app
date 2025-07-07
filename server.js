const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();

// Database imports
const connectDB = require('./config/database');
const Employee = require('./models/Employee');
const File = require('./models/File');
const Role = require('./models/Role');

// Import middleware
const { requireAuth, requireAdmin, requireAdminOrSelf, redirectIfAuthenticated, hashPassword, comparePassword, generateRandomPassword, addUserToViews } = require('./middleware/auth');
const { upload, uploadToCloudinaryFromFile, deleteFromCloudinaryByPublicId, generateCloudinaryDownloadUrl, handleUploadError, getFileIcon, formatFileSize } = require('./middleware/upload');

// Initialize seed data for development
async function initializeSeedData() {
    try {
        // Check if roles exist, if not create them
        const roleCount = await Role.countDocuments();
        if (roleCount === 0) {
            const defaultRoles = [
                {
                    naam: 'admin',
                    beschrijving: 'Administrator role with full access',
                    machtigingen: ['create', 'read', 'update', 'delete', 'admin'],
                    actief: true
                },
                {
                    naam: 'user',
                    beschrijving: 'Standard user role',
                    machtigingen: ['read', 'update'],
                    actief: true
                }
            ];
            await Role.insertMany(defaultRoles);
            console.log('Default roles created');
        }

        // Clear existing employees with invalid rol format and recreate
        await Employee.deleteMany({});
        console.log('Cleared existing employees to fix rol field format');
        
        // Create sample data
        const employeeCount = await Employee.countDocuments();
        if (employeeCount === 0) {
            const defaultEmployees = [
                {
                    naam: 'Admin User',
                    email: 'admin@example.com',
                    telefoon: '06-12345678',
                    functie: 'Administrator',
                    afdeling: 'IT',
                    rol: 'admin',
                    startdatum: new Date('2020-01-15'),
                    salaris: 75000,
                    password: await bcrypt.hash('admin123', 10),
                    isActive: true
                },
                {
                    naam: 'Test User',
                    email: 'user@example.com',
                    telefoon: '06-87654321',
                    functie: 'Employee',
                    afdeling: 'General',
                    rol: 'user',
                    startdatum: new Date('2021-01-15'),
                    salaris: 45000,
                    password: await bcrypt.hash('user123', 10),
                    isActive: true
                }
            ];
            await Employee.insertMany(defaultEmployees);
            console.log('Default employees created');
        }

        console.log('Seed data initialization completed');
    } catch (error) {
        console.error('Error initializing seed data:', error);
    }
}

// Connect to database
connectDB().then((connected) => {
    if (connected) {
        console.log('Database configuration loaded');
        // Initialize seed data after successful connection
        initializeSeedData();
    } else {
        console.log('Server starting without database connection');
        initializeFallbackData();
    }
}).catch(error => {
    console.error('Database connection failed:', error);
    console.log('Server starting without database connection');
    initializeFallbackData();
});

// Fallback function for when database is not available
function initializeFallbackData() {
    console.log('Using in-memory data storage as fallback');
    
    // Initialize default roles
    roles = [
        {
            _id: '1',
            naam: 'admin',
            beschrijving: 'Administrator role with full access',
            machtigingen: ['create', 'read', 'update', 'delete', 'admin'],
            actief: true
        },
        {
            _id: '2',
            naam: 'user',
            beschrijving: 'Standard user role',
            machtigingen: ['read', 'update'],
            actief: true
        }
    ];
    
    // Initialize default employees with hashed passwords
    werknemers = [
        {
            _id: '1',
            naam: 'Admin User',
            email: 'admin@example.com',
            telefoon: '06-12345678',
            functie: 'Administrator',
            afdeling: 'IT',
            rol: 'admin',
            startdatum: new Date('2020-01-15'),
            salaris: 75000,
            password: '$2a$10$LTzfeNuSvcyAWK0yPYBRMeJu2sLYOcasuCuOw9VbHHGqi4S/9nsWG', // admin123
            isActive: true,
            createdAt: new Date()
        },
        {
            _id: '2',
            naam: 'Test User',
            email: 'user@example.com',
            telefoon: '06-87654321',
            functie: 'Employee',
            afdeling: 'General',
            rol: 'user',
            startdatum: new Date('2021-01-15'),
            salaris: 45000,
            password: '$2a$10$NRgBuLmeJkOWNNaHPGWwpekzfE27xPOoMpyN25IndRVvV/7Ie28PG', // user123
            isActive: true,
            createdAt: new Date()
        }
    ];
    
    console.log('Fallback data initialized with default users');
}

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: 'healthcare-admin-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash messages
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
  // look in query string
  if (req.query && req.query._method) {
    return req.query._method
  }
}));

// Debug logging for all requests
app.use((req, res, next) => {
    if (req.body && req.body._method) {
        console.log(`🔄 Method override: ${req.body._method}`);
    }
    if (req.method === 'POST' && req.body._method === 'DELETE') {
        console.log('DELETE request detected through method override');
    }

    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Passport configuration
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            // Try MongoDB first
            let user;
            try {
                user = await Employee.findOne({ email: email, isActive: true });
            } catch (dbError) {
                console.log('MongoDB not available, using in-memory data');
                // Fall back to in-memory data
                user = werknemers.find(emp => emp.email === email && emp.isActive);
            }
            
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            
            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
    try {
        let user;
        try {
            user = await Employee.findById(id);
        } catch (dbError) {
            console.log('MongoDB not available, using in-memory data for user deserialization');
            // Fall back to in-memory data
             user = werknemers.find(emp => emp._id === id);
             if (user && user.rol) {
                 // For string roles, just keep the role as is
                 // No need to populate since rol is already a string
                 user = { ...user };
             }
        }
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Add user info to all views
app.use(addUserToViews);



// In-memory data storage (fallback for development)
let werknemers = [];
let bestanden = [];
let roles = [];

// Routes

// Authentication routes
app.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('auth/login', { title: 'Inloggen' });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.redirect('/login');
        });
    });
});

app.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.redirect('/login');
        });
    });
});

// Dashboard (protected route)
app.get('/', requireAuth, (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        let totalEmployees, totalRoles, totalFiles, departments, newThisMonth, recentEmployees, departmentStats, userFiles;
        
        try {
            // Try MongoDB first
            totalEmployees = await Employee.countDocuments();
            totalRoles = await Role.countDocuments();
            totalFiles = await File.countDocuments();

            // Get departments count
            const departmentAggregation = await Employee.aggregate([
                { $group: { _id: '$afdeling' } },
                { $count: 'departments' }
            ]);
            departments = departmentAggregation.length > 0 ? departmentAggregation[0].departments : 0;
            
            // Get new employees this month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            newThisMonth = await Employee.countDocuments({
                startdatum: { $gte: startOfMonth }
            });
            
            // Get recent employees (only for admin users)
            if (req.user.rol === 'admin') {
                recentEmployees = await Employee.find()
                    .populate('rol')
                    .sort({ createdAt: -1 })
                    .limit(3);
            } else {
                recentEmployees = [];
            }
            
            // Get department stats
            const departmentStatsAgg = await Employee.aggregate([
                { $group: { _id: '$afdeling', count: { $sum: 1 } } }
            ]);
            departmentStats = departmentStatsAgg.reduce((acc, dept) => {
                acc[dept._id] = dept.count;
                return acc;
            }, {});
            
            // Get user's files count
            userFiles = await File.countDocuments({ eigenaar: req.user._id });
        } catch (dbError) {
            console.log('MongoDB not available, using in-memory data for dashboard');
            // Fall back to in-memory data
            totalEmployees = werknemers.length;
            totalRoles = roles.length;
            totalFiles = bestanden.length;
            
            // Get unique departments
            const uniqueDepts = [...new Set(werknemers.map(emp => emp.afdeling))];
            departments = uniqueDepts.length;
            
            // Get new employees this month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            newThisMonth = werknemers.filter(emp => 
                new Date(emp.startdatum) >= startOfMonth
            ).length;
            
            // Get recent employees with string roles (only for admin users)
            if (req.user.rol === 'admin') {
                recentEmployees = werknemers
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3)
                    .map(emp => ({
                        ...emp,
                        id: emp._id // Add virtual id field for template compatibility
                        // rol is already a string, no need to populate
                    }));
            } else {
                recentEmployees = [];
            }
            
            // Get department stats
            departmentStats = werknemers.reduce((acc, emp) => {
                acc[emp.afdeling] = (acc[emp.afdeling] || 0) + 1;
                return acc;
            }, {});
            
            // Get user's files count
            userFiles = bestanden.filter(file => file.eigenaar === req.user._id).length;
        }
        
        res.render('dashboard', {
            user: req.user,
            stats: {
                totalEmployees,
                totalRoles,
                departments,
                newThisMonth,
                recentEmployees,
                departmentStats,
                userFiles,
                totalFiles
            },
            title: 'Dashboard'
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
});

// Employee Routes (Admin only for management, users can view their own data)
app.get('/werknemers', requireAuth, async (req, res) => {
    try {
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'naam';
        const sortOrder = req.query.sortOrder || 'asc';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { naam: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { afdeling: { $regex: search, $options: 'i' } },
                    { functie: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        // If user is not admin, only show their own profile
        if (req.user.rol !== 'admin') {
            searchQuery._id = req.user._id;
        }
        
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        // Get total count for pagination
        const totalEmployees = await Employee.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalEmployees / limit);
        
        // Get paginated employees
        const employees = await Employee.find(searchQuery)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit);
        
        res.render('employees/index', {
            user: req.user,
            employees: employees,
            title: 'Werknemers',
            canAdd: req.user.rol === 'admin',
            canManage: req.user.rol === 'admin',
            search: search,
            sortBy: sortBy,
            sortOrder: sortOrder,
            currentPage: page,
            totalPages: totalPages,
            limit: limit,
            totalEmployees: totalEmployees
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).render('error', { message: 'Error loading employees' });
    }
});

app.get('/werknemers/nieuw', requireAdmin, async (req, res) => {
    try {
        const roles = await Role.find({ isActive: true });
        res.render('employees/new', { 
            roles, 
            title: 'Nieuwe Werknemer',
            availableRoles: ['admin', 'user']
        });
    } catch (error) {
        console.error('Error loading roles:', error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
});



app.post('/werknemers', requireAdmin, async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.naam || !req.body.email || !req.body.functie || !req.body.afdeling || !req.body.password) {
            req.flash('error', 'Alle verplichte velden moeten worden ingevuld.');
            return res.redirect('/werknemers/nieuw');
        }
        
        // Validate password length
        if (req.body.password.length < 6) {
            req.flash('error', 'Wachtwoord moet minimaal 6 karakters lang zijn.');
            return res.redirect('/werknemers/nieuw');
        }
        
        // Check if email already exists
        const existingEmployee = await Employee.findOne({ email: req.body.email });
        if (existingEmployee) {
            req.flash('error', 'Een werknemer met dit e-mailadres bestaat al.');
            return res.redirect('/werknemers/nieuw');
        }
        
        // Use admin-provided password (will be hashed by the model's pre-save hook)
        const userPassword = req.body.password;
        
        // Set role as string (default to 'user' for new employees)
        const userRole = req.body.rol || 'user';
        
        // Validate role
        if (!['admin', 'user'].includes(userRole)) {
            req.flash('error', 'Ongeldige rol geselecteerd.');
            return res.redirect('/werknemers/nieuw');
        }
        
        const newEmployee = new Employee({
            naam: req.body.naam,
            email: req.body.email,
            telefoon: req.body.telefoon || '',
            functie: req.body.functie,
            afdeling: req.body.afdeling,
            rol: userRole,
            startdatum: req.body.startdatum ? new Date(req.body.startdatum) : new Date(),
            salaris: parseInt(req.body.salaris) || 0,
            password: userPassword,
            isActive: true
        });
        
        await newEmployee.save();
        
        req.flash('success', `✅ Werknemer ${newEmployee.naam} is succesvol aangemaakt!<br>
                             📧 E-mail: ${newEmployee.email}<br>
                             👤 Rol: ${newEmployee.rol}<br>
                             💡 De werknemer kan nu inloggen met het opgegeven e-mail en wachtwoord.`);
        
        res.redirect('/werknemers');
        
    } catch (error) {
        console.error('Error creating employee:', error);
        req.flash('error', '❌ Er is een fout opgetreden bij het aanmaken van de werknemer. Probeer het opnieuw.');
        res.redirect('/werknemers/nieuw');
    }
});

app.get('/werknemers/:id', requireAuth, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).render('404');
        }
        
        // Check if user can view this employee
        if (req.user && req.user.rol !== 'admin' && req.user._id.toString() !== employee._id.toString()) {
            req.flash('error', 'Je hebt geen toegang tot deze gegevens.');
            return res.redirect('/werknemers');
        }
        
        // Get employee's files
        const employeeFiles = await File.find({ eigenaar: employee._id })
            .sort({ uploadDatum: -1 });
        
        res.render('employees/show', { 
            user: req.user,
            employee, 
            title: employee.naam,
            files: employeeFiles,
            canEdit: req.user ? (req.user.rol === 'admin' || req.user._id.toString() === employee._id.toString()) : true
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).render('error', { message: 'Error loading employee' });
    }
});

app.get('/werknemers/:id/bewerken', requireAdminOrSelf, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).render('404');
        }
        
        const roles = await Role.find({ isActive: true });
        
        res.render('employees/edit', { 
            employee, 
            roles, 
            title: 'Werknemer Bewerken',
            availableRoles: ['admin', 'user'],
            canChangeRole: req.user.rol === 'admin'
        });
    } catch (error) {
        console.error('Error loading employee for edit:', error);
        res.status(500).render('error', { message: 'Error loading employee' });
    }
});

app.put('/werknemers/:id', requireAdminOrSelf, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).render('404');
        }
        
        const updateData = {
            naam: req.body.naam,
            email: req.body.email,
            telefoon: req.body.telefoon,
            functie: req.body.functie,
            afdeling: req.body.afdeling,
            startdatum: req.body.startdatum ? new Date(req.body.startdatum) : employee.startdatum,
            salaris: parseInt(req.body.salaris) || employee.salaris
        };
        
        // Only admin can change role
        if (req.user.rol === 'admin' && req.body.rol) {
            // Validate role
            if (['admin', 'user'].includes(req.body.rol)) {
                updateData.rol = req.body.rol;
            }
        }
        
        // Handle password change (will be hashed by the model's pre-save hook)
        if (req.body.newPassword && req.body.newPassword.trim()) {
            updateData.password = req.body.newPassword;
        }
        
        // Check if email already exists (excluding current employee)
        const existingEmployee = await Employee.findOne({ 
            email: updateData.email, 
            _id: { $ne: req.params.id } 
        });
        if (existingEmployee) {
            req.flash('error', 'Een andere werknemer met dit e-mailadres bestaat al.');
            return res.redirect(`/werknemers/${req.params.id}/bewerken`);
        }
        
        // Update employee
        await Employee.findByIdAndUpdate(req.params.id, updateData);
        
        req.flash('success', `✅ Werknemergegevens voor ${updateData.naam} zijn succesvol bijgewerkt!`);
        res.redirect(`/werknemers/${req.params.id}`);
        
    } catch (error) {
        console.error('Error updating employee:', error);
        req.flash('error', 'Er is een fout opgetreden bij het bijwerken.');
        res.redirect(`/werknemers/${req.params.id}/bewerken`);
    }
});

// Test route to check if DELETE method is working
app.delete('/test-delete/:id', (req, res) => {
    console.log('🧪 TEST DELETE ROUTE HIT FOR ID:', req.params.id);
    res.json({ success: true, id: req.params.id });
});

app.delete('/werknemers/:id', requireAdmin, async (req, res) => {
    console.log('🗑️ DELETE REQUEST RECEIVED FOR ID:', req.params.id);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request body:', req.body);
    console.log('👤 Current user:', req.user ? req.user.email : 'No user');
    console.log('🔐 User role:', req.user ? req.user.rol : 'No role');
    
    try {
        console.log('🔍 Looking for employee with ID:', req.params.id);
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            console.log('❌ Employee not found, returning 404');
            return res.status(404).render('404');
        }
        
        console.log('✅ Employee found:', employee.naam);
        
        // Don't allow deleting yourself
        if (employee._id.toString() === req.user._id.toString()) {
            console.log('⚠️ User trying to delete themselves');
            req.flash('error', 'Je kunt jezelf niet verwijderen.');
            return res.redirect('/werknemers');
        }
        
        console.log('🗂️ Deleting employee files...');
        // Delete employee's files first
        const deletedFiles = await File.find({ eigenaar: employee._id });
        
        // Delete files from Cloudinary
        for (const file of deletedFiles) {
            try {
                if (file.cloudinaryPublicId) {
                    console.log(`☁️ Deleting file from Cloudinary: ${file.cloudinaryPublicId}`);
                    await deleteFromCloudinaryByPublicId(file.cloudinaryPublicId);
                    console.log(`✅ Successfully deleted from Cloudinary: ${file.bestandsnaam}`);
                }
            } catch (cloudinaryError) {
                console.error(`❌ Failed to delete from Cloudinary: ${file.bestandsnaam}`, cloudinaryError);
                // Continue with other files even if one fails
            }
        }
        
        // Delete files from database
        await File.deleteMany({ eigenaar: employee._id });
        console.log(`📁 Deleted ${deletedFiles.length} files from database and Cloudinary`);
        
        console.log('🗑️ Deleting employee from database...');
        // Delete the employee
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        console.log('✅ Employee deleted successfully:', deletedEmployee ? 'Yes' : 'No');
        
        req.flash('success', `✅ Werknemer ${employee.naam} is succesvol verwijderd!<br>
                             📁 Bestanden: ${deletedFiles.length} bestand(en) verwijderd`);
        
        console.log('↩️ Redirecting to /werknemers');
        res.redirect('/werknemers');
        
    } catch (error) {
        console.error('❌ Error deleting employee:', error);
        req.flash('error', 'Er is een fout opgetreden bij het verwijderen.');
        res.redirect('/werknemers');
    }
});

// Role Routes (Admin only)
app.get('/rollen', requireAdmin, (req, res) => {
    res.render('roles/index', { 
        roles, 
        title: 'Rollen',
        canManage: true
    });
});

app.get('/rollen/nieuw', requireAdmin, (req, res) => {
    res.render('roles/new', { title: 'Nieuwe Rol' });
});

app.post('/rollen', requireAdmin, (req, res) => {
    try {
        const newRole = {
            id: uuidv4(),
            naam: req.body.naam,
            beschrijving: req.body.beschrijving,
            machtigingen: Array.isArray(req.body.machtigingen) ? req.body.machtigingen : [req.body.machtigingen].filter(Boolean)
        };
        roles.push(newRole);
        
        req.flash('success', `Rol ${newRole.naam} is aangemaakt.`);
        res.redirect('/rollen');
        
    } catch (error) {
        console.error('Error creating role:', error);
        req.flash('error', 'Er is een fout opgetreden bij het aanmaken van de rol.');
        res.redirect('/rollen/nieuw');
    }
});

app.get('/rollen/:id', requireAdmin, (req, res) => {
    const role = roles.find(r => r.id === req.params.id);
    if (!role) {
        return res.status(404).render('404');
    }
    res.render('roles/show', { 
        role, 
        title: role.naam,
        canEdit: true
    });
});

app.get('/rollen/:id/bewerken', requireAdmin, (req, res) => {
    const role = roles.find(r => r.id === req.params.id);
    if (!role) {
        return res.status(404).render('404');
    }
    res.render('roles/edit', { 
        role, 
        title: 'Rol Bewerken'
    });
});

app.put('/rollen/:id', requireAdmin, (req, res) => {
    try {
        const index = roles.findIndex(r => r.id === req.params.id);
        if (index === -1) {
            return res.status(404).render('404');
        }
        
        const updateData = {
            naam: req.body.naam,
            beschrijving: req.body.beschrijving,
            machtigingen: Array.isArray(req.body.machtigingen) ? req.body.machtigingen : [req.body.machtigingen].filter(Boolean)
        };
        
        roles[index] = { ...roles[index], ...updateData };
        
        req.flash('success', 'Rol is bijgewerkt.');
        res.redirect(`/rollen/${req.params.id}`);
        
    } catch (error) {
        console.error('Error updating role:', error);
        req.flash('error', 'Er is een fout opgetreden bij het bijwerken.');
        res.redirect(`/rollen/${req.params.id}/bewerken`);
    }
});

app.delete('/rollen/:id', requireAdmin, (req, res) => {
    try {
        const index = roles.findIndex(r => r.id === req.params.id);
        if (index === -1) {
            return res.status(404).render('404');
        }
        
        const deletedRole = roles[index];
        roles.splice(index, 1);
        
        req.flash('success', `Rol ${deletedRole.naam} is verwijderd.`);
        res.redirect('/rollen');
        
    } catch (error) {
        console.error('Error deleting role:', error);
        req.flash('error', 'Er is een fout opgetreden bij het verwijderen.');
        res.redirect('/rollen');
    }
});

// File Management Routes (Admin only for upload, users can view their own files)
app.get('/bestanden', requireAuth, async (req, res) => {
    try {
        console.log('📂 Files page requested by user:', req.user.email);
        
        let query = {};
        
        // If user is not admin, only show their own files
        if (req.user.rol !== 'admin') {
            query.eigenaar = req.user._id;
            console.log('👤 User files only for:', req.user._id);
        }
        
        const files = await File.find(query)
            .populate('eigenaar', 'naam email')
            .sort({ uploadDatum: -1 });
        
        console.log('📊 Files to display:', files.length);
        
        res.render('files/index', {
            files: files,
            title: 'Bestanden',
            canUpload: req.user.rol === 'admin',
            canManage: req.user.rol === 'admin',
            getFileIcon: getFileIcon,
            formatFileSize: formatFileSize
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).render('error', { message: 'Error loading files' });
    }
});

app.get('/bestanden/uploaden', requireAdmin, async (req, res) => {
    try {
        const employees = await Employee.find({ isActive: true }).sort({ naam: 1 });
        console.log('Employees found for upload dropdown:', employees.length);
        
        res.render('files/upload', {
            title: 'Bestanden Uploaden',
            employees: employees
        });
    } catch (error) {
        console.error('Error loading employees for upload:', error);
        res.status(500).render('error', { message: 'Error loading upload form' });
    }
});

// File upload route for individual employees
app.post('/werknemers/:id/upload', requireAuth, upload.single('file'), async (req, res) => {
    console.log('File upload route hit for employee:', req.params.id);
    console.log('File info:', req.file);
    
    try {
        if (!req.file) {
            req.flash('error', 'Geen bestand geselecteerd.');
            return res.redirect(`/werknemers/${req.params.id}`);
        }
        
        // Find the employee
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            req.flash('error', 'Werknemer niet gevonden.');
            return res.redirect('/werknemers');
        }
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinaryFromFile(req.file);
        
        // Create file record in MongoDB
        const newFile = new File({
            naam: req.file.originalname,
            originalName: req.file.originalname,
            eigenaar: employee._id,
            uploadDatum: new Date(),
            grootte: uploadResult.size,
            type: uploadResult.type,
            cloudinaryPublicId: uploadResult.cloudinaryPublicId,
            cloudinaryUrl: uploadResult.cloudinaryUrl,
            downloadUrl: uploadResult.downloadUrl
        });
        
        await newFile.save();
        
        console.log('File uploaded successfully:', newFile.naam);
        req.flash('success', `Bestand ${req.file.originalname} is succesvol geüpload.`);
        res.redirect(`/werknemers/${req.params.id}`);
        
    } catch (error) {
        console.error('File upload error:', error);
        req.flash('error', 'Er is een fout opgetreden bij het uploaden van het bestand.');
        res.redirect(`/werknemers/${req.params.id}`);
    }
});

app.post('/bestanden/uploaden', requireAdmin, upload.array('files', 5), async (req, res) => {
    console.log('🚀 POST /bestanden/uploaden route triggered!');
    console.log('📁 File upload started by admin:', req.user.email);
    console.log('📋 Number of files received:', req.files ? req.files.length : 0);
    console.log('📦 Request headers:', {
        'content-type': req.headers['content-type'],
        'x-requested-with': req.headers['x-requested-with'],
        'accept': req.headers.accept
    });
    console.log('📝 Request body keys:', Object.keys(req.body));
    
    // Check if this is an AJAX request
    const isAjax = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data') && 
                   req.headers['x-requested-with'] === 'XMLHttpRequest' || 
                   req.headers.accept && req.headers.accept.includes('application/json');
    
    console.log('🔍 AJAX detection result:', isAjax);
    
    try {
        if (!req.files || req.files.length === 0) {
            console.log('❌ No files selected for upload');
            if (isAjax) {
                return res.status(400).json({
                    success: false,
                    error: 'Geen bestanden geselecteerd',
                    details: 'Selecteer minimaal één bestand om te uploaden'
                });
            }
            req.flash('error', '❌ Geen bestanden geselecteerd. Selecteer minimaal één bestand.');
            return res.redirect('/bestanden/uploaden');
        }
        
        if (!req.body.eigenaar) {
            console.log('❌ No owner selected');
            if (isAjax) {
                return res.status(400).json({
                    success: false,
                    error: 'Geen eigenaar geselecteerd',
                    details: 'Selecteer een eigenaar voor de bestanden'
                });
            }
            req.flash('error', '❌ Geen eigenaar geselecteerd.');
            return res.redirect('/bestanden/uploaden');
        }
        
        console.log('📂 Files to upload:', req.files.map(f => `${f.originalname} (${f.size} bytes)`));
        
        let successCount = 0;
        let failedFiles = [];
        let uploadedFiles = [];
        
        const uploadPromises = req.files.map(async (file) => {
            try {
                console.log(`🔄 Uploading file: ${file.originalname} to Cloudinary`);
                const uploadResult = await uploadToCloudinaryFromFile(file);
                console.log(`✅ Successfully uploaded: ${file.originalname} to Cloudinary`);
                console.log(`📊 Cloudinary URL: ${uploadResult.cloudinaryUrl}`);
                
                // Find owner employee
                const ownerId = req.body.eigenaar;
                const owner = await Employee.findById(ownerId);
                if (!owner) {
                    throw new Error(`Owner with ID ${ownerId} not found`);
                }
                
                const newFile = new File({
                    naam: file.originalname,
                    originalName: file.originalname,
                    eigenaar: owner._id,
                    uploadDatum: new Date(),
                    grootte: uploadResult.size,
                    type: uploadResult.type,
                    cloudinaryPublicId: uploadResult.cloudinaryPublicId,
                    cloudinaryUrl: uploadResult.cloudinaryUrl,
                    downloadUrl: uploadResult.downloadUrl
                });
                
                await newFile.save();
                successCount++;
                console.log(`💾 File ${file.originalname} saved to MongoDB with ID: ${newFile._id}`);
                
                uploadedFiles.push({
                    name: file.originalname,
                    size: uploadResult.size,
                    cloudinaryUrl: uploadResult.cloudinaryUrl,
                    owner: owner.naam
                });
                
                return newFile;
            } catch (fileError) {
                console.error(`❌ Error uploading file ${file.originalname}:`, fileError);
                failedFiles.push({
                    name: file.originalname,
                    error: fileError.message
                });
                return null;
            }
        });
        
        await Promise.all(uploadPromises);
        
        console.log(`📊 Upload completed: ${successCount}/${req.files.length} files successful`);
        if (failedFiles.length > 0) {
            console.log('❌ Failed files:', failedFiles.map(f => f.name));
        }
        
        // Return JSON response for AJAX requests
        if (isAjax) {
            if (successCount === req.files.length) {
                console.log('🎉 All files uploaded successfully to Cloudinary!');
                return res.json({
                    success: true,
                    message: 'Alle bestanden succesvol geüpload',
                    details: {
                        totalFiles: req.files.length,
                        successCount: successCount,
                        failedCount: failedFiles.length,
                        uploadedFiles: uploadedFiles,
                        cloudinaryStatus: 'All files uploaded to Cloudinary successfully'
                    }
                });
            } else if (successCount > 0) {
                console.log('⚠️ Partial upload success');
                return res.status(207).json({
                    success: false,
                    message: 'Gedeeltelijk succesvol',
                    details: {
                        totalFiles: req.files.length,
                        successCount: successCount,
                        failedCount: failedFiles.length,
                        uploadedFiles: uploadedFiles,
                        failedFiles: failedFiles,
                        cloudinaryStatus: `${successCount} files uploaded, ${failedFiles.length} failed`
                    }
                });
            } else {
                console.log('💥 All files failed to upload');
                return res.status(500).json({
                    success: false,
                    error: 'Alle uploads mislukt',
                    details: {
                        totalFiles: req.files.length,
                        successCount: 0,
                        failedCount: failedFiles.length,
                        failedFiles: failedFiles,
                        cloudinaryStatus: 'All Cloudinary uploads failed'
                    }
                });
            }
        }
        
        // Traditional form submission - use flash messages and redirect
        if (successCount === req.files.length) {
            console.log('🎉 All files uploaded successfully!');
            req.flash('success', `✅ Alle ${successCount} bestand(en) zijn succesvol geüpload naar Cloudinary!<br>
                                 📁 Bestanden zijn nu beschikbaar in het systeem.`);
        } else if (successCount > 0) {
            console.log('⚠️ Partial upload success');
            req.flash('warning', `⚠️ ${successCount} van ${req.files.length} bestand(en) succesvol geüpload.<br>
                                  ❌ Mislukte bestanden: ${failedFiles.map(f => f.name).join(', ')}`);
        } else {
            console.log('💥 All files failed to upload');
            req.flash('error', `❌ Alle bestanden zijn mislukt bij het uploaden.<br>
                               📋 Mislukte bestanden: ${failedFiles.map(f => f.name).join(', ')}`);
        }
        
        res.redirect('/bestanden');
        
    } catch (error) {
        console.error('Error uploading files:', error);
        
        if (isAjax) {
            return res.status(500).json({
                success: false,
                error: 'Server fout',
                details: {
                    message: error.message,
                    cloudinaryStatus: 'Upload process failed before reaching Cloudinary'
                }
            });
        }
        
        req.flash('error', '❌ Er is een onverwachte fout opgetreden bij het uploaden. Probeer het opnieuw.');
        res.redirect('/bestanden/uploaden');
    }
});

app.get('/bestanden/:id/download', requireAuth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id).populate('eigenaar');
        if (!file) {
            req.flash('error', 'Bestand niet gevonden.');
            return res.redirect('/bestanden');
        }
        
        // Check if user can access this file
        if (req.user.rol !== 'admin' && file.eigenaar._id.toString() !== req.user._id.toString()) {
            req.flash('error', 'Je hebt geen toegang tot dit bestand.');
            return res.redirect('/bestanden');
        }
        
        // Use existing download URL or generate a new one
        let downloadUrl = file.downloadUrl;
        if (!downloadUrl && file.cloudinaryPublicId) {
            downloadUrl = generateCloudinaryDownloadUrl(file.cloudinaryPublicId);
        }
        
        if (downloadUrl) {
            res.redirect(downloadUrl);
        } else {
            req.flash('error', 'Download URL niet beschikbaar.');
            res.redirect('/bestanden');
        }
        
    } catch (error) {
        console.error('Error downloading file:', error);
        req.flash('error', 'Er is een fout opgetreden bij het downloaden.');
        res.redirect('/bestanden');
    }
});

app.delete('/bestanden/:id', requireAdmin, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            req.flash('error', 'Bestand niet gevonden.');
            return res.redirect('/bestanden');
        }
        
        // Delete from Cloudinary
        if (file.cloudinaryPublicId) {
            await deleteFromCloudinaryByPublicId(file.cloudinaryPublicId);
        }
        
        // Remove from MongoDB
        await File.findByIdAndDelete(req.params.id);
        
        req.flash('success', `Bestand ${file.naam} is verwijderd.`);
        res.redirect('/bestanden');
        
    } catch (error) {
        console.error('Error deleting file:', error);
        req.flash('error', 'Er is een fout opgetreden bij het verwijderen.');
        res.redirect('/bestanden');
    }
});

// Upload error handling middleware
app.use(handleUploadError);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Pagina Niet Gevonden' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  console.log('🚀 Server is now listening for requests...');
});

// module.exports = app; // Commented out to prevent script from exiting