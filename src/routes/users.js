const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Redirect /api/users/:id to /api/employees/:id
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const newUrl = `/api/employees/${id}`;
  console.log(`Redirecting PUT /api/users/${id} to ${newUrl}`);
  req.url = newUrl;
  req.app.handle(req, res);
});

module.exports = router;
