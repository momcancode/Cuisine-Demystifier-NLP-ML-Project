# Import dependencies
import pandas as pd
import numpy as np
from joblib import dump
import pickle

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
import sklearn
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.utils import resample
from sklearn.svm import SVC

# SQL Alchemy
from sqlalchemy import create_engine

# Create a function to remove accented characters
def remove_accented_chars(matchobj):
    text = matchobj.group()
    new_text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8', 'ignore')
    return new_text

words_to_remove = [
    "tbsp", "roughly", "chopped", "tsp", "finely", "oz", "plus", "optional",
    "extra", "fresh", "freshly", "ground", "thinly", "sliced", "clove", "pint",
    "cut", "kg", "lb", "cm", "ml", "mm", "small", "large", "medium", "diced", "slice",
    "pinch", "peeled", "grated", "removed", "handful", "piece", "crushed", "red", "dried",
    "drained", "rinsed", "halved", "trimmed", "deseeded", "x", "beaten", "available", "supermarket"]

# Create a function to clean ingredient text
def clean(doc):
    doc = doc.str.lower()
    doc = doc.str.replace(r'\w*[\d¼½¾⅓⅔⅛⅜⅝]\w*', '')
    doc = doc.str.translate(str.maketrans('', '', string.punctuation))
    doc = doc.str.replace(r'[£×–‘’“”⁄]', '')
    doc = doc.apply(lambda x: re.sub(r'[âãäçèéêîïñóôûüōưấớ]', remove_accented_chars, x))
    doc = doc.apply(lambda x: word_tokenize(x))
    doc = doc.apply(lambda x: [word for word in x if not word in stop_words_nltk])
    doc = doc.apply(lambda x: [word for word in x if not word in words_to_remove])
    doc = doc.apply(lambda x: [stemmer.stem(word) for word in x])
    processed_doc = doc.apply(lambda x: ' '.join([word for word in x]))

    return processed_doc


# Create a function to load data
def load_data():

    # Create engine and connection
    engine = create_engine("sqlite:///../db.sqlite")

    # Read in table in the database
    df = pd.read_sql_query('SELECT * FROM cuisine_ingredients', con=engine)

    # Add a new column to the dataframe with the cleaned text
    df["ingredients_processed"] = clean(df["full_ingredients"])

    # The column contains textual data to extract features from.
    X = df["ingredients_processed"]

    # The column we're learning to predict.
    y = df["cuisine"]

    return X, y


# Create a function to split the data
def split_data(X, y):

    # Split X and y into training and testing sets.
    # By default, it splits 75% training and 25% test
    X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=1)

    return X_train, X_test, y_train, y_test


# Create a function to resample the data
def resampling(X_train, y_train):
    # Concatenate our training data back together
    X_y_train = pd.concat([X_train, y_train], axis=1)

    # Separate minority and majority classes
    british_cuisines_df = X_y_train[X_y_train.cuisine == "British"]
    other_cuisines_df = X_y_train[X_y_train.cuisine != "British"]

    # Get a list of minority cuisines
    other_cuisines = other_cuisines_df.cuisine.unique().tolist()

    # Upsample the minorities
    other_cuisines_upsampled = list()

    for cuisine in other_cuisines:
        cuisine_df = X_y_train[X_y_train.cuisine==cuisine]
        cuisine_upsampled = resample(cuisine_df,
                                    replace=True, # sample with replacement
                                    n_samples=len(british_cuisines_df), # match number of recipes in British cuisine
                                    random_state=1)
        other_cuisines_upsampled.append(cuisine_upsampled)

    # Create a new resampled data set for minority cuisines
    other_cuisines_upsampled = pd.concat(other_cuisines_upsampled)

    # Combine the majority and the upsampled minority
    upsampled = pd.concat([british_cuisines_df, other_cuisines_upsampled])

    X_train_new = upsampled["ingredients_processed"]
    y_train_new = upsampled["cuisine"]

    return X_train_new, y_train_new


# Support vector machine linear classifier
def get_model():
    return SVC(kernel='linear')


# Save vectorizer vocab
def save_vocab(X_train_new):
    vectorizer = CountVectorizer(decode_error="replace")
    vectorizer.fit_transform(X_train_new)
    pickle.dump(vectorizer.vocabulary_, open("feature.pkl","wb"))


# Train the model
def train_model(model, X_train_new, y_train_new):

    # Feature engineering using TF-IDF
    tfidf = TfidfVectorizer()
    X_train_transformed = tfidf.fit_transform(X_train_new)
    model.fit(X_train_transformed, y_train_new)


def save_model(model):
    dump(model, "trained_model.joblib")


if __name__ == "__main__":
    X, y = load_data()
    X_train, X_test, y_train, y_test = split_data(X, y)

    X_train_new, y_train_new = resampling(X_train, y_train)

    print("X input")
    print(X[:5])
    print(X.shape)
    print("\ry input")
    print(y[:5])
    print(y.shape)
    print("\rX_train")
    print(X_train.shape)
    print("\rX_test")
    print(X_test.shape)
    print("\ry_train")
    print(y_train.shape)
    print("\ry_test")
    print(y_test.shape)
    print("\rX_train_new")
    print(X_train_new.shape)
    print("\ry_train_new")
    print(y_train_new.shape)
    print("=" * 20)
    print("\r")

    save_vocab(X_train_new)

    model = get_model()
    print(type(model))

    train_model(model, X_train_new, y_train_new)

    save_model(model)
    del model