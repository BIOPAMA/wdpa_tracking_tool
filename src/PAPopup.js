import React from 'react';
import Changed from './Changed.js';
import Status from './Status.js';
import { getFeatureStatus } from './genericFunctions.js';

const TITLE_LINK = "Click to open in the Protected Planet website";
const URL_PP = "https://www.protectedplanet.net/";

class PAPopup extends React.Component {
	getChangedData(feature){ //single feature under mouse
		let attributesData =[];
		let props = feature.properties;
		//check that the diff data has loaded
		if (this.props.country_pa_diffs.length === 0) return {};
		//get the data for the feature under the mouse
		let pa_data = this.props.country_pa_diffs.find(pa => pa.wdpa_pid === props.wdpa_pid); 
		if (pa_data === undefined) return;
		//get the previous version of the feature either from the points layer or the polygons layer
		let previous_feature;
		if (pa_data.geometry_change && pa_data.geometry_change === "point to polygon"){
			previous_feature = this.props.map.querySourceFeatures(window.SRC_FROM_POINTS, {sourceLayer: "wdpa_" + pa_data.from + "_points", filter: ["==", "wdpa_pid", props.wdpa_pid]})[0];
		}else{
			previous_feature = this.props.map.querySourceFeatures(window.SRC_FROM_POLYGONS, {sourceLayer: "wdpa_" + pa_data.from + "_polygons", filter: ["==", "wdpa_pid", props.wdpa_pid]})[0];
		}
		//attributes have changed - make an array of the data
		if (pa_data.attribute_change){
			pa_data.attribute_change.forEach((attribute) => {
				if (previous_feature){
					attributesData.push({attribute: attribute, previous: previous_feature.properties[attribute], current: props[attribute]});
				}else{
					attributesData.push({attribute: attribute, previous: 'changed in ' + pa_data.from, current: props[attribute]});
				}
			});
		}
		return {attributesData: attributesData, geometryData: pa_data.geometry_change};
	}
	render() {
		if (this.props.dataForPopup === undefined) return null;
		let left = this.props.dataForPopup.point.x + 35 + 'px';
		let top = this.props.dataForPopup.point.y - 25 + 'px';
		let feature = this.props.dataForPopup.features[0];
		let children, status="", link;
		link = <span className={"ppLink underline"}><a href={URL_PP + feature.properties.wdpa_pid} target='_blank'  rel="noopener noreferrer" title={TITLE_LINK}>{feature.properties.wdpa_pid}</a></span>;
		status = getFeatureStatus(feature);
		switch (status) {
			case "changed":
				let changedData = this.getChangedData(feature);
				children = <Changed statuses={this.props.statuses} changedData={changedData} fromVersion={this.props.fromVersion} toVersion={this.props.toVersion}/>;
				break;
			case "added":
				children = <div className={'paPopupChangeType'}>Added in {this.props.toVersion.title}</div>;
				break;
			case "removed":
				children = <div className={'paPopupChangeType'}>Removed in {this.props.toVersion.title}</div>;
				link = <span className={"ppLink"}></span>;
				break;
			case "no_change":
				if (this.props.dataForPopup.showingChange){
					children = <div className={'paPopupChangeType'}>No change</div>;
				}else{
					//show all of the protected area attributes
					children = Object.keys(feature.properties).map(key=>{
						return <tr><td>{key}</td><td>{feature.properties[key]}</td></tr>;
					});
					children = <div className={'wdpaAttributeTable'}><table><tbody>{children}</tbody></table></div>;
				}
				break;
			default:
				//code
		}
		return (
			<div style={{'left': left,'top':top}} id="popup" className={'PAPopup'} onMouseEnter={this.props.onMouseEnterPAPopup} onMouseLeave={this.props.onMouseLeavePAPopup}>
				<div className={'wdpaPopup'}>
					<div className="paPopupName">{(this.props.dataForPopup.showingChange) ? <Status status={status} iconOnly={true} rightPadding={3}/> : null }<span className={"paPopupNameLeft"}>{feature.properties.name}</span>{link}</div>
					<div className={'paPopupContent'}>
						{children}
					</div>
				</div>
			</div>
		);
	}
}

export default PAPopup;