"""Test MongoDB Atlas connection."""
import sys
from app.mongo_db import get_mongo_client, get_database, close_mongo_connection

def test_mongodb_connection():
    """Test connection to MongoDB Atlas."""
    try:
        print("🔄 Connecting to MongoDB Atlas...")
        client = get_mongo_client()
        
        # Ping the server
        result = client.admin.command('ping')
        print(f"✅ Ping successful: {result}")
        
        # Get database
        db = get_database()
        print(f"✅ Database connected: {db.name}")
        
        # List collections
        collections = db.list_collection_names()
        print(f"✅ Collections: {collections if collections else 'No collections yet'}")
        
        # Test insert and read (optional)
        test_collection = db.test_connection
        test_doc = {"message": "Connection test", "status": "ok"}
        result = test_collection.insert_one(test_doc)
        print(f"✅ Test insert successful - ID: {result.inserted_id}")
        
        # Read back
        found = test_collection.find_one({"_id": result.inserted_id})
        print(f"✅ Test read successful: {found}")
        
        # Clean up
        test_collection.delete_one({"_id": result.inserted_id})
        print("✅ Test document cleaned up")
        
        print("\n🎉 MongoDB Atlas connection is working perfectly!")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    finally:
        close_mongo_connection()


if __name__ == "__main__":
    test_mongodb_connection()
