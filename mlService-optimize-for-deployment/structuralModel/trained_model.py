import pandas as pd
import re
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score


# -----------------------------
# 1️⃣ Load Dataset
# -----------------------------
true_df = pd.read_csv("../data/True.csv")
fake_df = pd.read_csv("../data/Fake.csv")

true_df["label"] = 1
fake_df["label"] = 0

news = pd.concat([true_df, fake_df], axis=0)

news.drop(["title", "subject", "date"], axis=1, inplace=True)

news = news.sample(frac=1, random_state=42).reset_index(drop=True)

print("Dataset loaded successfully.")
print("Total samples:", len(news))


# -----------------------------
# 2️⃣ Text Cleaning Function
# -----------------------------
def wordopt(text):
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d', '', text)
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'\b(reuters|washington|london|new york)\b', '', text)
    return text.strip()


news["text"] = news["text"].apply(wordopt)


# -----------------------------
# 3️⃣ Features & Labels
# -----------------------------
X = news["text"]
y = news["label"]


# -----------------------------
# 4️⃣ Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# -----------------------------
# 5️⃣ OPTIMIZED Vectorization
# -----------------------------
vectorizer = TfidfVectorizer(
    stop_words="english",
    max_df=0.7,
    max_features=5000,     # LIMIT FEATURES (VERY IMPORTANT)
    ngram_range=(1, 1)     # REMOVE BIGRAMS (SAVES MEMORY)
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)


# -----------------------------
# 6️⃣ Train Model
# -----------------------------
model = LogisticRegression(
    C=1.0,
    max_iter=1000,
    solver="liblinear"
)

model.fit(X_train_vec, y_train)


# -----------------------------
# 7️⃣ Evaluate Model
# -----------------------------
y_pred = model.predict(X_test_vec)

print("Train Accuracy:", model.score(X_train_vec, y_train))
print("Test Accuracy:", model.score(X_test_vec, y_test))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))


# -----------------------------
# 8️⃣ Save Optimized Model
# -----------------------------
joblib.dump(model, "fake_news_model_opt.pkl", compress=3)
joblib.dump(vectorizer, "vectorizer_opt.pkl", compress=3)

print("\nOptimized model and vectorizer saved successfully.")