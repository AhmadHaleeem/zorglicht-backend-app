const bcrypt = require('bcryptjs');

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
        console.log('   - User role:', req.user.rol);
    } else {
        console.log('   - User object is missing.');
    }

    if (req.isAuthenticated() && req.user && req.user.rol === 'admin') {
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
        const isAdmin = req.user.rol === 'admin';
        
        // Only allow admin users for edit/delete operations
        if (isAdmin) {
            return next();
        }
    }
    
    req.flash('error', 'Je hebt geen toegang tot deze actie. Alleen administrators kunnen werknemers bewerken of verwijderen.');
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
    res.locals.isAdmin = req.user && req.user.rol === 'admin';
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