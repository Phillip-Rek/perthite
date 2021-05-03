import { Parser, astTagNode, astNode } from "./parser";
import { Lexer } from "./lexer";
import * as fs from "fs";

let mode = process.env.NODE_ENV || "development";


let templateBuffer: string = "let template = ``\n";
let buffer = `let template="";\n`;
let globalVars = "";
let status;
let serverRunsForTheFirstTime = true;
export class GenerateCode {
  //initialize a program
  constructor(private ast: astTagNode | astNode, private options: {}, srcFile: string) {
    switch (this.ast.type) {
      case "Program":
        this.init(this.ast);
    }
  }

  private init(ast: astTagNode | astNode) {
    buffer += `\n/*START-OF-BLOBAL-VARIALE-DECLARATION-55522555*/\n`;
    for (const key in this.options) {
      if (this.options.hasOwnProperty(key)) {
        let value = this.options[key];
        switch (typeof value) {
          case "object":
            value = JSON.stringify(value);
            break;
          case "number":
          case "boolean":
          case "function":
            value = value;
            break;
          default:
            value = `\`${value}\``;
            break;
        }
        if (serverRunsForTheFirstTime) {
          buffer += `let ${key} = ${value};\n`;
          serverRunsForTheFirstTime = false;
        }
        else
          buffer += `${key} = ${value};\n`;
      }
    }

    /*mark the end of global variables declarations*/
    buffer += `\n/*END-OF-BLOBAL-VARIALE-DECLARATION-55522555*/\n`

    this.visitChildren(ast);
  }

  private visitChildren(node: Partial<astTagNode>) {
    let children = node.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      switch (child.type) {
        case "Tag":
          this.visitTag(child);
          break;
        case "SelfClosingTag":
          this.visitSelfClosingTag(child);
          break;
        case "Text":
          this.visitText(child);
          break;
        case "JsCode":
          this.visitJsCode(child);
          break;
        case "InnerHTML":
          this.visitInnerHTML(child);
          break;
        case "DynamicData":
          this.visitDynamicData(child);
          break;
        case "DocType":
          this.visitDocType(child);
          break;
        default:
          throw new Error("Unknown token type, " + child.type);
      }
    }
  }
  public get byteCode() { return buffer; }

  private visitTag(node: Partial<astTagNode>) {
    if (node.ifStatement) {
      this.visitIfStatement(node.ifStatement);
      buffer += `template += "<${node.name}";\n`;
      this.visitAttributes(node);
      buffer += `template += ">";\n`;

      /*
          if its selfclosing tag then, 
          we stop here since it does not have 
          children of forstatement 
      */
      if (node.type === "SelfClosingTag") return;

      if (node.forStatement) {
        this.visitForStatement(node);
      } else {
        this.visitChildren(node);
      }
      buffer += `template += "</${node.name}>";\n`;
      buffer += "}\n"
    } else {
      buffer += `template += "<${node.name}";\n`;
      this.visitAttributes(node);
      buffer += `template += ">";\n`;

      /*
          if its selfclosing tag then, 
          we stop here since it does not have 
          children of forstatement 
      */

      if (node.type === "SelfClosingTag") return;

      if (node.forStatement) {
        this.visitForStatement(node);
      } else {
        this.visitChildren(node);
      }
      buffer += `template += "</${node.name}>";\n`;
    }
  }

  private visitDocType(node: astNode) {
    buffer += `template += "${node.value}";\n`;
  }
  private visitForStatement(node: Partial<astTagNode>) {
    let forStatementExpression = node.forStatement.slice(2, -2).trim();

    buffer += `${forStatementExpression}{\n`;
    this.visitChildren(node);
    buffer += `}\n`;
  }
  private visitIfStatement(ifStatement: string) {
    let expression = ifStatement.substring(2, ifStatement.length - 2).trim();
    buffer += expression + `{\n`;
  }

  private visitSelfClosingTag(node: Partial<astTagNode>) {
    this.visitTag(node);
  }

  private visitAttributes(node: Partial<astTagNode>) {
    let attributes = node.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      buffer += `template += \` ${attr}\`;\n`;
    }
  }

  private visitText(node: astNode) {
    buffer += `template += \`${node.value}\`;\n`;
  }

  private visitJsCode(node: astNode) {
    buffer += `template += \`${node.value}\`;\n`;
  }

  private visitInnerHTML(node: astNode) {
    buffer += `template += \`${node.value}\`;\n`;
  }

  private visitDynamicData(node: astNode) {
    let val = node.value.slice(2, -2)
    buffer += `template += ${val};\n`;
  }
}

export function render(tmplateSrsCode: string, file: string, data: {}) {
  // if (!tmplateSrsCode) {
  //     tmplateSrsCode = fs.readFileSync(file, "utf8").toString()
  // }
  let tokens = new Lexer(tmplateSrsCode, "index.html").tokenize();
  let AST = JSON.parse(JSON.stringify(new Parser(tokens, data).ast));
  let template = new GenerateCode(AST, data, file).byteCode;

  //    fs.writeFileSync(__dirname + '/template.js', template, "utf8")
  let output;
  if (mode === "development") {
    let output = new Function(template + "return template;\n")();
    return output;
  } else {
    try {
      output = new Function(template + "return template;\n")();
      return output;
    } catch (e) {
      console.error("failed to compile: " + e);
      return output;
      //return "<h1 style='color: red'>failed to compile</h1>"
    }
  }
}

export function engine(
  filePath: string,
  options: {},
  callback: (arg: any, arg2?: any) => string
) {
  fs.readFile(filePath, (err, content) => {
    if (err) return callback(err);
    let res = render(content.toString(), filePath, options);
    return callback(null, res);
  });
}
