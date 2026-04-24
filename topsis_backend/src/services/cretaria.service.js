function buildMatrix(locations, criteria) {
    return locations.map(loc =>
      criteria.map(c => loc[c.name])
    )
  }
  
export default buildMatrix;
