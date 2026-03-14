from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    login: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    login: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)
