function distanceCalculator(lat1, lon1, lat2, lon2) {
  // Radius of the Earth in kilometers
  const R = 6371;

  // Convert latitude and longitude from degrees to radians
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLon1 = (lon1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const radLon2 = (lon2 * Math.PI) / 180;

  // Calculate the differences between latitudes and longitudes
  const deltaLat = radLat2 - radLat1;
  const deltaLon = radLon2 - radLon1;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = R * c;

  return distance;
}


module.exports = distanceCalculator;