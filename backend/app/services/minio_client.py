from minio import Minio
from minio.error import S3Error
from app.config import settings
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MinioClient:
    def __init__(self):
        self.client = None
        try:
            self.client = Minio(
                settings.minio_endpoint,
                access_key=settings.minio_access_key,
                secret_key=settings.minio_secret_key,
                secure=settings.minio_secure
            )
            # The list_buckets call is a lightweight way to check if the connection is valid.
            self.client.list_buckets() 
            logger.info("Successfully connected to MinIO.")
            self.ensure_buckets(["raw-html", "raw-pdfs", "processed-intelligence"])
        except Exception as e:
            self.client = None
            logger.warning(f"Could not connect to MinIO at {settings.minio_endpoint}. File upload/download will be disabled. Error: {e}")

    def ensure_buckets(self, buckets: list[str]):
        """Ensure critical buckets exist."""
        if not self.client:
            return
        for bucket in buckets:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    logger.info(f"Created bucket: {bucket}")
            except Exception as e:
                logger.error(f"Error checking/creating bucket {bucket}: {e}")

    def upload_bytes(self, bucket: str, object_name: str, data: bytes, content_type: str = "application/octet-stream"):
        """Upload raw bytes to MinIO."""
        if not self.client:
            logger.warning("MinIO client not available. Skipping upload.")
            return None
        try:
            result = self.client.put_object(
                bucket,
                object_name,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type
            )
            return {
                "bucket": bucket,
                "object_name": object_name,
                "etag": result.etag
            }
        except S3Error as e:
            logger.error(f"Upload failed: {e}")
            return None

    def get_presigned_url(self, bucket: str, object_name: str):
        """Get a temporary URL for downloading content."""
        if not self.client:
            logger.warning("MinIO client not available. Cannot generate presigned URL.")
            return None
        try:
            return self.client.get_presigned_url("GET", bucket, object_name)
        except S3Error as e:
            logger.error(f"Presigned URL failed: {e}")
            return None

# Singleton
minio_client = MinioClient()
