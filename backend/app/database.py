import ssl

import certifi
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

def _engine_kwargs() -> dict:
    if ".supabase.co" not in settings.DATABASE_URL:
        return {}
    if settings.DATABASE_SSL_INSECURE:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return {"connect_args": {"ssl": ctx}}
    if settings.DATABASE_SSL_USE_CERTIFI:
        ctx = ssl.create_default_context(cafile=certifi.where())
        return {"connect_args": {"ssl": ctx}}
    return {"connect_args": {"ssl": True}}


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.SQL_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=15,
    **_engine_kwargs(),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, autoflush=False, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
