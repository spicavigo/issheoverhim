from google.appengine.ext import db

class Post(db.Model):
	created_by = db.StringProperty(required=True)
	subject = db.StringProperty(required=True)
	subject_name = db.StringProperty(required=True)
	obj = db.StringProperty(required=True)
	obj_name = db.StringProperty(required=True)
	answer = db.StringProperty()
	lang = db.StringProperty(required=True)
	hashkey = db.StringProperty(required=True)
	created = db.DateTimeProperty(auto_now_add=True)
	modified = db.DateTimeProperty(auto_now=True)