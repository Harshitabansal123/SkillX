from django.contrib.auth.hashers import make_password, check_password

def hash_password(raw_password):
    return make_password(raw_password)

def verify_password(raw_password, hashed):
    return check_password(raw_password, hashed)
