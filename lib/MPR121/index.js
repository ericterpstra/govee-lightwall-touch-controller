'use strict';

/**
 * @fileoverview MPR121 Capacitive Touch Sensor Driver
 * This module provides a driver for the MPR121 capacitive touch sensor controller,
 * communicating over I2C. It supports up to 12 capacitive touch inputs and provides
 * events for touch and release actions.
 * 
 * @module MPR121
 * @requires i2c-bus
 * @requires events
 */

const i2c = require('i2c-bus'),
    EventEmitter = require('events');

// MPR121 Register Addresses
/** @const {number} Default I2C address for MPR121 */
const MPR121_I2CADDR_DEFAULT = 0x5A,
    /** @const {number} Touch status register (LSB) */
    MPR121_TOUCHSTATUS_L = 0x00,
    /** @const {number} Touch status register (MSB) */
    MPR121_TOUCHSTATUS_H = 0x01,
    /** @const {number} Filtered data register start (LSB) */
    MPR121_FILTDATA_0L = 0x04,
    /** @const {number} Filtered data register start (MSB) */
    MPR121_FILTDATA_0H = 0x05,
    /** @const {number} Baseline data register start */
    MPR121_BASELINE_0 = 0x1E,
    /** @const {number} Rising MHD register */
    MPR121_MHDR = 0x2B,
    /** @const {number} Rising NHD register */
    MPR121_NHDR = 0x2C,
    /** @const {number} Rising NCL register */
    MPR121_NCLR = 0x2D,
    /** @const {number} Rising FDL register */
    MPR121_FDLR = 0x2E,
    /** @const {number} Falling MHD register */
    MPR121_MHDF = 0x2F,
    /** @const {number} Falling NHD register */
    MPR121_NHDF = 0x30,
    /** @const {number} Falling NCL register */
    MPR121_NCLF = 0x31,
    /** @const {number} Falling FDL register */
    MPR121_FDLF = 0x32,
    /** @const {number} Touched NHD register */
    MPR121_NHDT = 0x33,
    /** @const {number} Touched NCL register */
    MPR121_NCLT = 0x34,
    /** @const {number} Touched FDL register */
    MPR121_FDLT = 0x35,
    /** @const {number} Touch threshold register start */
    MPR121_TOUCHTH_0 = 0x41,
    /** @const {number} Release threshold register start */
    MPR121_RELEASETH_0 = 0x42,
    /** @const {number} Debounce register */
    MPR121_DEBOUNCE = 0x5B,
    /** @const {number} Configuration register 1 */
    MPR121_CONFIG1 = 0x5C,
    /** @const {number} Configuration register 2 */
    MPR121_CONFIG2 = 0x5D,
    /** @const {number} Electrode configuration register */
    MPR121_ECR = 0x5E,
    /** @const {number} Charge current register start */
    MPR121_CHARGECURR_0 = 0x5F,
    /** @const {number} Charge time register */
    MPR121_CHARGETIME_1 = 0x6C,
    /** @const {number} GPIO direction register */
    MPR121_GPIODIR = 0x76,
    /** @const {number} GPIO enable register */
    MPR121_GPIOEN = 0x77,
    /** @const {number} GPIO set register */
    MPR121_GPIOSET = 0x78,
    /** @const {number} GPIO clear register */
    MPR121_GPIOCLR = 0x79,
    /** @const {number} GPIO toggle register */
    MPR121_GPIOTOGGLE = 0x7A,
    /** @const {number} Auto-configuration register 0 */
    MPR121_AUTOCONFIG0 = 0x7B,
    /** @const {number} Auto-configuration register 1 */
    MPR121_AUTOCONFIG1 = 0x7C,
    /** @const {number} Upper limit register */
    MPR121_UPLIMIT = 0x7D,
    /** @const {number} Lower limit register */
    MPR121_LOWLIMIT = 0x7E,
    /** @const {number} Target limit register */
    MPR121_TARGETLIMIT = 0x7F,
    /** @const {number} Soft reset register */
    MPR121_SOFTRESET = 0x80;

/**
 * MPR121 Capacitive Touch Sensor Controller Class
 * @extends EventEmitter
 * 
 * @fires MPR121#touch - Emitted when a pin is touched
 * @fires MPR121#release - Emitted when a pin is released
 * @fires MPR121#error - Emitted when an error occurs
 * @fires MPR121#ready - Emitted when the sensor is initialized and ready
 */
class MPR121 extends EventEmitter {

    /**
     * Creates a new MPR121 instance
     * @param {number} [address=0x5A] - I2C address of the MPR121
     * @param {number} [bus=1] - I2C bus number
     * @param {number} [interval=100] - Polling interval in milliseconds
     */
    constructor(address, bus, interval) {
        super();

        this.address = address || MPR121_I2CADDR_DEFAULT;
        this.bus = Number.isInteger(bus) ? bus : 1;
        this.interval = interval || 100;

        this.state = [false, false, false, false, false, false, false, false, false, false, false, false];
        this.device = false;
        this.ready = false;
        this.timer = false;

        this.init()
            .then(this.reset.bind(this))
            .then(this.configure.bind(this))
            .then(this.startPolling.bind(this))
            .catch((err) => this.emit('error', err));
    }

    /**
     * Initializes the I2C connection
     * @private
     * @returns {Promise} Resolves when I2C is initialized
     */
    init() {
        return new Promise((resolve, reject) => {
            this.device = i2c.open(this.bus, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * Performs a soft reset of the MPR121
     * @private
     * @returns {Promise} Resolves when reset is complete
     */
    reset() {
        return this.writeByte(MPR121_SOFTRESET, 0x63)
            .then(() => {
                return new Promise((resolve, reject) => {
                    setTimeout(resolve, 100);
                });
            })
            .then(() => this.writeByte(MPR121_ECR, 0x00));
    }

    /**
     * Configures the MPR121 with default settings
     * @private
     * @returns {Promise} Resolves when configuration is complete
     */
    configure() {
        return this.setThresholds(10, 8)
            .then(() => this.writeByte(MPR121_MHDR, 0x01))
            .then(() => this.writeByte(MPR121_NHDR, 0x01))
            .then(() => this.writeByte(MPR121_NCLR, 0x0E))
            .then(() => this.writeByte(MPR121_FDLR, 0x00))
            .then(() => this.writeByte(MPR121_MHDF, 0x01))
            .then(() => this.writeByte(MPR121_NHDF, 0x05))
            .then(() => this.writeByte(MPR121_NCLF, 0x01))
            .then(() => this.writeByte(MPR121_FDLF, 0x00))
            .then(() => this.writeByte(MPR121_NHDT, 0x00))
            .then(() => this.writeByte(MPR121_NCLT, 0x00))
            .then(() => this.writeByte(MPR121_FDLT, 0x00))
            .then(() => this.writeByte(MPR121_DEBOUNCE, 0))
            .then(() => this.writeByte(MPR121_CONFIG1, 0x10)) // default, 16uA charge current
            .then(() => this.writeByte(MPR121_CONFIG2, 0x20)) // 0.5uS encoding, 1ms period
            .then(() => this.writeByte(MPR121_ECR, 0x8F)) // start with first 5 bits of baseline tracking
            .then(() => {
                this.ready = true;
                this.emit('ready');
            });
    }

    /**
     * Sets touch and release thresholds for all electrodes
     * @param {number} touch - Touch threshold (0-255)
     * @param {number} release - Release threshold (0-255)
     * @returns {Promise} Resolves when thresholds are set
     */
    setThresholds(touch, release) {
        if (touch < 0 || touch > 255) return Promise.reject();
        if (release < 0 || release > 255) return Promise.reject();

        let promises = [];

        for (let i = 0; i <= 12; i++) {
            promises.push(this.writeByte(MPR121_TOUCHTH_0 + 2 * i, touch));
            promises.push(this.writeByte(MPR121_RELEASETH_0 + 2 * i, release));
        }

        return Promise.all(promises);
    }

    /**
     * Starts the polling loop for touch detection
     * @private
     */
    startPolling() {
        if (!this.ready) return this.on('ready', this.startPolling);
        if (!this.interval) return;

        this.timer = setInterval(() => {
            this.touched().then(this.updateState.bind(this));
        }, this.interval);
    }

    /**
     * Stops the polling loop
     */
    stopPolling() {
        if (!this.timer) return;

        clearInterval(this.timer);
        this.timer = false;
    }

    /**
     * Updates internal state and emits events for changed pins
     * @private
     * @param {number} touched - Bitmask of touched pins
     */
    updateState(touched) {
        this.state.forEach((previous, i) => {
            const current = (touched & (1 << i)) > 0;

            if (previous === current) return;

            this.state[i] = current;

            if (current)
                this.emit('touch', i);
            else
                this.emit('release', i);

            this.emit(i, current);
        });
    }

    /**
     * Gets the filtered data value for a specific pin
     * @param {number} pin - Pin number (0-11)
     * @returns {Promise<number>} Resolves with the filtered data value
     */
    filteredData(pin) {
        if (pin < 0 || pin >= 12) return Promise.reject();
        return this.readWord(MPR121_FILTDATA_0L + (pin * 2));
    }

    /**
     * Gets the baseline data value for a specific pin
     * @param {number} pin - Pin number (0-11)
     * @returns {Promise<number>} Resolves with the baseline data value
     */
    baselineData(pin) {
        if (pin < 0 || pin >= 12) return Promise.reject();

        return this.readByte(MPR121_BASELINE_0 + pin)
            .then((bl) => {
                return Promise.resolve(bl << 2);
            });
    }

    /**
     * Gets the current touch state of all pins
     * @returns {Promise<number>} Resolves with a bitmask of touched pins
     */
    touched() {
        return this.readWord(MPR121_TOUCHSTATUS_L).then((t) => Promise.resolve(t & 0x0FFF));
    }

    /**
     * Checks if a specific pin is currently touched
     * @param {number} pin - Pin number (0-11)
     * @returns {boolean} True if the pin is touched
     */
    isTouched(pin) {
        if (!this.ready) return false;
        if (pin < 0 || pin >= 12) return false;

        return this.state[pin];
    }

    /**
     * Reads a byte from a register
     * @private
     * @param {number} reg - Register address
     * @returns {Promise<number>} Resolves with the byte value
     */
    readByte(reg) {
        return new Promise((resolve, reject) => {
            this.device.readByte(this.address, reg, (err, b) => {
                if (err) return reject(err);
                resolve(b);
            });
        });
    }

    /**
     * Reads a word from a register
     * @private
     * @param {number} reg - Register address
     * @returns {Promise<number>} Resolves with the word value
     */
    readWord(reg) {
        return new Promise((resolve, reject) => {
            this.device.readWord(this.address, reg, (err, w) => {
                if (err) return reject(err);
                resolve(w);
            });
        });
    }

    /**
     * Writes a byte to a register
     * @private
     * @param {number} reg - Register address
     * @param {number} value - Byte value to write
     * @returns {Promise} Resolves when write is complete
     */
    writeByte(reg, value) {
        return new Promise((resolve, reject) => {
            this.device.writeByte(this.address, reg, value & 0xFF, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

exports = module.exports = MPR121;
