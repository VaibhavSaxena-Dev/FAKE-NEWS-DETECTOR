from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()


app = Flask(__name__)
CORS(app)



model = joblib.load('structuralModel/fake_news_model_opt.pkl')
vectorizer = joblib.load('structuralModel/vectorizer_opt.pkl')



client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
gemini_ready = False



def wordopt(text):
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d', '', text)
    text = re.sub(r'\n', ' ', text)
    return text.strip()



@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ready', 'model_loaded': model is not None})

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

       
        cleaned_text = wordopt(text)
        text_vectorized = vectorizer.transform([cleaned_text])
        prediction = model.predict(text_vectorized)[0]
        confidence = model.predict_proba(text_vectorized)[0]

       
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




def check_facts(text, max_retries=3):
    global gemini_ready
    print("\n=== FACT CHECK STARTED ===")
    print(f"Text length: {len(text)}")
    
    prompt = f"""Analyze ALL claims in the following text and determine if the facts are TRUE, FALSE, or INSUFFICIENT_INFORMATION.

IMPORTANT: If the text contains multiple claims, evaluate the OVERALL truthfulness. If ANY claim is false, the verdict should be FALSE.

Respond ONLY in this format:
Verdict: [TRUE/FALSE/INSUFFICIENT_INFORMATION]
Reason: [Brief explanation addressing ALL claims]

Text: {text}"""

    for attempt in range(max_retries):
        try:
            print(f"Calling Gemini API... (Attempt {attempt + 1}/{max_retries})")
            response = client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt
            )
            gemini_ready = True
            print("Gemini API responded successfully")
            response_text = response.text.strip()
            print(f"Response: {response_text}")

            verdict = "INSUFFICIENT_INFORMATION"
            reason = "Unable to analyze"

            lines = [line.strip() for line in response_text.split('\n') if line.strip()]
            
            # Collect all lines after finding Verdict
            verdict_found = False
            reason_lines = []
            
            for line in lines:
                if "Verdict:" in line:
                    verdict = line.split("Verdict:", 1)[1].strip()
                    verdict_found = True
                    print(f"Found verdict: {verdict}")
                elif "Reason:" in line and verdict_found:
                    # Get everything after "Reason:"
                    reason_lines.append(line.split("Reason:", 1)[1].strip())
                elif verdict_found and reason_lines:
                    # Continue collecting reason lines
                    reason_lines.append(line)
            
            if reason_lines:
                reason = ' '.join(reason_lines)

            result = {
                "verdict": verdict,
                "reason": reason
            }
            print(f"Final result: {result}")
            print("=== FACT CHECK COMPLETED ===")
            return result

        except Exception as e:
            print(f"Gemini API Error (Attempt {attempt + 1}/{max_retries}):", str(e))
            if attempt < max_retries - 1:
                import time
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                import traceback
                traceback.print_exc()
                return {
                    "verdict": "INSUFFICIENT_INFORMATION",
                    "reason": "Fact-checking service temporarily unavailable"
                }


if __name__ == '__main__':
    app.run(port=8000, debug=True)


# checks fact 