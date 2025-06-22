import './style.css';
import { startTestRoom } from './game/utils/testRoom';

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

  document.body.appendChild(menuContainer);

  // Add event listener to the button
  startButton.addEventListener('click', () => {
    // Hide main menu
    menuContainer.style.display = 'none';

    // Show game-specific UI elements (if they exist and are part of index.html)
    if (sceneContainer) sceneContainer.style.display = 'block'; 
    if (popupElement) {
        // popupElement starts with class 'hidden'. 
        // We ensure it's in the DOM, testRoom.ts will manage actual visibility.
        popupElement.style.display = 'block'; // Or some other display type if 'hidden' class does more
    }
    if (goldDisplayElement) goldDisplayElement.style.display = 'block';
    
    // instructionsElement is created by testRoom.ts if not found, so no need to show it here
    // unless it was part of index.html and hidden.

    // Call the function to start the test room
    startTestRoom();
  });
}

// Initialize the main menu when the script loads
showMainMenu();
