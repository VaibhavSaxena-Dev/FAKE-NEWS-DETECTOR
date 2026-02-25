import express from 'express';
import jwt from 'jsonwebtoken';
import History from '../models/History.js';

const router = express.Router();

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/', authenticate, async (req, res) => {
  try {
    const { article, news_correct, format_correct, fact_check, language_quality } = req.body;
    const history = new History({
      user_id: req.userId,
      article,
      news_correct,
      format_correct,
      fact_check,
      language_quality,
    });
    await history.save();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const history = await History.find({ user_id: req.userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const history = await History.findOneAndDelete({ _id: req.params.id, user_id: req.userId });
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }
    res.json({ message: 'History deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
