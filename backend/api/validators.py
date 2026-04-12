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
