import React, { useState } from 'react';
import './VectorSearchPage.css';
import { EmbeddingIndex } from 'client-vector-search';

const VectorSearchPage = () => {
  const [embeddings, setEmbeddings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState([0.3, 0.5, 0.2]);  // Default values
  const [selectedDB, setSelectedDB] = useState('defaultDB'); // New state for selected DB
  const [selectedStore, setSelectedStore] = useState('DefaultStore_1'); // New state for selected Store
  const [databases, setDatabases] = useState(['defaultDB']); // New state for list of databases

  const loadData = async () => {
    const initialObjects_1 = [
      { id: 1, name: "Apple", embedding: Array.from({length: 3}, () => Math.random()) },
      { id: 2, name: "Banana", embedding: Array.from({length: 3}, () => Math.random()) },
      { id: 3, name: "Cheddar", embedding: Array.from({length: 3}, () => Math.random()) },
    ];

    const index_1 = new EmbeddingIndex(initialObjects_1);
    // await index_1.deleteDB(selectedDB);

    // some operation ...
    
    await index_1.saveIndexToDB(selectedDB, selectedStore);
  };

  const handleSearch = async () => {
    const index_1 = new EmbeddingIndex();
    // convert searchQuery to floats
    searchQuery.forEach((value, index) => {
      searchQuery[index] = parseFloat(value);
    });

    console.log("searchQuery: ", searchQuery)
    let result = await index_1.search(searchQuery, {}, true, selectedDB, selectedStore);
    setSearchResult(result);
  };

  const viewEmbeddings = async () => {
    const index_1 = new EmbeddingIndex();
    let embeddings = await index_1.getAllObjectsFromDB(selectedDB, selectedStore);
    console.log("Embeddings: ", embeddings);
    setEmbeddings(embeddings);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="container">
      <div className="sidebar">
        <h2>Settings</h2>
        <label>Select Database:</label>
        <select value={selectedDB} onChange={(e) => setSelectedDB(e.target.value)}>
          {databases.map((db, index) => (
            <option key={index} value={db}>{db}</option>
          ))}
        </select>
        <label>Select Store:</label>
        <input 
          type="text" 
          value={selectedStore} 
          onChange={(e) => setSelectedStore(e.target.value)}
        />
      </div>
      
      <div className="main-content">
        <h1>Vector Search</h1>
        <div className="action-bar">
          <button onClick={loadData}>Load Data</button>
          <input 
            type="text" 
            value={searchQuery.join(",")} 
            placeholder="Enter Search Query"
            onChange={(e) => setSearchQuery(e.target.value.split(","))}
          />
          <button onClick={handleSearch}>Search</button>
          <button onClick={viewEmbeddings}>View Embeddings</button>
        </div>
        
        <div className="results">
          {searchResult?.map((result, index) => (
            <div className="result-card" key={index}>
              <h3>{result.object?.name || 'Unknown'}</h3>
              <p>Embedding: {result.object?.embedding ? result.object.embedding.join(", ") : 'Unknown'}</p>
              <p>Similarity: {result.similarity}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <button onClick={closeModal}>Close</button>
          <h2>Embeddings</h2>
          {embeddings.map((embedding, index) => (
            <div key={index}>
              <p>{embedding.name}</p>
              <p>{embedding.embedding.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default VectorSearchPage;