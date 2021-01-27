/*global fetch*/
/*global URLSearchParams*/
import React from 'react';
import './App.css';
import geojson from './countries.json';
import MyMap from './MyMap.js';
import PAPopup from './PAPopup.js';
import PAPopupList from './PAPopupList.js';
import parse from 'color-parse';
import AppBar from './AppBar.js';
import FooterBar from './FooterBar.js';
import Trends from './Trends.js';
import dateFormat from 'dateformat';
import packageJson from '../package.json';

// const REST_BASE_URL = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com/python-rest-server/pythonrestserver/services/";
const REST_BASE_URL = "https://rest-services.jrc.ec.europa.eu/services/marxan_vt/services/";
// const REST_BASE_URL = "https://dopa-services.jrc.ec.europa.eu/services/marxan_vt/services/";
const USE_SELECTION_COLOR = false; //set to true to disable the selection using the color of the polygon - it will use the P_SELECTION_ colors in MyMap.js
//defines which layers will be highlighted when the mouse moves over the source layer - each layer in the highlight layers will be highlighted using the paint properties from the paintPropertyFrom layer
let hightlightRules = [
  { sourceLayer: window.LYR_TO_NEW_POLYGON, highlightLayers: [{ layer: window.LYR_TO_SELECTED_POLYGON, paintPropertyFrom: window.LYR_TO_NEW_POLYGON }] },
  { sourceLayer: window.LYR_TO_NEW_POINT, highlightLayers: [{ layer: window.LYR_TO_SELECTED_POINT, paintPropertyFrom: window.LYR_TO_NEW_POINT }] },
  { sourceLayer: window.LYR_FROM_DELETED_POLYGON, highlightLayers: [{ layer: window.LYR_FROM_SELECTED_POLYGON, paintPropertyFrom: window.LYR_FROM_DELETED_POLYGON }] },
  { sourceLayer: window.LYR_FROM_DELETED_POINT, highlightLayers: [{ layer: window.LYR_FROM_SELECTED_POINT, paintPropertyFrom: window.LYR_FROM_DELETED_POINT }] },
  { sourceLayer: window.LYR_TO_CHANGED_ATTRIBUTE, highlightLayers: [{ layer: window.LYR_TO_SELECTED_POLYGON, paintPropertyFrom: window.LYR_TO_CHANGED_ATTRIBUTE }] },
  { sourceLayer: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON, highlightLayers: [{ layer: window.LYR_FROM_SELECTED_POINT, paintPropertyFrom: window.LYR_FROM_GEOMETRY_POINT_TO_POLYGON }, { layer: window.LYR_TO_SELECTED_POLYGON, paintPropertyFrom: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON }, { layer: window.LYR_TO_SELECTED_LINE, paintPropertyFrom: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON_LINE }] },
  { sourceLayer: window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON, highlightLayers: [{ layer: window.LYR_FROM_SELECTED_LINE, paintPropertyFrom: window.LYR_FROM_GEOMETRY_POINT_COUNT_CHANGED_LINE }, { layer: window.LYR_TO_SELECTED_POLYGON, paintPropertyFrom: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON }, { layer: window.LYR_TO_SELECTED_LINE, paintPropertyFrom: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON_LINE }] },
  { sourceLayer: window.LYR_TO_GEOMETRY_SHIFTED_POLYGON, highlightLayers: [{ layer: window.LYR_FROM_SELECTED_LINE, paintPropertyFrom: window.LYR_FROM_GEOMETRY_POINT_COUNT_CHANGED_LINE }, { layer: window.LYR_TO_SELECTED_POLYGON, paintPropertyFrom: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON }, { layer: window.LYR_TO_SELECTED_LINE, paintPropertyFrom: window.LYR_TO_GEOMETRY_POINT_TO_POLYGON_LINE }] },
  { sourceLayer: window.LYR_TO_POLYGON, highlightLayers: [{ layer: window.LYR_TO_SELECTED_POLYGON, paintPropertyFrom: window.LYR_TO_POLYGON }, { layer: window.LYR_FROM_SELECTED_POINT, paintPropertyFrom: window.LYR_FROM_GEOMETRY_POINT_TO_POLYGON }] },
  { sourceLayer: window.LYR_TO_POINT, highlightLayers: [{ layer: window.LYR_TO_SELECTED_POINT, paintPropertyFrom: window.LYR_TO_POINT }] }
];

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      global_summary: [],
      country_summary: [],
      country_pa_diffs: [],
      globalStats: {},
      countryStats: {},
      showStatuses: ['added', 'removed', 'changed', 'no_change'],
      view: 'global',
      showTrends: false,
      global_trends: [],
      statuses: [
        { key: "added", text: "Added", short_text: "Added", present: false, visible: true, layers: [window.LYR_TO_NEW_POLYGON, window.LYR_TO_NEW_POINT] },
        { key: "removed", text: "Removed", short_text: "Removed", present: false, visible: true, layers: [window.LYR_FROM_DELETED_POLYGON, window.LYR_FROM_DELETED_POINT] },
        { key: "changed", text: "One or more attributes have changed", short_text: "Data change", present: false, visible: true, layers: [window.LYR_TO_CHANGED_ATTRIBUTE] },
        { key: "point_to_polygon", text: "The boundary has changed from a point to a polygon", short_text: "Point to polygon", present: false, visible: true, layers: [window.LYR_FROM_GEOMETRY_POINT_TO_POLYGON, window.LYR_TO_GEOMETRY_POINT_TO_POLYGON, window.LYR_TO_GEOMETRY_POINT_TO_POLYGON_LINE] },
        { key: "point_count_changed", text: "The boundary has changed", short_text: "Shape change", present: false, visible: true, layers: [window.LYR_FROM_GEOMETRY_POINT_COUNT_CHANGED_LINE, window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON, window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON_LINE] },
        { key: "geometry_shifted", text: "The boundary has moved", short_text: "Shape moved", present: false, visible: true, layers: [window.LYR_FROM_GEOMETRY_SHIFTED_LINE, window.LYR_TO_GEOMETRY_SHIFTED_POLYGON, window.LYR_TO_GEOMETRY_SHIFTED_POLYGON_LINE] },
        { key: "no_change", text: "No change", short_text: "No change", present: false, visible: true, layers: [window.LYR_TO_POLYGON, window.LYR_TO_POINT] },
      ],
      versions: [],
      fromVersion: undefined,
      toVersion: undefined,
      sliderValues: [0, 1],
      gettingGlobalStats: false,
      gettingCountryStats: false,
    };
    this.shiftDown = false;
    this.mouseOverPAPopup = false;
    this.mouseOverPAPopuplist = false;
    this.PAPopuptimer = [];
    this.PAPopupListtimer = [];
    this.wdpa_pidsUnderMouse = [];
  }
  async componentDidMount() {
    //get the wdpa versions
    await this.getVersions();
    //add listeners for the keys to control dragging the slider
    this.keyDownEventListener = this.handleKeyDown.bind(this);
    document.addEventListener("keydown", this.keyDownEventListener);
    this.keyUpEventListener = this.handleKeyUp.bind(this);
    document.addEventListener("keyup", this.keyUpEventListener);
  }
  componentWillUnmount() {
    //remove event listeners
    document.removeEventListener("keydown", this.keyDownEventListener);
    document.removeEventListener("keyup", this.keyUpEventListener);
  }
  async mapStyleLoaded() {
    this.initialBounds = this.map.getBounds();
    //get the query parameters
    var params = new URLSearchParams(window.location.search);
    //if a country is passed in the url search parameters then initialise the data for the app
    if (params.has("iso3")) {
      //set the slider values
      let _from = this.state.versions.filter(_version => _version.key === params.get('from'))[0]['id'];
      let _to = this.state.versions.filter(_version => _version.key === params.get('to'))[0]['id'];
      await this.setSliderValues([_from, _to], false);
      //get the country in the search params
      let filtered = this.state.global_summary.filter(item => item.iso3 === params.get('iso3'));
      //set the country
      if (filtered.length) await this.clickCountryPopup(filtered[0]);
    }
  }
  //gets all the available versions of the WDPA from the first month we have data available
  async getVersions() {
    let dateArray = await this.getDateArray();
    //only get the dates with valid wmts calls
    dateArray = dateArray.filter(item => item.wmtsValid);
    //get the months and years between d1 and d2 (inclusive)
    let versions = dateArray.map((item, index) => {
      return { id: index, title: dateFormat(item._date, "mmmm yyyy"), shortTitle: dateFormat(item._date, "mmm yy"), key: dateFormat(item._date, "mmm_yyyy").toLowerCase(), year: dateFormat(item._date, "yyyy") };
    });
    this.setState({ versions: versions, sliderValues: [versions.length, versions.length] }, async() => {
      await this.setFromToVersions(versions.length - 1, versions.length - 1);
    });
  }
  async getDateArray() {
    //set the first date of the available data as 01/08/2019
    let d = new Date(2019, 7, 1);
    let today = new Date();
    let dateArray = [];
    let callCount = 0;
    //iterate through the months until the date is greater than today
    do {
      dateArray.push({ _date: new Date(d.getTime()), wmtsValid: false }); //clone the date
      d = new Date(d.setMonth(d.getMonth() + 1)); //increment the date by 1 month
    }
    while (d < today);
    //iterate through the months and test the call to get the vector tiles - the test is a zoomed in area of morocco
    await Promise.all(dateArray.map(async(item, index) => {
      let url = window.TILES_PREFIX + "wdpa_" + dateFormat(item._date, "mmm_yyyy").toLowerCase() + "_polygons&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:11&TileCol=986&TileRow=817";
      let response = await fetch(url);
      callCount = callCount + 1;
      //if the call succeeds then add the date
      if (response.status !== 400) item.wmtsValid = true;
    }));
    return dateArray;
  }
  //slider events
  onBeforeChange(values) {
    this.prevMin = values[0];
    this.prevMax = values[1];
    this.prevDiff = values[1] - values[0];
  }
  async onChange(values, marks) {
    let vals = Object.keys(marks);
    if (this.shiftDown) {
      //see if we are going up or down
      if ((values[0] < this.prevMin) || (values[1] < this.prevMax)) {
        if (values[1] - this.prevDiff < Number(vals[0])) return;
        if (this.prevDiff === 0) {
          this.newMin = values[0] - this.prevDiff;
          this.newMax = values[0];
        }
        else {
          this.newMin = values[1] - this.prevDiff;
          this.newMax = values[1];
        }
      }
      else { //going up
        if (values[1] > Number(vals[vals.length - 1])) return;
        this.newMin = values[1] - this.prevDiff;
        this.newMax = values[1];
      }
      await this.setSliderValues([this.newMin, this.newMax]);
      this.prevMin = this.newMin;
      this.prevMax = this.newMax;
    }
    else {
      await this.setSliderValues(values);
    }
  }
  updateUrl() {
    if (window.history.pushState) {
      let pref = window.location.protocol + "//" + window.location.host + window.location.pathname;
      let suf = 'from=' + this.state.fromVersion.key + '&to=' + this.state.toVersion.key;
      let newUrl = (this.state.country && this.state.country.iso3) ? pref + '?iso3=' + this.state.country.iso3 + '&' + suf : pref + '?' + suf;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }
  //set updateUrl to true to update the browser url adding the from and to parameters
  async setSliderValues(values, updateUrl=true) {
    //set the slider values
    this.setState({ sliderValues: values });
    //set the from and to versions
    await this.setFromToVersions(values[0], values[1], updateUrl);
  }
  //sets the from and to versions
  async setFromToVersions(_from, _to, updateUrl=false) {
    //check that the _from and _to are different - the onChange event on the slider is called repeatedly as it is moved
    if ((this.state.fromVersion && this.state.fromVersion.id === _from) && (this.state.toVersion && this.state.toVersion.id === _to)) return;
    this.setState({ fromVersion: this.state.versions[_from], toVersion: this.state.versions[_to] });
    //if from and to are the same then get the global totals
    if (_from === _to) {
      if (this.state.view === 'global') {
        await this.getGlobalTotal(_to);
      }
      else {
        this.showUnchanged(); //the user may have unchecked the no_change status when looking at diffs so we need to reset it
        //get the total count of PAs for the version
        await this.getCountryTotal(_to);
      }
    }
    else {
      if (this.state.view === 'global') {
        //get the global and country totals for added, removed and changed
        await Promise.all([this.getGlobalDiffStats(_from, _to), this.getCountriesDiffStats(_from, _to)]);
      }
      else {
        //get the country summary, stats and diffs
        await this.getCountryDiffs();
      }
    }
    //update the browser url
    if (updateUrl) this.updateUrl();
  }
  async handleKeyDown(e) {
    //if the Shift key is pressed then shiftDown property
    if ((e.keyCode === 16) && (!(this.shiftDown))) this.shiftDown = true;
    if (e.keyCode === 37) await this.setSliderValues(([0, 1])); //left arrow key
    if (e.keyCode === 39) await this.setSliderValues(([2, 3])); //right arrow key
  }
  handleKeyUp(e) {
    this.shiftDown = false;
  }
  //the mapbox gl map is ready
  mapReady(map) {
    this.map = map;
    //add event handlers to the map
    this.map.on("mousemove", this.mouseMove.bind(this));
  }
  //gets the global count of protected areas for the version
  async getGlobalTotal(version) {
    let response = await this._get(REST_BASE_URL + "get_global_total?version=" + version + "&format=json");
    this.setState({ globalTotal: response.records[0].total });
  }
  //gets the country count of protected areas for the version
  async getCountryTotal(version) {
    this.setState({ gettingCountryStats: true });
    let response = await this._get(REST_BASE_URL + "get_country_total?version=" + version + "&iso3=" + this.state.country.iso3 + "&format=json");
    this.setState({ countryTotal: response.records[0].total });
    this.setState({ gettingCountryStats: false });
  }
  //gets the global stats for added, removed and changed for the versions
  async getGlobalDiffStats(_from, _to) {
    this.setState({ gettingGlobalStats: true });
    let restUrl = (_to - _from === 1) ? "get_global_stats?version=" + _to + "&format=json" : "get_global_stats2?fromversion=" + _from + "&toversion=" + _to + "&format=json";
    let response = await this._get(REST_BASE_URL + restUrl);
    this.setState({ globalStats: response.records[0], gettingGlobalStats: false });
  }
  //gets the countries stats for added, removed and changed for the versions
  async getCountriesDiffStats(_from, _to) {
    let countryData;
    //get the country reference data from the cached geojson data
    let centroids = JSON.parse(JSON.stringify(geojson));
    //get the country statistics - there are 2 different REST services depending on whether there is 1 months difference (simple) or >1 month (not simple)
    let restUrl = (_to - _from === 1) ? "get_countries_stats?version=" + _to + "&format=json" : "get_countries_stats2?fromversion=" + _from + "&toversion=" + _to + "&format=json";
    let response = await this._get(REST_BASE_URL + restUrl);
    let global_summary_all = response.records.map(country => {
      //find the matching item from the countries.json array
      countryData = centroids.features.find(feature => feature.properties.iso3 === country.iso3);
      //merge the two objects
      return (countryData) ? Object.assign(country, countryData.properties, { "centroid": countryData.geometry.coordinates }) : null;
    });
    //filter out the nulls
    this.global_summary_all = global_summary_all.filter((item) => !(item === null));
    //get the countries that are visible
    let visibleCountries = this.global_summary_all.filter(country => {
      return (this.isCountryVisible('added', country) || this.isCountryVisible('removed', country) || this.isCountryVisible('changed', country));
    });
    //set the state - this creates the country popups on the map
    this.setState({ global_summary: visibleCountries });
  }
  async getCountryDiffs() {
    //hide the country popups and set the view type
    this.setState({ global_summary: [], view: "country" }, async() => {
      //get the difference in the months between the versions
      let diff = (this.state.toVersion.id - this.state.fromVersion.id);
      let _from = this.state.fromVersion.id;
      let _to = this.state.toVersion.id;
      let suf = "&format=json&iso3=" + this.state.country.iso3;
      //get the country stats
      let countryStats_url = (diff === 1) ? "get_country_stats?version=" + _to + suf : "get_country_stats2?fromversion=" + _from + "&toversion=" + _to + suf;
      let country_summary_url = (diff === 1) ? "get_country_summary?version=" + _to + suf : "get_country_summary2?fromversion=" + _from + "&toversion=" + _to + suf;
      let country_pa_diffs_url = (diff === 1) ? "get_country_diffs?version=" + _to + suf : "get_country_diffs2?fromversion=" + _from + "&toversion=" + _to + suf;
      //make the calls for the country simultaneously
      let [countryStats, country_summary, country_pa_diffs] = await Promise.all([this._get(REST_BASE_URL + countryStats_url), this._get(REST_BASE_URL + country_summary_url), this._get(REST_BASE_URL + country_pa_diffs_url)]);
      //set the state
      this.setState({ countryStats: countryStats.records[0], country_summary: country_summary.records, country_pa_diffs: country_pa_diffs.records });
      //set the visibility of the statuses in the statuses array
      this.setStatusPresence(country_summary.records, this.state.country.iso3);
    });
  }
  //returns true if the country has protected areas with the passed status
  isCountryVisible(status, country) {
    return (this.state.showStatuses.indexOf(status) !== -1) && (country[status] > 0);
  }
  async zoomOutMap() {
    //zoom to the full extent
    this.map.fitBounds(this.initialBounds, { padding: { top: 10, bottom: 10, left: 10, right: 10 }, easing: (num) => { return 1 } });
    //set the view back to global
    this.setState({ view: 'global', country: undefined}, () => {
      //update the browser url
      this.updateUrl();
    });
    await this.getCountriesDiffStats(this.state.fromVersion.id, this.state.toVersion.id);
  }
  async showTrends() {
    this.setState({ showTrends: !this.state.showTrends });
    let response = await this._get(REST_BASE_URL + "get_global_trends?format=json");
    //add the version short title
    let global_trends = response.records.map(item => {
      let version = this.state.versions.filter(_version => _version.key === item.from)[0];
      return Object.assign(item, version);
    });
    this.setState({ global_trends: global_trends });
  }
  //makes a GET request and returns a promise which will either be resolved (passing the response) or rejected (passing the error)
  async _get(url, params) {
    let response = await fetch(url);
    return await response.json();
  }
  //iterates through the country summary data and sets a flag in the status array if they are visible
  setStatusPresence(records, iso3) {
    let _statuses = this.state.statuses;
    //iteraten through the status array
    _statuses = _statuses.map(status => {
      if (status.key !== "no_change") {
        //get the matching country_status object
        let filtered = records.filter(item => { return item.status === status.key });
        let country_status = (filtered.length) ? filtered[0] : {};
        return Object.assign(status, { present: country_status.hasOwnProperty('status'), count: country_status.hasOwnProperty('wdpa_pids') && country_status.wdpa_pids.length });
      }
      else {
        //the no_change status is handled differently as we dont want to retrieve all wdpa_pids for a country which havent changed as this is lots of data, potentially, but we can get the no_change country statistics from the global summary
        let global_summary_data = this.global_summary_all.find(item => { return item.iso3 === iso3 });
        let no_change_status = _statuses.find(item => item.key === 'no_change');
        return Object.assign(no_change_status, { present: global_summary_data.no_change > 0, count: this.state.country.no_change });
      }
    });
    this.setState({ statuses: _statuses });
  }
  //manually show the no_change status layers if they are currently not visible
  showUnchanged() {
    let no_change_status = this.state.statuses.filter(status => status.key === 'no_change')[0];
    if (!no_change_status.visible) this.handleStatusChange(no_change_status);
  }
  handleStatusChange(e) {
    let _statuses = this.state.statuses;
    _statuses = _statuses.map(status => {
      return Object.assign(status, { visible: (status.key === e.key) ? !status.visible : status.visible });
    });
    this.setState({ statuses: _statuses });
    //set the layer(s) visibility directly on the map (to avoid an update of the map state)  
    e.layers.forEach(layer => {
      this.map.setLayoutProperty(layer, "visibility", (e.visible) ? "visible" : "none");
    });
  }
  //fired when the user clicks on a country popup
  async clickCountryPopup(country) {
    //set the bounds of the map
    this.map.fitBounds([
      [country.west, country.south],
      [country.east, country.north]
    ], { padding: { top: 10, bottom: 10, left: 10, right: 10 }, easing: (num) => { return 1 } });
    await this.setState({ country: country }, async() => {
      //get the country diffs
      await this.getCountryDiffs();
    });
    //update the browser url
    this.updateUrl();
  }
  //gets the features under the cursor 
  mouseMove(e) {
    if (this.state.view === 'global') return; //dont show popups when at the global level
    //get the layers to be queried
    let showingChange = (this.state.sliderValues[0] !== this.state.sliderValues[1]);
    let queryLayers = (showingChange) ? [window.LYR_FROM_DELETED_POLYGON, window.LYR_FROM_DELETED_POINT, window.LYR_TO_POLYGON, window.LYR_TO_POINT, window.LYR_TO_CHANGED_ATTRIBUTE, window.LYR_TO_GEOMETRY_POINT_TO_POLYGON, window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON, window.LYR_TO_GEOMETRY_SHIFTED_POLYGON, window.LYR_TO_NEW_POLYGON, window.LYR_TO_NEW_POINT] : [window.LYR_TO_POLYGON, window.LYR_TO_POINT];
    var features = this.map.queryRenderedFeatures(e.point, { layers: queryLayers });
    if (features.length > 0) {
      //remove any duplicate features (at the boundary between vector tiles there may be duplicates so remove them)
      features = this.removeDuplicateFeatures(features, "wdpa_pid");
      //get the unique wdpa_pids values 
      let wdpa_pids = features.map(feature => feature.properties.wdpa_pid);
      //compare the wdpas with the previous features under the mouse to see if there are any differences
      if (!this.arraysAreTheSame(wdpa_pids, this.wdpa_pidsUnderMouse)) {
        //if the mouse has moved over 1 or more new features then show them
        this.onMouseEnter({ point: e.point, features: features, showingChange: showingChange });
        this.wdpa_pidsUnderMouse = wdpa_pids;
      }
    }
    else {
      //no features under the cursor
      this.clearPopups();
    }
  }
  //gets unique features from an array of features based on the key property
  removeDuplicateFeatures(arr, key) {
    let uniqueValues = [],
      uniqueFeatures = [];
    arr.forEach(feature => {
      if (uniqueValues.indexOf(feature.properties[key]) === -1) {
        uniqueFeatures.push(feature);
        uniqueValues.push(feature.properties[key]);
      }
    });
    return uniqueFeatures;
  }
  //compares two arrays to see if they are the same
  arraysAreTheSame(arr1, arr2) {
    //compare using a simple string conversion
    return (arr1.join("") === arr2.join("")) ? true : false;
  }
  //mouse has entered one or more features
  onMouseEnter(e) {
    if (this.state.view === 'global') return;
    //if only one feature - show the PAPopup
    if (e.features.length === 1) {
      this.closePAPopuplist(0);
      //clear any timers to close the PAPopup
      this.PAPopuptimer.forEach(timer => { clearTimeout(timer) });
      this.showPAPopup(e);
    }
    else { //show the PAPopuplist
      this.closePAPopup(0);
      //clear any timers to close the PAPopupList
      this.PAPopupListtimer.forEach(timer => { clearTimeout(timer) });
      this.showPAPopuplist(e);
    }
  }
  clearPopups() {
    //reset the local variable that has the wdpa_pids
    this.wdpa_pidsUnderMouse = [];
    //the PAPopupList is currently shown and we dont want to close it
    if (this.state.dataForPopup && this.state.dataForPopup.features && this.state.dataForPopup.features.length > 1) return;
    //deselect features immediately 
    this.deselectFeatures();
    //close the PAPopup
    if (this.state.dataForPopup !== undefined) this.closePAPopup(400);
  }
  showPAPopup(e) {
    //highlight the feature
    this.highlightFeature(e.features[0]);
    //set the data for the popup
    this.setState({ dataForPopup: e });
  }
  showPAPopuplist(e) {
    //set the data for the popuplist
    this.setState({ dataForPopupList: e });
  }
  showPAPopupFromList(feature, e) {
    this.showPAPopup({ features: [feature], point: { x: e.clientX + 50, y: e.clientY }, showingChange: (this.state.sliderValues[0] !== this.state.sliderValues[1]) });
  }
  closePAPopup(ms) {
    //wait for a bit before closing the popup - the user may want to interact with it
    this.PAPopuptimer.push(setTimeout(() => {
      if (!this.mouseOverPAPopup) this.setState({ dataForPopup: undefined });
    }, ms));
  }
  closePAPopuplist(ms) {
    this.PAPopupListtimer.push(setTimeout(() => {
      if (!this.mouseOverPAPopuplist) this.setState({ dataForPopupList: undefined });
    }, ms));
  }
  onMouseEnterPAPopup(e) {
    this.mouseOverPAPopup = true;
  }
  onMouseLeavePAPopup(e) {
    this.mouseOverPAPopup = false;
    //close the PAPopup
    this.closePAPopup(0);
  }
  onMouseEnterPAPopuplist(e) {
    this.mouseOverPAPopuplist = true;
  }
  onMouseLeavePAPopuplist(e) {
    this.mouseOverPAPopuplist = false;
    //close the PAPopup
    this.closePAPopuplist(0);
  }
  highlightFeature(feature) {
    //reset the selected layers
    this.deselectFeatures();
    //get the rule for the layer  
    let rule = hightlightRules.find(_rule => _rule.sourceLayer === feature.layer.id);
    //iterate through the layers that need to be highlighted
    rule.highlightLayers.forEach((item) => {
      //set the filter on the highlightLayers
      this.map.setFilter(item.layer, ['==', 'wdpa_pid', feature.properties.wdpa_pid]);
      //increase the opacity
      if (!USE_SELECTION_COLOR) this.increaseOpacity(item.paintPropertyFrom, item.layer);
    });
  }
  //deselects all features 
  deselectFeatures() {
    if ((this.map === undefined) || (this.map && !this.map.isStyleLoaded())) return;
    if (this.state.fromVersion) this.map.setFilter(window.LYR_FROM_SELECTED_POINT, ['==', 'wdpa_pid', '-1']);
    if (this.state.fromVersion) this.map.setFilter(window.LYR_FROM_SELECTED_LINE, ['==', 'wdpa_pid', '-1']);
    if (this.state.fromVersion) this.map.setFilter(window.LYR_FROM_SELECTED_POLYGON, ['==', 'wdpa_pid', '-1']);
    this.map.setFilter(window.LYR_TO_SELECTED_POINT, ['==', 'wdpa_pid', '-1']);
    this.map.setFilter(window.LYR_TO_SELECTED_LINE, ['==', 'wdpa_pid', '-1']);
    this.map.setFilter(window.LYR_TO_SELECTED_POLYGON, ['==', 'wdpa_pid', '-1']);
    //reset the selection color in the LYR_TO_SELECTED_POLYGON layer - too slow fades in slowly
    // this.map.setPaintProperty(window.LYR_TO_SELECTED_POLYGON, "fill-color", "rgba(0,0,0,0)");
  }
  //gets the paint property from the passed source layer, clones it into the target layer but with an increase in opacity
  increaseOpacity(sourceLayer, targetLayer, increaseBy = 0.1) {
    //get the paint property of the source layer
    let paint = this.getPaintProperty(sourceLayer);
    //iterate through the paint properties of the source layer and copy them to the target layer
    Object.keys(paint).forEach(key => {
      let newValue = paint[key];
      //increase the opacity in any rgba values
      if ((typeof(paint[key]) === "string") && paint[key].indexOf("rgba") !== -1) {
        let rgba = parse(paint[key]);
        newValue = "rgba(" + rgba.values[0] + "," + rgba.values[1] + "," + rgba.values[2] + "," + this.getNewOpacity(rgba.alpha, increaseBy) + ")";
      }
      //increase the opacity if the key contains the word opacity
      if (key.indexOf("opacity") !== -1) newValue = this.getNewOpacity(paint[key], increaseBy);
      //dont change the fill outline opacity if the source layer is a changed geometry polygon - the fill outline should remain invisible as it will be shown in the geometry changed line layer
      if (!((key === "fill-outline-color") && (sourceLayer === window.LYR_TO_GEOMETRY_POINT_TO_POLYGON || sourceLayer === window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON || sourceLayer === window.LYR_TO_GEOMETRY_SHIFTED_POLYGON))) this.map.setPaintProperty(targetLayer, key, newValue);
    });
  }
  getNewOpacity(value, increaseBy) {
    return ((value + increaseBy) > 1) ? 1 : value + increaseBy;
  }
  getPaintProperty(layerid) {
    let style = this.map.getStyle();
    let layer = style.layers.find(layer => { return layer.id === layerid });
    let paintProperty = (layer) ? layer.paint : {};
    return paintProperty;
  }

  showAllNoChanges(_show) {
    let statuses = (_show) ? ['added', 'removed', 'changed'] : [];
    this._showChanges(statuses);
  }
  showChangesWithStatus(status, _show) {
    let statuses = this.state.showStatuses;
    if (_show) {
      statuses.push(status);
    }
    else {
      statuses.pop(status);
    }
    this._showChanges(statuses);
  }
  _showChanges(statuses) {
    this.setState({ showStatuses: statuses }, () => {
      this.getVisibleCountries();
    });
  }
  render() {
    return (
      <React.Fragment>
        <MyMap 
          setMap={this.mapReady.bind(this)}
          mapStyleLoaded={this.mapStyleLoaded.bind(this)}
          fromVersion={this.state.fromVersion} 
          toVersion={this.state.toVersion}
          global_summary={this.state.global_summary}
          country_summary={this.state.country_summary}
          country={this.state.country}
          showStatuses={this.state.showStatuses}
          statuses={this.state.statuses}
          clickCountryPopup={this.clickCountryPopup.bind(this)}
          view={this.state.view}
        />
        <AppBar 
          softwareVersion={packageJson.version}
          versions={this.state.versions} 
          fromVersion={this.state.fromVersion} 
          toVersion={this.state.toVersion} 
          onBeforeChange={this.onBeforeChange.bind(this)} 
          onChange={this.onChange.bind(this)} 
          values={this.state.sliderValues} 
          zoomOutMap={this.zoomOutMap.bind(this)} 
          showTrends={this.showTrends.bind(this)}
          showStatuses={this.state.showStatuses}
          globalTotal={this.state.globalTotal} 
          globalStats={this.state.globalStats} 
          countryTotal={this.state.countryTotal}
          countryStats={this.state.countryStats}
          country={this.state.country}
          view={this.state.view}
          gettingGlobalStats={this.state.gettingGlobalStats}
          gettingCountryStats={this.state.gettingCountryStats}
        />
        <Trends showTrends={this.state.showTrends} global_trends={this.state.global_trends}/>
        <PAPopupList 
          dataForPopupList={this.state.dataForPopupList} 
          country_pa_diffs={this.state.country_pa_diffs} 
          map={this.map} 
          showPAPopup={this.showPAPopupFromList.bind(this)} 
          onMouseEnterPAPopuplist={this.onMouseEnterPAPopuplist.bind(this)} 
          onMouseLeavePAPopuplist={this.onMouseLeavePAPopuplist.bind(this)}
        /> 
        <PAPopup 
          statuses={this.state.statuses} 
          dataForPopup={this.state.dataForPopup} 
          country_pa_diffs={this.state.country_pa_diffs} 
          map={this.map} 
          fromVersion={this.state.fromVersion} 
          toVersion={this.state.toVersion} 
          onMouseEnterPAPopup={this.onMouseEnterPAPopup.bind(this)} 
          onMouseLeavePAPopup={this.onMouseLeavePAPopup.bind(this)}
        />
        <FooterBar 
          view={this.state.view} 
          statuses={this.state.statuses} 
          values={this.state.sliderValues} 
          handleStatusChange={this.handleStatusChange.bind(this)}
        />
      </React.Fragment>
    );
  }
}

export default App;
