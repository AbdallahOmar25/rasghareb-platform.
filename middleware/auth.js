function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
}

function isAdminRole(role) {
  return ['primary_admin', 'secondary_admin', 'admin'].includes(role);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/auth/login');
    }
    const role = req.session.user.role;
    if (!roles.includes(role) && !(roles.includes('admin') && isAdminRole(role))) {
      return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    }
    next();
  };
}

function requirePrimaryAdmin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'primary_admin') {
    return res.status(403).render('errors/404', { message_key: 'not_authorized' });
  }
  next();
}

function requireAdminPermission(permission) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/auth/login');
    }
    const user = req.session.user;
    if (user.role === 'primary_admin') return next();
    if (user.role === 'secondary_admin' && Array.isArray(user.permissions) && user.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).render('errors/404', { message_key: 'not_authorized' });
  };
}

module.exports = { requireAuth, requireRole, requirePrimaryAdmin, requireAdminPermission, isAdminRole };
