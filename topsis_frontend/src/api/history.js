const LOCAL_STORAGE_KEY = 'geotopsis_local_history';

/**
 * Save an analysis to the user's history.
 * @param {{ name?: string, polygon: Array, weights: Object, results: Array }} payload
 */
export async function saveAnalysis(payload) {
    const history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        ...payload
    };
    history.unshift(newEntry);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    return newEntry;
}

/** Get all history entries for the current user. */
export async function getHistory() {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
}

/** Delete a history entry by id. */
export async function deleteAnalysis(id) {
    let history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    return { success: true };
}
