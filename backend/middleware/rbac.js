// Usage: rbac('FleetManager', 'SafetyOfficer')
function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Your role (${req.user.role}) cannot perform this action.` });
    }
    next();
  };
}

module.exports = rbac;
