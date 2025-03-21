import express from 'express';

const router = express.Router();
router.get('/welcome', (req, res) => {
  res.json(
    'Hello, There! Welcome, this is Education-portal  project.'
  );
});

export default router;