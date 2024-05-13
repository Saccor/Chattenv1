import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login/failure' }),
  (req, res) => {
    console.log('Google OAuth callback received.');
    console.log('Authenticated user:', req.user);

    // Create a session token or use the existing session
    const sessionToken = req.sessionID;

    const redirectURL = process.env.NODE_ENV === 'production' ? 'https://chattenv1.vercel.app/chat' : 'http://localhost:3000/chat';
    
    // Include the token in the response
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.redirect(redirectURL);
  }
);

router.get('/login/failure', (req, res) => {
  res.status(401).send('Failed to authenticate');
});

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid', { path: '/' });
      const homeURL = process.env.NODE_ENV === 'production' ? 'https://chattenv1.vercel.app/login' : 'http://localhost:3000/login';
      res.redirect(homeURL);
    });
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
