import os
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key-fis-uncp-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or ('sqlite:///' + os.path.join(BASE_DIR, 'database.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-fis-uncp-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=4)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(BASE_DIR), 'uploads')

