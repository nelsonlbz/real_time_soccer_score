const axios = require("axios");

async function fetchDataFromAPI(options) {
  try {
    const response = await axios.request(options);
    return response.data.response[0];
  } catch (error) {
    console.error("Error fetching data from API:", error);
    return null;
  }
}

module.exports = {
  fetchDataFromAPI,
};
