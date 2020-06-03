import React, { useState, useEffect } from "react";
import styled from "styled-components";
import NavBar from "./NavBar";
import GPS from "./GPS";
import NewTrip from "./Trips/NewTrip";
import RecentTrips from "./Trips/RecentTrips";
import NewReport from "./NewReport";
import BottomNav from "../BottomNav";
import Reports from "./Reports/Reports";
import Map from "../Map";

const Body = styled.main`
  margin-top: 70px;
  padding-bottom: 60px;
  background: #f5f5f5;
`;

const Homepage = (props) => {
  const [locationText, setLocationText] = useState(null);
  const [coordinates, setCoordinates] = useState({lat: 59.95, lng: 30.33});

  useEffect(() => {
    let textContent = '';
    const success = (position) => {
      const latitude  = position.coords.latitude;
      const longitude = position.coords.longitude;
  
      const href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
      textContent = `Lat: ${latitude.toFixed(3)} °, Long: ${longitude.toFixed(3)} °`;
      console.log(textContent);
      setCoordinates({lat: latitude, long: longitude});
      setLocationText(textContent);
      props.setLocated(true);
      console.log(coordinates);
    }
  
    const error = () => {
      textContent = 'Unable to retrieve your location';
      setLocationText(textContent);
    }
  
    if(!navigator.geolocation) {
      textContent = 'Geolocation is not supported by your browser';
      setLocationText(textContent);
    } else {
      textContent = 'Locating…';
      setLocationText(textContent);
      navigator.geolocation.watchPosition(success, error);
    }
  }, []);

  return (
    <div className="homepage w-screen min-h-screen">
      <NavBar name="Fasta" />
      <Body className="px-4">
        {!props.located ? <GPS /> : <div>Your location is @ <p></p>{locationText}<Map lat={coordinates.lat} long={coordinates.long} /></div>}
        <NewTrip user={props.user} />
        <RecentTrips />
        <Reports />
        <NewReport />
      </Body>
      {/* <BottomNav homeColor={{color: "#fff"}} /> */}
      <BottomNav />
    </div>
  );
};

export default Homepage;