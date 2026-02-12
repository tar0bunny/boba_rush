import React, { useState, useEffect, useRef } from 'react';

export default function BobaRush() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver'
  const [drinkPosition, setDrinkPosition] = useState(50); // percentage from left
  const [pearls, setPearls] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [drinkImage, setDrinkImage] = useState(null);
  const [pearlImage, setPearlImage] = useState(null);
  
  const gameAreaRef = useRef(null);
  const touchStartX = useRef(null);
  const lastPearlId = useRef(0);
  const animationFrameRef = useRef(null);
  const lastSpawnTime = useRef(0);

  // Game constants
  const DRINK_WIDTH = 80;
  const PEARL_SIZE = 30;
  const BASE_FALL_SPEED = 2;
  const BASE_SPAWN_RATE = 1000;
  const PEARLS_PER_LEVEL = 20;

  // Calculate current game speed
  const getFallSpeed = () => BASE_FALL_SPEED + (level - 1) * 0.5;
  const getSpawnRate = () => Math.max(400, BASE_SPAWN_RATE - (level - 1) * 80);

  // Handle image uploads
  const handleDrinkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setDrinkImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePearlUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPearlImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setPearls([]);
    setDrinkPosition(50);
    lastSpawnTime.current = Date.now();
  };

  // Spawn a new pearl
  const spawnPearl = () => {
    const newPearl = {
      id: ++lastPearlId.current,
      x: Math.random() * 85 + 5,
      y: -PEARL_SIZE,
      caught: false
    };
    
    setPearls(prev => [...prev, newPearl]);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = (timestamp) => {
      const gameArea = gameAreaRef.current;
      if (!gameArea) return;

      // Spawn pearls
      const now = Date.now();
      if (now - lastSpawnTime.current > getSpawnRate()) {
        spawnPearl();
        lastSpawnTime.current = now;
      }

      // Update pearls
      setPearls(prev => {
        const gameHeight = gameArea.clientHeight;
        const gameWidth = gameArea.clientWidth;
        const fallSpeed = getFallSpeed();
        
        const drinkLeft = (drinkPosition / 100) * gameWidth - DRINK_WIDTH / 2;
        const drinkRight = drinkLeft + DRINK_WIDTH;
        const drinkTop = gameHeight - 120;

        let newPearls = [];
        let missedPearl = false;

        for (let pearl of prev) {
          if (pearl.caught) continue;

          const newY = pearl.y + fallSpeed;
          const pearlLeft = (pearl.x / 100) * gameWidth;
          const pearlRight = pearlLeft + PEARL_SIZE;
          const pearlBottom = newY + PEARL_SIZE;

          // Check if pearl is caught
          if (newY < drinkTop + 40 && pearlBottom > drinkTop &&
              pearlRight > drinkLeft && pearlLeft < drinkRight) {
            setScore(s => {
              const newScore = s + 1;
              // Check for level up
              if (newScore % PEARLS_PER_LEVEL === 0) {
                setLevel(l => l + 1);
                setShowLevelUp(true);
                setTimeout(() => setShowLevelUp(false), 1500);
              }
              return newScore;
            });
            continue; // Pearl caught, remove it
          }

          // Check if pearl missed
          if (newY > gameHeight) {
            missedPearl = true;
            continue;
          }

          // Keep pearl
          newPearls.push({ ...pearl, y: newY });
        }

        if (missedPearl) {
          setGameState('gameOver');
          setHighScore(prev => Math.max(prev, score));
        }

        return newPearls;
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, drinkPosition, level, score]);

  // Touch controls
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null || !gameAreaRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const gameWidth = gameAreaRef.current.clientWidth;
    const newPosition = (currentX / gameWidth) * 100;
    
    setDrinkPosition(Math.max(10, Math.min(90, newPosition)));
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  // Mouse controls (for testing)
  const handleMouseDown = (e) => {
    touchStartX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (touchStartX.current === null || !gameAreaRef.current) return;
    
    const gameWidth = gameAreaRef.current.clientWidth;
    const newPosition = (e.clientX / gameWidth) * 100;
    
    setDrinkPosition(Math.max(10, Math.min(90, newPosition)));
  };

  const handleMouseUp = () => {
    touchStartX.current = null;
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-pink-100 to-purple-100 flex flex-col items-center justify-center overflow-hidden">
      {gameState === 'start' && (
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-md mx-4">
          <h1 className="text-5xl font-bold text-pink-500 mb-4">🧋 Boba Rush</h1>
          <p className="text-gray-700 mb-6 text-lg">Swipe to catch falling boba pearls!</p>
          
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Boba Drink Image:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleDrinkUpload}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Pearl Image:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePearlUpload}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
          </div>

          {highScore > 0 && (
            <p className="text-gray-600 mb-4">High Score: {highScore}</p>
          )}
          
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div
          ref={gameAreaRef}
          className="relative w-full h-full bg-gradient-to-b from-sky-200 to-pink-200"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Score and Level Display */}
          <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <span className="text-lg font-bold text-purple-600">Score: {score}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <span className="text-lg font-bold text-pink-600">Level {level}</span>
            </div>
          </div>

          {/* Level Up Notification */}
          {showLevelUp && (
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 animate-bounce">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold py-3 px-6 rounded-full shadow-2xl text-xl">
                Level {level}!
              </div>
            </div>
          )}

          {/* Falling Pearls */}
          {pearls.map(pearl => (
            <div
              key={pearl.id}
              className="absolute"
              style={{
                left: `${pearl.x}%`,
                top: `${pearl.y}px`,
                width: `${PEARL_SIZE}px`,
                height: `${PEARL_SIZE}px`,
              }}
            >
              {pearlImage ? (
                <img
                  src={pearlImage}
                  alt="pearl"
                  className="w-full h-full object-contain"
                  draggable="false"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg" />
              )}
            </div>
          ))}

          {/* Boba Drink */}
          <div
            className="absolute bottom-8 transform -translate-x-1/2"
            style={{
              left: `${drinkPosition}%`,
              width: `${DRINK_WIDTH}px`,
              height: '100px',
            }}
          >
            {drinkImage ? (
              <img
                src={drinkImage}
                alt="boba drink"
                className="w-full h-full object-contain"
                draggable="false"
              />
            ) : (
              <div className="relative w-full h-full">
                <div className="absolute bottom-0 w-full h-20 bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg border-4 border-amber-300 shadow-xl" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-12 bg-pink-300 rounded-full" />
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-md mx-4">
          <h2 className="text-4xl font-bold text-red-500 mb-4">Game Over!</h2>
          <p className="text-2xl text-gray-700 mb-2">Score: {score}</p>
          <p className="text-xl text-gray-600 mb-4">Level: {level}</p>
          {score === highScore && score > 0 && (
            <p className="text-lg text-yellow-600 font-bold mb-4">🎉 New High Score! 🎉</p>
          )}
          {highScore > 0 && score !== highScore && (
            <p className="text-gray-600 mb-4">High Score: {highScore}</p>
          )}
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
