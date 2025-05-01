import secrets


def generate_secret_key():
    return "".join(
        secrets.choice("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        for _ in range(6)
    )
