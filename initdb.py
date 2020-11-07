import os
import csv
from sqlalchemy import create_engine, Table, Column, MetaData
from sqlalchemy import DateTime, Float, Integer, String

"""
Create an instance the SQLAlchemy of `MetaData` object.
"""
meta = MetaData()

"""
For deployment purposes I'll be using an environment variable
for storing the details of the database connection. This way
we can keep the login and password of the database outside of our
code.
"""
os_env_db_url = os.environ.get('DATABASE_URL', '')

"""
If we don't have an environment variable 'DATABASE_URL' the value in
`os_env_db_url` will be an empty string. In which case we will use
a sqlite database - this allows us to do development without having to
configure a SQL Database.
"""
connection = os_env_db_url or "sqlite:///db.sqlite"

"""
Let's establish a connection to our database.
"""
print("connection to database")
print("os env", os.environ.get('DATABASE_URL', ''))
engine = create_engine(connection)

"""
Create table cuisine_ingredients to load scraped data from csv
If the table already exists we will not be adding to the database.
"""
if not engine.has_table("cuisine_ingredients"):

    """
    Here we'll define the table using the SQLAlchemy ORM interface
    https://docs.sqlalchemy.org/en/13/core/metadata.html#creating-and-dropping-database-tables
    """
    new_table = Table(
        'cuisine_ingredients', meta,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('cuisine', String),
        Column('recipe', String),
        Column('full_ingredients', String),
    )

    meta.create_all(engine)
    
    print("Table created")

    """
    Let's read in the csv data and put into a list to read into
    our newly created table
    """
    seed_data = list()

    with open('data/cuisine_full_ingredients.csv', newline='', encoding='utf8') as input_file:
        reader = csv.DictReader(input_file)       #csv.reader is used to read a file
        for row in reader:
            seed_data.append(row)
    
    """
    With our newly created table let's insert the row we've read in
    and with that we're done
    """
    with engine.connect() as conn:
        conn.execute(new_table.insert(), seed_data)

    print("Seed Data Imported")
else:
    print("Table already exists")


# Create table feedback to update users' feedback on model's performance
if not engine.has_table("feedback"):
    print("Creating Table")

    new_table = Table(
        'feedback', meta,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('ingredient_text', String),
        Column('predicted_cuisine', String),
        Column('actual_chosen_cuisine', String),
        Column('actual_entered_cuisine', String),
        Column('recipe_name', String),
        Column('recipe_link', String),
    )

    meta.create_all(engine)
    
    print("Table created")

else:
    print("Table already exists")

print("initdb complete")