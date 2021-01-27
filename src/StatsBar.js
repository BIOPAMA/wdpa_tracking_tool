import React from 'react';
import Status from './Status.js';
class StatsBar extends React.Component {
	render() {
	    let spacer = <span style={{paddingLeft: (this.props.spacing) ? this.props.spacing + 'px' : '6px'}}/>;
		return (
		    <div className={'statsBar'}>
                <div style={{display:'inline',paddingRight:'6px'}}><Status status={'total'} amount={this.props.values.total}/>{spacer}</div>
                <div style={{display: ((this.props.showStatuses.indexOf('added') !==-1)&&this.props.values.added) ? 'inline' : 'none'}}><Status status={'added'} amount={this.props.values.added}/>{spacer}</div>
                <div style={{display: ((this.props.showStatuses.indexOf('removed') !==-1)&&this.props.values.removed) ? 'inline' : 'none'}}><Status status={'removed'} amount={this.props.values.removed}/>{spacer}</div>
                <div style={{display: ((this.props.showStatuses.indexOf('changed') !==-1)&&this.props.values.changed) ? 'inline' : 'none'}}><Status status={'changed'} amount={this.props.values.changed} rightPadding={1}/>{spacer}</div>
                {/*<div style={{display: ((this.props.showStatuses.indexOf('no_change') !==-1)&&this.props.values.no_change) ? 'inline' : 'none'}}><Status status={'no_change'} amount={this.props.values.no_change}/></div>*/}
            </div>
		);
	}
}

export default StatsBar;