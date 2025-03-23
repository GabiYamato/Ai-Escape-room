import { useState } from 'react';
import '../styles/QuizQuestion.css';

const QuizQuestion = ({ questionNumber, question, options, selectedOption, onSelectOption }) => {
  const handleOptionSelect = (option) => {
    onSelectOption(option);
  };
  
  return (
    <div className="quiz-question">
      <div className="question-header">
        <h3>Question {questionNumber}</h3>
      </div>
      <p className="question-text">{question}</p>
      
      <div className="options-container">
        {Object.entries(options).map(([optionKey, optionText]) => (
          <div 
            key={optionKey}
            className={`option ${selectedOption === optionKey ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(optionKey)}
          >
            <div className="option-marker">{optionKey.replace('option', '')}</div>
            <div className="option-text">{optionText}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
