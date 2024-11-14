/**
 * @fileoverview A wrapper for the Govee API that provides methods to control Govee smart devices.
 * This module enables interaction with Govee devices through their official REST API.
 * 
 * @requires axios
 * @requires ./config
 */

const axios = require('axios');
const config = require('./config');

/**
 * GoveeApi class provides methods to interact with Govee smart devices.
 * 
 * @class
 * @example
 * const GoveeApi = require('./lib/GoveeApi');
 * const govee = new GoveeApi();
 * 
 * // Get list of devices
 * const devices = await govee.getDevices();
 */
class GoveeApi {
  /**
   * Creates an instance of GoveeApi.
   * Initializes axios with base URL and authentication headers from config.
   * 
   * @constructor
   * @throws {Error} If config is missing required fields (apiKey, apiUrl)
   */
  constructor() {
    this.axios = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Govee-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Retrieves a list of all Govee devices associated with the account.
   * 
   * @async
   * @returns {Promise<Object>} A promise that resolves to the device list response
   * @throws {Error} If the API request fails
   * 
   * @example
   * try {
   *   const devices = await govee.getDevices();
   *   console.log(devices);
   * } catch (error) {
   *   console.error('Failed to get devices:', error);
   * }
   */
  async getDevices() {
    try {
      const response = await this.axios.get('/router/api/v1/user/devices');
      return response.data;
    } catch (error) {
      console.error('Error getting devices:', error.message);
      throw error;
    }
  }

  /**
   * Retrieves the current state of a specific device.
   * Uses device SKU and ID from config file.
   * 
   * @async
   * @returns {Promise<Object>} A promise that resolves to the device state
   * @throws {Error} If the API request fails or if config is missing deviceSku/deviceId
   * 
   * @example
   * try {
   *   const state = await govee.getDeviceState();
   *   console.log(state);
   * } catch (error) {
   *   console.error('Failed to get device state:', error);
   * }
   */
  async getDeviceState() {
    try {
      const response = await this.axios.post('/router/api/v1/device/state', {
        requestId: Date.now().toString(),
        payload: { sku: config.deviceSku, device: config.deviceId }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting device state:', error.message);
      throw error;
    }
  }

  /**
   * Controls a device by sending a capability command.
   * Uses device SKU and ID from config file.
   * 
   * @async
   * @param {Object} capability - The capability object defining the control command
   * @returns {Promise<Object>} A promise that resolves to the control response
   * @throws {Error} If the API request fails or if config is missing deviceSku/deviceId
   * 
   * @example
   * try {
   *   // Turn on the device
   *   await govee.controlDevice({
   *     name: 'powerSwitch',
   *     value: 'on'
   *   });
   * 
   *   // Set brightness to 50%
   *   await govee.controlDevice({
   *     name: 'brightness',
   *     value: 50
   *   });
   * } catch (error) {
   *   console.error('Failed to control device:', error);
   * }
   */
  async controlDevice(capability) {
    try {
      const response = await this.axios.post('/router/api/v1/device/control', {
        requestId: Date.now().toString(),
        payload: { sku: config.deviceSku, device: config.deviceId, capability }
      });
      return response.data;
    } catch (error) {
      console.error('Error controlling device:', error.message);
      throw error;
    }
  }
}

module.exports = GoveeApi;
