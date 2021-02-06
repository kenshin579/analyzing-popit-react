import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import decodeHtml from 'decode-html';
import { dracula } from 'react-syntax-highlighter/styles/hljs';
import {renderToString} from "react-dom/server";
import Iframe from 'react-iframe';
import Url from 'url-parse';

// const URL = Url.URL;

class HtmlElement extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { html } = this.props;

    return (
      <div dangerouslySetInnerHTML={{ __html: html }} />
    )
  }
}

class PostElement {
  constructor() {
    this.needNextLine = this.needNextLine.bind(this);
    this.addNextLine = this.addNextLine.bind(this);
    this.isFinished = this.isFinished.bind(this);
    this.getHtmlString = this.getHtmlString.bind(this);
    this.getComponent = this.getComponent.bind(this);
  }

  static newPostElement(line) {
    if (line.indexOf('[embed]') >= 0) {
      return new EmbeddedElement(line);
    } else if (line.trim().indexOf('[gallery') >= 0) {
      return new GalleryElement(line);
    } else if (line.indexOf("[caption") === 0) {
      return new CaptionImageElement(line);
    } else if (line.indexOf("<pre class=\"") >= 0) {
      return new SourceCodeElement(line);
    } else if (line.indexOf("<ul") >= 0) {
      return new ItemsElement(line);
    } else if (line.indexOf("<blockquote") >=0 && line.indexOf("</blockquote>") < 0) {
      return new BlockQuoteElement(line);
    } else {
      return new ParagraphElement(line);
    }
  }

  addNextLine(line) {
  }

  needNextLine() {
    return false;
  }

  isFinished() {
    return true;
  }

  getHtmlString() {
    return "<div>Unknown element type</div>";
  }

  getComponent(key) {
    const html = this.getHtmlString();
    if (!html) {
      return null;
    }
    return (<HtmlElement key={key} html={html}/>)
  }
}

class GalleryComponent extends React.Component {
  render() {
    const { columns, size, images, captions } = this.props;

    const itemWidth = Math.floor(100/columns);

    const galleryItemStyle = {
      float: 'left',
      marginTop: '10px',
      textAlign: 'center',
      width: itemWidth + '%'
    };

    const galleryImageStyle = {
      border: 'none',
      verticalAlign: 'bottom',
      maxWidth: '100%',
      height: 'auto',
      padding: 5,
    };

    const galleryCaptionStyle = {
      marginLeft: 0
    };

    const items = [];
    for (let i = 0; i < columns; i++) {
      const caption = (captions && captions.length >= i - 1) ? captions[i] : "";
      items.push((
        <div key={i}>
          <dl className="gallery-item" style={galleryItemStyle}>
            <dt className="gallery-icon landscape">
              <a href={images[i]} target='_blank' style={{borderBottom: 'none'}}>
                <img style={galleryImageStyle}
                   width="600" height="449"
                   src={images[i]}
                   className={`attachment-${size} size-${size}`}
                   alt={caption}
                   sizes="(max-width: 600px) 100vw, 600px"/>
              </a>
            </dt>
            <dd style={galleryCaptionStyle} className="wp-caption-text gallery-caption">
              {caption}
            </dd>
          </dl>
        </div>
      ));
    }

    return (
      <div className={`gallery gallery-columns-${columns} gallery-size-${size}`} style={{margin: 'auto'}}>
        {items}
        <br style={{clear: 'both'}}/>
      </div>
    )
  }
}
class GalleryElement extends PostElement {
  constructor(line) {
    super();

    const tokens = line.split(" ");
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].startsWith("size=")) {
        const val = tokens[i].split("=")[1].trim();
        this.size = val.substr(1, val.length - 2);
      } else if (tokens[i].startsWith("columns=")) {
        const val = tokens[i].split("=")[1].trim();
        this.columns = parseInt(val.substr(1, val.length - 2), 10);
      } else if (tokens[i].startsWith("images=")) {
        const val = tokens[i].split("=")[1].trim();
        this.images = val.substr(1, val.length - 2).split(",")
      } else if (tokens[i].startsWith("captions=")) {
        const val = decodeURIComponent(tokens[i].split("=")[1].trim().replace(/\+/g, ' '));
        this.captions = val.substr(1, val.length - 3).split(",")
      }
    }
  }

  getHtmlString() {
    return renderToString(this.getComponent(""));
  }

  getComponent(key) {
    return (<GalleryComponent size={this.size} columns={this.columns} images={this.images} captions={this.captions}/>);
  }
}

class ParagraphElement extends PostElement {
  constructor(paragraph) {
    super();
    this.paragraph = paragraph;
  }

  getHtmlString() {
    if (!this.paragraph) {
      return "";
    }
    // if (this.paragraph.startsWith("<")) {
    //   return `<p>${this.paragraph}</p>`;
    // }
    return `<p>${this.paragraph}</p>`;
  }
}

class BlockQuoteElement extends PostElement {
  constructor(firstLine) {
    super();
    this.finish = false;
    this.lines = [firstLine];
  }

  needNextLine() {
    return !this.finish;
  }

  isFinished() {
    return this.finish;
  }

  addNextLine(line) {
    const endTagIndex = line.indexOf("</blockquote>");
    if (endTagIndex >= 0) {
      this.finish = true;
    }
    this.lines.push(line);
  }

  getHtmlString() {
    let html = "";
    this.lines.forEach((line) => html += line + "\n");

    return html;
  }
}

class ItemsElement extends PostElement {
  constructor(ulTag) {
    super();
    this.finish = false;
    this.lines = [ulTag];
    this.startListItem = false;
    this.currentNestedItemElement = null;
    this.level = 1;
    this.toString = this.toString.bind(this);
    this.nestedItemElementPos = 0;
  }

  needNextLine() {
    return !this.finish;
  }

  isFinished() {
    return this.finish;
  }

  makeNestedComponents(lines) {
    // console.log(">>>lines>", lines);
    let linesWithNestedComponents = [];
    let nestedItemElement = null;
    for (let i = 0; i < lines.length; ) {
      const line = lines[i];
      if (i > 0 && line.trim().startsWith("<ul>")) {
        nestedItemElement = new ItemsElement(line);
        nestedItemElement.level = this.level + 1;
        const childElements = nestedItemElement.makeNestedComponents(lines.slice(i))
        linesWithNestedComponents.concat(childElements);
        i += childElements.length;
      } else if (line.indexOf("</ul>") >= 0) {
        i++;
        linesWithNestedComponents.push(line)
        return linesWithNestedComponents;
      } else {
        i++;
        linesWithNestedComponents.push(line);
      }
    }

    return linesWithNestedComponents;
  }

  addNextLine(line) {
    this.lines.push(line);
    if (line.trim().startsWith("<ul>")) {
      this.nestedItemElementPos++;
    }
    if (line.indexOf("</ul>") >= 0) {
      this.nestedItemElementPos--;
      if (this.nestedItemElementPos < 0) {
        this.finish = true;
        const linesWithNestedComponents = this.makeNestedComponents(this.lines);
      }
    }
  }

  toString() {
    return this.getHtmlString();
  }

  getHtmlString() {
    let html = "";
    let startListItemTag = false; // <li>
    let nestedComponentIndex = 1;
    let nestedComponent = null;
    this.lines.forEach((line) => {
      if (typeof line !== "string") {
        if (line.getHtmlString) {
          html += line.getHtmlString();
        } else {
          html += line.toString();
        }
        return;
      }
      line = line.trim();
      if (line.indexOf("<pre class=\"") >= 0) {
        // <li> 내부에 다시 소스 코드가 있는 경우
        nestedComponent = PostElement.newPostElement(line);
        return;
      } else if (line.indexOf("[caption") === 0) {
        nestedComponent = PostElement.newPostElement(line);
      }

      if (nestedComponent != null) {
        nestedComponent.addNextLine(line);
        if (nestedComponent.isFinished()) {
          html += renderToString(nestedComponent.getComponent(nestedComponentIndex));
          nestedComponent = null;
          nestedComponentIndex++;
        }
        return;
      }

      html += line + "\n";

      if (line.trim().replace("\t", "").startsWith("<li>")) {
        startListItemTag = true;
      }
      if (line.endsWith("</li>")) {
        startListItemTag = false;
      }
    });

    return html;
  }

  getComponent(key) {
    let html = "";
    let startListItemTag = false; // <li>

    let nestedComponentIndex = 1;
    let nestedComponent = null;
    this.lines.forEach((line) => {
      if (line.indexOf("<pre class=\"") >= 0) {
        // <li> 내부에 다시 소스 코드가 있는 경우
        nestedComponent = PostElement.newPostElement(line);
        return;
      } else if (line.indexOf("[caption") === 0) {
        nestedComponent = PostElement.newPostElement(line);
      }

      if (nestedComponent != null) {
        nestedComponent.addNextLine(line);
        if (nestedComponent.isFinished()) {
          html += renderToString(nestedComponent.getComponent(key + "_" + nestedComponentIndex));
          nestedComponent = null;
          nestedComponentIndex++;
        }
        return;
      }
      html += line;
      if (startListItemTag) {
        html += "<br/>";
      }
      html += "\n";

      if (line.trim().replace("\t", "").startsWith("<li>")) {
        startListItemTag = true;
      }
      if (line.endsWith("</li>")) {
        startListItemTag = false;
      }
    });

    return (<HtmlElement key={key} html={html}/>)
  }
}

class CaptionImageElement extends PostElement {
  constructor(captionTag) {
    super();

    this.captionTag = captionTag;
  }

  getHtmlString() {
    const captionTag = this.captionTag;

    //[caption id="attachment_11782" align="alignnone" width="600"]<img class="size-medium wp-image-11782" src="http://www.popit.kr/wp-content/uploads/2017/03/tony-1-600x600.png" alt="소통은 언제나 환영하니 메일 주세요" wit="600" /> 소통은 언제나 환영하니 메일 주세요[/caption]
    const captionIndex = captionTag.indexOf("]");
    let captionDiv = captionTag.substring(captionTag.indexOf("[caption") + 8, captionIndex);
    captionDiv = captionDiv.replace("aligncenter", "center");

    const imageTag = captionTag.substring(captionIndex + 1, captionTag.indexOf("/>") + 2);
    const caption = captionTag.substring(captionTag.indexOf("/>") + 2, captionTag.indexOf("[/caption]")).trim();

    return `<div class="wp-caption-image" ${captionDiv}>\n${imageTag}\n<p class="wp-caption-text">${caption}</p></div>`;
  }
}

class EmbeddedElement extends PostElement {
  constructor(embeddedTag) {
    super();

    this.embeddedTag = embeddedTag;
    this.contentsType = null;
    this.embeddedLink = null;
    this.iframeHtml = null;

    this.parseTag = this.parseTag.bind(this);
    this.getHtmlString = this.getHtmlString.bind(this);
    this.isSlideShare = this.isSlideShare.bind(this);
    this.getSlideShareIFrame = this.getSlideShareIFrame.bind(this);
    this.parseTag();
  }

  isSlideShare() {
    const url = new Url(this.embeddedLink);
    return this.contentsType == "slideshare" || url.host == "www.slideshare.net";
  }
  parseTag() {
    const startIndex = this.embeddedTag.indexOf("[embed]");
    const endIndex = this.embeddedTag.indexOf("[/embed]");

    let link = this.embeddedTag.substring(startIndex + "[embed]".length, endIndex);

    if (!link || link == null) {
      return;
    }
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      return;
    }

    const url = new Url(link);
    if (url.host == "www.youtube.com" || url.host == "youtu.be") {
      this.contentsType = "youtube";
    } else if (url.host == "www.slideshare.net") {
      this.contentsType = "slideshare";
    }
    this.embeddedLink = link;
  }

  getHtmlString() {
    if (this.embeddedLink == null) {
      return renderToString(<HtmlElement html={`<p>Link: ${this.embeddedTag}</p>`}/>);
    }
    if (this.contentsType == "youtube") {
      const url = new Url(this.embeddedLink);
      let contentId = "";
      if (url.host == "youtu.be") {
        contentId = url.pathname;
      } else {
        // ?v=tElWsmHROYA
        if (url.query.length > 0) {
          const query = url.query.substring(1);
          const paramKeyVals = query.split("&")
          paramKeyVals.forEach((keyVal) => {
            const keyValArray = keyVal.split("=")
            if (keyValArray.length == 2 && keyValArray[0] == "v") {
              contentId = keyValArray[1];
            }
          })
        }
      }

      if (contentId) {
        const link = `https://www.youtube.com/embed/${contentId}`;
        return renderToString(
            <div className="post-embed" style={{margin: 10}}>
              <Iframe url={link}
                      width="560px"
                      height="314px"
                      display="initial"
                      position="relative"
                      allowFullScreen/>
            </div>
        )
      } else {
        return renderToString(<HtmlElement html={`<p>Link: <a href="${this.embeddedLink}" target="_blank">${this.embeddedLink}</a></p>`}/>);
      }
    } else if (this.isSlideShare()) {
      if (this.iframeHtml) {
        return this.iframeHtml;
      } else {
        return renderToString((
          <div className="post-embed" style={{margin: 10}}>
            <p>Link: <a href={this.embeddedLink} target="_blank">{this.embeddedLink}</a></p>
          </div>
        ));
      }
    }

    return renderToString(<HtmlElement html={`<p>Link: ${this.embeddedTag}</p>`}/>);
  }

  getSlideShareIFrame() {
    const slideshareApi = `https://www.popit.kr/api/GetSlideShareEmbedLink?link=${this.embeddedLink}`;

    try {
      return fetch(slideshareApi, {method: 'GET', headers: {'Content-Type': 'json'}})
        .then(res => res.json())
        .then(json => {
          if (!json.success) {
            console.log("Error: ", json.message);
            return;
          }
          this.iframeHtml = json.data.html;
          return this.iframeHtml;
        })
        .catch(error => {
          console.log('Error: ', error);
        });
    } catch (error) {
      console.log('Error: ', error);
    }
  }
}

class SourceCodeElement extends PostElement {
  constructor(firstLine) {
    super();

    // parse first line
    const preTagClosingIndex = firstLine.indexOf(">");

    let firstLineSourceCode = firstLine.substring(preTagClosingIndex + 1);
    this.finish = firstLine.endsWith("</pre>");
    if (this.finish) {
      firstLineSourceCode = firstLineSourceCode.substr(0, firstLineSourceCode.indexOf("</pre>"));
    }

    this.sourceCodes = [decodeHtml(firstLineSourceCode)];
    this.getComponent = this.getComponent.bind(this);
  }

  needNextLine() {
    return !this.finish;
  }

  isFinished() {
    return this.finish;
  }

  addNextLine(line) {
    if (line.endsWith("</pre>")) {
      const preTagIndex = line.lastIndexOf("</pre>");
      this.finish = true;
      this.sourceCodes.push(decodeHtml(line.substring(0, preTagIndex)));
    } else {
      this.sourceCodes.push(decodeHtml(line));
    }
  }

  getHtmlString() {
    const code = this.sourceCodes.join('\n');
    return renderToString (
      <SyntaxHighlighter customStyle={{fontSize: '13px', lineHeight: '16px'}} language='java' useInlineStyles={true} style={dracula} showLineNumbers={true}>{code}</SyntaxHighlighter>
    );
  };
}

export { PostElement, EmbeddedElement, ParagraphElement, CaptionImageElement, SourceCodeElement, ItemsElement, BlockQuoteElement }
