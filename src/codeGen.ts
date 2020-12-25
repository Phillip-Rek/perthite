import { Parser, ASTElement, simpleASTElement, Program } from './parser';
import { Lexer } from './lexer';
let fs = require('fs');

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
            expression = typeof expression === "object" ?
                JSON.stringify(expression) : `\`${expression}\``;
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

        if (!node.EachOf) {
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
        if (!node.ifStatement) return false;
        if (node.ifStatement.val.startsWith("{{"))
            return this.visitIfStatement2(node);
        if (node.ifStatement.val.startsWith("if=")) {
            let statement = node.ifStatement.val;
            statement = statement.slice(4, -1);
            buffer += "if(" + statement + "){\n"
            node.ifStatement = null;
            this.visitHTMLElement(node);
            buffer += "}\n"
        }
        else if (node.ifStatement.val.startsWith("else-if=")) {
            let statement = node.ifStatement.val;
            statement = statement.slice(9, -1);
            buffer += "else if(" + statement + "){\n"
            node.ifStatement = null;
            this.visitHTMLElement(node);
            buffer += "}\n"
        }
        else if (node.ifStatement.val = "else") {
            buffer += "else{\n";
            node.ifStatement = null;
            this.visitHTMLElement(node);
            buffer += "}\n"
        }
        return true;
    }
    private visitIfStatement2(node: AstNode) {
        let statement = node.ifStatement.val;
        statement = statement.slice(3, -3);
        buffer += statement + "{\n";
        node.ifStatement = null;
        this.visitHTMLElement(node);
        buffer += "}\n"
        return true;
    }
    private visitForStatement2(node: AstNode) {
        if (!node.EachOf) return;
        //exclude other syntax
        if (!node.EachOf.val.startsWith("{{"))
            return this.visitForStatement(node);

        buffer += `template +=\`>\`\n`;
        let statement = node.EachOf.val.slice(2, -2).trim();
        let variable = statement.slice(statement.indexOf(" "), statement.indexOf("of")).trim()
        let arr = statement.slice(statement.indexOf(" of ") + 4, -1).trim()

        node = this.visitForVariable2(node, variable, arr);

        buffer += statement + "{"
        this.visitChildren(node);
        buffer += "}\n"
        if (this.data[arr] === undefined) this.data[arr] = []
    }
    private visitForVariable2(node: AstNode, variable: string, arr: string) {
        node.children.forEach(child => {
            if (child.type === "HtmlElement") {
                this.visitForVariable(child, variable, arr)
            }
            else if (child.type === "DynamicData") {
                child.type = "ParsedText";
                child.val = child.val.slice(2, -2)
            }
        })
        return node;
    }
    private visitForStatement(node: AstNode) {
        if (!node.EachOf) return;

        buffer += `template +=\`>\`\n`;

        let statement = node.EachOf.val;
        let variable = statement.slice(statement.indexOf(" "), statement.indexOf("of")).trim()
        let arr = statement.slice(statement.indexOf(" of ") + 4, -1).trim()

        node = this.visitForVariable(node, variable, arr);
        let forStatement = `for(let i=0;i<${arr}.length;i++){`
        buffer += forStatement + "\n";
        buffer += "let " + variable + " = " + arr + "[i];\n"
        this.visitChildren(node);
        buffer += `}\n`;
        if (this.data[arr] === undefined) this.data[arr] = []
    }
    private visitForVariable(node: AstNode, variable: string, arr: any) {
        node.children.forEach(child => {
            if (child.type === "HtmlElement") {
                this.visitForVariable(child, variable, arr)
            }
            else if (child.type === "DynamicData") {
                if (child.val.search(`{{${arr}`) !== 0) {
                    child.type = "ParsedText";
                    child.val = child.val.slice(2, -2)
                }
            }
        })
        return node;
    }

    private visitText(node: AstNode) {
        buffer += "template += \`" + node.val + "\`;\n";
    }
    private visitDynamicData(node: AstNode) {
        let val = node.val.slice(2, -2).trim();

        let replacement = this.dynamicDataHelper(val, node)
        buffer = buffer.concat("template += \`" + replacement + "\`;\n");
    }
    private dynamicDataHelper(identifier: string, node: AstNode) {
        let property: string = "";
        let replacement = this.data;
        for (let i = 0; i <= identifier.length; i++) {
            const char = identifier[i];
            switch (char) {
                case ".":
                case "[":
                case "]":
                case undefined:
                    if (replacement === undefined) {
                        this.refErr(node)
                    }
                    replacement = property ? replacement[property] : replacement;
                    property = property ? "" : property;
                    break;
                default:
                    property += char;
                    break;
            }
        }
        return typeof replacement === "object" ?
            JSON.stringify(replacement) : replacement;
    }

    private refErr(node: AstNode) {
        let msg = node.val +
            " is undefined at line : " +
            node.line + " col " +
            node.col;
        throw new ReferenceError(msg);
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
    //console.log(template)
    let output = new Function(template + "return template;\n")();
    return output;
}