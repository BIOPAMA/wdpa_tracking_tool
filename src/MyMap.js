import React from 'react';
import ReactDOM from 'react-dom';
import CountryPopup from './CountryPopup.js';
import mapboxgl from 'mapbox-gl';

// const INITIAL_CENTER = [-175.15, -21.15]; 
const INITIAL_CENTER = [0, 0];
const INITIAL_ZOOM = 2;
const INITIAL_FILTER = ['==', 'wdpa_pid','-1'];
const BASEMAP = 'dark'
//paint properties
const CIRCLE_RADIUS_STOPS = {"stops": [[5, 1],[10, 4], [15, 7]]};
const P_TO_CHANGED_GEOMETRY = { "fill-color": "rgba(99,148,69,0.2)", "fill-outline-color": "rgba(0,0,0,0)"};
const P_TO_CHANGED_GEOMETRY_LINE = { "line-color": "rgb(99,148,69)", "line-width": 2, "line-opacity": 0.6, "line-dasharray": [3,3]};
const P_SELECTED_POINT = {"circle-radius": CIRCLE_RADIUS_STOPS, "circle-color": "rgb(0,0,0)", "circle-opacity": 0};
const P_SELECTED_LINE = { "line-color": "rgb(0,0,0)", "line-width": 2, "line-opacity": 0};
const P_SELECTED_POLYGON = { "fill-color": "rgba(0,0,0,0)", "fill-outline-color": "rgba(255,0,0,0)"};

class MyMap extends React.Component {
  constructor(props){
    super(props);
    this.state = {
    };
    this.popups = [];
  }
  componentDidMount(){
    //instantiate the map
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg';
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    //set a property in the App class
    this.props.setMap(this.map);
    //get a reference to the map loaded event
    this.mapLoadedEvent = this.mapLoaded.bind(this);
    this.map.on("load", this.mapLoadedEvent);
  }
  //called when the maps style has loaded
  mapLoaded(map){
    //remove the event handler using the actual event reference
    this.map.off("load", this.mapLoadedEvent); 
    this.mapLoadedEvent = undefined;
    //add the to sources and layers
    this.addToLayers();
    //call the event in the app component
    this.props.mapStyleLoaded();
  }
  componentDidUpdate(prevProps, prevState){
    if (this.mapLoadedEvent) return; //the maps style has not laded
    //see if the to version has changed
    if (this.props.toVersion && (this.props.toVersion.id !== prevProps.toVersion.id)) this.addToLayers();
    //are the from and to versions different
    if (this.props.fromVersion.id !== this.props.toVersion.id){
      //if the from doesn't exist or it does but for a different version, then add it
      if ((this.map.getSource(window.SRC_FROM_POLYGONS) === undefined) || ((this.map.getSource(window.SRC_FROM_POLYGONS) !== undefined) && (this.props.fromVersion.id !== prevProps.fromVersion.id))){
        //add the to change layers - these need to be added first as the from layers go before them
        this.addToChangeLayers();
        //add the from layers
        this.addFromLayers();
      }
    }else{ //from and to are the same
      //remove the to change layers
      this.removeToChangeLayers();
      //remove the from layers
      this.removeFromLayers();
      //unfilter the no_change layers
      this.unfilterNoChangeLayers();
      //remove the popups
      this.removePopups();
    }
    if (this.props.view === 'global'){
      //render the country popups
      if (this.props.global_summary !== prevProps.global_summary) {
        //clear the existing popups
        this.removePopups();
        let iso3s = [];
        //create and add the popups
        this.props.global_summary.forEach(country => {
          iso3s.push(country.iso3);
          this.addCountryPopup(country);
        });
        this.filterToVersionByCountries(iso3s);
      }      
    }else{
      //see if anything has changed
      if (this.props.country_summary !== prevProps.country_summary){
        //render the country change maps
        this.filterCountryLayers();
        //remove the popups
        this.removePopups();
      }
    }
  }
  //adds the sources and layers for the from version
  addFromLayers(){
    let _from = this.props.fromVersion.key;
    //add the sources
    this.addSource({id: window.SRC_FROM_POLYGONS, source: {type: "vector", tiles: [ window.TILES_PREFIX + "wdpa_" + _from + "_polygons" + window.TILES_SUFFIX]}});
    this.addSource({id: window.SRC_FROM_POINTS, source: {type: "vector", tiles: [ window.TILES_PREFIX + "wdpa_" + _from + "_points" + window.TILES_SUFFIX]}});
    //add the layers
    this.addLayer({id: window.LYR_FROM_DELETED_POLYGON, sourceId: window.SRC_FROM_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _from + "_polygons", layout: {visibility: "visible"}, paint: { "fill-color": "rgba(255,0,0, 0.5)", "fill-outline-color": "rgba(255,0,0,1)"}, filter:INITIAL_FILTER, beforeID: window.LYR_TO_POLYGON});
    this.addLayer({id: window.LYR_FROM_DELETED_POINT, sourceId: window.SRC_FROM_POINTS, type: "circle", sourceLayer: "wdpa_" + _from + "_points", layout: {visibility: "visible"}, paint: {"circle-radius": CIRCLE_RADIUS_STOPS, "circle-color": "rgb(255,0,0)", "circle-opacity": 0.6}, filter:INITIAL_FILTER, beforeID: window.LYR_TO_POLYGON});
    //geometry change in protected areas layers - from
    this.addLayer({id: window.LYR_FROM_GEOMETRY_POINT_TO_POLYGON, sourceId: window.SRC_FROM_POINTS, type: "circle", sourceLayer: "wdpa_" + _from + "_points", layout: {visibility: "visible"}, paint: {"circle-radius": CIRCLE_RADIUS_STOPS, "circle-color": "rgb(255,0,0)", "circle-opacity": 0.9}, filter:INITIAL_FILTER, beforeId: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON});
    this.addLayer({id: window.LYR_FROM_GEOMETRY_POINT_COUNT_CHANGED_LINE, sourceId: window.SRC_FROM_POLYGONS, type: "line", sourceLayer: "wdpa_" + _from + "_polygons", layout: {visibility: "visible"}, paint: { "line-color": "rgb(255,0,0)", "line-width": 1, "line-opacity": 0.9, "line-dasharray": [3,3]}, filter:INITIAL_FILTER, beforeId: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON});
    this.addLayer({id: window.LYR_FROM_GEOMETRY_SHIFTED_LINE, sourceId: window.SRC_FROM_POLYGONS, type: "line", sourceLayer: "wdpa_" + _from + "_polygons", layout: {visibility: "visible"}, paint: { "line-color": "rgb(255,0,0)", "line-width": 1, "line-opacity": 0.8, "line-dasharray": [3,3]}, filter:INITIAL_FILTER, beforeId: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON});
    //selection layers
    this.addLayer({id: window.LYR_FROM_SELECTED_POLYGON, sourceId: window.SRC_FROM_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _from + "_polygons", layout: {visibility: "visible"}, paint: P_SELECTED_POLYGON, filter:INITIAL_FILTER, beforeId: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_FROM_SELECTED_LINE, sourceId: window.SRC_FROM_POLYGONS, type: "line", sourceLayer: "wdpa_" + _from + "_polygons", layout: {visibility: "visible"}, paint: P_SELECTED_LINE, filter:INITIAL_FILTER, beforeId: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_FROM_SELECTED_POINT, sourceId: window.SRC_FROM_POINTS, type: "circle", sourceLayer: "wdpa_" + _from + "_points", layout: {visibility: "visible"}, paint: P_SELECTED_POINT, filter:INITIAL_FILTER, beforeId: window.LYR_TO_SELECTED_POLYGON});
  }
  //removes the sources and layers for the from version
  removeFromLayers(){
    if (this.map.getSource(window.SRC_FROM_POLYGONS)) this.removeSource(window.SRC_FROM_POLYGONS);
    if (this.map.getSource(window.SRC_FROM_POINTS)) this.removeSource(window.SRC_FROM_POINTS);
  }
  //adds the sources and layers for the to version
  addToLayers(){
    try {
      let _to = this.props.toVersion.key;
      //add the sources
      let attribution = "IUCN and UNEP-WCMC (" + this.props.toVersion.year + "), The World Database on Protected Areas (" + this.props.toVersion.year + ") " + this.props.toVersion.title + ", Cambridge, UK: UNEP-WCMC. Available at: <a href='http://www.protectedplanet.net'>www.protectedplanet.net</a>";
      this.addSource({id: window.SRC_TO_POLYGONS, source: {type: "vector", attribution: attribution, tiles: [ window.TILES_PREFIX + "wdpa_" + _to + "_polygons" + window.TILES_SUFFIX]}});
      this.addSource({id: window.SRC_TO_POINTS, source: {type: "vector", tiles: [ window.TILES_PREFIX + "wdpa_" + _to + "_points" + window.TILES_SUFFIX]}});
      //no change protected areas layers
      this.addLayer({id: window.LYR_TO_POLYGON, sourceId: window.SRC_TO_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: { "fill-color": "rgba(99,148,69,0.2)", "fill-outline-color": "rgba(99,148,69,0.3)"}, beforeID: window.LYR_TO_SELECTED_POLYGON});
      this.addLayer({id: window.LYR_TO_POINT, sourceId: window.SRC_TO_POINTS, type: "circle", sourceLayer: "wdpa_" + _to + "_points", layout: {visibility: "visible"}, paint: {"circle-radius": CIRCLE_RADIUS_STOPS, "circle-color": "rgb(99,148,69)", "circle-opacity": 0.6}, beforeID: window.LYR_TO_SELECTED_POLYGON});
      //selection layers
      this.addLayer({id: window.LYR_TO_SELECTED_POLYGON, sourceId: window.SRC_TO_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_SELECTED_POLYGON, filter:INITIAL_FILTER});
      this.addLayer({id: window.LYR_TO_SELECTED_LINE, sourceId: window.SRC_TO_POLYGONS, type: "line", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_SELECTED_LINE, filter:INITIAL_FILTER});
      this.addLayer({id: window.LYR_TO_SELECTED_POINT, sourceId: window.SRC_TO_POINTS, type: "circle", sourceLayer: "wdpa_" + _to + "_points", layout: {visibility: "visible"}, paint: P_SELECTED_POINT, filter:INITIAL_FILTER});
      //add the change layers if needed
      if (this.props.fromVersion.id !== this.props.toVersion.id) this.addToChangeLayers();
    } catch (e) {
      console.log(e);
    }
  }
  //adds the change layers in the to version
  addToChangeLayers(){
    let _to = this.props.toVersion.key;
    //attribute change in protected areas layers
    this.addLayer({id: window.LYR_TO_CHANGED_ATTRIBUTE, sourceId: window.SRC_TO_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: { "fill-color": "rgba(99,148,69,0.4)", "fill-outline-color": "rgba(99,148,69,0.8)"}, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    //geometry change in protected areas layers - to
    this.addLayer({id: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON, sourceId: window.SRC_TO_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_TO_CHANGED_GEOMETRY, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON_LINE, sourceId: window.SRC_TO_POLYGONS, type: "line", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_TO_CHANGED_GEOMETRY_LINE, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON, sourceId: window.SRC_TO_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_TO_CHANGED_GEOMETRY, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON_LINE, sourceId: window.SRC_TO_POLYGONS, type: "line", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_TO_CHANGED_GEOMETRY_LINE, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_TO_GEOMETRY_SHIFTED_POLYGON, sourceId: window.SRC_TO_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_TO_CHANGED_GEOMETRY, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_TO_GEOMETRY_SHIFTED_POLYGON_LINE, sourceId: window.SRC_TO_POLYGONS, type: "line", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: P_TO_CHANGED_GEOMETRY_LINE, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    //added protected areas layers
    this.addLayer({id: window.LYR_TO_NEW_POLYGON, sourceId: window.SRC_TO_POLYGONS, type: "fill", sourceLayer: "wdpa_" + _to + "_polygons", layout: {visibility: "visible"}, paint: { "fill-color": "rgba(63,127,191,0.2)", "fill-outline-color": "rgba(63,127,191,0.6)"}, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    this.addLayer({id: window.LYR_TO_NEW_POINT, sourceId: window.SRC_TO_POINTS, type: "circle", sourceLayer: "wdpa_" + _to + "_points", layout: {visibility: "visible"}, paint: {"circle-radius": CIRCLE_RADIUS_STOPS, "circle-color": "rgb(63,127,191)", "circle-opacity": 0.6}, filter:INITIAL_FILTER, beforeID: window.LYR_TO_SELECTED_POLYGON});
    
  }
  //removes the change layers in the to version
  removeToChangeLayers(){
    if (this.map && !this.map.isStyleLoaded()) return;
    this.props.statuses.forEach(status => {
      if (status.key !== 'no_change'){
        status.layers.forEach(layer => {
          if (this.map.getLayer(layer)) {
            this.map.removeLayer(layer);
          }
        });
      }
    });
  }
  //removes any filter from the to points and to polygons layers
  unfilterNoChangeLayers(){
    //get the no change status object
    let no_change_status = this.props.statuses.filter(status => status.key === 'no_change');
    //clear the filter depending on whether it is a global or country view
    let filter = (this.props.view === 'global') ? null : ['in', 'iso3', this.props.country.iso3];
    //iterate through the layers and set the filter
    no_change_status[0].layers.forEach(layer => this.map.setFilter(layer, filter));
    //
  }
  //adds a source to the map
  addSource(details){
    //if the source already exists then delete it
    if (this.map.getSource(details.id)) this.removeSource(details.id);
    this.map.addSource(details.id, details.source);
  }
  //removes a source and all its dependent layers
  removeSource(id){
    this.map.getStyle().layers.forEach((layer)=>{
      if (layer.source === id) {
        this.map.removeLayer(layer.id);
      }
    });
    this.map.removeSource(id);
  }
  //adds an individual layer to the map
  addLayer(details){
    //if the layer already exists then delete it
    if (this.map.getLayer(details.id)){
      this.map.removeLayer(details.id);
    } 
    this.map.addLayer({
      'id': details.id,
      'type': details.type,
      'source': details.sourceId,
      'source-layer': details.sourceLayer,
      'paint': details.paint
    }, (details.beforeId) ? details.beforeId : undefined);
    //set a filter if one is passed
    if (details.hasOwnProperty('filter')) this.map.setFilter(details.id, details.filter);
    if (this.props.view === 'country'){
      //set the visibility of the layer depending on the visible property of the status 
      let status = this.props.statuses.filter(status => {
        return (status.layers.indexOf(details.id) !== -1);
      })[0];
      if (status) this.map.setLayoutProperty(details.id, "visibility", (status.visible) ? "visible" : "none" );
    }
  }
  clickCountryPopup(country){
    //set the currently selected country
    this.props.clickCountryPopup(country);
  }
  addCountryPopup(country){
    let countryPopup = <CountryPopup country={country} key={country.iso3} showStatuses={this.props.showStatuses} clickCountryPopup={this.clickCountryPopup.bind(this)}/>;
    const placeholder = document.createElement('div');
    ReactDOM.render(countryPopup, placeholder);
    this.popups.push(new mapboxgl.Popup({closeButton: false, closeOnClick: false})
        .setLngLat(country.centroid)
        .setDOMContent(placeholder)
        .addTo(this.map));
  }
  removePopups(){
    this.popups.forEach(popup => popup.remove());
  }
  filterToVersionByCountries(iso3s){
      let filter = ['in', 'iso3'].concat(iso3s);
      this.map.setFilter(window.LYR_TO_POLYGON, filter);
      this.map.setFilter(window.LYR_TO_POINT, filter);
  }
  filterCountryLayers(){
    let toPolygonsFilter, toPointsFilter = [], addedPAs=[], removedPAs=[], changedPAs=[], geometryShiftedPAs=[], geometryPointCountChangedPAs= [], geometryPointToPolygonPAs = [], geometryChangedPAs =[];
    if (this.props.fromVersion){
      //get the stats data for the country
      this.props.country_summary.forEach(record => {
        switch (record.status) {
          case 'added':
            addedPAs = record.wdpa_pids;
            break;
          case 'removed':
            removedPAs = record.wdpa_pids;
            break;
          case 'changed':
            changedPAs = record.wdpa_pids;
            break;
          case 'geometry_shifted':
            geometryShiftedPAs = record.wdpa_pids;
            break;
          case 'point_count_changed':
            geometryPointCountChangedPAs = record.wdpa_pids;
            break;
          case 'point_to_polygon':
            geometryPointToPolygonPAs = record.wdpa_pids;
            break;
          default:
            // code
          }
      });
      //get the array of all protected areas that have changed geometries
      geometryChangedPAs = geometryShiftedPAs.concat(geometryPointCountChangedPAs).concat(geometryPointToPolygonPAs);
      //the toLayer should exclude all of the other protected areas that are changed, added or have their geometry shifted
      toPolygonsFilter = ['all',['!in', 'wdpa_pid'].concat(changedPAs).concat(addedPAs).concat(geometryChangedPAs),['in', 'iso3', this.props.country.iso3]];
      //the toPoints layer should exclude all new point PAs (which will be shown in blue)
      toPointsFilter = ['all',['!in', 'wdpa_pid'].concat(addedPAs),['in', 'iso3', this.props.country.iso3]];        
      //the changed layer should exclude all of the other protected areas that have had their geometry changed - these will be rendered with dashed outlines - I have changed this to show both now
      // changedPAs = changedPAs.filter(item => !geometryChangedPAs.includes(item));
      //set the filters on the individual layers
      if (this.props.fromVersion) { //we are showing changes
        this.map.setFilter(window.LYR_FROM_DELETED_POLYGON,['in', 'wdpa_pid'].concat(removedPAs));
        this.map.setFilter(window.LYR_FROM_DELETED_POINT, ['in', 'wdpa_pid'].concat(removedPAs));
        this.map.setFilter(window.LYR_FROM_GEOMETRY_POINT_TO_POLYGON, ['in', 'wdpa_pid'].concat(geometryPointToPolygonPAs));
        this.map.setFilter(window.LYR_FROM_GEOMETRY_POINT_COUNT_CHANGED_LINE, ['in', 'wdpa_pid'].concat(geometryPointCountChangedPAs));
        this.map.setFilter(window.LYR_FROM_GEOMETRY_SHIFTED_LINE, ['in', 'wdpa_pid'].concat(geometryShiftedPAs));
      }
      this.map.setFilter(window.LYR_TO_POLYGON, toPolygonsFilter);
      this.map.setFilter(window.LYR_TO_POINT, toPointsFilter);
      this.map.setFilter(window.LYR_TO_CHANGED_ATTRIBUTE, ['in', 'wdpa_pid'].concat(changedPAs));
      this.map.setFilter(window.LYR_TO_GEOMETRY_POINT_TO_POLYGON, ['in', 'wdpa_pid'].concat(geometryPointToPolygonPAs));
      this.map.setFilter(window.LYR_TO_GEOMETRY_POINT_TO_POLYGON_LINE, ['in', 'wdpa_pid'].concat(geometryPointToPolygonPAs));
      this.map.setFilter(window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON, ['in', 'wdpa_pid'].concat(geometryPointCountChangedPAs));
      this.map.setFilter(window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON_LINE, ['in', 'wdpa_pid'].concat(geometryPointCountChangedPAs));
      this.map.setFilter(window.LYR_TO_GEOMETRY_SHIFTED_POLYGON, ['in', 'wdpa_pid'].concat(geometryShiftedPAs));
      this.map.setFilter(window.LYR_TO_GEOMETRY_SHIFTED_POLYGON_LINE, ['in', 'wdpa_pid'].concat(geometryShiftedPAs));
      this.map.setFilter(window.LYR_TO_NEW_POLYGON, ['in', 'wdpa_pid'].concat(addedPAs));
      this.map.setFilter(window.LYR_TO_NEW_POINT, ['in', 'wdpa_pid'].concat(addedPAs));
    }    
  }
  render() {
    return (
      <div id='map' className={'map'}></div>
    );
  }
}

export default MyMap;