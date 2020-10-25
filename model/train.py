import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
from joblib import dump, load

MODEL_PATH = "model/trained_model.joblib"

def load_data():
    """
    Return the X and y values from the processed data
    """
    df = pd.read_csv("data/processed.csv")
    y = df["survived"].values
    columns = list(df.columns[1:])
    X = df[columns].values

    return X, y

def split_data(X, y):
    """
    Split the data into test and train splits
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size = 0.3, random_state = 42, stratify = y
    )

    return X_train, X_test, y_train, y_test


def train_model(model, X_train, y_train):
    model.fit(X_train, y_train)

def save_model(model):
    dump(model, MODEL_PATH)

def load_model():
    return load(MODEL_PATH)

def get_model():
    return RandomForestClassifier(
        n_estimators = 25,
        criterion = "gini",
        random_state = 42,
        verbose = 2,
        )

def test_model(model, test_type, X_to_test, y_to_test):
    """
    Display the performance of our model
    """
    y_preds = model.predict(X_to_test)
    report = confusion_matrix(y_to_test, y_preds)
    print("")
    print("=" * 20)
    print(test_type, "\r")
    print(report)
    print("")
    
    return report


if __name__ == "__main__":
    X, y = load_data()
    X_train, X_test, y_train, y_test = split_data(X, y)
    
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
    print("=" * 20)
    print("\r")

    model = get_model()
    train_model(model, X_train, y_train)
    save_model(model)
    del model

    loaded_model = load_model()
    print(type(loaded_model))

    test_model(loaded_model, "Train", X_train, y_train)
    test_model(loaded_model, "Test", X_test, y_test)


    