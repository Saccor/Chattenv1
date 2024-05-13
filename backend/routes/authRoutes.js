import express from 'express';
import passport from 'passport';

const router = express.Router();

// Utility middleware to ensure CORS headers are sent correctly
// Ideally, you might use the npm package cors for more comprehensive handling
const attachCORSHeaders = (req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'https://chattenv1.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin); // Dynamic origin setting
  }
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
        const redirectURL = process.env.NODE_ENV === 'production' ? 'https://chattenv1.vercel.app/chat' : 'http://localhost:3000/chat';
        res.redirect(redirectURL);
    }
);

router.get('/login/failure', (req, res) => {
    res.status(401).send('Failed to authenticate');
});

router.get('/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      // Ensure the response is not cached
      const homeURL = process.env.NODE_ENV === 'production' ? 'https://chattenv1.vercel.app' : 'http://localhost:3000';
      res.clearCookie('connect.sid', { path: '/' }); // Adjust this according to your session cookie settings
      res.redirect(homeURL);
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
