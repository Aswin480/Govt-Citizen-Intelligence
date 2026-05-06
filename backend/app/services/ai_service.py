import os
import glob
from typing import List, Dict

class OracleEngine:
    """
    A lightweight RAG (Retrieval Augmented Generation) engine for the Government System.
    It digests policy documents and answers user queries with citations.
    """
    
    def __init__(self, policy_dir: str = "data/policies"):
        self.policy_dir = policy_dir
        self.documents = [] # List of {filename, content, chunks}
        self.is_loaded = False

    def load_knowledge_base(self):
        """
        Loads all text files from the policy directory into memory.
        """
        if self.is_loaded:
            return

        print(f"🔍 Search: Loading knowledge from {self.policy_dir}...")
        try:
            files = glob.glob(os.path.join(self.policy_dir, "*.txt"))
            for f_path in files:
                with open(f_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    self.documents.append({
                        "filename": os.path.basename(f_path),
                        "content": content,
                        "paragraphs": [p for p in content.split("\n\n") if len(p) > 50]
                    })
            self.is_loaded = True
            print(f"🔍 Search: Loaded {len(self.documents)} documents.")
        except Exception as e:
            print(f"🔍 Search Error: {e}")

    def query(self, question: str) -> Dict:
        """
        Answers a question by finding the most relevant policy paragraph.
        Uses simple keyword matching (TF-IDF style heuristic).
        """
        if not self.is_loaded:
            self.load_knowledge_base()

        best_score = 0
        best_paragraph = "No relevant policy found."
        source_doc = "N/A"

        keywords = [w.lower() for w in question.split() if len(w) > 4] # Simple tokenizer

        for doc in self.documents:
            for para in doc["paragraphs"]:
                score = sum(1 for k in keywords if k in para.lower())
                if score > best_score:
                    best_score = score
                    best_paragraph = para
                    source_doc = doc["filename"]

        return {
            "answer": best_paragraph,
            "source": source_doc,
            "confidence": "High" if best_score > 2 else "Low" if best_score > 0 else "None"
        }

# Singleton instance
oracle = OracleEngine()
