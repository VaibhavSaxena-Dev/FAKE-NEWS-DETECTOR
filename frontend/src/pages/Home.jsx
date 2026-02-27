import { useState, useEffect } from 'react';
import Heading from '../components/Heading.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api';

export default function Home() {
  const [article, setArticle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFirstRequest, setIsFirstRequest] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    // Warm up ML service on component mount
    const mlServiceUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';
    fetch(`${mlServiceUrl}/health`)
      .then(() => {
        console.log('ML service warmed up');
        setIsFirstRequest(false);
      })
      .catch(() => console.log('ML service not ready yet'));
  }, []);

  const checkArticle = async () => {
    if (!article.trim()) {
      alert('Please enter an article to check');
      return;
    }

    setLoading(true);

    try {
      const analysisResult = await api.analyzeArticle(article);
      console.log('API Response:', analysisResult);

      setResult(analysisResult);

      // Mark first request as complete
      setIsFirstRequest(false);

      if (user && token) {
        try {
          await api.createHistory(token, {
            article,
            news_correct: analysisResult.factCheck?.verdict === 'TRUE',
            format_correct: analysisResult.structure === 'Well-structured',
            fact_check: analysisResult.factCheck?.verdict === 'TRUE',
            language_quality: true,
          });
        } catch (error) {
          console.error('Error saving to history:', error);
        }
      }
    } catch (error) {
      console.error('Error analyzing article:', error);
      alert('Failed to analyze article. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-12 px-4"
     style={{
  backgroundImage:
    "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/newsPaperBackground.png')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}}
    >
      <div className="max-w-4xl mx-auto">
        <Heading>Fake News Detector</Heading>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700 text-center">
            Enter your article here
          </h2>

          <textarea
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder="Paste or type your article here..."
            className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-gray-700"
          />

          <button
            onClick={checkArticle}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (isFirstRequest ? 'Analyzing... (First request may take up to 3 minutes)' : 'Analyzing...') : 'Check'}
          </button>

          {result && (
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3">Results:</h3>
              <div className="space-y-2">
                <p className="text-lg">
                  <span className="font-semibold">Analysis:</span>{' '}
                  {result.structure || 'Analysis unavailable - please try again'}
                </p>
                <p className="text-lg">
                  <span className="font-semibold">Confidence:</span>{' '}
                  {result.confidence}%
                </p>
                {result.factCheck && (
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <p className="text-lg">
                      <span className="font-semibold">Fact Check:</span>{' '}
                      <span className={`font-bold ${
                        result.factCheck.verdict === 'TRUE' ? 'text-green-200' :
                        result.factCheck.verdict === 'FALSE' ? 'text-red-200' :
                        'text-yellow-200'
                      }`}>
                        {result.factCheck.verdict}
                      </span>
                    </p>
                    <p className="text-sm mt-2">
                      {result.factCheck.reason}
                    </p>
                  </div>
                )}
              </div>

              {!user && (
                <p className="mt-4 text-sm bg-white/20 p-3 rounded">
                  Login to save your check history
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
