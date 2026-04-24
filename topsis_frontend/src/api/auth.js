import axios from 'axios';

const BASE = 'http://localhost:3000/api/auth';

export async function loginUser(email, password) {
    const { data } = await axios.post(`${BASE}/login`, { email, password });
    return data; // { user, token }
}

export async function registerUser(name, email, password) {
    const { data } = await axios.post(`${BASE}/register`, { name, email, password });
    return data; // { user, token }
}

export async function getMe(token = null) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await axios.get(`${BASE}/me`, { headers });
    return data; // { id, name, email }
}
