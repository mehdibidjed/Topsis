import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/decision';

/**
 * Run TOPSIS analysis on the given polygon and weights.
 *
 * @param {Array<[number, number]>} polygon  - Array of [lat, lng] pairs
 * @param {Object} weights                   - { wind, slope, habitations, exposure, altitude }
 * @returns {Promise<Object>}                - Response data from backend
 */
export async function runTopsis(polygon, weights) {
    const response = await axios.post(`${API_BASE}/topsis`, {
        polygon,
        weights,
    });
    return response.data;
}
