// decision.controller.js
import getLocationsInPolygon from "../services/spacial.service.js";
import runTopsis from "../services/topsis.service.js";

async function getTopsisResult(req, res) {
  try {
    const { polygon, weights } = req.body;
    console.log(polygon, weights);
    
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ 
        error: "Invalid polygon: Please provide a polygon with at least 3 points" 
      });
    }
    
    const data = await getLocationsInPolygon(polygon);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: "No locations found in the selected area",
        message: "Try drawing a larger area or check if data exists in this region"
      });
    }
    
    if (data.length < 3) {
      console.warn(`Only ${data.length} locations found. TOPSIS works best with more alternatives.`);
    }
    
    // Criteria types
    const types = [
      "benefit",  // vent
      "cost",     // pente
      "cost",     // habitations
      "benefit",  // exposition
      "benefit"   // altitude
    ];
    
    // Run TOPSIS (weights can be array or object)
    const results = runTopsis(data, weights, types);
    
    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    const rankedResults = results.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    console.log(`Successfully ranked ${rankedResults.length} locations`);
    console.log(`Top score: ${rankedResults[0]?.score?.toFixed(4)}, Bottom score: ${rankedResults[rankedResults.length-1]?.score?.toFixed(4)}`);
    
    res.json({
      success: true,
      count: rankedResults.length,
      weights: weights || [0.3, 0.2, 0.25, 0.1, 0.15],
      results: rankedResults
    });
    
  } catch (error) {
    console.error("TOPSIS Error:", error);
    res.status(500).json({ 
      error: "Failed to compute TOPSIS results",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export default getTopsisResult;