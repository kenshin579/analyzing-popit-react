import React from 'react';
import { Layout, Col, Row } from 'antd';
import PostApi from "../services/PostApi";

import { Link } from 'react-router-dom';
import { PUBLIC_PATH } from "../routes";

export default class TagListWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tags: []
    }
  };

  componentDidMount() {
    PostApi.getTags()
      .then(json => {
        if (json.success !== true) {
          alert("Error:" + json.message);
          return;
        }

        this.setState({
          tags: json.data,
        });
      })
      .catch(error => {
        alert("Error:" + error);
      });
  };

  render() {
    const { tags } = this.state;

    const tagStyle = {
      // float: 'left',
      color: '#525252',
      fontSize: 14,
      lineHeight: '16px',
      maxHeight: 50,
      maxWidth: 185,
      marginLeft: 10,

      fontWeight: 'bold',
      textOverflow: 'ellipsis',
      wordWrap: 'break-word',
    };

    const tagDivList1 = [];
    const tagDivList2 = [];
    tags.forEach((tag, index) => {
      if (index < 20) {
        tagDivList1.push((<div key={index} style={tagStyle}><a href={`${PUBLIC_PATH}/tag/${tag.term.slug}`} style={{color: '#333333'}}>{tag.term.name}</a> ({tag.numPosts})</div>));
      } else if (index >= 20 && index < 40) {
        tagDivList2.push((<div key={index} style={tagStyle}><a href={`${PUBLIC_PATH}/tag/${tag.term.slug}`} style={{color: '#333333'}}>{tag.term.name}</a> ({tag.numPosts})</div>));
      }
    });

    return (
      <div style={{width: 300, border: '1px solid #e9ebee', display: 'inline-block'}}>
        <div style={{textAlign: 'center', background: '#e9ebee'}}>
          <h4 style={{padding: 5, color: '#333333'}}>Tags</h4>
        </div>
        <div style={{padding: 5}}>
          <Row>
            <Col span={12}>{ tagDivList1 }</Col>
            <Col span={12}>{ tagDivList2 }</Col>
          </Row>
        </div>
      </div>
    )
  };
}