import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Heading from '../components/Heading.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    try {
      const data = await api.getHistory(token);
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteHistory(token, id);
      setHistory(history.filter(entry => entry._id !== id));
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const getBoxColor = (newsCorrect, formatCorrect) => {
    if (newsCorrect && formatCorrect) return 'bg-green-500';
    if (newsCorrect && !formatCorrect) return 'bg-yellow-300';
    if (!newsCorrect && formatCorrect) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getBulletColor = (newsCorrect) => {
    return newsCorrect ? 'bg-green-600' : 'bg-red-600';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFirstLine = (text) => {
    const firstLine = text.split('\n')[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{
      backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/newsPaperBackground.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <div className="max-w-4xl mx-auto">
        <Heading>Validity Check History</Heading>

        {history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-xl text-gray-600">No history yet</p>
            <p className="text-gray-500 mt-2">Check some articles to see your history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry._id}
                className={`${getBoxColor(
                  entry.news_correct,
                  entry.format_correct
                )} text-white rounded-xl shadow-lg p-6 relative`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`${getBulletColor(
                      entry.news_correct
                    )} w-4 h-4 rounded-full flex-shrink-0 mt-1`}
                  />
                  <div className="flex-1">
                    <p className="text-lg font-medium">{getFirstLine(entry.article)}</p>
                  </div>
                  <div className="text-right text-sm flex items-center gap-3">
                    <p className="font-medium">{formatDate(entry.createdAt)}</p>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
