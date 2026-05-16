import hashlib
import redis
from config import settings

class Deduplicator:
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url)

    def is_duplicate(self, url: str) -> bool:
        url_hash = hashlib.sha256(url.encode('utf-8')).hexdigest()
        # Set with expiration of 7 days to keep it clean
        is_new = self.redis.set(f"news:url:{url_hash}", "1", nx=True, ex=60*60*24*7)
        return is_new is None
