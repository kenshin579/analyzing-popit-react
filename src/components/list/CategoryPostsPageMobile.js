import React from 'react';
import PostApi from "../../services/PostApi";
import PostCardListMobile from './PostCardListMobile';
import { Layout } from 'antd';
import PopitMobileHeader from "../PopitMobileHeader";
import PopitMobileSider from "../PopitMobileSider";
import PopitFooter from "../PopitFooter";

import '../popit.css';

const { Content } = Layout;

const MAX_NUM_POSTS = 10;

export default class CategoryPostsPageMobile extends React.Component {
  constructor(props) {
    super(props);

    let posts;
    if (process.env.BROWSER) {
      if (window.__INITIAL_DATA__) {
        posts = window.__INITIAL_DATA__.data;
      }
      delete window.__INITIAL_DATA__;
    } else {
      posts = this.props.staticContext.data.data;
    }
    this.state = {
      posts: posts,
      loading: posts ? false : true,
      errorMessage: "",
    };
    this.page = posts ? 1 : 0;

    this.getCategoryPosts = this.getCategoryPosts.bind(this);
  }

  componentDidMount () {
    if (!this.state.posts) {
      this.getCategoryPosts()
    }
  }

  getCategoryPosts() {
    this.page++;
    PostApi.getPostsByCategory(this.props.categoryParam, [], this.page, MAX_NUM_POSTS)
      .then(json => {
        if (json.success !== true) {
          this.setState({
            loading: false,
            errorMessage: json.message,
            posts: [],
          });
          // alert("Error:" + json.message);
          return;
        }

        const posts = json.data;
        if (posts.length == 0) {
          this.page--;
          alert("마지막 글 입니다.");
          return;
        }

        const mergedPosts = (this.state.posts) ? ([...this.state.posts, ...posts]) : posts
        this.setState({
          loading: false,
          posts: mergedPosts,
        });
      })
      .catch(error => {
        alert("Error:" + error);
      });
  };


  render() {
    const { loading, posts, errorMessage } = this.state;

    if (loading === true) {
      return (<div style={{textAlign: 'center', marginTop: 20}}>Loading...</div>)
    }

    return (
      <Layout className="layout" hasSider={false} style={{background: '#ffffff'}}>
        <PopitMobileSider />
        <Layout>
          <PopitMobileHeader/>
          <Content style={{ padding: '10px', marginTop: 84}}>
            <div>
              <h1>{this.props.categoryParam.toUpperCase()}</h1>
              { (errorMessage) ? (<div style={{fontWeight: 'bold', fontSize: 16}}>Error: {errorMessage}</div>) : null }
              <PostCardListMobile posts={posts}
                                  moreButtonText={this.props.categoryParam.toUpperCase() + ' 글 더보기'}
                                  getNextPosts={this.getCategoryPosts}
                                  showAuthor={true}/>
            </div>
          </Content>
          <PopitFooter/>
        </Layout>
      </Layout>
    )
  }
}