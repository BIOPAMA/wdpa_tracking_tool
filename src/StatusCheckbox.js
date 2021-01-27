import React from 'react';
import added from './added.png';
import removed from './removed.png';
import changed from './changed.png';
import point_to_polygon from './point_to_polygon.png';
import point_count_changed from './point_count_changed.png';
import geometry_shifted from './geometry_shifted.png';
import no_change from './no_change.png';

class StatusCheckbox extends React.Component {
    handleStatusChange(e){
        this.props.handleStatusChange(this.props.status);
    }
    render() {
        let img;
        switch (this.props.status.key) {
            case 'added':
                img = added;
                break;
            case 'removed':
                img = removed;
                break;
            case 'changed':
                img = changed;
                break;
            case 'point_to_polygon':
                img = point_to_polygon;
                break;
            case 'point_count_changed':
                img = point_count_changed;
                break;
            case 'geometry_shifted':
                img = geometry_shifted;
                break;
            case 'no_change':
                img = no_change;
                break;
            default:
                // code
        }
        return (
            <div className={'statusCheckboxContainer'}>
                <img src={img} alt={this.props.status.text} title={this.props.status.text} className={"statusImage"}/>
                <input className={'statusCheckbox'} id={this.props.status.key + 'id'} type="checkbox" checked={this.props.status.visible} onChange={this.handleStatusChange.bind(this)}/>
                <label for={this.props.status.key + 'id'} className={'statusLabel'}>{this.props.status.short_text}({this.props.status.count})</label>
            </div>
        );
    }
}

export default StatusCheckbox;
