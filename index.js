const MPR121 = require('./lib/MPR121');
const GoveeApi = require('./lib/GoveeApi');
const SCENES = require('./scenes');

// Initialize MPR121 touch sensor
const touchSensor = new MPR121();
const govee = new GoveeApi();

// Selected scenes for pins 4-7
const PIN_SCENES = {
    4: SCENES["Rainbow Swirl"],     // Pin 4: Rainbow Swirl
    5: SCENES["Starry Night"],      // Pin 5: Starry Night
    6: SCENES["Forest Fireflies"],  // Pin 6: Forest Fireflies
    7: SCENES["Space"],             // Pin 7: Space
};

// Handle touch events
touchSensor.on('touch', async (pin) => {
    try {
        switch (pin) {
            case 2: // Turn on
                await govee.controlDevice({
                    type: 'devices.capabilities.on_off',
                    instance: 'powerSwitch',
                    value: 1
                });
                console.log('Light turned on');
                break;

            case 3: // Turn off
                await govee.controlDevice({
                    type: 'devices.capabilities.on_off',
                    instance: 'powerSwitch',
                    value: 0
                });
                console.log('Light turned off');
                break;

            case 4: // Brightness 100%
                await govee.controlDevice({
                    type: 'devices.capabilities.range',
                    instance: 'brightness',
                    value: 100
                });
                console.log('Brightness set to 100%');
                break;

            case 5: // Brightness 0%
                await govee.controlDevice({
                    type: 'devices.capabilities.range',
                    instance: 'brightness',
                    value: 0
                });
                console.log('Brightness set to 0%');
                break;

            case 6:
            case 7:
            case 8:
            case 9:
                // Set dynamic scene
                if (PIN_SCENES[pin]) {
                    await govee.controlDevice({
                        type: 'devices.capabilities.dynamic_scene',
                        instance: 'lightScene',
                        value: PIN_SCENES[pin]
                    });
                    console.log(`Scene set to ${Object.keys(SCENES).find(key => SCENES[key] === PIN_SCENES[pin])}`);
                }
                break;
        }
    } catch (error) {
        console.error('Error controlling light:', error.message);
    }
});

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
console.log('Pin 0: Turn on');
console.log('Pin 1: Turn off');
console.log('Pin 2: Brightness 100%');
console.log('Pin 3: Brightness 0%');
console.log('Pin 4: Rainbow Swirl scene');
console.log('Pin 5: Starry Night scene');
console.log('Pin 6: Forest Fireflies scene');
console.log('Pin 7: Space scene');
