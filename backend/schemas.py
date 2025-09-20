# add to your schemas section
from pydantic import BaseModel, EmailStr, Field, Field, HttpUrl
from typing import List, Optional

class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    text: Optional[str] = None
    html: Optional[str] = None
    cc: List[EmailStr] = []
    bcc: List[EmailStr] = []


class AccountCreate(BaseModel):
    platform: str | None = None
    link: HttpUrl
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1)

class AccountOut(BaseModel):
    id: str
    platform: str | None
    link: str
    username: str
    # never return password
