import { Parser, ASTElement, simpleASTElement, Program } from './parser';
import { Lexer } from './lexer';
declare type AstNode = Partial<ASTElement>;
let buffer: string = '';
class GenerateCode {
    constructor(ast: AstNode, data: any) {
        this.node = ast;
        this.data = data;
        switch (ast.type) {
            case "Program":
                this.initProgram(this.node)
                break;
            case "HtmlElement":
                this.visitHTMLElement(this.node)
                break;
            case "DynamicData":
                this.visitDynamicData(this.node)
                break;
            case "Text":
                this.visitText(this.node)
                break;
            default:
                break;
        }
    }
    private node: AstNode;
    private data: any;
    public compile() { return buffer; }
    private initProgram(node: AstNode) {
        buffer = "";
        this.visitChildren(node);
        // buffer += "";
    }
    private visitChildren(node: AstNode) {
        let children = node.children;
        for (let child of children) new GenerateCode(child, this.data);
    }
    private visitHTMLElement(node: AstNode) {
        let shouldRender = this.visitIf(node)
        if (!shouldRender) return;

        this.visitOpenTag(node);
        this.vivitAttributes(node)
        this.visitEvents(node)

        if (node.isSelfClosing)
            return buffer = buffer.concat("/>")

        this.visitIfStatement(node)
        this.visitForStatement(node)

        if (!node.EachOf) {
            buffer = buffer.concat(">");
            this.visitChildren(node)
        }

        buffer = buffer.concat("</" + node.name + ">")
    }
    private visitIf(node: AstNode): boolean {
        if (!node.ifStatement) return true;
        let statement: string;
        if (node.ifStatement.type === "IfStatement") {
            statement = node.ifStatement.val.slice(4, -1);
        }
        else {
            if (this.ifStatementHelper(node.previousElementSibling)) {
                node.ifStatement.val = `if="88 === 88"`;
                return false;
            }
            statement = node.ifStatement.val.slice(9, - 1)
        }
        let locals = "";
        Object.entries(this.data).forEach(assignment => {
            assignment[1] = typeof assignment[1] === "object" ?
                JSON.stringify(assignment[1]) : `\`${assignment[1]}\``;
            locals += "\n let " + assignment[0] + "=" + assignment[1] + "\n";
        })
        return Function(locals + '\n return ' + statement)()
    }

    private ifStatementHelper(node: AstNode) {
        if (!node.ifStatement) return true;
        let statement: string;
        if (node.ifStatement.type === "IfStatement")
            statement = node.ifStatement.val.slice(4, -1);
        else {
            statement = node.ifStatement.val.slice(9, - 1)
        }
        let locals = "";
        Object.entries(this.data).forEach(assignment => {
            assignment[1] = typeof assignment[1] === "object" ?
                JSON.stringify(assignment[1]) : `\`${assignment[1]}\``;
            locals += "\n let " + assignment[0] + "=" + assignment[1] + "\n";
        })
        return Function(locals + '\n return ' + statement)()
    }

    private visitOpenTag(node: AstNode) {
        buffer = buffer.concat("<" + node.name)
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
                buffer = buffer.concat(` ${attrKey}=\"`)

                this.visitDynamicData({
                    type: "DynamicData",
                    val: attrVal,
                    line: node.line,
                    col: node.col
                })

                buffer = buffer.concat("\"")
            } else {
                buffer = buffer.concat(` ${attr}`)
            }
        }
    }
    private visitEvents(node: AstNode) {
        node.events.forEach(ev => {
            buffer = buffer.concat(` ${ev.val}`)
        })
    }
    private visitIfStatement(node: AstNode) {
        if (!node.ifStatement) return;
        if (node.ifStatement) buffer += ` ${node.ifStatement.val}`;
    }
    private visitForStatement(node: AstNode) {
        if (!node.EachOf) return;

        Object.freeze(node)
        buffer += ` ${node.EachOf.val}>`;

        let statement = node.EachOf.val;
        let variable = statement.slice(statement.indexOf(" "), statement.indexOf("of")).trim()
        let arr = statement.slice(statement.lastIndexOf(" "), -1).trim()

        if (this.data[arr] === undefined) this.data[arr] = []

        for (let i = 0; i < this.data[arr].length; i++) {
            let node_ = this.forStatementHelper({ ...node }, variable, arr, i)
            this.visitChildren(node_);
        }
    }

    private forStatementHelper(
        node: AstNode,
        variable: string,
        arr: string,
        index: number
    ): AstNode {
        if (!node.children) return node;
        node.children.forEach(child => {
            if (child.type === "HtmlElement") {
                child = this.forStatementHelper(child, variable, arr, index)
            }
            else if (
                child.type === "DynamicData" ||
                child.type === "DynamicAttribute"
            ) {
                let replacement = child.val;
                replacement = replacement
                    .replace(new RegExp(`{{${variable}.`, "g"), `{{${arr}.${index}.`)
                    .replace(new RegExp(`{{[ ]+${variable}.`, "g"), `{{${arr}.${index}.`)
                    .replace(new RegExp(`{{${arr}.${index - 1}.`, "g"), `{{${arr}.${index}.`)
                    .replace(new RegExp(`{{[ ]+${arr}.${index - 1}.`, "g"), `{{${arr}.${index}.`)
                    .replace(new RegExp(`{{${variable}}}`, "g"), `{{${arr}.${index}}}`)

                child.val = replacement
            }
        })
        return node;
    }
    private visitText(node: AstNode) {
        buffer += node.val;
    }
    private visitDynamicData(node: AstNode) {
        let val = node.val.slice(2, -2).trim();

        let replacement = this.dynamicDataHelper(val, node)
        buffer = buffer.concat(replacement);
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
                        // return replacement = undefined;
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

export function render(input: string, data: any) {
    let tokens = new Lexer(input).tokenize();
    let AST = JSON.parse(JSON.stringify(new Parser(tokens).getAST()));
    let template = new GenerateCode(AST, data).compile();
    let output = template;
    return output
}