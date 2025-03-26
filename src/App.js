"use client"

import React, { useState, useEffect, useRef } from "react"
import "./App.css"

function App() {
  // State declarations
  const [birdPosition, setBirdPosition] = useState(window.innerHeight / 2)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [pipes, setPipes] = useState([])
  const [highScore, setHighScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [difficulty, setDifficulty] = useState("normal")
  const [birdRotation, setBirdRotation] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const gameContainerRef = useRef(null)

  // Window dimensions
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 700,
  })

  // Audio references
  const jumpSoundRef = useRef(null)
  const hitSoundRef = useRef(null)
  const scoreSoundRef = useRef(null)
  const buttonClickSoundRef = useRef(null)

  // Game constants
  const gravity = 5
  const jumpHeight = 60
  const pipeGap = Math.min(220, windowDimensions.height * 0.3) // Responsive pipe gap
  const pipeSpeed = difficulty === "easy" ? 3 : difficulty === "hard" ? 7 : 5
  const pipeWidth = 80

  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
      // Adjust bird position when window is resized
      if (!gameStarted) {
        setBirdPosition(window.innerHeight / 2)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [gameStarted])

  // Sound functions
  const playSound = (soundRef) => {
    if (!isMuted && soundRef.current) {
      soundRef.current.currentTime = 0
      soundRef.current.play().catch((error) => console.error("Audio play error:", error))
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    setIsMuted(!isMuted)
    playSound(buttonClickSoundRef)
  }

  // Fullscreen toggle
  const toggleFullscreen = (e) => {
    e.stopPropagation()

    if (!document.fullscreenElement) {
      if (gameContainerRef.current.requestFullscreen) {
        gameContainerRef.current.requestFullscreen()
      } else if (gameContainerRef.current.webkitRequestFullscreen) {
        gameContainerRef.current.webkitRequestFullscreen()
      } else if (gameContainerRef.current.msRequestFullscreen) {
        gameContainerRef.current.msRequestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
      setIsFullscreen(false)
    }

    playSound(buttonClickSoundRef)
  }

  // Jump function
  const jump = () => {
    if (!gameOver && !isPaused) {
      setBirdPosition((position) => position - jumpHeight)
      setBirdRotation(-20) // Rotate bird up when jumping
      playSound(jumpSoundRef)
    }
  }

  // Game physics
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const interval = setInterval(() => {
        setBirdPosition((position) => position + gravity)
        setBirdRotation((rotation) => Math.min(rotation + 2, 30)) // Gradually rotate bird down
        setPipes((pipes) =>
          pipes.map((pipe) => ({ ...pipe, x: pipe.x - pipeSpeed })).filter((pipe) => pipe.x > -pipeWidth),
        )
      }, 30)

      return () => clearInterval(interval)
    }
  }, [gameStarted, gameOver, isPaused, pipeSpeed])

  // Pipe generation
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const pipeInterval = setInterval(() => {
        const newPipeY = Math.random() * (windowDimensions.height * 0.6 - pipeGap)
        setPipes((pipes) => [...pipes, { x: windowDimensions.width, y: newPipeY, passed: false }])
      }, 3000)

      return () => clearInterval(pipeInterval)
    }
  }, [gameStarted, gameOver, isPaused, pipeGap, windowDimensions])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space") {
        if (!gameStarted) {
          setGameStarted(true)
          playSound(buttonClickSoundRef)
        }
        jump()
      }
      if (e.code === "KeyM") {
        setIsMuted(!isMuted)
      }
      if (e.code === "KeyF") {
        toggleFullscreen(e)
      }
      if (e.code === "Escape" && gameStarted && !gameOver) {
        togglePause(e)
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [gameStarted, isMuted])

  // Collision detection
  useEffect(() => {
    if (!gameStarted || gameOver) return

    // Check if bird hits the ground or ceiling
    if (birdPosition > windowDimensions.height * 0.8 - 40 || birdPosition < 0) {
      setGameOver(true)
      playSound(hitSoundRef)
      return
    }

    // Check for pipe collisions
    for (const pipe of pipes) {
      if (pipe.x < windowDimensions.width * 0.1 + 40 && pipe.x > windowDimensions.width * 0.1 - pipeWidth) {
        if (birdPosition < pipe.y || birdPosition > pipe.y + pipeGap) {
          setGameOver(true)
          playSound(hitSoundRef)
          return
        }
      }

      // Score when passing a pipe
      if (pipe.x < windowDimensions.width * 0.1 - 20 && !pipe.passed) {
        setScore((score) => score + 1)
        setPipes((pipes) => pipes.map((p) => (p === pipe ? { ...p, passed: true } : p)))
        playSound(scoreSoundRef)
      }
    }
  }, [birdPosition, pipes, gameStarted, gameOver, pipeGap, score, windowDimensions])

  // High score tracking
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score)
    }
  }, [gameOver, score, highScore])

  // Reset game
  const resetGame = (e) => {
    if (e) e.stopPropagation()
    setBirdPosition(windowDimensions.height / 2)
    setGameOver(false)
    setScore(0)
    setPipes([])
    setGameStarted(false)
    setIsPaused(false)
    setBirdRotation(0)
    playSound(buttonClickSoundRef)
  }

  // Toggle pause
  const togglePause = (e) => {
    if (e) e.stopPropagation()
    setIsPaused(!isPaused)
    playSound(buttonClickSoundRef)
  }

  // Change difficulty
  const changeDifficulty = (level, e) => {
    e.stopPropagation()
    setDifficulty(level)
    playSound(buttonClickSoundRef)
  }

  return (
    <div className={`game-container ${isFullscreen ? "fullscreen" : ""}`} ref={gameContainerRef}>
      {/* Audio elements */}
      <audio ref={jumpSoundRef} src="/sounds/jump.mp3" preload="auto"></audio>
      <audio ref={hitSoundRef} src="/sounds/hit.mp3" preload="auto"></audio>
      <audio ref={scoreSoundRef} src="/sounds/score.mp3" preload="auto"></audio>
      <audio ref={buttonClickSoundRef} src="/sounds/click.mp3" preload="auto"></audio>

      <div
        className="game"
        onClick={() => {
          if (!gameStarted) {
            setGameStarted(true)
            playSound(buttonClickSoundRef)
          }
          if (!gameOver && !isPaused) jump()
        }}
      >
        {/* Sky background */}
        <div className="sky"></div>

        {/* Ground */}
        <div className="ground"></div>

        {/* Bird */}
        <div
          className="bird"
          style={{
            top: birdPosition,
            transform: `rotate(${birdRotation}deg)`,
          }}
        ></div>

        {/* Pipes */}
        {pipes.map((pipe, i) => (
          <React.Fragment key={i}>
            <div className="pipe-top" style={{ left: pipe.x, height: pipe.y }}></div>
            <div className="pipe-bottom" style={{ left: pipe.x, top: pipe.y + pipeGap }}></div>
          </React.Fragment>
        ))}

        {/* Sound control button */}
        <button className="sound-button" onClick={toggleMute}>
          {isMuted ? "🔇" : "🔊"}
        </button>

        {/* Fullscreen button */}
        <button className="fullscreen-button" onClick={toggleFullscreen}>
          {isFullscreen ? "⤓" : "⤢"}
        </button>

        {/* Game UI */}
        {!gameStarted && (
          <div className="start-screen">
            <h1>Flappy Bird</h1>

            <div className="difficulty-section">
              <h2>Select Difficulty</h2>
              <div className="difficulty-buttons">
                <button
                  className={`button ${difficulty === "easy" ? "active" : ""}`}
                  onClick={(e) => changeDifficulty("easy", e)}
                >
                  Easy
                </button>
                <button
                  className={`button ${difficulty === "normal" ? "active" : ""}`}
                  onClick={(e) => changeDifficulty("normal", e)}
                >
                  Normal
                </button>
                <button
                  className={`button ${difficulty === "hard" ? "active" : ""}`}
                  onClick={(e) => changeDifficulty("hard", e)}
                >
                  Hard
                </button>
              </div>
            </div>

            <p className="high-score-text">High Score: {highScore}</p>

            <button
              className="start-button"
              onClick={(e) => {
                e.stopPropagation()
                setGameStarted(true)
                playSound(buttonClickSoundRef)
              }}
            >
              Start Game
            </button>

            <p className="instructions">Click or press Space to jump</p>
            <p className="instructions">Press M to mute/unmute sounds</p>
            <p className="instructions">Press F for fullscreen</p>
            <p className="instructions">Press ESC to pause</p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Score: {score}</p>
            <p>High Score: {highScore}</p>
            <button className="button" onClick={resetGame}>
              Play Again
            </button>
          </div>
        )}

        {/* Score Display */}
        {gameStarted && !gameOver && (
          <div className="score-display">
            <div className="current-score">{score}</div>
          </div>
        )}

        {/* Pause Button */}
        {gameStarted && !gameOver && (
          <button className="pause-button" onClick={togglePause}>
            {isPaused ? "Resume" : "Pause"}
          </button>
        )}

        {/* Pause Screen */}
        {isPaused && (
          <div className="pause-screen">
            <h2>Paused</h2>
            <button className="button" onClick={togglePause}>
              Resume
            </button>
            <button className="button" onClick={resetGame}>
              Main Menu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

