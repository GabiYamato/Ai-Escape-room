import React from 'react';
import '../styles/CodeSnippet.css';

// Code snippet data (divided and shuffled)
const snippets = {
  "data-loading": [
    "import pandas as pd",
    "import numpy as np",
    "from sklearn.model_selection import train_test_split",
    "from sklearn.metrics import mean_squared_error, r2_score",
    "# Load datasets",
    "train = pd.read_csv(\"train.csv\")",
    "train_output = pd.read_csv(\"trainoutput.csv\")",
    "test = pd.read_csv(\"test.csv\")",
    "# Feature & label selection",
    "train_x = train.drop(columns=[\"Serial No.\"])",
    "train_y = train_output.drop(columns=[\"Serial No.\"])"
  ],
  "model-training": [
    "from sklearn.ensemble import RandomForestRegressor",
    "from sklearn.linear_model import LinearRegression",
    "# Split dataset for validation",
    "X_train, X_val, y_train, y_val = train_test_split(train_x, train_y, test_size=0.2, random_state=42)",
    "# Train models",
    "rf_model = RandomForestRegressor(random_state=42)",
    "lr_model = LinearRegression()",
    "rf_model.fit(X_train, y_train.values.ravel())",
    "lr_model.fit(X_train, y_train.values.ravel())"
  ],
  "evaluation-prediction": [
    "# Evaluate models",
    "val_y_rf = rf_model.predict(X_val)",
    "val_y_lr = lr_model.predict(X_val)",
    "mse_rf = mean_squared_error(y_val, val_y_rf)",
    "r2_rf = r2_score(y_val, val_y_rf)",
    "mse_lr = mean_squared_error(y_val, val_y_lr)",
    "r2_lr = r2_score(y_val, val_y_lr)",
    "print(f\"Random Forest - MSE: {mse_rf:.4f}, R²: {r2_rf:.4f}\")",
    "print(f\"Linear Regression - MSE: {mse_lr:.4f}, R²: {r2_lr:.4f}\")",
    "# Predict on test set",
    "test_x = test.drop(columns=[\"Serial No.\"])",
    "test_y_rf = rf_model.predict(test_x)",
    "test_y_lr = lr_model.predict(test_x)",
    "# Save predictions",
    "pd.DataFrame({'Serial No.': test[\"Serial No.\"], 'Chance of Admit': test_y_rf}).to_csv(\"rf_testoutput.csv\", index=False)",
    "pd.DataFrame({'Serial No.': test[\"Serial No.\"], 'Chance of Admit': test_y_lr}).to_csv(\"lr_testoutput.csv\", index=False)"
  ]
};

// Shuffle the snippets to make it more challenging
const shuffleSnippet = (snippetId) => {
  const snippet = [...snippets[snippetId]];
  // Use a seeded random function to ensure consistency
  const seededShuffle = (array, seed = 42) => {
    let currentIndex = array.length;
    let temporaryValue, randomIndex;
    
    // Create a pseudo-random generator with seed
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    
    // While there remain elements to shuffle
    while (0 !== currentIndex) {
      // Pick a remaining element
      randomIndex = Math.floor(random() * currentIndex);
      currentIndex -= 1;
      
      // Swap with the current element
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    
    return array;
  };
  
  return seededShuffle(snippet);
};

const CodeSnippet = ({ stage, currentStage, snippetId }) => {
  const isUnlocked = currentStage >= stage;
  const shuffledCode = shuffleSnippet(snippetId);
  
  return (
    <div className={`code-snippet ${isUnlocked ? 'unlocked' : 'locked'}`}>
      <div className="snippet-header">
        <h4>{
          snippetId === "data-loading" ? "Data Loading" : 
          snippetId === "model-training" ? "Model Training" : 
          "Evaluation & Prediction"
        }</h4>
        <div className="lock-icon">
          {isUnlocked ? '🔓' : '🔒'}
        </div>
      </div>
      
      {isUnlocked ? (
        <pre className="code-block">
          <code>
            {shuffledCode.join('\n')}
          </code>
        </pre>
      ) : (
        <div className="locked-message">
          <p>Complete Stage {stage} to unlock this code snippet</p>
        </div>
      )}
    </div>
  );
};

export default CodeSnippet;
