from flask import Flask
from flask_cors import CORS

app = Flask(
    __name__,
    static_folder='../../frontend/dist',
    static_url_path='/',
    template_folder='../../frontend/dist'
)
CORS(app)

import backend.views
