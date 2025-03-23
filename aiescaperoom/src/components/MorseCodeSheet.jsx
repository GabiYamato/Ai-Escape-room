import React from 'react';
import '../styles/MorseCodeSheet.css';

const MorseCodeSheet = () => {
  // Morse code mappings
  const morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 
    'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/'
  };

  // Create arrays of letters, numbers, and space for organized display
  const letters = Object.entries(morseCode).filter(([key]) => /[A-Z]/.test(key));
  const numbers = Object.entries(morseCode).filter(([key]) => /[0-9]/.test(key));
  const space = [['SPACE', '/']];

  return (
    <div className="morse-code-reference">
      <h3>MORSE CODE TRANSLATION MATRIX</h3>
      
      <h4>ALPHABETIC CHARACTERS</h4>
      <table className="morse-code-table">
        <thead>
          <tr>
            <th>CHARACTER</th>
            <th>MORSE CODE</th>
            <th>CHARACTER</th>
            <th>MORSE CODE</th>
          </tr>
        </thead>
        <tbody>
          {letters.map((item, index) => {
            if (index % 2 === 0 && index < letters.length - 1) {
              return (
                <tr key={item[0]}>
                  <td>{item[0]}</td>
                  <td className="morse-code-symbol">{item[1]}</td>
                  <td>{letters[index + 1][0]}</td>
                  <td className="morse-code-symbol">{letters[index + 1][1]}</td>
                </tr>
              );
            } else if (index % 2 === 0) {
              return (
                <tr key={item[0]}>
                  <td>{item[0]}</td>
                  <td className="morse-code-symbol">{item[1]}</td>
                  <td></td>
                  <td></td>
                </tr>
              );
            }
            return null;
          })}
        </tbody>
      </table>
      
      <h4>NUMERIC CHARACTERS</h4>
      <table className="morse-code-table">
        <thead>
          <tr>
            <th>CHARACTER</th>
            <th>MORSE CODE</th>
            <th>CHARACTER</th>
            <th>MORSE CODE</th>
          </tr>
        </thead>
        <tbody>
          {numbers.map((item, index) => {
            if (index % 2 === 0 && index < numbers.length - 1) {
              return (
                <tr key={item[0]}>
                  <td>{item[0]}</td>
                  <td className="morse-code-symbol">{item[1]}</td>
                  <td>{numbers[index + 1][0]}</td>
                  <td className="morse-code-symbol">{numbers[index + 1][1]}</td>
                </tr>
              );
            } else if (index % 2 === 0) {
              return (
                <tr key={item[0]}>
                  <td>{item[0]}</td>
                  <td className="morse-code-symbol">{item[1]}</td>
                  <td></td>
                  <td></td>
                </tr>
              );
            }
            return null;
          })}
        </tbody>
      </table>
      
      <h4>SPECIAL CHARACTERS</h4>
      <table className="morse-code-table">
        <thead>
          <tr>
            <th>CHARACTER</th>
            <th>MORSE CODE</th>
          </tr>
        </thead>
        <tbody>
          {space.map(item => (
            <tr key={item[0]}>
              <td>{item[0]}</td>
              <td className="morse-code-symbol">{item[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="morse-hint">
        <p>DECODING PROTOCOL: Use a space between morse characters and a slash (/) between words</p>
        <p>EXAMPLE: ".-- --- .-. -.. / -.-. --- -.. ." decodes to "WORD CODE"</p>
      </div>
    </div>
  );
};

export default MorseCodeSheet;
