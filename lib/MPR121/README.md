# MPR121 Library for Node.js

Access a [MPR121 breakout](https://www.adafruit.com/product/2024) using Node.js from a Raspberry Pi or BeagleBone Black.

## Installation

This library requires [Node.js](https://nodejs.org/) v6.0.0 or higher.

```sh
$ npm install adafruit-mpr121
```

### Detailed Installation for Raspberry Pi

On a Raspberry Pi [configure I2C following these instructions](https://learn.adafruit.com/adafruits-raspberry-pi-lesson-4-gpio-setup/configuring-i2c). E.g.

```sh
sudo apt-get update
sudo apt full-upgrade -y
sudo apt-get install i2c-tools
```

Make sure you follow these [steps to enable autoloading of I2C Kernel module](https://learn.adafruit.com/adafruits-raspberry-pi-lesson-4-gpio-setup/configuring-i2c#installing-kernel-support-with-raspi-config-5-4).

Install Node.js if not yet installed, e.g. to install Node v10:

```sh
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Reboot for above changes to take affect:

```sh
sudo reboot
```

You can check Node version like this:

```sh
node -v
# v10.11.0
```

To install `adafruit-mpr121` in your own Node app:

```sh
mkdir myapp
cd myapp
npm init
npm install adafruit-mpr121 --save
```

To run node in interactive mode on command line:

```sh
node
```

## Basic Example

```js
const MPR121 = require('adafruit-mpr121'),
      mpr121  = new MPR121(0x5A, 1);

// listen for touch events
mpr121.on('touch', (pin) => console.log(`pin ${pin} touched`));

// listen for release events
mpr121.on('release', (pin) => console.log(`pin ${pin} released`));

// listen for changes to the state of a specific pin
mpr121.on(3, (state) => console.log(`pin 3 is ${state ? 'touched' : 'released'}`));

// check the current state of a specific pin synchronously
const state = mpr121.isTouched(2);
console.log(`pin 2 is ${state ? 'touched' : 'released'}`);
```

## API Reference

### Constructor

```js
const mpr121 = new MPR121([address], [bus], [interval])
```

- `address` (optional): I2C address of the MPR121 (default: 0x5A)
- `bus` (optional): I2C bus number (default: 1)
- `interval` (optional): Polling interval in milliseconds (default: 100)

### Methods

#### setThresholds(touch, release)
Sets touch and release thresholds for all electrodes.
- `touch`: Touch threshold (0-255)
- `release`: Release threshold (0-255)
- Returns: Promise that resolves when thresholds are set

```js
await mpr121.setThresholds(12, 6);  // More sensitive than default
```

#### filteredData(pin)
Gets the filtered data value for a specific pin.
- `pin`: Pin number (0-11)
- Returns: Promise that resolves with the filtered data value

```js
const data = await mpr121.filteredData(0);
console.log(`Pin 0 filtered data: ${data}`);
```

#### baselineData(pin)
Gets the baseline data value for a specific pin.
- `pin`: Pin number (0-11)
- Returns: Promise that resolves with the baseline data value

```js
const baseline = await mpr121.baselineData(0);
console.log(`Pin 0 baseline: ${baseline}`);
```

#### touched()
Gets the current touch state of all pins.
- Returns: Promise that resolves with a bitmask of touched pins

```js
const touchState = await mpr121.touched();
console.log(`Touch state bitmask: ${touchState.toString(2)}`);
```

#### isTouched(pin)
Checks if a specific pin is currently touched.
- `pin`: Pin number (0-11)
- Returns: Boolean indicating if pin is touched

```js
if (mpr121.isTouched(0)) {
    console.log('Pin 0 is currently being touched');
}
```

#### stopPolling()
Stops the automatic polling of touch states.

```js
mpr121.stopPolling();  // Stop monitoring touch events
```

### Events

The MPR121 class extends EventEmitter and provides the following events:

#### 'touch'
Emitted when a pin is touched. Callback receives the pin number (0-11).

```js
mpr121.on('touch', (pin) => {
    console.log(`Pin ${pin} was touched`);
});
```

#### 'release'
Emitted when a pin is released. Callback receives the pin number (0-11).

```js
mpr121.on('release', (pin) => {
    console.log(`Pin ${pin} was released`);
});
```

#### Pin-specific events
Each pin (0-11) can be listened to directly. Callback receives boolean indicating touch state.

```js
mpr121.on(0, (touched) => {
    console.log(`Pin 0 is now ${touched ? 'touched' : 'released'}`);
});
```

#### 'ready'
Emitted when the sensor is initialized and ready to use.

```js
mpr121.on('ready', () => {
    console.log('MPR121 is initialized and ready');
});
```

#### 'error'
Emitted when an error occurs.

```js
mpr121.on('error', (error) => {
    console.error('MPR121 error:', error);
});
```

## Advanced Example

```js
const MPR121 = require('adafruit-mpr121');

// Create MPR121 instance with custom settings
const mpr121 = new MPR121(0x5A, 1, 50);  // Faster 50ms polling

// Wait for sensor to be ready
mpr121.on('ready', async () => {
    // Set custom touch thresholds
    await mpr121.setThresholds(12, 6);
    
    // Monitor specific pins
    for (let pin = 0; pin < 12; pin++) {
        mpr121.on(pin, async (touched) => {
            if (touched) {
                // Get additional data when touched
                const filtered = await mpr121.filteredData(pin);
                const baseline = await mpr121.baselineData(pin);
                console.log(`Pin ${pin} touched:`, {
                    filtered,
                    baseline,
                    delta: baseline - filtered
                });
            }
        });
    }
});

// Error handling
mpr121.on('error', (error) => {
    console.error('MPR121 error:', error);
    process.exit(1);
});
```

## License

Copyright (c) 2016 Adafruit Industries. Licensed under the MIT license.
