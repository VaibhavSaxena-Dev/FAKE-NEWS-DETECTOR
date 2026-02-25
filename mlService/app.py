from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import os
from dotenv import load_dotenv
from google import genai

# ===============================
# Load Environment Variables
# ===============================

load_dotenv()

# ===============================
# Flask Setup
# ===============================

app = Flask(__name__)
CORS(app)

# ===============================
# Load Structural ML Model
# ===============================

model = joblib.load('structuralModel/fake_news_model.pkl')
vectorizer = joblib.load('structuralModel/vectorizer.pkl')

# ===============================
# Gemini Setup
# ===============================

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# ===============================
# Text Cleaning Function
# ===============================

def wordopt(text):
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d', '', text)
    text = re.sub(r'\n', ' ', text)
    return text.strip()

# ===============================
# Prediction Route
# ===============================

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        if len(text.strip().split()) < 10:
            fact_check_result = check_facts(text)
            return jsonify({
                'prediction': 'Fake',
                'confidence': 0.95,
                'text': text,
                'factCheck': fact_check_result
            })

        # Structural Model Prediction
        cleaned_text = wordopt(text)
        text_vectorized = vectorizer.transform([cleaned_text])
        prediction = model.predict(text_vectorized)[0]
        confidence = model.predict_proba(text_vectorized)[0]

        # Fact Checking with Gemini
        fact_check_result = check_facts(text)

        result = {
            'prediction': 'Real' if prediction == 1 else 'Fake',
            'confidence': float(max(confidence)),
            'text': text,
            'factCheck': fact_check_result
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# Gemini Fact Checking Function
# ===============================

def check_facts(text):
    print("\n=== FACT CHECK STARTED ===")
    print(f"Text length: {len(text)}")
    
    prompt = f"""Analyze the following text and determine if the facts are TRUE, FALSE, or INSUFFICIENT_INFORMATION.

Respond ONLY in this format:
Verdict: [TRUE/FALSE/INSUFFICIENT_INFORMATION]
Reason: [Brief explanation]

Text: {text}"""

    try:
        print("Calling Gemini API...")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        print("Gemini API responded successfully")
        response_text = response.text.strip()
        print(f"Response: {response_text}")

        verdict = "INSUFFICIENT_INFORMATION"
        reason = "Unable to analyze"

        lines = [line.strip() for line in response_text.split('\n') if line.strip()]
        for line in lines:
            if "Verdict:" in line:
                verdict = line.split("Verdict:")[1].strip()
                print(f"Found verdict: {verdict}")
            elif "Reason:" in line:
                reason = line.split("Reason:")[1].strip()
                print(f"Found reason: {reason}")

        result = {
            "verdict": verdict,
            "reason": reason
        }
        print(f"Final result: {result}")
        print("=== FACT CHECK COMPLETED ===")
        return result

    except Exception as e:
        print("Gemini API Error:", str(e))
        import traceback
        traceback.print_exc()
        return {
            "verdict": "INSUFFICIENT_INFORMATION",
            "reason": "Fact-checking service temporarily unavailable"
        }

# ===============================
# Run Server
# ===============================

if __name__ == '__main__':
    app.run(port=8000, debug=True)


# checks fact 