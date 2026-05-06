import logging
import json
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExtractionService:
    def __init__(self, model_name: str = "llama3"):
        """
        Initialize the LLM engine using Ollama.
        """
        self.model_name = model_name
        logger.info(f"Initializing Extraction Service with model: {model_name}")
        self.llm = ChatOllama(model=model_name, format="json", temperature=0)

    def extract_data(self, raw_text: str, schema: Dict[str, str]) -> Dict[str, Any]:
        """
        Extracts structured data from raw text based on a provided schema.
        
        Args:
            raw_text (str): The unstructured text from OCR.
            schema (Dict): A key-value description of fields to extract. 
                           Example: {"name": "Full Name", "dob": "Date of Birth (YYYY-MM-DD)"}
        
        Returns:
            Dict: The extracted JSON data.
        """
        logger.info("Starting data extraction...")
        
        # Construct a clear prompt for the LLM
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are an expert data extraction assistant. Your task is to extract specific information from the provided document text."),
            ("user", """
            Extract the following fields from the document text provided below.
            
            Return the result ONLY as a VALID JSON object. Do not include any markdown formatting, explanations, or extra text.
            If a field is not found, set its value to null.
            
            REQUIRED SCHEMA (Fields to extract):
            {schema}
            
            DOCUMENT TEXT:
            {raw_text}
            """)
        ])
        
        # Chain: Prompt -> LLM -> JSON Parser
        chain = prompt_template | self.llm | JsonOutputParser()
        
        try:
            result = chain.invoke({"schema": json.dumps(schema, indent=2), "raw_text": raw_text})
            logger.info("Extraction completed successfully.")
            return result
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            # Fallback or re-raise
            raise

if __name__ == "__main__":
    # Test stub
    extractor = ExtractionService()
    print("Extraction Service Ready.")
