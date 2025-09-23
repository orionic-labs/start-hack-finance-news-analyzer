# add to your schemas section
from pydantic import BaseModel, EmailStr, Field, Field, HttpUrl
from typing import List, Optional, Dict


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


class IngestRequest(BaseModel):
    source_urls: list[str] = Field(min_items=1)
    deduplicate: bool = True


class AnalyzeNewsRequest(BaseModel):
    title: str
    text: str
    language: str = "en"


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = 5


class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    text: Optional[str] = None
    html: Optional[str] = None
    cc: list[EmailStr] = []
    bcc: list[EmailStr] = []


class AccountPayload(BaseModel):
    id: Optional[str] = None
    platform: str
    username: str
    password: str


class ClientPayload(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr


class SourcePayload(BaseModel):
    id: Optional[str] = None
    name: str
    url: str


class ReportRequest(BaseModel):
    body: str
    filename: str = "report.pdf"
    company: Optional[str] = None
    report_title: Optional[str] = None
    report_date: Optional[str] = None
    logo_path: Optional[str] = None
    include_cover: bool = True


class ToggleImportancePayload(BaseModel):
    article_url: Optional[str] = None
    url: Optional[str] = None
    importance: Optional[bool] = None


class ImportancePayload(BaseModel):
    url: str
    important: bool | None = None


class AddClientPayload(BaseModel):
    name: str
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    status: Optional[str] = "active"


class UpdatePortfolioPayload(BaseModel):
    portfolio: Dict[str, float] = {}
