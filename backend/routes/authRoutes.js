import express from 'express';
import passport from 'passport';

const router = express.Router();

// Utility middleware to ensure CORS headers are sent correctly
// Ideally, you might use the npm package cors for more comprehensive handling
const attachCORSHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Allow frontend domain
  res.header('Access-Control-Allow-Credentials', 'true'); // Crucial for cookies to work
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
};

// Pre-route middleware to attach CORS headers
router.use(attachCORSHeaders);

// Define authentication routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login/failure' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('http://localhost:3000/chat');
    }
);

router.get('/login/failure', (req, res) => {
    // Consider setting the status code for more explicit error handling
    res.status(401).send('Failed to authenticate');
});

router.get('/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      // Ensure the response is not cached
      res.clearCookie('connect.sid', { path: '/' }); // adjust this according to your session cookie settings
      res.redirect('http://localhost:3000');
    });
});

router.get('/check', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user });
    } else {
        res.json({ isAuthenticated: false });
    }
});

export default router;
