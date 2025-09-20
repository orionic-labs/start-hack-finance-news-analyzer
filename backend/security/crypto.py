# security/crypto.py
import os
from cryptography.fernet import Fernet, InvalidToken

_key = os.environ["FERNET_KEY"].encode()
fernet = Fernet(_key)

def encrypt_secret(plain: str) -> str:
    return fernet.encrypt(plain.encode()).decode()

def decrypt_secret(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()
