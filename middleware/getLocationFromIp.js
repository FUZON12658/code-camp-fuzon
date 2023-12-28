const getLocationFromIp = async (ip) => {
  try {
    const apiKey = '24e5a404a674de'; // Replace with your ipinfo API key
    const response = await fetch(`http://ipinfo.io/${ip}?token=${apiKey}`,{
      method:"GET"
    });
    const tempData = await response.json();
    return tempData;
  } catch (error) {
    console.error('Error fetching user location from ipinfo:', error);
    return null;
  }
};

module.exports = getLocationFromIp;