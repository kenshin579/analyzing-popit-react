import React from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { Layout, Icon, Input } from "antd";
import './popit.css';
import { PUBLIC_PATH } from '../routes';

const Search = Input.Search;
const { Header } = Layout;

export default class PopitHeader extends React.Component {
  constructor(props) {
    super(props);

    this.search = this.search.bind(this);
  }

  search(keyword) {
    document.location.href = `${PUBLIC_PATH}/search/${encodeURIComponent(keyword)}`;
  };

  render() {
    const rootPath = PUBLIC_PATH.length > 0 ? PUBLIC_PATH : "/";
    return (
      <Header style={{ position: 'fixed', width: '100%', zIndex: 999, top: 0}}>
        <div className="logo" style={{cursor: 'pointer'}} onClick={() => {document.location.href = rootPath}}/>
        <div style={{float: 'right', marginLeft: 20, lineHeight: '64px' }}>
          <a style={{color: '#DEDEDE', fontWeight: 'bold', marginRight: 10, fontSize: 14, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif"}} href="https://www.popit.kr/how-to-contribute/"><Icon type="edit" />&nbsp;&nbsp;저자신청</a>
          <a style={{color: '#DEDEDE', fontWeight: 'bold', marginRight: 10, fontSize: 14, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif"}} href="https://www.popit.kr/category/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/"><Icon type="sound" />&nbsp;&nbsp;공지사항</a>
          <a style={{color: '#DEDEDE', fontWeight: 'bold', fontSize: 14, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif"}} href="https://www.popit.kr/wp-admin/"><Icon type="setting" /> 로그인</a>
        </div>
        <div style={{float: 'right', marginLeft: 20}}>
          <Search
            placeholder="Search"
            onSearch={ (value) => this.search(value) }
            style={{ width: 200 }}
          />
        </div>
      </Header>
    )
  }
}