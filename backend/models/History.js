import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  article: {
    type: String,
    required: true,
  },
  news_correct: {
    type: Boolean,
    required: true,
  },
  format_correct: {
    type: Boolean,
    required: true,
  },
  fact_check: {
    type: Boolean,
    required: true,
  },
  language_quality: {
    type: Boolean,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('History', historySchema);
