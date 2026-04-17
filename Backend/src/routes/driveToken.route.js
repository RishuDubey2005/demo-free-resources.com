const express = require('express');
const c = require('../controllers/driveToken.controller.js');
const router = express.Router();

router.get('/all',                  c.getAllTokens);
router.get('/check/:label',         c.checkTokenStatus);
router.put('/update/:label',        c.updateRefreshToken);
router.get('/auth-url/:label',      c.getAuthUrl);
router.get('/auth-start/:label',    c.startOAuth);
router.get('/oauth-callback',       c.oauthCallback);   // Google redirects here
router.get('/seed',                 c.seedTokensFromEnv);

module.exports = router;