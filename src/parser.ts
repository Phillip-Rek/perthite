import { Token } from './lexer';

export declare type ASTElement = {
    type: string;
    name?: string;
    val?: string;
    replacement?: any;
    parent?: Partial<ASTElement>;
    closeTag?: Partial<ASTElement>
    events?: Array<Partial<ASTElement>>;
    ForStatement?: Partial<ASTElement>;
    rendered?: Boolean;
    currentStatus?: string;
    ifStatement?: simpleASTElement;
    attributes?: Array<string>;
    children?: Array<Partial<ASTElement>>;
    nextSibling?: Partial<ASTElement>;
    nextElementSibling?: Partial<ASTElement>;
    previousElementSibling?: Partial<ASTElement>;
    line: number;
    col: number;
    isSelfClosing?: boolean;
    block: {
        type: string,
        nodes: Array<Partial<ASTElement>>
    };
}
export declare type Program = Pick<ASTElement, "type" | "children">;
export declare type simpleASTElement = Required<Pick<ASTElement, "type" | "val" | "line" | "col">>;
export declare type tagAST = Pick<ASTElement, "type" | "val" | "name" | "line" | "col" | "attributes" | "block" | "events">;

export class Parser {
    constructor(tokens: Array<Token>) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            switch (token.type) {
                case "OpenTagStart":
                    this.parseOpenTagStart(token)
                    break;
                case "SelfClosingTag":
                    this.parseSelfClosingTag()
                    break;
                case "CloseTag":
                    this.parseCloseTag(token)
                    break;
                case "CSS":
                case "Attribute":
                    this.parseAttribute(token)
                    break;
                case "DynamicAttribute":
                    this.parseDynamicAttribute(token)
                    break;
                case "IfStatement":
                    this.parseIfStatement(token)
                    break;
                case "ElseIfStatement":
                    this.parseElseIfStatement(token)
                    break;
                case "ElseStatement":
                    this.parseElseStatement(token)
                    break;
                case "ForStatement":
                    this.parseForStatement(token)
                    break;
                case "Event":
                    this.parseEvent(token)
                    break;
                case "OpenTagEnd":
                    this.parseOpenTagEnd()
                    break;
                case "DynamicData":
                    this.parseDynamicData(token)
                    break; case "Text":
                    this.parseText(token)
                    break;
                default:
                    break;
            }
        }
    }

    getAST = (): Program => this.ast

    private ast: Program = {
        type: "Program",
        children: []
    };
    private currentNode: Partial<ASTElement> = this.ast;
    private unclosedNodes: Partial<ASTElement>[] = [this.currentNode]
    private previousElementSibling: Partial<ASTElement>;
    private logError(msg: string) {
        throw new Error(msg)
    }
    private parseOpenTagStart(token: Token) {
        let el: Partial<ASTElement> = {
            type: "HtmlElement",
            name: token.tagName,
            attributes: [],
            events: [],
            currentStatus: "attributes",
            ifStatement: null,
            ForStatement: null,
            line: token.pos.row,
            col: token.pos.col,
            children: [],
            nextSibling: null,
            nextElementSibling: null,
            previousElementSibling: this.previousElementSibling
        }
        this.currentNode.children.push(el);
        this.unclosedNodes.push(el);
        this.currentNode = el;
    }
    private parseAttribute(token: Token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text"
            return this.parseText(token)
        }
        this.currentNode.attributes.push(token.val);
    }
    private parseDynamicAttribute(token: Token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text"
            return this.parseText(token)
        }
        this.currentNode.attributes.push(token.val);
    }
    private parseEvent(token: Token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text"
            return this.parseText(token)
        }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.events.push(el)
    }
    private parseForStatement(token: Token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text"
            return this.parseText(token)
        }
        if (!token.val.startsWith("{{")) {
            let nativeFor = token.val.replace(/for=['"]/g, "for(");
            nativeFor = nativeFor.slice(0, -1) + ")"
            token.val = "{{ " + nativeFor + " }}";
        }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.ForStatement = el;
    }
    private parseIfStatement(token: Token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text"
            return this.parseText(token)
        }
        //transforming non-native tyntax to natice syntax
        if (token.val.startsWith("if=")) {
            let nativeIf = token.val
            nativeIf = nativeIf.replace(/if=["']/, 'if(').slice(0, -1) + ")"
            token.val = "{{ " + nativeIf + " }}"
        }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    }
    private parseElseIfStatement(token: Token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text"
            return this.parseText(token)
        }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    }
    private parseElseStatement(token: Token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text"
            return this.parseText(token)
        }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    }
    private parseSimpleAstElement(token: Token): simpleASTElement {
        return {
            type: token.type,
            val: token.val,
            line: token.pos.row,
            col: token.pos.col,
        }
    }
    private parseOpenTagEnd() {
        this.currentNode.currentStatus = "innerHTML";
    }
    private parseDynamicData(token: Token) {
        let el = {
            type: token.type,
            val: token.val,
            replacement: '',
            line: token.pos.row,
            col: token.pos.col,
        }
        this.currentNode.children.push(el)
    }
    private parseText(token: Token) {
        let token_ = this.parseSimpleAstElement(token);
        this.currentNode.children.push(token_)
    }
    private parseSelfClosingTag() {
        this.currentNode.type = "HtmlElement";
        this.currentNode.isSelfClosing = true;
        this.previousElementSibling = this.unclosedNodes[this.unclosedNodes.length - 1]
        this.unclosedNodes.pop();
        this.currentNode = this.unclosedNodes[this.unclosedNodes.length - 1]
    }
    private parseCloseTag(token: Token) {
        let tagName = token.val.slice(2, -1);
        if (this.unclosedNodes[this.unclosedNodes.length - 1].name === tagName) {
            this.previousElementSibling = this.unclosedNodes[this.unclosedNodes.length - 1]
            this.unclosedNodes.pop();
        }
        else
            this.logError(token.val +
                " does not have a corresponding open tag at line " +
                token.pos.row +
                " col " +
                token.pos.col
            )
        this.currentNode = this.unclosedNodes[this.unclosedNodes.length - 1]
    }
}

