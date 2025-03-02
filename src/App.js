import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  // State declarations
  const [birdPosition, setBirdPosition] = useState(250);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [pipes, setPipes] = useState([]);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');

  // Game constants
  const gravity = 6;
  const jumpHeight = 80;
  const pipeGap = 200;

  const jump = useCallback(() => {
    if (!gameOver && !isPaused) {
      setBirdPosition(position => position - jumpHeight);
    }
  }, [gameOver, isPaused]);

  // Game physics
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const interval = setInterval(() => {
        setBirdPosition(position => position + gravity);
        setPipes(pipes => pipes
          .map(pipe => ({ ...pipe, x: pipe.x - 5 }))
          .filter(pipe => pipe.x > -50)
        );
      }, 30);

      return () => clearInterval(interval);
    }
  }, [gameStarted, gameOver, isPaused]);

  // Pipe generation
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const pipeInterval = setInterval(() => {
        const newPipeY = Math.random() * (400 - pipeGap);
        setPipes(pipes => [...pipes, { x: 800, y: newPipeY }]);
      }, 3000);

      return () => clearInterval(pipeInterval);
    }
  }, [gameStarted, gameOver, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        if (!gameStarted) setGameStarted(true);
        jump();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [gameStarted, jump]);

  // Collision detection
  useEffect(() => {
    if (birdPosition > 500 || birdPosition < 0) {
      setGameOver(true);
    }

    pipes.forEach(pipe => {
      if (pipe.x < 100 && pipe.x > 20) {
        if (birdPosition < pipe.y || birdPosition > pipe.y + pipeGap) {
          setGameOver(true);
        }
      }
      if (pipe.x === 20) {
        setScore(score => score + 1);
      }
    });
  }, [birdPosition, pipes]);

  // High score tracking
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const resetGame = () => {
    setBirdPosition(250);
    setGameOver(false);
    setScore(0);
    setPipes([]);
    setGameStarted(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="game" onClick={() => { 
      if (!gameStarted) setGameStarted(true);
      if (!gameOver && !isPaused) jump();
    }}>
      <div className="bird" style={{ top: birdPosition }}></div>
      {pipes.map((pipe, i) => (
        <React.Fragment key={i}>
          <div className="pipe-top" style={{ left: pipe.x, height: pipe.y }}></div>
          <div className="pipe-bottom" style={{ left: pipe.x, top: pipe.y + pipeGap }}></div>
        </React.Fragment>
      ))}
      {!gameStarted && <div className="start-message">Click or Press Space to Start</div>}
      {gameOver && <div className="game-over">Game Over! Score: {score}</div>}
      <div className="score">Score: {score}</div>
      <div className="high-score">High Score: {highScore}</div>
      
      <div className="controls">
        {gameOver ? (
          <button className="button" onClick={resetGame}>
            Restart
          </button>
        ) : (
          <>
            {gameStarted && (
              <button className="button" onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;