import './style.css';
import { startTestRoom } from './game/utils/testRoom';
import { startTestDungeon } from './game/utils/testDungeon';

function showMainMenu() {
  // Get references to game-specific UI elements
  const sceneContainer = document.getElementById('scene-container');
  const popupElement = document.getElementById('popup');
  const goldDisplayElement = document.getElementById('gold-display');
  const instructionsElement = document.getElementById('instructions');

  // Hide game-specific UI elements initially
  if (sceneContainer) sceneContainer.style.display = 'none';
  if (popupElement) popupElement.style.display = 'none'; // Will be 'hidden' by class anyway
  if (goldDisplayElement) goldDisplayElement.style.display = 'none';
  if (instructionsElement) instructionsElement.style.display = 'none';


  // Create main menu container
  const menuContainer = document.createElement('div');
  menuContainer.id = 'main-menu-container';
  menuContainer.style.position = 'absolute';
  menuContainer.style.top = '50%';
  menuContainer.style.left = '50%';
  menuContainer.style.transform = 'translate(-50%, -50%)';
  menuContainer.style.textAlign = 'center';
  menuContainer.style.color = 'white'; 
  menuContainer.style.fontFamily = 'Arial, sans-serif';
  menuContainer.style.padding = '20px';
  menuContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
  menuContainer.style.borderRadius = '10px';


  // Create title
  const titleElement = document.createElement('h1');
  titleElement.textContent = 'JCRWL';
  menuContainer.appendChild(titleElement);

  // Create "Start Test Room" button
  const startButton = document.createElement('button');
  startButton.id = 'start-test-room-button';
  startButton.textContent = 'Start Test Room';
  startButton.style.padding = '12px 25px';
  startButton.style.fontSize = '18px';
  startButton.style.marginTop = '20px';
  startButton.style.cursor = 'pointer';
  startButton.style.backgroundColor = '#4CAF50';
  startButton.style.color = 'white';
  startButton.style.border = 'none';
  startButton.style.borderRadius = '5px';
  
  startButton.onmouseenter = () => startButton.style.backgroundColor = '#45a049';
  startButton.onmouseleave = () => startButton.style.backgroundColor = '#4CAF50';
  menuContainer.appendChild(startButton);

  // Create "Start Test Dungeon" button
  const startDungeonButton = document.createElement('button');
  startDungeonButton.id = 'start-test-dungeon-button';
  startDungeonButton.textContent = 'Start Test Dungeon';
  startDungeonButton.style.padding = '12px 25px';
  startDungeonButton.style.fontSize = '18px';
  startDungeonButton.style.marginTop = '10px'; // Add some space below the first button
  startDungeonButton.style.cursor = 'pointer';
  startDungeonButton.style.backgroundColor = '#007bff'; // Blue color
  startDungeonButton.style.color = 'white';
  startDungeonButton.style.border = 'none';
  startDungeonButton.style.borderRadius = '5px';
  
  startDungeonButton.onmouseenter = () => startDungeonButton.style.backgroundColor = '#0069d9';
  startDungeonButton.onmouseleave = () => startDungeonButton.style.backgroundColor = '#007bff';
  menuContainer.appendChild(startDungeonButton);


  document.body.appendChild(menuContainer);

  // Event listener for "Start Test Room" button
  startButton.addEventListener('click', () => {
    menuContainer.style.display = 'none';
    if (sceneContainer) sceneContainer.style.display = 'block';
    if (popupElement) popupElement.style.display = 'block';
    if (goldDisplayElement) goldDisplayElement.style.display = 'block';
    startTestRoom();
  });

  // Event listener for "Start Test Dungeon" button
  startDungeonButton.addEventListener('click', () => {
    menuContainer.style.display = 'none';
    if (sceneContainer) sceneContainer.style.display = 'block';
    // testDungeon.ts also expects popup and goldDisplay to be available,
    // though it might not use them initially.
    if (popupElement) popupElement.style.display = 'block'; 
    if (goldDisplayElement) goldDisplayElement.style.display = 'block';
    startTestDungeon();
  });
}

// Initialize the main menu when the script loads
showMainMenu();
