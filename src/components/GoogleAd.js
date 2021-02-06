import React from 'react';

export default class GoogleAd extends React.Component {
  componentDidMount() {
    (window.adsbygoogle = window.adsbygoogle || []).push({})
  }

  render() {
    console.log(">>>>>AAAAAA: GoogleAd:", this.props.googleAd)
    return (
      <div style={{marginTop: 10, marginBottom: 10}}>
        <div dangerouslySetInnerHTML={ {__html: this.props.googleAd} }>
        </div>
      </div>
    );
  }
}
