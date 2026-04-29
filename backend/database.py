import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "verbalyst")

# Create Motor client (using certifi for secure TLS connections to Atlas)
client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())

# Get database
db = client[MONGO_DB_NAME]
