import sys
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle

TOP_FEATURES = [
    'muscle_pain', 'yellowing_of_eyes', 'dark_urine', 'itching',
    'chest_pain', 'mild_fever', 'fatigue', 'family_history',
    'nausea', 'joint_pain', 'high_fever', 'vomiting',
    'lack_of_concentration', 'altered_sensorium', 'sweating'
]

MODEL_PATH = 'rf_model.pkl'
TRAIN_CSV = 'Training.csv'
TARGET_COL = 'prognosis'

def train_and_save_model():
    df_train = pd.read_csv(TRAIN_CSV)
    X_train = df_train[TOP_FEATURES]
    y_train = df_train[TARGET_COL]

    model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    pickle.dump(model, open(MODEL_PATH, 'wb'))

def predict():
    input_json = json.loads(sys.stdin.read())
    input_features = input_json.get('symptoms', {})

    model = pickle.load(open(MODEL_PATH, 'rb'))

    df = pd.DataFrame([input_features], columns=TOP_FEATURES)
    df.fillna(0, inplace=True)

    prediction = model.predict(df)[0]
    print(json.dumps({ "disease": prediction }))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "train":
        train_and_save_model()
    else:
        predict()
