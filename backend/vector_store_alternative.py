"""
Alternative vector store implementation that doesn't rely on FAISS.
This is a simple in-memory vector store that can be used as a fallback.
"""

import numpy as np
from typing import List, Dict, Any, Optional
import json
import os
import pickle

class SimpleVectorStore:
    """
    A simple in-memory vector store implementation.
    This is a fallback option when FAISS is not available.
    """
    
    def __init__(self, folder_path: str = "/tmp/"):
        """
        Initialize the vector store.
        
        Args:
            folder_path: Path to store the index files
        """
        self.folder_path = folder_path
        self.embeddings = []
        self.documents = []
        self.metadata = []
        
    def add_documents(self, documents: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Add documents and their embeddings to the store.
        
        Args:
            documents: List of document dictionaries
            embeddings: List of embedding vectors
        """
        self.documents.extend(documents)
        self.embeddings.extend(embeddings)
        self.metadata.extend([doc.get("metadata", {}) for doc in documents])
        
    def similarity_search(self, query_embedding: List[float], k: int = 5) -> List[Dict[str, Any]]:
        """
        Perform a similarity search.
        
        Args:
            query_embedding: The query embedding vector
            k: Number of results to return
            
        Returns:
            List of documents with their similarity scores
        """
        if not self.embeddings:
            return []
            
        # Convert to numpy arrays for efficient computation
        query_embedding = np.array(query_embedding)
        embeddings = np.array(self.embeddings)
        
        # Calculate cosine similarity
        similarities = np.dot(embeddings, query_embedding) / (
            np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        # Get top k indices
        top_k_indices = np.argsort(similarities)[-k:][::-1]
        
        # Return top k documents with their similarity scores
        results = []
        for idx in top_k_indices:
            results.append({
                "document": self.documents[idx],
                "metadata": self.metadata[idx],
                "similarity": float(similarities[idx])
            })
            
        return results
        
    def save_local(self, index_name: str, folder_path: Optional[str] = None):
        """
        Save the vector store to disk.
        
        Args:
            index_name: Name of the index file
            folder_path: Optional path to save the index
        """
        if folder_path is None:
            folder_path = self.folder_path
            
        os.makedirs(folder_path, exist_ok=True)
        
        data = {
            "embeddings": self.embeddings,
            "documents": self.documents,
            "metadata": self.metadata
        }
        
        with open(os.path.join(folder_path, f"{index_name}.pkl"), "wb") as f:
            pickle.dump(data, f)
            
    @classmethod
    def load_local(cls, index_name: str, folder_path: str, embeddings=None):
        """
        Load a vector store from disk.
        
        Args:
            index_name: Name of the index file
            folder_path: Path to the index file
            embeddings: Embeddings model (not used in this implementation)
            
        Returns:
            Loaded vector store
        """
        vector_store = cls(folder_path=folder_path)
        
        with open(os.path.join(folder_path, f"{index_name}.pkl"), "rb") as f:
            data = pickle.load(f)
            
        vector_store.embeddings = data["embeddings"]
        vector_store.documents = data["documents"]
        vector_store.metadata = data["metadata"]
        
        return vector_store
        
    def as_retriever(self, search_type: str = "similarity", search_kwargs: Dict[str, Any] = None):
        """
        Create a retriever from the vector store.
        
        Args:
            search_type: Type of search (only "similarity" is supported)
            search_kwargs: Search parameters
            
        Returns:
            Retriever object
        """
        if search_kwargs is None:
            search_kwargs = {}
            
        k = search_kwargs.get("k", 5)
        
        def retriever(query_embedding):
            return self.similarity_search(query_embedding, k=k)
            
        return retriever 