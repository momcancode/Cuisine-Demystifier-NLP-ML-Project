# Import dependencies
import pandas as pd
import numpy as np
import os
import simplejson
from sqlalchemy.sql import select, column, text
from sqlalchemy.sql.expression import func
from flask import (Flask, render_template, jsonify, request, redirect, session)
from models import create_classes
from flask_sqlalchemy import SQLAlchemy

# NLP libraries
import re
import string
import unicodedata
import nltk
nltk.download('punkt')
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
nltk.download('stopwords')
stop_words_nltk = set(stopwords.words('english'))
from nltk.stem.porter import PorterStemmer
stemmer = PorterStemmer()

# Machine learning
from joblib import load
import pickle
import sklearn
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.feature_extraction.text import CountVectorizer

# Setup the Flask application.
app = Flask(__name__)

# Set the secret key to some random bytes. https://flask.palletsprojects.com/en/1.1.x/quickstart/
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

"""
Database connection setup: Let's look for an environment variable 'DATABASE_URL'.
If there isn't one, we'll use a connection to a sqlite database.
"""
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', '') or "sqlite:///db.sqlite"

# Remove tracking modifications
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Use the `flask_sqlalchemy` library we'll create our variable `db` that is the connection to our database
db = SQLAlchemy(app)

"""
From `models.py` we call `create_classes` that we will have a reference to the class
we defined `Feedback` that is bound to the underlying database table.
"""
Cuisine, Feedback = create_classes(db)


# create route that renders index.html template
@app.route("/")
def home():
    cuisine_list = ['African', 'American', 'British', 'Caribbean', 'Chinese',
    'East European', 'French', 'Greek', 'Indian', 'Irish', 'Italian', 'Japanese',
    'Korean', 'Mexican', 'Nordic', 'North African', 'Pakistani', 'Portuguese',
    'South American', 'Spanish', 'Thai and South-East Asian', 'Turkish and Middle Eastern']

    return render_template("index.html", cuisine_list=cuisine_list)

# Create a function to remove accented characters
def remove_accented_chars(matchobj):
    text = matchobj.group()
    new_text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8', 'ignore')
    return new_text

# List of words to remove from ingredients' text
words_to_remove = [
    "tbsp", "roughly", "chopped", "tsp", "finely", "oz", "plus", "optional",
    "extra", "fresh", "freshly", "ground", "thinly", "sliced", "clove", "pint",
    "cut", "kg", "lb", "cm", "ml", "mm", "small", "large", "medium", "diced", "slice",
    "pinch", "peeled", "grated", "removed", "handful", "piece", "crushed", "red", "dried",
    "drained", "rinsed", "halved", "trimmed", "deseeded", "x", "beaten", "available", "supermarket"]

# Create a function to clean ingredient text
def preprocess(text):
    text = text.lower()
    text = re.sub(r'\w*[\d¼½¾⅓⅔⅛⅜⅝]\w*', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'[£×–‘’“”⁄]', '', text)
    text = re.sub(r'[âãäçèéêîïñóôûüōưấớ]', remove_accented_chars, text)
    words = word_tokenize(text)
    words = [word for word in words if not word in stop_words_nltk]
    words = [word for word in words if not word in words_to_remove]
    words = [stemmer.stem(word) for word in words]
    processed_text = ' '.join([word for word in words])
    
    return processed_text


# Create route that requests the ingredients' text and return a predicted cuisine
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    ingredient_text = data["ingredients"]

    # create panda series from received data
    try:
        X_cleaned = pd.Series([preprocess(ingredient_text)])

    except Exception as e:
        print("Error Parsing Input Data")
        print(e)
        return "Error"

    # Load the trained model
    model = load("model/trained_model.joblib")

    # Load the vectorized vocabulary
    transformer = TfidfTransformer()
    loaded_vec = CountVectorizer(
        decode_error="replace",vocabulary=pickle.load(open("model/feature.pkl", "rb")))

    X_transformed = transformer.fit_transform(loaded_vec.fit_transform(X_cleaned))

    # convert nparray to list so that we can serialise as json
    result = model.predict(X_transformed).tolist()

    session["prediction"] = result[0]

    return jsonify({"result": result})


# Create route that requests the feedback from customers
# and update to the database table 'feedback'
@app.route("/feedback", methods=["POST"])
def feedback():

    feedback = request.json
    ingredient_text = feedback["ingredientText"]
    predicted_cuisine = session.pop('prediction', None)
    actual_chosen_cuisine = feedback["chosenCuisine"]
    actual_entered_cuisine = feedback["enteredCuisine"]
    recipe_name = feedback["recipeName"]
    recipe_link = feedback["recipeLink"]

    feedback_data = Feedback(
        ingredient_text=ingredient_text,
        predicted_cuisine=predicted_cuisine,
        actual_chosen_cuisine=actual_chosen_cuisine,
        actual_entered_cuisine=actual_entered_cuisine,
        recipe_name=recipe_name,
        recipe_link=recipe_link)

    db.session.add(feedback_data)
    db.session.commit()

    return jsonify({"loaded": True})


if __name__ == "__main__":
    app.run(debug=True)