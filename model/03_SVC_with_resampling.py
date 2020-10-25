# Import dependencies
import pandas as pd
import numpy as np
import re
import string

# NLTK
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
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix 
from sklearn.utils import resample
from sklearn.svm import SVC

# SQL Alchemy
from sqlalchemy import create_engine

MODEL_PATH = "model/trained_model.joblib"

# Create a function to clean ingredient text
def clean(doc):
    doc = doc.str.lower()
    doc = doc.str.replace(r'\w*[\d¼½¾⅓⅔⅛⅜⅝]\w*', '')
    doc = doc.str.translate(str.maketrans('', '', string.punctuation))
    doc = doc.str.replace(r'[£×–‘’“”⁄]', '')
    doc = doc.apply(lambda x: word_tokenize(x))
    doc = doc.apply(lambda x: [word for word in x if not word in stop_words_nltk])
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

# Split X and y into training and testing sets. By default, it splits 75% training and 25% test
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=1)
print(X_train.shape, y_train.shape)
print(X_test.shape, y_test.shape)


# ### Resampling

# In[14]:


# Concatenate our training data back together
X_y_train = pd.concat([X_train, y_train], axis=1)
X_y_train.shape


# In[15]:


# Overview of the training set
X_y_train.head()


# In[16]:


# Separate minority and majority classes
british_cuisines_df = X_y_train[X_y_train.cuisine=="British"]
other_cuisines_df = X_y_train[X_y_train.cuisine!="British"]
other_cuisines_df.head()


# In[17]:


# Get a list of minority cuisines
other_cuisines = other_cuisines_df.cuisine.unique().tolist()
other_cuisines


# In[18]:


other_cuisines_upsampled = list()

# Upsample the minorities

for cuisine in other_cuisines:
    cuisine_df = X_y_train[X_y_train.cuisine==cuisine]
    cuisine_upsampled = resample(cuisine_df,
                                 replace=True, # sample with replacement
                                 n_samples=len(british_cuisines_df), # match number of recipes in British cuisine
                                 random_state=1)
    other_cuisines_upsampled.append(cuisine_upsampled)


# In[19]:


# Create a new resampled data set for minority cuisines
other_cuisines_upsampled = pd.concat(other_cuisines_upsampled)
other_cuisines_upsampled.head()


# In[20]:


# Combine the majority and the upsampled minority
upsampled = pd.concat([british_cuisines_df, other_cuisines_upsampled])


# In[21]:


# check new class counts
upsampled.cuisine.value_counts()


# In[22]:


# Overview of the upsampled dataset
upsampled.sample(10, random_state=2)


# ### Feature engineering using TF-IDF

# In bags of words and bags of n-grams approaches, all words in a corpus are treated equally important. TF-IDF, meanwhile, emphasizes that some words in a document are more important than others. For the current classification problem, I find that TF-IDF would suit the best.

# In[23]:


tfidf = TfidfVectorizer()


# In[24]:


X_train_new = upsampled.ingredients_processed
y_train_new = upsampled.cuisine


# In[25]:


# Vectorize train and test data
X_train_transformed = tfidf.fit_transform(X_train_new)
X_test_transformed = tfidf.transform(X_test)
print(X_train_transformed.shape, X_test_transformed.shape)


# ### Train the model

# In[26]:


# Support vector machine linear classifier
model = SVC(kernel='linear')


# In[27]:


# Train the classifier and time the training step
get_ipython().run_line_magic('time', 'model.fit(X_train_transformed, y_train_new)')


# In[28]:


# Make class predictions for X_test_transformed
y_predicted = model.predict(X_test_transformed)


# ### Evaluate the model

# In[29]:


#Print accuracy:
print("Accuracy: ", accuracy_score(y_test, y_predicted))


# In[30]:


# Function to plot confusion matrix. 
# Ref: http://scikit-learn.org/stable/auto_examples/model_selection/plot_confusion_matrix.html
import itertools

def plot_confusion_matrix(cm, classes,
                          normalize=False,
                          title='Confusion matrix',
                          cmap=plt.cm.Blues):
    """
    This function prints and plots the confusion matrix.
    Normalization can be applied by setting `normalize=True`.
    """
    if normalize:
        cm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

    plt.imshow(cm, interpolation='nearest', cmap=cmap)
    plt.title(title)
    plt.colorbar()
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, rotation=90)
    plt.yticks(tick_marks, classes)

    fmt = '.2f' if normalize else 'd'
    thresh = cm.max() / 2.
    for i, j in itertools.product(range(cm.shape[0]), range(cm.shape[1])):
        plt.text(j, i, format(cm[i, j], fmt),
                 horizontalalignment="center",
                 color="white" if cm[i, j] > thresh else "black")

    plt.tight_layout()
    plt.ylabel('True label',fontsize=15)
    plt.xlabel('Predicted label',fontsize=15)


# In[31]:


# print the confusion matrix
cnf_matrix = confusion_matrix(y_test, y_predicted)
plt.figure(figsize=(16, 12))
plot_confusion_matrix(cnf_matrix, classes=cuisine_list, normalize=True,
                      title='Confusion matrix with all features')


# At this point, we can notice that the classifier is doing poorly with identifying xxx, while it is doing well with xxx.

# In[32]:


# Calculate classification report
from sklearn.metrics import classification_report

print(classification_report(y_test, y_predicted,
                            target_names=cuisine_list))


# So, how do we choose whats the best? If we look at overall accuracy alone, we should be choosing the very first classifier in this notebook. However, that is also doing poorly with identifying "relevant" articles. If we choose purely based on how good it is doing with "relevant" category, we should choose the second one we built. If we choose purely based on how good it is doing with "irrelevant" category, surely, nothing beats not building any classifier and just calling everything irrelevant! So, what to choose as the best among these depends on what we are looking for in our usecase!

# ### Hyperparameter Tuning

# Use GridSearchCV to tune the model's parameters

# In[33]:


# # Create the GridSearch estimator along with a parameter object containing the values to adjust
# from sklearn.model_selection import GridSearchCV
# param_grid = {'kernel': ["linear", "poly", "rbf", "sigmoid"]}
# grid = GridSearchCV(model, param_grid, verbose=3)


# In[34]:


# Train the model with GridSearch


# In[35]:


# print(grid2.best_params_)
# print(grid2.best_score_)


# In[ ]:




