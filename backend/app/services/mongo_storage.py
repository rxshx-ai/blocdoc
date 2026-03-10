import json
import threading
import time
from typing import Any

from pymongo import MongoClient
import logging

from app.config.settings import get_settings
from app.services.storage import InMemoryDataStore

logger = logging.getLogger(__name__)

class MongoDataStore(InMemoryDataStore):
    """
    MongoDB persistence layer that maintains the standard Python memory interface
    for high speed, while periodically syncing offline data into MongoDB natively.
    """
    def __init__(self) -> None:
        super().__init__()
        settings = get_settings()
        
        # Connect to Mongo and setup database context
        try:
            self.client = MongoClient(getattr(settings, "mongodb_uri", "mongodb://127.0.0.1:27017/"), serverSelectionTimeoutMS=2000)
            # Verify connectivity
            self.client.admin.command('ping')
            self.db = self.client["medchain_logistics_offline"]
            self.app_state_col = self.db["global_data_store"]
            
            # Load initial state from mongo if exists
            doc = self.app_state_col.find_one({"_id": "master_state"})
            if doc:
                logger.info("MongoDB: Restored existing local offline data context.")
                self._collections = doc.get("collections", {})
                self._map_collections = doc.get("map_collections", {})
            else:
                logger.info("MongoDB: Initializing clean offline data context.")
                
            # Start background flusher loop
            self._running = True
            self._sync_thread = threading.Thread(target=self._background_flush, daemon=True)
            self._sync_thread.start()
        except Exception as e:
            logger.error(f"MongoDB integration failed to connect: {e}. Falling back to pure memory mode.")
            self._running = False

    def _background_flush(self):
        """Continuously persists offline data to MongoDB."""
        while self._running:
            time.sleep(2)  # Flush every 2 seconds
            try:
                # We serialize to JSON strings first to bypass `dict changed size during iteration` 
                # safely as much as possible, or fallback if mutation occurs
                state = {
                    "collections": self._collections,
                    "map_collections": self._map_collections
                }
                
                # We use string manipulation to catch any non-mongo compatible structures implicitly
                clean_payload = json.loads(json.dumps(state, default=str))

                self.app_state_col.update_one(
                    {"_id": "master_state"},
                    {"$set": clean_payload},
                    upsert=True
                )
            except RuntimeError:
                # Expected periodically if memory dicts mutate strictly during the json.dumps iteration
                pass
            except Exception as e:
                logger.error(f"MongoDB offline flush encountered an error: {e}")

    def stop(self):
        """Gracefully shutdown MongoDB syncing."""
        self._running = False
        if hasattr(self, 'client'):
            self.client.close()
