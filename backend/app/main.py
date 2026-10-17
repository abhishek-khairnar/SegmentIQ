import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db import engine, Base
from app.routers import (
    auth, datasets, suggest, runs, export, compare, contact, admin, meta
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("segmentiq")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing SegmentIQ backend storage...")
    settings.storage_path.mkdir(parents=True, exist_ok=True)
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized.")
    yield
    # Shutdown actions
    logger.info("SegmentIQ backend shutting down.")

app = FastAPI(
    title="SegmentIQ API",
    description="Customer Segmentation & RFM Analytics Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Attach rate limiter
app.state.limiter = auth.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        errors.append({
            "field": field,
            "message": err.get("msg", "Invalid input value")
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": errors[0]["message"] if errors else "Validation failed",
            "code": "VALIDATION_ERROR",
            "errors": errors
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": f"HTTP_{exc.status_code}"
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected internal server error occurred.",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

# Include Routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(suggest.router, prefix="/api")
app.include_router(runs.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(contact.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(meta.router, prefix="/api")

# Also include root health endpoint
@app.get("/")
def root():
    return {
        "app": "SegmentIQ",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }
