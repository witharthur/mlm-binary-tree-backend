"""MongoDB connection and client management."""
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()

# Global MongoDB client
_mongo_client = None


def get_mongo_client() -> MongoClient:
    """
    Get or create MongoDB client.
    Uses connection pooling from pymongo.
    """
    global _mongo_client
    
    if _mongo_client is None:
        try:
            _mongo_client = MongoClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
                socketTimeoutMS=None,
                retryWrites=True,
                maxPoolSize=50,
                minPoolSize=10,
            )
            # Verify connection with longer timeout
            _mongo_client.admin.command('ping')
            logger.info("✅ Connected to MongoDB Atlas successfully")
        except (ServerSelectionTimeoutError, ConnectionFailure) as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    return _mongo_client


def get_database(database_name: str = "mlm_platform"):
    """Get a specific database from MongoDB."""
    client = get_mongo_client()
    return client[database_name]


def close_mongo_connection():
    """Close MongoDB connection."""
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
        logger.info("MongoDB connection closed")


# Collection names
COLLECTIONS = {
    "users": "users",
    "orders": "orders",
    "packages": "packages",
    "bonuses": "bonuses",
    "wallets": "wallets",
    "withdrawals": "withdrawals",
    "tree": "binary_tree",
}
