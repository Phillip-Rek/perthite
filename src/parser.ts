import { Token } from "./lexer";

/* Still needs modifications */

export declare type astNode = {
  type: string,
  value: string,
  line: number,
  column: number
}

export interface astTagNode extends astNode {
  name: string,
  children: Array<astNode | astTagNode>,
  attributes: string[],
  forStatement: string,
  ifStatement: string
}

export class Parser {
  ast: (astTagNode & astNode) = {
    type: "Program",
    value: "Program",
    name: "Program",
    forStatement: null,
    ifStatement: null,
    attributes: [],
    children: [],
    line: null,
    column: null,
  }
  private unclosedTagsStack: astTagNode[] = [this.ast];
  private currentTag: astTagNode = this.unclosedTagsStack[
    this.unclosedTagsStack.length - 1
  ];
  currentCursorState = null;
  constructor(private tokens: Token[], private options: {}) {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      //@ ts-ignore
      if (this[`parse${token.type}`]) {
        if (token.type === "SelfClosingTag") {
          i = this[`parse${token.type}`](token, i, tokens);
        } else
          this[`parse${token.type}`](token);
      }
    }
    // console.log(JSON.stringify(this.ast))
    // console.log(this.ast.children)
  }

  parseOpenTagStart(token: Token) {
    let tag: astTagNode = {
      type: "Tag",
      value: null,
      name: token.val.substring(1),
      attributes: [],
      children: [],
      forStatement: null,
      ifStatement: null,
      line: token.pos.row,
      column: token.pos.col,
    }
    this.currentTag.children.push(tag);
    this.unclosedTagsStack.push(tag);
    this.currentTag = tag;
  }

  parseOpenTagEnd(token: Token) {
    this.currentCursorState = "parsingInnerHtml";
  }

  parseIfStatement(token: Token) {
    this.currentTag.ifStatement = token.val;
  }
  parseForStatement(token: Token) {
    this.currentTag.forStatement = token.val;
  }

  parseAttribute(token: Token) {
    this.currentTag.attributes.push(token.val)
  }

  parseInnerHTML(token: Token) {
    this.currentTag.children.push({
      type: "InnerHTML",
      value: token.val,
      line: token.pos.row,
      column: token.pos.col
    })
  }

  parseDynamicData(token: Token) {
    this.currentTag.children.push({
      type: "DynamicData",
      value: token.val,
      line: token.pos.row,
      column: token.pos.col
    })
  }


  parseJsCode(token: Token) {
    this.currentTag.children.push({
      type: "JsCode",
      value: token.val,
      line: token.pos.row,
      column: token.pos.col
    })
  }

  parseDocType(token: Token) {
    this.currentTag.children.push({
      type: "DocType",
      value: token.val,
      line: token.pos.row,
      column: token.pos.col
    })
  }

  parseSelfClosingTag(token: Token, start: number, tokens: Token[]) {
    let tag = {
      type: "SelfClosingTag",
      value: null,
      name: token.val.substring(1),
      line: token.pos.row,
      column: token.pos.col,
      attributes: [],
      children: [],
      forStatement: null,
      ifStatement: null
    }
    this.currentTag.children.push(tag);
    let end = null;
    for (let i = start; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === "OpenTagEnd")
        break;
      else if (token.type === "Attribute")
        tag.attributes.push(token.val)
      end = i
    }

    return end;
  }

  parseText(token: Token) {
    this.currentTag.children.push({
      type: "Text",
      value: token.val,
      line: token.pos.row,
      column: token.pos.col
    })
  }

  parseCloseTag(token: Token) {
    if (`</${this.currentTag.name}>` === token.val) {
      this.unclosedTagsStack.pop();
      this.currentTag = this.unclosedTagsStack[this.unclosedTagsStack.length - 1]
    } else {
      let error = new Error();
      error.name = "Unexpected CloseTag";
      error.message = token.val +
        " Does not have a corresponding" +
        " OpenTag " + ", At line " + token.pos.row + " column" +
        " " + token.pos.col;

      throw error;
    }
  }
}
