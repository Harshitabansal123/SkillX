import re

def sanitize_username(username):
    if not username:
        raise ValueError("Username is required.")
    if not re.match(r'^[\w\-]{3,150}$', username):
        raise ValueError("Username must be 3–150 characters, letters/numbers/underscores only.")
    return username

def sanitize_email(email):
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        raise ValueError("Invalid email address.")
    return email

def sanitize_code_input(code):
    if len(code) > 100000:
        raise ValueError("Code input too large.")
    return code

def validate_password_strength(password):
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r'[0-9]', password):
        raise ValueError("Password must contain at least one digit.")
    return password