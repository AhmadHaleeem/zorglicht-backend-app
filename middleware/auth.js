const bcrypt = require('bcryptjs');

// Helper function to get role name from user object
function getUserRole(user) {
    if (!user || !user.rol) return null;
    // If rol is an object (populated), return the naam property
    if (typeof user.rol === 'object' && user.rol.naam) {
        return user.rol.naam;
    }
    // If rol is a string (fallback data), return it directly
    if (typeof user.rol === 'string') {
        return user.rol;
    }
    return null;
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Je moet ingelogd zijn om deze pagina te bekijken.');
    res.redirect('/login');
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
    console.log('🛡️ Checking for admin access...');
    console.log('   - Is authenticated:', req.isAuthenticated());
    if (req.user) {
        console.log('   - User role:', getUserRole(req.user));
    } else {
        console.log('   - User object is missing.');
    }

    if (req.isAuthenticated() && req.user && getUserRole(req.user) === 'admin') {
        console.log('✅ Access granted.');
        return next();
    } else {
        console.log('❌ Access denied. Redirecting...');
        req.flash('error', 'Je hebt geen toegang tot deze pagina. Alleen administrators kunnen deze actie uitvoeren.');
        return res.redirect('/dashboard');
    }
}

// Middleware to check if user is admin or accessing their own data
function requireAdminOrSelf(req, res, next) {
    if (req.isAuthenticated() && req.user) {
        const isAdmin = getUserRole(req.user) === 'admin';
        const isAccessingOwnData = req.params.id && req.params.id === req.user._id.toString();
        
        // Allow admin users or users accessing their own data
        if (isAdmin || isAccessingOwnData) {
            return next();
        }
    }
    
    req.flash('error', 'Je hebt geen toegang tot deze actie. Je kunt alleen je eigen gegevens bewerken.');
    return res.redirect('/dashboard');
}

// Middleware to redirect authenticated users away from login page
function redirectIfAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    next();
}

// Hash password function
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

// Compare password function
async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

// Generate random password
function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Add user info to all views
function addUserToViews(req, res, next) {
    res.locals.currentUser = req.user || null;
    res.locals.isAdmin = req.user && getUserRole(req.user) === 'admin';
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error'),
        warning: req.flash('warning'),
        info: req.flash('info')
    };
    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireAdminOrSelf,
    redirectIfAuthenticated,
    hashPassword,
    comparePassword,
    generateRandomPassword,
    addUserToViews
};