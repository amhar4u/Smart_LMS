const axios = require('axios');

class DailyService {
  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || '7254b5e6a63ee1527c919cb706e3fc305b67f979c663db78165caa595d2f9785';
    this.domain = process.env.DAILY_DOMAIN || 'slms.daily.co';
    this.baseURL = 'https://api.daily.co/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new Daily room for a meeting
   * @param {Object} options - Room configuration options
   * @returns {Promise<Object>} - Room details including URL
   */
  async createRoom(options = {}) {
    try {
      const roomConfig = {
        name: options.name || this.generateRoomName(),
        privacy: options.privacy || 'public',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          enable_prejoin_ui: true,
          start_video_off: options.startVideoOff !== undefined ? options.startVideoOff : false,
          start_audio_off: options.startAudioOff !== undefined ? options.startAudioOff : false,
          // Removed enable_recording as it's not available in free plan
          exp: options.exp || Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // Expires in 7 days
          ...options.properties
        }
      };

      const response = await this.client.post('/rooms', roomConfig);
      
      return {
        success: true,
        room: response.data,
        roomUrl: response.data.url,
        roomName: response.data.name
      };
    } catch (error) {
      console.error('Error creating Daily room:', error.response?.data || error.message);
      throw new Error(`Failed to create Daily room: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get room details
   * @param {string} roomName - Name of the room
   * @returns {Promise<Object>} - Room details
   */
  async getRoom(roomName) {
    try {
      const response = await this.client.get(`/rooms/${roomName}`);
      return {
        success: true,
        room: response.data
      };
    } catch (error) {
      console.error('Error fetching room details:', error.response?.data || error.message);
      throw new Error(`Failed to fetch room details: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Delete a Daily room
   * @param {string} roomName - Name of the room to delete
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteRoom(roomName) {
    try {
      await this.client.delete(`/rooms/${roomName}`);
      return {
        success: true,
        message: 'Room deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting room:', error.response?.data || error.message);
      throw new Error(`Failed to delete room: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Create a meeting token for participants
   * @param {string} roomName - Name of the room
   * @param {Object} options - Token options (user_name, is_owner, etc.)
   * @returns {Promise<string>} - Meeting token
   */
  async createMeetingToken(roomName, options = {}) {
    try {
      const tokenConfig = {
        properties: {
          room_name: roomName,
          user_name: options.userName || 'Guest',
          is_owner: options.isOwner || false,
          start_video_off: options.startVideoOff !== undefined ? options.startVideoOff : false,
          start_audio_off: options.startAudioOff !== undefined ? options.startAudioOff : false,
          enable_screenshare: options.enableScreenshare !== undefined ? options.enableScreenshare : true,
          // Removed enable_recording as it's not available in free plan
          exp: options.exp || Math.floor(Date.now() / 1000) + (60 * 60 * 24), // Expires in 24 hours
        }
      };

      const response = await this.client.post('/meeting-tokens', tokenConfig);
      
      return {
        success: true,
        token: response.data.token
      };
    } catch (error) {
      console.error('Error creating meeting token:', error.response?.data || error.message);
      throw new Error(`Failed to create meeting token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get meeting session details
   * @param {string} roomName - Name of the room
   * @returns {Promise<Object>} - Session details
   */
  async getMeetingSession(roomName) {
    try {
      const response = await this.client.get(`/rooms/${roomName}/presence`);
      return {
        success: true,
        presence: response.data
      };
    } catch (error) {
      console.error('Error fetching meeting session:', error.response?.data || error.message);
      throw new Error(`Failed to fetch meeting session: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Generate a unique room name
   * @returns {string} - Unique room name
   */
  generateRoomName() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `meeting-${timestamp}-${random}`;
  }

  /**
   * Get room URL from room name
   * @param {string} roomName - Name of the room
   * @returns {string} - Full room URL
   */
  getRoomUrl(roomName) {
    return `https://${this.domain}/${roomName}`;
  }
}

module.exports = new DailyService();
