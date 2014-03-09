"""`main` is the top level module for your Flask application."""

import uuid
import json

from flask import Flask
from flask import request
from flask import render_template
app = Flask(__name__)

from model import Post
from google.appengine.ext import db

from facebook import GraphAPI

fbapi = GraphAPI()

Title = 'Is She Over Him?'
@app.route('/')
def index(subject=None, obj=None, hashkey=None):
    """Return a friendly HTTP greeting."""

    return render_template('index.html', sgender='female', ogender='male', initmethod='NewPost', title=Title)


@app.route('/<subject>/<obj>/')
def page(subject, obj):
	post = Post.get_by_key_name(subject + '||' + obj)
	if post == None:
		return 'We do not know that!', 404
	return render_template('index.html', sgender='female', 
				ogender='male', initmethod='ViewPost', post=post, title=getTitle(post))

@app.route('/<subject>/<obj>/ask/<hashkey>/')
@app.route('/<subject>/<obj>/edit/<hashkey>/')
def askpage(subject, obj, hashkey):
	post = Post.get_by_key_name(subject + '||' + obj)
	if post == None:
		return 'We do not know that!', 404
	if post.hashkey != hashkey:
		return 'You are not authorized'
	return render_template('index.html', sgender='female', 
				ogender='male', initmethod='EditPost', post=post, title=getTitle(post))


@app.route('/post', methods = ['POST'])
def post():
	token = request.form['token']
	username = request.form['username']
	fb = GraphAPI(token)
	try:
		data = fb.get_object("me")
		if username != data['username']:
			return 'fail'
	except:
		return 'fail'
	print data
	print request.form
	subject = request.form['subject']
	subject_name = request.form['subject_name']
	obj = request.form['object']
	obj_name = request.form['object_name']
	answer = request.form['answer']
	lang = request.form['language']
	hashkey = request.form['hashkey']
	print 'here'
	post = Post(
		created_by=username,
		subject=subject,
		subject_name=subject_name,
		obj=obj,
		obj_name=obj_name,
		answer=answer,
		lang=lang,
		hashkey=str(uuid.uuid1()),
		key_name=subject+'||'+obj)
	post.put()
	print request.url, request.url_root
	link = request.url_root + subject + '/' + obj + '/'
	edit = link + 'edit/' + post.hashkey
	res = {
		'link': link,
		'edit': edit
	}
	return json.dumps(res)

@app.route('/update', methods=['POST'])
def update():
	answer = request.form['answer']
	uid = request.form['uid']
	hashkey = request.form['hashkey']
	post = Post.get_by_key_name(uid)
	if post and post.hashkey == hashkey:
		post.answer=answer
		post.put()
		return 'ok'
	return 'fail'

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404

def getUrls(url_root, post):
	base_url = url_root + post.subject + '/' + post.obj + '/'
	edit_url = base_url + 'edit/' + post.hashkey
	return base_url, edit_url

def getTitle(post):
	return 'Is %(subject_name)s Over %(obj_name)s?' % post._entity

@app.route('/getallposts', methods=['POST'])
def getAllPosts():
	token = request.form['token']
	username = request.form['username']
	fb = GraphAPI(token)
	try:
		data = fb.get_object("me")
		if username == data['username']:
			posts = db.Query(Post).filter("created_by =", username)
			res = []
			for post in posts:
				link, edit = getUrls(request.url_root, post)
				res.append({
					'title': getTitle(post),
					'link': link,
					'edit': edit,
					'delete': post.subject+'||'+post.obj
					})
			return json.dumps(res)
	except:pass
	return json.dumps([])

@app.route('/delete', methods=['POST'])
def deletePost():
	print request
	token = request.form['token']
	username = request.form['username']
	hashkey =request.form['hashkey']
	print request.form
	fb = GraphAPI(token)
	try:
		data = fb.get_object("me")
		print data
		if username == data['username']:
			post = Post.get_by_key_name(hashkey)
			print post
			if post.created_by == username:
				post.delete()
				return 'ok'
	except:raise
	print 'here'
	return ''