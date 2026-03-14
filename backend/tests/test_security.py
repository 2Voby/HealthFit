from src.core.security import hash_password, verify_password


def test_hash_and_verify_password() -> None:
    raw_password = "StrongPassword123!"
    password_hash = hash_password(raw_password)

    assert password_hash != raw_password
    assert verify_password(raw_password, password_hash) is True
    assert verify_password("WrongPassword123!", password_hash) is False
