import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class DjangoAdapter:
    """
    Adapter to connect FastAPI with the legacy Django backend (Parli_backend).
    Allows running both systems side-by-side as microservices.
    """
    
    def __init__(self, django_url: str = "http://127.0.0.1:8080"):
        # Defaulting Django to 8080 to avoid clashing with FastAPI on 8000
        self.django_url = django_url
        self.timeout = 5.0
        
    async def get_django_health(self) -> Dict[str, Any]:
        """Check if Django backend is accessible"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Basic connection test
                response = await client.get(f"{self.django_url}/")
                return {
                    "status": "connected",
                    "django_url": self.django_url,
                    "status_code": response.status_code
                }
        except Exception as e:
            logger.warning(f"Django backend not reachable at {self.django_url}: {e}")
            return {
                "status": "unreachable",
                "django_url": self.django_url,
                "error": str(e)
            }

    async def fetch_data_from_django(self, endpoint: str) -> Optional[Dict[str, Any]]:
        """Generic method to fetch data from a Django endpoint"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.django_url}/{endpoint.lstrip('/')}")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching from Django endpoint {endpoint}: {e}")
            return None

# Global instance for dependency injection
django_adapter = DjangoAdapter()
