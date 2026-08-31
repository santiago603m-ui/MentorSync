export const verificarRol = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Información de rol ausente.'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso prohibido. El rol '${req.user.rol}' no tiene permisos para este recurso.`
      });
    }

    next();
  };
};