const validateUser = (req, res, next, handler) => {
  if (String(req.params.id) === String(req.user.id)) {
    return handler(req, res, next);
  }

  const error = new Error('Forbidden request');
  error.status = 403;
  return next(error);
};

module.exports = validateUser;