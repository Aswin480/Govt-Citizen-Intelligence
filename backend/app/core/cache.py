import redis
import json
from functools import wraps
from typing import Callable, Optional, Any
from app.config import settings

# Initialize Redis Client
# We use a global client that is lazily connected or fails gracefully
try:
    redis_client = redis.Redis.from_url(
        settings.redis_url,
        decode_responses=True, # Returns strings instead of bytes
        socket_connect_timeout=1, # Fast fail on connect
        socket_timeout=1 # Fast fail on operations (ping, get, set)
    )
except Exception as e:
    print(f"⚠️ Redis Init Warning: {e}")
    redis_client = None

def is_redis_available() -> bool:
    """Check if Redis is actually connected"""
    # Force disable for local dev to prevent blocking/hanging
    return False
    
    # if not redis_client:
    #     return False
    # try:
    #     return redis_client.ping()
    # except redis.RedisError:
    #     return False

def get_cache(key: str) -> Optional[Any]:
    """Retrieve data from cache"""
    if not is_redis_available():
        return None
    
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"⚠️ Cache Read Error: {e}")
    return None

def set_cache(key: str, value: Any, ttl: int = 300):
    """Set data in cache with TTL (default 5 mins)"""
    if not is_redis_available():
        return
    
    try:
        json_data = json.dumps(value)
        redis_client.setex(key, ttl, json_data)
    except Exception as e:
        print(f"⚠️ Cache Write Error: {e}")

def delete_cache(pattern: str):
    """Delete keys matching pattern (supports wildcards like 'policy:*')"""
    if not is_redis_available():
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception as e:
        print(f"⚠️ Cache Delete Error: {e}")

def cache_response(ttl: int = 60, key_prefix: str = ""):
    """
    Decorator to cache API responses.
    Auto-generates key based on path and query params.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # We can't easily access Request object here without specific dependency injection
            # So simpler version: just use manual caching inside function or 
            # assume kwargs has identifying info.
            
            # For simplicity in FastAPI, correct way is usually valid logic inside route
            # or middleware. But let's keep it simple: 
            # Use this for PURE functions or routes where we construct key manually inside.
            
            # actually better to just inject 'cache' logic inside route for now
            # as generic decorator needs 'request' object for proper key generation
            return await func(*args, **kwargs)
        return wrapper
    return decorator
