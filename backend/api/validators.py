import re
from rest_framework.exceptions import ValidationError

def sanitize_username(value):
    if not re.match(r'^[\w.@+-]+$', value):
        raise ValidationError("Invalid characters in username.")
    return value

def sanitize_code_input(value):
    if len(value) > 5000:
        raise ValidationError("Code too long.")
    return value

def validate_password_strength(value):
    if not re.search(r'[A-Z]', value):
        raise ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r'[0-9]', value):
        raise ValidationError("Password must contain at least one number.")
    return value

# ADD THIS — it was missing
def sanitize_email(value):
    value = value.strip().lower()
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
        raise ValidationError("Invalid email address.")
    return value