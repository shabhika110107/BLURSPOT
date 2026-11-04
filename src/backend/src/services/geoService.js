class GeoService {
  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // in km
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Check if point is within radius
  isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
    return this.calculateDistance(lat1, lon1, lat2, lon2) <= radiusKm;
  }
}

module.exports = new GeoService();
