import React, { useState, Component } from 'react';
import { GoogleMap, withScriptjs, withGoogleMap, Marker, InfoWindow } from 'react-google-maps';
import axios from 'axios';
import { AppBar, Box, Checkbox, Container, Collapse,
         FormControlLabel, FormGroup, Switch, Toolbar, Typography} from '@material-ui/core/';
import { styled } from '@material-ui/core/styles';
import 'typeface-roboto';

const FilterCheckBox = styled(Checkbox)({ height: 8 });
const MainAppBar = styled(AppBar)({ alignItems: 'center'})

const FACILITIES_PATH = 'http://localhost/api/facility_types';
const FILTERS_PATH = 'http://localhost/api/park_ids';
const PARKS_PATH = 'http://localhost/api/parks';

class App extends Component{
  constructor(props){
    super(props);
    this.state = {
      parks: {},
      facilityTypes: [],
      checked: {},
      filtered: [],
      selected: null
    };
    
    this.handleChange = this.handleChange.bind(this);
  }
  
  componentDidMount() {
    this.fetchParks();
    this.fetchFacilityTypes();
  }
  
  fetchFacilityTypes(){
    axios.get(`${FACILITIES_PATH}`)
    .then(result => this.setFacilities(result.data))
    .catch(e => console.log(e));
  }
  
  fetchFiltered(){
    const checked = this.state.checked;
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
      this.setState({...this.state, filtered:filtered});
    })
    .catch((e) => {
      console.log(e);
    });
  }
  
  fetchParks(){
    axios.get(`${PARKS_PATH}`)
    .then(result => this.setParks(result.data))
    .catch(e => console.log(e));
  }
  
  handleChange = event => {
    const item = event.target.name;
    const isChecked = event.target.checked;
    let checked = this.state.checked;
    checked[item] = isChecked;
    this.setState({...this.state, checked:checked});
    this.fetchFiltered();
  };
  
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
  
  render(){
    const parks = this.state.parks;
    return(
      <div>
        <MainAppBar position="static">
          <Toolbar>
            <Typography variant="h6">Vancouver Parks</Typography>
          </Toolbar>
        </MainAppBar>
        <Container maxWidth="lg">
          <br/>
          <CollapseWrapper>
            <div>
              <CheckBoxes
                facilityTypes={this.state.facilityTypes}
                checked={this.state.checked}
                handleChange={this.handleChange}
                selected={this.state.selected}
              />
            </div>
          </CollapseWrapper>
          <div style={{height:'55vh'}}>
            <br/>
            <MapWrapper
              googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=${process.env.REACT_APP_API_KEY}`}
              loadingElement={<div style={{height:"100%"}}/>}
              containerElement={<div style={{height: "100%"}}/>}
              mapElement={<div style={{height:"100%" }}/>}
            >
              {
                this.state.filtered.map((id) => (
                  <MapMarker
                    id = {id}
                    park = {parks[id]}
                    onClick = {() => {this.setState({selected: id});}}
                    selected = {this.state.selected}
                    onCloseClick={() => {this.setState({selected: null});}}
                  />
                ))
              }
            </MapWrapper>
          </div>
        </Container>
      </div>
    );
  }
}

const CheckBoxes = ({facilityTypes, checked, handleChange}) => (
  <Box border={2} borderColor="grey.500" p={1}>
    <FormGroup row>
      {
        facilityTypes.map((facilityType) => (
          <FormControlLabel
            control={
              <FilterCheckBox
                checked={checked[facilityType]}
                name={facilityType}
                onChange={handleChange}
                color="primary"
                size="small"
              />
            }
            label={facilityType}
          />
        ))
      }
    </FormGroup>
  </Box>
)

const MapMarker = ({id, park, onClick, selected, onCloseClick}) => (
  <Marker
    onClick={onClick}
    key={id}
    position={{lat: park.lat, lng: park.lng}}
  >
    { selected===id &&
    <InfoWindow
      anchor={Marker}
      onCloseClick={onCloseClick}
    >
      <div>
        <b>{park.name}</b><br/>
        {park.address}
        {(park.washrooms==="Y" || park.facilities.length>0) && <span><br/><br/></span>}
        {park.facilities.length>0 &&
        park.facilities.map((facility) => (<span>{facility}<br/></span>))}
        {park.washrooms==="Y" && <span>Washrooms<br/></span>}
      </div>
    </InfoWindow>
    }
  </Marker>
)

const MapWrapper = withScriptjs(withGoogleMap(props =>
  <GoogleMap
    defaultZoom={12}
    defaultCenter={{lat:49.256439, lng: -123.104004}}
  >
    {props.children}
  </GoogleMap>
))

const CollapseWrapper = ({children}) => {
  const [checked, setChecked] = useState(true);
  const handleChange = () => {
    setChecked(prev => !prev);
  };
  
  return (
    <div>
      <FormControlLabel
        control={<Switch checked={checked} onChange={handleChange} />}
        label="Show Filters"
      />
      <div>
        <Collapse in={checked}>
          {children}
        </Collapse>
      </div>
    </div>
  );
}

export default App;