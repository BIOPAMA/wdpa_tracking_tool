import React from 'react';
import StatusCheckbox from './StatusCheckbox.js';

class FooterBar extends React.Component {
    handleStatusChange(status) {
        this.props.handleStatusChange(status);
    }
    render() {
        let children = this.props.statuses.map(item=>{
            return (item.present) ? <StatusCheckbox status={item} handleStatusChange={this.handleStatusChange.bind(this)} key={item.key}/> : null;
        });
        return (
            <React.Fragment>
                <div className={'footerBar'} style={{display: ((this.props.view === 'country') && (this.props.values[0] !== this.props.values[1])) ? 'flex' : 'none' }}>
                    <div className={'footerBarTitle'}>Changes</div>
                    <div className={'footerBarContent'}>
                        <div style={{display: 'block'}}>
                            {children}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default FooterBar;
