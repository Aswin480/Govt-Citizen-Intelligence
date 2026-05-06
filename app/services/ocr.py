import logging
import os
from paddleocr import PaddleOCR
import fitz  # PyMuPDF
import cv2
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self, lang='en', use_gpu=False):
        """
        Initialize the OCR engine.
        Using PaddleOCR used for detection and recognition.
        """
        logger.info(f"Initializing PaddleOCR (lang={lang}, use_gpu={use_gpu})...")
        try:
            self.ocr = PaddleOCR(use_angle_cls=True, lang=lang, use_gpu=use_gpu, show_log=False)
            logger.info("PaddleOCR initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}")
            raise

    def process_pdf(self, pdf_path: str) -> str:
        """
        Extracts text from a PDF file by converting pages to images first.
        This handles scanned PDFs better than direct text extraction.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        logger.info(f"Processing PDF: {pdf_path}")
        full_text = []

        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                logger.info(f"Processing page {page_num + 1}/{len(doc)}...")
                page = doc.load_page(page_num)
                
                # Convert PDF page to image (pixmap)
                # Zoom factor 2.0 provides better resolution for OCR
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                
                # Convert to numpy array for OpenCV/PaddleOCR
                img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                
                # If image has alpha channel, remove it
                if pix.n == 4:
                    img_data = cv2.cvtColor(img_data, cv2.COLOR_RGBA2RGB)
                
                # Perform OCR on the image
                page_text = self._perform_ocr_on_image(img_data)
                full_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
                
            doc.close()
            return "\n\n".join(full_text)

        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise

    def _perform_ocr_on_image(self, img_array) -> str:
        """
        Helper to run PaddleOCR on a single image array.
        """
        result = self.ocr.ocr(img_array, cls=True)
        text_lines = []
        if result and result[0]:
            # result structure: [[[[x1,y1],[x2,y2]...], (text, confidence)], ...]
            for line in result[0]:
                text_lines.append(line[1][0])
        return "\n".join(text_lines)

if __name__ == "__main__":
    # Test stub
    processor = OCRService()
    print("OCR Service Ready.")
