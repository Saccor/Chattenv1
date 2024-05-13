import express from 'express';
import passport from 'passport';

const router = express.Router();

// Define authentication routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login/failure' }),
  (req, res) => {
    console.log('Google OAuth callback received.');
    console.log('Authenticated user:', req.user);
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
      const homeURL = process.env.NODE_ENV === 'production' ? 'https://chattenv1.vercel.app' : 'http://localhost:3000';
      res.clearCookie('connect.sid', { path: '/' });
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
