
/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const https = require("https");
// Option parameter for google api request
const options = {
  hostname: "maps.googleapis.com",
  port: 443,
  // path: `/maps/api/place/textsearch/json?query=transport&location=${this.latitude},${this.longitude}&radius=10000&key=AIzaSyDg-6GC6doxzpE_etI9E-yJR2NOLyFzBYc`,
  path: `/maps/api/place/textsearch/json?query=transport&location=${this.latitude},${this.longitude}&radius=10000&key=AIzaSyAm00Wsdh6jJB2QzlW5c6t_nu0gMRAZB9s`,
  method: "GET"
};

// Allow function to receive coordinate argument from client
class GetTripInfo {
  constructor(latitude, longitude, method) {
    this.latitude = latitude; 
    this.longitude = longitude;
    this.method = method;
  }

  // api to list all the transporters within 1km of users location
  async getPlaces() {
    let aa = {};
    try {
      const r = await client.textSearch({
        params: {
          locations: [{ lat: this.latitude, lng: this.longitude }],
          query: this.method,
          key: process.env.TEST_KEY,
          radius: 10000
        }
      });
      if (r.data.status === Status.OK) {
        aa = r.data.results;
      } else {
        aa = r.data.error_message;
      }
    } catch (e) {
      // console.log(e);
    }

    return aa;
  }
}

module.exports = GetTripInfo;
