function polygonToWKT(polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) {
      throw new Error("Polygon must have at least 3 points");
    }
  
    const cleaned = polygon.map((p) => {
      if (!Array.isArray(p) || p.length !== 2) {
        throw new Error("Invalid coordinate format");
      }
  
      const [lng, lat] = p;
  
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error("Coordinates must be numbers");
      }
  
      return [Number(lng), Number(lat)];
    });
  
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
  
    const isClosed = first[0] === last[0] && first[1] === last[1];
  
    if (!isClosed) {
      cleaned.push(first);
    }
  
    const coords = cleaned.map(([lng, lat]) => `${lng} ${lat}`).join(",");
  
    return `POLYGON((${coords}))`;
  }
  export default polygonToWKT;
  