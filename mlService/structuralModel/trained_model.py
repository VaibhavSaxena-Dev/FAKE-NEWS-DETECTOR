import pandas as pd
import re
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score


# -----------------------------
#  1 Load Dataset
# -----------------------------
true_df = pd.read_csv("../data/True.csv")
fake_df = pd.read_csv("../data/Fake.csv")

true_df["label"] = 1
fake_df["label"] = 0

# Combine datasets
news = pd.concat([true_df, fake_df], axis=0)

# Drop unnecessary columns
news.drop(["title", "subject", "date"], axis=1, inplace=True)

# Shuffle properly
news = news.sample(frac=1, random_state=42).reset_index(drop=True)

print("Dataset loaded successfully.")
print("Total samples:", len(news))


# -----------------------------
# 2 Text Cleaning Function
# -----------------------------
def wordopt(text):
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d', '', text)
    text = re.sub(r'\n', '', text)
    text = re.sub(r'\b(reuters|washington|london|new york)\b', '', text)
    return text


news["text"] = news["text"].apply(wordopt)


# -----------------------------
# 3️ Define Features and Labels
# -----------------------------
X = news["text"]
y = news["label"]


# -----------------------------
# 4️ Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# -----------------------------
# 5️ Vectorization
# -----------------------------
vectorizer = TfidfVectorizer(
    stop_words="english",
    max_df=0.7,
    ngram_range=(1, 2)   # unigrams + bigrams
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)


# -----------------------------
# 6️ Train Model (Logistic Regression)
# -----------------------------
model = LogisticRegression(
    C=1.0,
    max_iter=1000,
    solver="liblinear"
)

model.fit(X_train_vec, y_train)

# -----------------------------
# 7️ Evaluate Model
# -----------------------------
y_pred = model.predict(X_test_vec)

accuracy = accuracy_score(y_test, y_pred)
print("Train Accuracy:", model.score(X_train_vec, y_train))
print("Test Accuracy:", model.score(X_test_vec, y_test))
print("\nModel Accuracy:", accuracy)
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))


# -----------------------------
# 8️ Save Model and Vectorizer
# -----------------------------
joblib.dump(model, "fake_news_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("\nModel and vectorizer saved successfully.")