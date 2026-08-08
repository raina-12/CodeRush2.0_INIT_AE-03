"""MongoDB connection management using the async Motor driver."""

import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient | None = None
    db = None

    @classmethod
    def connect(cls):
        """Initialize the async MongoDB connection."""
        settings = get_settings()
        try:
            # Added tlsCAFile=certifi.where() to fix the Windows SSL handshake error
            cls.client = AsyncIOMotorClient(
                settings.mongodb_uri, 
                tlsCAFile=certifi.where()
            )
            cls.db = cls.client[settings.mongodb_db_name]
            logger.info("Successfully connected to MongoDB.")
        except Exception as exc:
            logger.error(f"Failed to connect to MongoDB: {exc}")
            raise

    @classmethod
    def disconnect(cls):
        """Close the MongoDB connection."""
        if cls.client:
            cls.client.close()
            logger.info("Disconnected from MongoDB.")

def get_db():
    """Retrieve the active database instance."""
    if DatabaseManager.db is None:
        raise RuntimeError("Database is not initialized. Call DatabaseManager.connect() first.")
    return DatabaseManager.db