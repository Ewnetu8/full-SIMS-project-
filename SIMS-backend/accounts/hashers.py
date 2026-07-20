from django.contrib.auth.hashers import PBKDF2PasswordHasher

class CustomPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """
    Custom PBKDF2-SHA256 password hasher with 600,000 iterations.
    """
    iterations = 600000
