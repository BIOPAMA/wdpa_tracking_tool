import React from 'react';
import StatsBar from './StatsBar.js';

class CountryPopup extends React.Component {
    clickCountryPopup(){
      this.props.clickCountryPopup(this.props.country);
    }
    render() {
        return (
            <div  className={'countryPopup'}>
              <div title={"View details for " + this.props.country.name} onClick={this.clickCountryPopup.bind(this)}>
                <div className={'name'}>{(this.props.country.name.length > 40) ? (this.props.country.name.substr(0,30) + '...') : this.props.country.name}</div>
                <div className={'stats'}>
                  <StatsBar values={this.props.country} showStatuses={this.props.showStatuses}/>
                </div>
              </div>
            </div>
        );
    }
}

export default CountryPopup;
