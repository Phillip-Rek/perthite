import { Parser, ASTElement } from './parser';
import { Lexer, forEach_Re } from './lexer';
import * as fs from "fs"

let mode = process.env.NODE_ENV || "development";

declare type AstNode = Partial<ASTElement>;

let templateBuffer: string = 'let template = \`\`\n';
let buffer = "";
let globalVars = "";
let status;
class GenerateCode {
    constructor(ast: AstNode, data: any, file: string) {
        this.node = ast;
        this.data = data;
        this.file = file;
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
    private file;
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
            if (!status) {
                globalVars += `let ${identifier} = ${expression};\n`;
                buffer += `let ${identifier} = ${expression};\n`;
            }
            else {
                globalVars += `${identifier} = ${expression};\n`;
                buffer += `${identifier} = ${expression};\n`;
            }
        }
        status = true;
        this.visitChildren(node);
    }
    private visitChildren(node: AstNode) {
        let children = node.children;
        let typ = node.name && node.name === "script" && "Text";

        for (let child of children) {
            child.type = typ ? typ : child.type;
            new GenerateCode(child, this.data, this.file);
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
        let identifier = /\w={{[ ]*[a-z0-9._\[\]]+[ ]*}}/i
        for (const attr of node.attributes) {
            if (attr.search(identifier) > -1) {
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
        let statementForTest = statement.slice(2, -2).trim();
        if (statement.search(/{{[ ]*else if\(/) === 0) {
            let start = statement.indexOf("else if");
            let end = statement.lastIndexOf(")") + 1;
            statement = statement.slice(start, end);
            statementForTest = "if(false){}" + statement;
        }
        else if (statement.search(/{{[ ]*else[ ]*}}/) === 0) {
            statement = statement.slice(2, -2).trim();
            statementForTest = "if(false){}" + statement;
        }
        else {
            let start = statement.indexOf("if");
            let end = statement.lastIndexOf(")") + 1;
            statement = statement.slice(start, end);
            statementForTest = statement;
        }
        //we know that node.locals contains identifiers
        //of all declared variables so we redeclare them
        //to to able to handle errors
        let locals = '';
        for (const local of node.locals) {
            if (globalVars.search(new RegExp(`let ${local}`)) === -1) {
                locals += local + ";\n"
            }
        }
        if (mode === "development") {
            statementForTest = globalVars + locals + statementForTest;
            try {
                new Function(statementForTest + "{}")()
            } catch (e) {
                console.error(
                    e + " at line " +
                    node.ifStatement.line + ", col " +
                    node.ifStatement.col + " " +
                    ", file " + this.file +
                    ", src: " + node.ifStatement.val
                )
            }
        }

        buffer += statement + "{\n";
        //remove ifStatement to avoid recursion
        node.ifStatement = null;
        this.visitHTMLElement(node);
        buffer += "}\n";

        return true;
    }
    private visitForStatement2(node: AstNode) {
        if (!node.ForStatement) return;
        //end an open-tag-start
        buffer += `template +=\`>\`\n`;
        let statement = node.ForStatement.val;
        let statementForTest;
        if (statement.search(forEach_Re) > -1) {
            statement = statement.slice(2, -2).trim();
            statement = statement.slice(0, statement.lastIndexOf("=>"))
            buffer += statement + "=>{\n";
            this.visitChildren(node);
            buffer += "\n})\n";
            statementForTest = globalVars + "\n" + statement + "=>{})";

        }
        else {
            statement = statement.slice(2, -2).trim();
            buffer += statement + "{\n"
            this.visitChildren(node);
            buffer += "}\n"
            statementForTest = globalVars + "\n" + statement + "{}";
        }

        if (mode === "development") {
            try {
                new Function(statementForTest)()
            } catch (e) {
                console.error(
                    e + " at line " +
                    node.ForStatement.line + " col " +
                    node.ForStatement.col + " " +
                    node.ForStatement.val
                )
            }
        }

    }

    private visitText(node: AstNode) {
        buffer += "template += \`" + node.val + "\`;\n";
    }
    private visitDynamicData(node: AstNode) {
        let val = node.val.slice(2, -2).trim();

        //get a variable from expression like users[0]
        //let variable = this.extractLocalVariable(val)

        //check if a variable was declared
        // if (buffer.search("let " + variable) === -1) {
        //     this.refErr(node)
        // }

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

export function render(tmplateSrsCode: string, file: string, data: {}) {
    // if (!tmplateSrsCode) {
    //     tmplateSrsCode = fs.readFileSync(file, "utf8").toString()
    // }
    let tokens = new Lexer(tmplateSrsCode).tokenize();
    let AST = JSON.parse(JSON.stringify(new Parser(tokens).getAST()));
    let template = new GenerateCode(AST, data, file).compile();

    //    fs.writeFileSync(__dirname + '/template.js', template, "utf8")
    let output;
    if (mode === "development") {
        let output = new Function(template + "return template;\n")();
        return output;
    }
    else {
        try {
            output = new Function(template + "return template;\n")();
            return output
        }
        catch (e) {
            console.error("failed to compile: " + e);
            return output
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
        if (err) return callback(err)
        let res = render(content.toString(), filePath, options);
        return callback(null, res);
    })
}

