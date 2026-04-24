// topsis.service.js

function normalizeMatrix(matrix) {
  const cols = matrix[0].length;
  const denom = Array(cols).fill(0);

  for (let j = 0; j < cols; j++) {
    let sumSquares = 0;
    for (let i = 0; i < matrix.length; i++) {
      sumSquares += Math.pow(matrix[i][j], 2);
    }
    denom[j] = Math.sqrt(sumSquares);
    
    if (denom[j] < 0.000001) {
      denom[j] = 1;
      console.warn(`Column ${j} has near-zero variance, setting denominator to 1`);
    }
  }

  return matrix.map(row =>
    row.map((val, j) => {
      const safeVal = val || 0;
      return safeVal / denom[j];
    })
  );
}

function applyWeights(matrix, weights) {
  const weightSum = weights.reduce((sum, w) => sum + Math.abs(w), 0);
  const normalizedWeights = weights.map(w => w / weightSum);
  
  console.log("Normalized weights:", normalizedWeights);
  
  return matrix.map(row =>
    row.map((val, j) => val * normalizedWeights[j])
  );
}

function getIdealSolutions(matrix, types) {
  const cols = matrix[0].length;
  const idealBest = [];
  const idealWorst = [];

  for (let j = 0; j < cols; j++) {
    const column = matrix.map(row => row[j]);
    const maxVal = Math.max(...column);
    const minVal = Math.min(...column);
    
    const epsilon = (maxVal === minVal) ? 0.000001 : 0;

    if (types[j] === "benefit") {
      idealBest[j] = maxVal + epsilon;
      idealWorst[j] = minVal - epsilon;
    } else {
      idealBest[j] = minVal - epsilon;
      idealWorst[j] = maxVal + epsilon;
    }
  }

  return { idealBest, idealWorst };
}

function computeScores(matrix, idealBest, idealWorst) {
  const scores = [];
  
  for (let i = 0; i < matrix.length; i++) {
    let dPlus = 0;
    let dMinus = 0;
    
    for (let j = 0; j < matrix[i].length; j++) {
      dPlus += Math.pow(matrix[i][j] - idealBest[j], 2);
      dMinus += Math.pow(matrix[i][j] - idealWorst[j], 2);
    }
    
    dPlus = Math.sqrt(dPlus);
    dMinus = Math.sqrt(dMinus);
    
    const denominator = dPlus + dMinus;
    const score = denominator < 0.000001 ? 0.5 : dMinus / denominator;
    
    scores.push(score);
  }
  
  return scores;
}

function runTopsis(data, weightsInput, types) {
  console.log("=== TOPSIS Calculation Started ===");
  console.log(`Processing ${data.length} locations`);

  if (data.length === 0) {
    console.error("No data provided");
    return [];
  }

  // Convert weightsInput (object or array) to array [vent, pente, habitations, exposition, altitude]
  let weights = [0.3, 0.2, 0.25, 0.1, 0.15]; // defaults
  
  if (weightsInput && typeof weightsInput === 'object') {
    if (Array.isArray(weightsInput)) {
      weights = weightsInput;
    } else {
      weights = [
        weightsInput.vent || 0.3,
        weightsInput.pente || 0.2,
        weightsInput.habitations || 0.25,
        weightsInput.exposition || 0.1,
        weightsInput.altitude || 0.15
      ];
    }
  }

  // Create matrix (allow real 0 values)
  const matrix = data.map(d => [
    Number(d.vent) || 0,           // benefit
    Number(d.pente) || 0,          // cost
    Number(d.habitations) || 0,    // cost
    Number(d.exposition) || 0,     // benefit
    Number(d.altitude) || 0        // benefit
  ]);

  // Debug: show column variances
  console.log("Column variances:");
  const colNames = ["vent", "pente", "hab", "expo", "alt"];
  for (let j = 0; j < matrix[0].length; j++) {
    const vals = matrix.map(row => row[j]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    console.log(colNames[j], "variance =", variance.toFixed(6));
  }

  console.log("Matrix sample (first 3):", matrix.slice(0, 3));

  // Step 1: Normalize
  const normalized = normalizeMatrix(matrix);
  console.log("Normalized sample:", normalized.slice(0, 3));

  // Step 2: Weighted normalized matrix
  const weighted = applyWeights(normalized, weights);
  console.log("Weighted sample:", weighted.slice(0, 3));

  // Step 3: Ideal solutions
  const { idealBest, idealWorst } = getIdealSolutions(weighted, types);
  console.log("Ideal Best:", idealBest);
  console.log("Ideal Worst:", idealWorst);

  // Step 4: Calculate raw TOPSIS scores (true 0-1 closeness)
  const rawScores = computeScores(weighted, idealBest, idealWorst);
  console.log("Raw TOPSIS scores (first 10):", rawScores.slice(0, 10));

  console.log("=== TOPSIS Calculation Complete ===");

  return data.map((item, index) => ({
    ...item,
    score: parseFloat(rawScores[index].toFixed(6))
  }));
}

export default runTopsis;