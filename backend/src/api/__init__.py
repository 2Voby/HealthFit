from fastapi import APIRouter

from src.api.routers.attributes import router as attributes_router
from src.api.routers.auth import router as auth_router
from src.api.routers.health import router as health_router
from src.api.routers.offers import router as offers_router
from src.api.routers.questions import router as questions_router
from src.api.routers.users import router as users_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(attributes_router)
api_router.include_router(auth_router)
api_router.include_router(health_router)
api_router.include_router(offers_router)
api_router.include_router(questions_router)
api_router.include_router(users_router)
