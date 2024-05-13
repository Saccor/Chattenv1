// middleware/isAuthenticated.js

/**
 * Middleware to check if the user is authenticated.
 * @param {Request} req - The express request object.
 * @param {Response} res - The express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'User not authenticated' });
};

export default isAuthenticated;
