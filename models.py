def create_classes(db):
    class Cuisine(db.Model):
        __tablename__ = 'cuisine_ingredients'

        id = db.Column(db.Integer, primary_key=True)
        cuisine = db.Column(db.String(64))
        recipe = db.Column(db.String(1024))
        full_ingredients = db.Column(db.String)

        def __repr__(self):
            return f'<Cuisine {self.id}>'

    return Cuisine