def create_classes(db):
    class Cuisine(db.Model):
        __tablename__ = 'cuisine_ingredients'

        id = db.Column(db.Integer, primary_key=True)
        cuisine = db.Column(db.String(64), nullable=False)
        recipe = db.Column(db.String(1024), nullable=False)
        full_ingredients = db.Column(db.String, nullable=False)

        def __repr__(self):
            return f'<Cuisine {self.id}>'

    class Feedback(db.Model):
        __tablename__ = 'feedback'

        id = db.Column(db.Integer, primary_key=True)
        ingredient_text = db.Column(db.String, nullable=False)
        predicted_cuisine = db.Column(db.String(64), nullable=False)
        actual_chosen_cuisine = db.Column(db.String(64), nullable=False)
        actual_entered_cuisine = db.Column(db.String(64))
        recipe_name = db.Column(db.String(1024))
        recipe_link = db.Column(db.String)

        def __repr__(self):
            return f'<Feedback {self.id}>'

    return Cuisine, Feedback