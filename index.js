const MPR121 = require('./lib/MPR121');
const GoveeApi = require('./lib/GoveeApi');
const SCENES = require('./scenes');

// Configuration
const TOUCH_DEBOUNCE_MS = 1000; // Debounce delay in milliseconds

// Initialize MPR121 touch sensor
const touchSensor = new MPR121();
const govee = new GoveeApi();

const SCENE_COLLECTIONS = {
    NIGHT: ["Sunset", "Moon", "Moonlight", "Mountain Forest", "Fire", "Forest Fireflies", "Space", "Camping", "Starry Night"],
    FUN: ["Groovy", "Shiny Rainbow", "Bubble", "Spider", "Music Note", "Love Heart", "UFO", "Lollipop", "Carousel", "Maze"],
    HOLIDAY: ["Snowman", "Christmas Tree", "Santa Claus", "Sled", "Christmas Gift", "Christmas Wreath"],
    NATURE: ["Sea Island", "Starfish", "Wave", "Rainbow", "Mushroom", "Flamingo Couple", "Waterfall"],
    ARTSY: ["Sunflowers", "Bonsai", "The Scream", "Mondrian", "Graffiti", "Rhomb", "Dot Eater"]
}

// Track current index for each collection
const collectionIndices = {
    4: 0, // NIGHT
    5: 0, // FUN
    6: 0, // HOLIDAY
    7: 0, // NATURE
    8: 0  // ARTSY
};

// Map pins to collections
const PIN_TO_COLLECTION = {
    4: 'NIGHT',
    5: 'FUN',
    6: 'HOLIDAY',
    7: 'NATURE',
    8: 'ARTSY'
};

// Debounce function with immediate execution
function debounce(func, wait) {
    let timeout;
    let lastRun = 0;

    return function executedFunction(...args) {
        const now = Date.now();

        // If enough time has passed since last execution, run immediately
        if (now - lastRun >= wait) {
            func.apply(this, args);
            lastRun = now;
            clearTimeout(timeout);
            return;
        }

        // Otherwise, debounce subsequent calls
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (Date.now() - lastRun >= wait) {
                func.apply(this, args);
                lastRun = Date.now();
            }
        }, wait);
    };
}

// Touch handler function
async function handleTouch(pin) {
    try {
        switch (pin) {
            case 0: // Turn on
                await govee.controlDevice({
                    type: 'devices.capabilities.on_off',
                    instance: 'powerSwitch',
                    value: 1
                });
                console.log('Light turned on');
                break;

            case 9: // Turn off
                await govee.controlDevice({
                    type: 'devices.capabilities.on_off',
                    instance: 'powerSwitch',
                    value: 0
                });
                console.log('Light turned off');
                break;

            case 2: // Brightness 100%
                await govee.controlDevice({
                    type: 'devices.capabilities.range',
                    instance: 'brightness',
                    value: 99
                });
                console.log('Brightness set to 100%');
                break;

            case 3: // Brightness 0%
                await govee.controlDevice({
                    type: 'devices.capabilities.range',
                    instance: 'brightness',
                    value: 1
                });
                console.log('Brightness set to 0%');
                break;

            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                const collection = PIN_TO_COLLECTION[pin];
                const scenes = SCENE_COLLECTIONS[collection];
                const currentIndex = collectionIndices[pin];

                // Get the scene name from the collection
                const sceneName = scenes[currentIndex];
                const sceneId = SCENES[sceneName];

                if (sceneId) {
                    await govee.controlDevice({
                        type: 'devices.capabilities.dynamic_scene',
                        instance: 'lightScene',
                        value: sceneId
                    });
                    console.log(`Scene set to ${sceneName} (${collection} collection)`);

                    // Update index for next touch, wrapping around to 0 if at end
                    collectionIndices[pin] = (currentIndex + 1) % scenes.length;
                }
                break;
        }
    } catch (error) {
        console.error('Error controlling light:', error.message);
    }
}

// Create debounced version of touch handler
const debouncedHandleTouch = debounce(handleTouch, TOUCH_DEBOUNCE_MS);

// Handle touch events with debouncing
touchSensor.on('touch', debouncedHandleTouch);

// Handle errors
touchSensor.on('error', (error) => {
    console.error('Touch sensor error:', error);
});

process.on('SIGINT', () => {
    touchSensor.stopPolling();
    process.exit(0);
});

console.log('Touch control system initialized');
console.log('Pin mappings:');
console.log('Pin 2: Brightness 100%');
console.log('Pin 3: Brightness 0%');
console.log('Pin 4: NIGHT scenes');
console.log('Pin 5: FUN scenes');
console.log('Pin 6: HOLIDAY scenes');
console.log('Pin 7: NATURE scenes');
console.log('Pin 8: ARTSY scenes');
console.log('Pin 9: Turn off');
