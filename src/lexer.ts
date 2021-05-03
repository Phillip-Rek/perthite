export declare type Pos = {
  col: number;
  row: number;
  file?: string;
};
export declare type Token = {
  type: string;
  val: string;
  pos: Pos;
};
const commentStart_Re = "<!--";
const compOp_Re = /[<>]/;
const ifStatement_Re = /{{[ ]*if\([ \w.$\[\]"'=<>+\-,&\(\)\|]+\)[ ]*}}/;
const elseIfStatement_Re = /{{[ ]*else if\([ \w.$\[\]"'=<>+\-,'"&\(\)\|]+\)[ ]*}}/;
const elseStatement_Re = /{{[ ]*else[ ]*}}/;
const forStatement_Re = /{{[ ]*for\([ a-zA-Z0-9_\w.$\[\]=<>\-+,]+\)[ ]*}}/;
const forEach_Re = /{{[ ]*[a-zA-Z0-9.\[\]_]+[.]forEach\(\([ a-zA-Z0-9,._]+\)=>\)[ ]*}}/;
const on_Re = /\*on[a-z]+="[ a-z0-9_\(\).,]+"/i;
const text_Re = /[ \w"'=\(\)\n\t!&^%$#@{}\-:_+\\/,.?\[\]>]+/i;
const openTagStart_Re = /<[-_;:&%$#@+=*\w]+/i;
const attribute_Re = /[-_:&$#@*\w]+=["|'][ '\w\-_.:&$;#@=,\?\(\)\{\}\*\/\[\]\+]*['|"]/i;
const dynamicAttr_Re = /[-_:*a-z0-9]+={{[ a-z0-9._\[\]]+}}/i;
const css_Re = /style=["'][a-z\-\;0-9\: ]+['"]/i;
const link_Re = /href=["'][a-z\-\;0-9\://. ]+['"]/i;
const dynamicData_Re = /{{[ ]*[a-z0-9_.$\[\]\(\)\+"'\-_, ]+[ ]*}}/i;
const closeTag_Re = /<\/[-_;:&%$#@+=*\w]+>/i;
const setDocType_Re = `<!DOCTYPE html>`;
const selfClosingTag_Re = /^(<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr|<command|<keygen|<menuitem)/;
const scriptTag_Re = "<script";

export class Lexer {
  private pos: Pos = { col: 1, row: 1 };
  private cursor: number;
  private tokens: Array<Token> = [];
  private currentStatus: string = "innerHTML";
  constructor(private input: string, private file: string) {
    this.cursor = 0;
    for (; ;) {
      if (this.scriptTag) {
        /*Find end of JavaScript code */
        let jsCodeEnd = this.input.indexOf("</script>");
        let jsCode = this.input.slice(0, jsCodeEnd + 9);
        /*update the position, by counting line-ends and columns */
        this.pos.row += jsCode.split("\n").length - 1;
        this.pos.col = 0;

        this.tokens.push({
          type: "JsCode",
          val: jsCode.split("`").join("\`"),
          pos: { ...this.pos },
        });
        this.consume(jsCode);
      }
      else if (this.selfClosingTag) {
        this.tokens.push({
          type: "SelfClosingTag",
          val: this.selfClosingTag,
          pos: { ...this.pos },
        });
        this.consume(this.selfClosingTag);
        this.currentStatus = "attributes";
      } else if (this.openTagStart) {
        this.tokens.push({
          type: "OpenTagStart",
          val: this.openTagStart,
          pos: { ...this.pos },
        });
        this.consume(this.openTagStart);
        this.currentStatus = "attributes";
      } else if (this.dynamicAttr) {
        this.tokens.push({
          type: "DynamicAttribute",
          val: this.dynamicAttr,
          pos: { ...this.pos },
        });
        this.consume(this.dynamicAttr);
      } else if (this.css) {
        this.tokens.push({
          type: "CSS",
          val: this.css,
          pos: { ...this.pos },
        });
        this.consume(this.css);
      } else if (this.link) {
        this.tokens.push({
          type: "Attribute",
          val: this.link,
          pos: { ...this.pos },
        });
        this.consume(this.link);
      } else if (this.elseIfStatement) {
        let type = this.currentStatus === "attributes" ?
          "ElseIfStatement" : "DynamicData";
        this.tokens.push({
          type,
          val: this.elseIfStatement,
          pos: { ...this.pos },
        });
        this.consume(this.elseIfStatement);
      } else if (this.elseStatement) {
        let type = this.currentStatus === "attributes" ?
          "ElseStatement" : "DynamicData";
        this.tokens.push({
          type: type,
          val: this.elseStatement,
          pos: { ...this.pos },
        });
        this.consume(this.elseStatement);
      }
      else if (this.ifStatement) {
        let type = this.currentStatus === "attributes" ?
          "IfStatement" : "DynamicData";
        this.tokens.push({
          type: type,
          val: this.ifStatement,
          pos: { ...this.pos },
        });
        this.consume(this.ifStatement);
      }
      else if (this.forStatement2) {
        this.tokens.push({
          type: "ForStatement",
          val: this.forStatement2,
          pos: { ...this.pos },
        });
        this.consume(this.forStatement2);
      } else if (this.forStatement) {
        this.tokens.push({
          type: "ForStatement",
          val: this.forStatement,
          pos: { ...this.pos },
        });
        this.consume(this.forStatement);
      } else if (this.forEach) {
        this.tokens.push({
          type: "ForStatement",
          val: this.forEach,
          pos: { ...this.pos },
        });
        this.consume(this.forEach);
      } else if (this.on) {
        this.tokens.push({
          type: "Event",
          val: this.on,
          pos: { ...this.pos },
        });
        this.consume(this.on);
      } else if (this.attribute) {
        this.tokens.push({
          type: "Attribute",
          val: this.attribute,
          pos: { ...this.pos },
        });
        this.consume(this.attribute);
      } else if (this.openTagEnd) {
        this.tokens.push({
          type: "OpenTagEnd",
          val: this.openTagEnd,
          pos: { ...this.pos },
        });
        this.consume(this.openTagEnd);
        this.currentStatus = "innerHTML";
      } else if (this.whiteSpace) {
        this.tokens.push({
          type: "Text",
          val: " ",
          pos: { ...this.pos },
        });

        this.consume(this.whiteSpace);
      }
      else if (this.input[0] === "\n") {
        this.tokens.push({
          type: "Text",
          val: `\n`,
          pos: { ...this.pos },
        });
        this.newLIne();
        this.consume("\n");
      }
      else if (this.dynamicData) {
        this.tokens.push({
          type: "DynamicData",
          val: this.dynamicData,
          pos: { ...this.pos },
        });

        this.consume(this.dynamicData);
      }
      else if (this.closeTag) {
        this.tokens.push({
          type: "CloseTag",
          val: this.closeTag,
          pos: { ...this.pos },
        });
        this.consume(this.closeTag);
      }
      else if (this.commentStart) {
        let commentEnd = this.input.indexOf("-->") + 3;
        let fullComment = this.input.substring(0, commentEnd);
        this.tokens.push({
          type: "Comment",
          val: fullComment,
          pos: { ...this.pos },
        });
        this.consume(fullComment);
      }
      else if (this.text) {
        let type = (this.currentStatus === "innerHTML" ? "InnerHTML" : "Attribute");
        if (type === "Attribute" && this.text.search(attribute_Re) === -1) {
          let error = new Error("");
          error.name = "Attribute Error";
          error.message = "Attribute was not assigned to a value. " +
            "An attribute need to be assigned to a value " +
            "like this attributeName='attributeValue' " +
            ", at line " + this.pos.row + " column " + this.pos.col +
            ", " + this.text + "...";
          throw error;
        }
        /*If the is a line end we stop lexing Text*/
        let text = this.text;
        if (this.text.search(`\n`) > -1) {
          text = this.text.substring(0, this.text.search(`\n`));
        }
        this.tokens.push({
          type: type,
          val: text,
          pos: { ...this.pos },
        });
        this.consume(text);
      }
      else if (this.setDocType) {
        this.tokens.push({
          type: "DocType",
          val: this.setDocType,
          pos: { ...this.pos },
        });
        this.consume(this.setDocType);
      } else if (this.comparisonOp) {
        this.tokens.push({
          type: "Text",
          val: this.comparisonOp,
          pos: { ...this.pos },
        });
        this.consume(this.comparisonOp);
      } else if (this.eof) {
        this.tokens.push({
          type: "eof",
          val: "eof",
          pos: { ...this.pos },
        });
        break;
      } else {
        this.next();
      }
    }
  }

  private next() {
    this.pos.col++;
    this.cursor++;
    this.input = this.input.substring(1);
  }

  private consume(lexeme: string) {
    this.pos.col += lexeme.length;
    this.input = this.input.substring(lexeme.length);
  }

  private newLIne() {
    this.pos.row++;
    this.pos.col = -1;
  }

  private get eof() {
    return this.input[this.cursor] === undefined;
  }

  private get openTagStart() {
    if (this.doesNotContain(openTagStart_Re)) return false;
    let opTag = this.input.match(openTagStart_Re)[0];
    return this.input.indexOf(opTag) === 0 && opTag;
  }

  private get setDocType(): string | false {
    if (this.doesNotContain(setDocType_Re)) return false;
    let docType = this.input.match(setDocType_Re)[0];
    return this.input.indexOf(docType) === 0 && docType;
  }

  private get attribute() {
    if (this.doesNotContain(attribute_Re)) return false;
    let attr = this.input.match(attribute_Re)[0];
    return this.input.indexOf(attr) === 0 && attr;
  }

  private get css(): string | false {
    if (this.doesNotContain(css_Re)) return false;
    let style = this.input.match(css_Re)[0];
    return this.input.indexOf(style) === 0 && style;
  }

  private get link(): string | false {
    if (this.doesNotContain(link_Re)) return false;
    let link = this.input.match(link_Re)[0];
    return this.input.indexOf(link) === 0 && link;
  }

  private get dynamicAttr(): string | false {
    if (this.doesNotContain(dynamicAttr_Re)) return false;
    let attr = this.input.match(dynamicAttr_Re)[0];
    return this.input.indexOf(attr) === 0 && attr;
  }

  private get openTagEnd(): string | false {

    if (
      this.doesNotContain(/>/) ||
      this.currentStatus === "innerHTML"
    ) {
      return false;
    }
    else {
      let tagENd = this.input.match(/>/)[0];
      return this.input.indexOf(tagENd) === 0 && tagENd;
    }
  }

  public get selfClosingTag(): string | false {
    if (this.doesNotContain(selfClosingTag_Re)) return false;
    let tagENd = this.input.match(selfClosingTag_Re)[0];
    return this.input.indexOf(tagENd) === 0 && tagENd;
  }

  private get dynamicData(): string | false {
    if (this.doesNotContain(dynamicData_Re)) return false;
    let identifier = this.input.match(dynamicData_Re)[0];
    return this.input.indexOf(identifier) === 0 && identifier;
  }

  private get comparisonOp(): string | false {
    if (this.doesNotContain(compOp_Re)) return false;
    let identifier = this.input.match(compOp_Re)[0];
    return this.input.indexOf(identifier) === 0 && identifier;
  }

  private get closeTag(): string | false {
    if (this.doesNotContain(closeTag_Re)) return false;
    let closeTag = this.input.match(closeTag_Re)[0];
    return this.input.indexOf(closeTag) === 0 && closeTag;
  }

  private get text(): string | false {
    if (this.doesNotContain(text_Re)) return false;
    let text = this.input.match(text_Re)[0];
    if (text.search(dynamicData_Re) > -1) {
      let dynamicDataStartPoint = text.search(dynamicData_Re);
      text = text.substring(0, dynamicDataStartPoint);
    }
    return this.input.indexOf(text) === 0 && text;
  }

  private get whiteSpace() {
    if (this.doesNotContain(/[ \t]+/)) return false;
    let whiteSpace = this.input.match(/[ \t]+/)[0];
    return this.input.indexOf(whiteSpace) === 0 && whiteSpace;
  }

  private get ifStatement(): string | false {
    if (this.doesNotContain(ifStatement_Re)) return false;
    let res = this.input.match(ifStatement_Re)[0];
    return this.input.indexOf(res) === 0 && res;
  }

  private get elseIfStatement(): string | false {
    if (!this.doesNotContain(elseIfStatement_Re)) {
      let res = this.input.match(elseIfStatement_Re)[0];
      return this.input.indexOf(res) === 0 && res;
    }
    return false;
  }
  private get elseStatement(): string | false {
    if (!this.doesNotContain(elseStatement_Re)) {
      let res = this.input.match(elseStatement_Re)[0];
      return this.input.indexOf(res) === 0 && res;
    }
    if (this.input.search(elseStatement_Re) !== -1) {
      let res = this.input.match(elseStatement_Re)[0];
      return this.input.indexOf(res) === 0 && res;
    }
    return false;
  }
  private get forStatement(): string | false {
    if (this.doesNotContain(forStatement_Re)) return false;
    let forStatement = this.input.match(forStatement_Re)[0];
    return this.input.indexOf(forStatement) === 0 && forStatement;
  }
  private get forEach() {
    if (this.doesNotContain(forEach_Re)) return false;
    let foreach = this.input.match(forEach_Re)[0];
    return this.input.indexOf(foreach) === 0 && foreach;
  }
  private get on() {
    if (this.doesNotContain(on_Re)) return false;
    let on = this.input.match(on_Re)[0];
    return this.input.indexOf(on) === 0 && on;
  }
  public tokenize() {
    return this.tokens;
  }
  private doesNotContain(arg: RegExp | string) {
    return this.input.search(arg) === -1;
  }

  /*NEW METHOD */

  private get scriptTag(): string | false {
    if (this.doesNotContain(scriptTag_Re)) return false;
    let scriptTag = this.input.match(scriptTag_Re)[0];
    return this.input.indexOf(scriptTag) === 0 && scriptTag;
  }
}


