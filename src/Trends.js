import React from 'react';
import { LineChart, Line,XAxis, YAxis,Tooltip  } from 'recharts';

class Trends extends React.Component {
  tickFormatter(value){
    return value.toLocaleString();
  }
  render() {
    const renderLineChart = (
      <LineChart width={1000} height={200} data={this.props.global_trends}>
        <Line type="monotone" dataKey="sum" stroke="#5b9541" />
        <XAxis dataKey="shortTitle" data={this.props.global_trends} label={{ value: "",  angle: 0,   dy: 15}}/>
        <YAxis type="number" domain={['auto', 'auto']} tickFormatter={this.tickFormatter.bind(this)} label={{ value: "Number of Protected Areas", angle: -90,   dx: -35}}/>
        <Tooltip />
      </LineChart>
    );    
    return (
      <React.Fragment>
          <div className={'trends'} style={{display:(this.props.showTrends) ? "block" : "none"}}>{renderLineChart}
          </div>
      </React.Fragment>
    );
  }
}

export default Trends;
