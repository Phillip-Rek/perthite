import { Parser, ASTElement } from './parser';
import { Lexer } from './lexer';
import * as fs from "fs"

declare type AstNode = Partial<ASTElement>;

let templateBuffer: string = 'let template = \`\`\n';
let buffer = "";

class GenerateCode {
    constructor(ast: AstNode, data: any) {
        this.node = ast;
        this.data = data;
        switch (ast.type) {
            case "Program":
                this.initProgram(this.node);
                break;
            case "HtmlElement":
                this.visitHTMLElement(this.node);
                break;
            case "DynamicData":
                this.visitDynamicData(this.node);
                break;
            case "Text":
                this.visitText(this.node);
                break;
            default:
                buffer += "template +=" + this.node.val + ";\n";
                break;
        }
    }
    private node: AstNode;
    private data: any;
    public compile() { return buffer; }
    private initProgram(node: AstNode) {
        buffer = templateBuffer;
        //declare local variables
        let data = Object.entries(this.data);
        for (const item of data) {
            const identifier = item[0];
            let expression = item[1];
            switch (typeof expression) {
                case "object":
                    expression = JSON.stringify(expression);
                    break;
                case "number":
                case "boolean":
                case "function":
                    expression = expression;
                    break;
                default:
                    expression = `\`${expression}\``;
                    break;
            }
            buffer += `let ${identifier} = ${expression};\n`
        }
        this.visitChildren(node);
    }
    private visitChildren(node: AstNode) {
        let children = node.children;
        let typ = node.name && node.name === "script" && "Text";

        for (let child of children) {
            child.type = typ ? typ : child.type;
            new GenerateCode(child, this.data);
        }
    }
    private blockStatementsStack = 0;
    private visitHTMLElement(node: AstNode) {
        let ifStatement = this.visitIfStatement(node);
        if (ifStatement) return;
        this.visitOpenTag(node);
        this.vivitAttributes(node);
        this.visitEvents(node);

        if (node.isSelfClosing)
            return buffer = buffer.concat("template += \"/>\";\n")

        //this.visitForStatement(node)
        this.visitForStatement2(node)

        //if an element has a forStatement, then a forStatement
        //will render it
        if (!node.ForStatement) {
            buffer = buffer.concat("template += \">\";\n");
            this.visitChildren(node)
        }

        buffer = buffer.concat("template += \`</" + node.name + ">\`;\n")
    }
    private visitOpenTag(node: AstNode) {
        buffer = buffer.concat("template += \`<" + node.name + "\`;\n")
    }
    private vivitAttributes(node: AstNode) {
        let identifier = /\w={{[a-z0-9._\[\]]+}}/i
        let identifier2 = /\w={{ [a-z0-9._\[\]]+ }}/i
        for (const attr of node.attributes) {
            if (
                attr.search(identifier) > -1 ||
                attr.search(identifier2) > -1
            ) {
                const attrVal = attr.substring(attr.indexOf("=") + 1).trim()
                const attrKey = attr.substring(0, attr.indexOf("="))
                buffer = buffer.concat(`template += \` ${attrKey}=\\"\`;\n`)

                this.visitDynamicData({
                    type: "DynamicData",
                    val: attrVal,
                    line: node.line,
                    col: node.col
                })

                buffer = buffer.concat("template += '\"';\n")
            } else {
                buffer = buffer.concat(`template += \` ${attr}\`;\n`)
            }
        }
    }
    private visitEvents(node: AstNode) {
        node.events.forEach(ev => {
            // buffer = buffer.concat(` ${ev.val}`)
        })
    }
    private visitIfStatement(node: AstNode) {
        if (!node.ifStatement) return;
        let statement = node.ifStatement.val;
        if (statement.indexOf("else if(") > -1) {
            statement = statement.slice(statement.indexOf("else if"), statement.lastIndexOf(")") + 1);
        }
        else if (statement.indexOf("else") > -1) {
            statement = statement.slice(2, -2).trim();
        }
        else {
            statement = statement.slice(statement.indexOf("if"), statement.lastIndexOf(")") + 1);
        }
        buffer += statement + "{\n";
        node.ifStatement = null;
        this.visitHTMLElement(node);
        buffer += "}\n";
        return true;
    }
    private visitForStatement2(node: AstNode) {
        if (!node.ForStatement) return;
        //end an open-tag-start
        buffer += `template +=\`>\`\n`;
        let statement = node.ForStatement.val.slice(2, -2).trim();
        buffer += statement + "{\n"
        this.visitChildren(node);
        buffer += "}\n"
    }

    private visitText(node: AstNode) {
        buffer += "template += \`" + node.val + "\`;\n";
    }
    private visitDynamicData(node: AstNode) {
        let val = node.val.slice(2, -2).trim();

        //get a variable from expression like users[0]
        let variable = this.extractLocalVariable(val)
        //check if a variable was declared
        if (buffer.search("let " + variable) === -1) {
            this.refErr(node)
        }

        buffer = buffer.concat("template += " + val + ";\n");
    }

    private refErr(node: AstNode) {
        let msg = node.val +
            " is not defined at line : " +
            node.line + " col: " +
            node.col;
        throw new ReferenceError(msg);
    }
    private extractLocalVariable = (expression: string) => {

        let variable = "";
        for (let i = 0; i < expression.length; i++) {
            let char = expression[i];
            if (char === "." || char === "[" || char === "(") break;
            variable += char;
        }
        return variable;
    }
}

export function render(input: { srcFile?: string; template?: string; }, data: {}) {
    let tmplt = input.template;
    if (input.srcFile) {
        tmplt = fs.readFileSync(input.srcFile, "utf8").toString()
    }
    let tokens = new Lexer(tmplt).tokenize();
    let AST = JSON.parse(JSON.stringify(new Parser(tokens).getAST()));
    let template = new GenerateCode(AST, data).compile();
    let output = new Function(template + "return template;\n")();
    return output;
}