import React, { Component, useState } from 'react';
import { GoogleMap, withScriptjs, withGoogleMap, Marker, InfoWindow } from 'react-google-maps';
import axios from 'axios';
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

const PARKS_PATH = 'http://localhost/map/parks.php';
const FACILITIES_PATH = 'http://localhost/map/facilities.php';
const FILTERS_PATH = 'http://localhost/map/filter.php';

class Map extends Component{
  
  static defaultProps = {
    googleMapURL: `https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=
      ${process.env.REACT_APP_API_KEY}`,
  }
  
  constructor(props){
    super(props);
    this.state = {
      parks: {},
      facilityTypes: [],
      checked: {},
      filtered: [],
    };
    
    this.handleChange = this.handleChange.bind(this);
  }
  
  componentDidMount() {
    this.fetchParks();
    this.fetchFacilityTypes();
  }
  
  fetchParks(){
    fetch(`${PARKS_PATH}`)
    .then(response => response.json())
    .then(result => this.setParks(result))
    .catch(e => console.log(e));
  }
  
  fetchFacilityTypes(){
    fetch(`${FACILITIES_PATH}`)
    .then(response => response.json())
    .then(result => this.setFacilities(result))
    .catch(e => console.log(e));
  }
  
  setFacilities(result){
    this.setState({...this.state, facilityTypes: result});
    let checked = {};
    result.forEach((facility) => {
      checked[facility] = false;
    });
    this.setState({...this.state, checked: checked});
  }
  
  setParks(result){
    let parks = {};
    let filtered = [];
    result.forEach((park) => {
        parks[park.id] = {
          name: park.name,
          address: park.address,
          washrooms: park.washrooms,
          lat: parseFloat(park.lat),
          lng: parseFloat(park.lng),
          facilities: park.facilities
        };
        filtered.push(park.id);
    });
    this.setState({...this.state, parks: parks, filtered:filtered});
  }
  
  handleChange = event => {
    const item = event.target.name;
    const isChecked = event.target.checked;
    let checked = this.state.checked;
    checked[item] = isChecked;
    let filters = [];
    for(const facility in checked){
      if(checked[facility])
        filters.push(facility);
    }
    
    axios.post(
      FILTERS_PATH, { filters: filters })
    .then((result) => {
      let filtered = [];
      result.data.forEach((num) => filtered.push(num));
      this.setState({...this.state, checked:checked, filtered:filtered});
    })
    .catch((error) => {
      console.log(error);
    });
    
  };
  
  CMap = withScriptjs(withGoogleMap(props =>
    <GoogleMap
      defaultZoom={12}
      defaultCenter={{ lat:49.24966, lng:-123.11934 } }
    >
      {props.children}
    </GoogleMap>
  ));
  
  render(){
    const parks = this.state.parks;
    return(
      <div style={{width: '100vw', height: '100vh'}}>
        <FormGroup row>
          {
            this.state.facilityTypes.map((facilityType) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={this.state.checked[facilityType]}
                    name={facilityType}
                    onChange={this.handleChange}
                    color="primary"
                  />
                }
                label={facilityType}
              />
            ))
          }
        </FormGroup>
        <this.CMap
          googleMapURL={this.props.googleMapURL}
          loadingElement={<div style={{ height:"100%" }} />}
          containerElement={<div style={{ height:"100%" }} />}
          mapElement={<div style={{ height:"100%" }} />}
        >
          {
            this.state.filtered.map((id) => (
              <Marker
                key={parks[id].name}
                position={{lat: parks[id].lat, lng: parks[id].lng}}
                onClick = {() => {
                  this.setState({selected: parks[id].name});
                }}
              >
                { this.state.selected===parks[id].name &&
                  <InfoWindow
                    anchor={Marker}
                    onCloseClick={() => {
                      this.setState({selected: null});
                    }}
                  >
                    <div>
                      <b>{parks[id].name}</b><br/>
                      {parks[id].address}
                      {(parks[id].washrooms==="Y" || parks[id].facilities.length>0) && <span><br/><br/></span> }
                      { parks[id].facilities.length>0 &&
                      parks[id].facilities.map((facility) => (
                            <span>{facility}<br/></span>
                        ))
                      }
                      {parks[id].washrooms==="Y" && <span>Washrooms<br/></span>}
                    </div>
                  </InfoWindow>
                }
              </Marker>
            ))
          }
        </this.CMap>
      </div>
    );
  }
}

export default Map;