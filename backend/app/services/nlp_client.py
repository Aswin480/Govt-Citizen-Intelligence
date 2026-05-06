"""
NLP Client Service - Bridges FastAPI with NLP Backend
Provides circuit breaker pattern and fallback responses
Location: backend/app/services/nlp_client.py
"""

import httpx
import logging
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class NLPClient:
    """
    REST client for NLP backend service (port 8001)
    Implements circuit breaker pattern and graceful fallback
    """
    
    def __init__(self, base_url: str = "http://127.0.0.1:8001", timeout: float = 10.0):
        self.base_url = base_url
        self.timeout = timeout
        self.circuit_open = False
        self.last_error_time: Optional[datetime] = None
        self.error_threshold = 5  # Errors before circuit opens
        self.error_count = 0
        self.circuit_reset_time = 60  # Reset after 60 seconds
    
    async def _check_circuit(self) -> bool:
        """Check if circuit breaker should be in open state"""
        if not self.circuit_open:
            return False
        
        # Check if enough time has passed to attempt reset
        if self.last_error_time:
            time_since_error = (datetime.now() - self.last_error_time).total_seconds()
            if time_since_error > self.circuit_reset_time:
                logger.info("Circuit breaker: Attempting reset...")
                self.circuit_open = False
                self.error_count = 0
                return False
        
        return True
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text using NLP backend
        Fallback: Returns neutral sentiment if NLP unavailable
        """
        if await self._check_circuit():
            logger.warning("NLP circuit breaker OPEN - using fallback")
            return self._fallback_sentiment({"fallback_reason": "circuit_breaker"})
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/sentiment",
                    json={"text": text},
                )
                
                if response.status_code == 200:
                    self.error_count = 0  # Reset error count on success
                    data = response.json()
                    return {
                        "sentiment": data.get("sentiment", "neutral"),
                        "score": data.get("score", 0.5),
                        "emotions": data.get("emotions", []),
                        "source": "nlp_backend",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    self.error_count += 1
                    logger.error(f"NLP sentiment analysis failed: {response.status_code}")
                    return self._fallback_sentiment({"error": f"HTTP {response.status_code}"})
        
        except httpx.TimeoutException:
            self.error_count += 1
            logger.warning(f"NLP sentiment analysis timeout ({self.timeout}s)")
            return self._fallback_sentiment({"error": "timeout"})
        
        except httpx.ConnectError as e:
            self.error_count += 1
            logger.warning(f"NLP backend not reachable: {e}")
            return self._fallback_sentiment({"error": "connection_failed"})
        
        except Exception as e:
            self.error_count += 1
            logger.error(f"NLP sentiment analysis error: {e}")
            return self._fallback_sentiment({"error": str(e)})
        
        finally:
            # Check if circuit should open
            if self.error_count >= self.error_threshold:
                self.circuit_open = True
                self.last_error_time = datetime.now()
                logger.error(f"NLP circuit breaker OPEN after {self.error_count} errors")
    
    async def extract_themes(self, text: str) -> Dict[str, Any]:
        """
        Extract themes/topics from text
        Fallback: Returns empty themes if NLP unavailable
        """
        if await self._check_circuit():
            logger.warning("NLP circuit breaker OPEN - using fallback")
            return self._fallback_themes({"fallback_reason": "circuit_breaker"})
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/extract-themes",
                    json={"text": text},
                )
                
                if response.status_code == 200:
                    self.error_count = 0
                    data = response.json()
                    return {
                        "themes": data.get("themes", []),
                        "source": "nlp_backend",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    self.error_count += 1
                    return self._fallback_themes({"error": f"HTTP {response.status_code}"})
        
        except Exception as e:
            self.error_count += 1
            logger.warning(f"NLP theme extraction failed: {e}")
            return self._fallback_themes({"error": str(e)})
        
        finally:
            if self.error_count >= self.error_threshold:
                self.circuit_open = True
                self.last_error_time = datetime.now()
    
    async def score_member(self, member_name: str, debate_text: str) -> Dict[str, Any]:
        """
        Score member's stance on a debate topic
        Fallback: Returns neutral score if NLP unavailable
        """
        if await self._check_circuit():
            return self._fallback_member_score({"fallback_reason": "circuit_breaker"})
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/member-score",
                    json={
                        "member_name": member_name,
                        "text": debate_text
                    },
                )
                
                if response.status_code == 200:
                    self.error_count = 0
                    data = response.json()
                    return {
                        "member": member_name,
                        "stance": data.get("stance", "neutral"),
                        "score": data.get("score", 0.5),
                        "confidence": data.get("confidence", 0.5),
                        "source": "nlp_backend",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    self.error_count += 1
                    return self._fallback_member_score({"error": f"HTTP {response.status_code}"})
        
        except Exception as e:
            self.error_count += 1
            logger.warning(f"NLP member scoring failed: {e}")
            return self._fallback_member_score({"error": str(e)})
        
        finally:
            if self.error_count >= self.error_threshold:
                self.circuit_open = True
                self.last_error_time = datetime.now()
    
    def _fallback_sentiment(self, extra: Dict = None) -> Dict[str, Any]:
        """Fallback sentiment response when NLP is unavailable"""
        response = {
            "sentiment": "neutral",
            "score": 0.5,
            "emotions": [],
            "source": "fallback",
            "fallback": True,
            "timestamp": datetime.now().isoformat()
        }
        if extra:
            response.update(extra)
        return response
    
    def _fallback_themes(self, extra: Dict = None) -> Dict[str, Any]:
        """Fallback themes response when NLP is unavailable"""
        response = {
            "themes": [],
            "source": "fallback",
            "fallback": True,
            "timestamp": datetime.now().isoformat()
        }
        if extra:
            response.update(extra)
        return response
    
    def _fallback_member_score(self, extra: Dict = None) -> Dict[str, Any]:
        """Fallback member score response when NLP is unavailable"""
        response = {
            "stance": "neutral",
            "score": 0.5,
            "confidence": 0.0,
            "source": "fallback",
            "fallback": True,
            "timestamp": datetime.now().isoformat()
        }
        if extra:
            response.update(extra)
        return response
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if NLP backend is healthy"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/health")
                
                if response.status_code in [200, 404]:  # 404 means endpoint not implemented but service is up
                    self.error_count = 0
                    return {
                        "status": "healthy",
                        "service": "NLP Backend",
                        "url": self.base_url
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "service": "NLP Backend",
                        "url": self.base_url,
                        "status_code": response.status_code
                    }
        
        except httpx.ConnectError:
            return {
                "status": "unreachable",
                "service": "NLP Backend",
                "url": self.base_url,
                "error": "Connection refused"
            }
        
        except Exception as e:
            return {
                "status": "error",
                "service": "NLP Backend",
                "url": self.base_url,
                "error": str(e)
            }


# Global instance
_nlp_client = None

def get_nlp_client() -> NLPClient:
    """Get or create NLP client singleton"""
    global _nlp_client
    if _nlp_client is None:
        _nlp_client = NLPClient()
    return _nlp_client

# Example usage in an API endpoint:
# @router.post("/sentiment/analyze")
# async def analyze_sentiment_via_nlp(request: SentimentRequest):
#     nlp = get_nlp_client()
#     result = await nlp.analyze_sentiment(request.text)
#     # Store in database
#     # Return to frontend
#     return result
