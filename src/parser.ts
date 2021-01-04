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
    locals: Array<string>;
    block: {
        type: string,
        nodes: Array<Partial<ASTElement>>
    };
}
export declare type Program = Pick<ASTElement, "type" | "children">;
export declare type simpleASTElement = Required<Pick<ASTElement, "type" | "val" | "line" | "col">>;
export declare type tagAST = Pick<ASTElement, "type" | "val" | "name" | "line" | "col" | "attributes" | "block" | "events">;
export declare type htmlElement = Partial<ASTElement> & { locals?: Array<string> };
export class Parser {
    constructor(tokens: Array<Token>) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            //@ ts-ignore
            if (this[`parse${token.type}`]) { this[`parse${token.type}`](token) }
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
    parseOpenTagStart(token: Token) {
        let el: htmlElement = {
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
            previousElementSibling: this.previousElementSibling,
            locals: this.currentNode.locals || []
        }
        this.currentNode.children.push(el);
        this.unclosedNodes.push(el);
        this.currentNode = el;
    }
    parseAttribute(token: Token) {
        if (this.afterOpTagEnd) { return this.parseAsInnerHTML(token) }
        this.currentNode.attributes.push(token.val);
    }
    parseDynamicAttribute(token: Token) {
        if (this.afterOpTagEnd) { return this.parseAsInnerHTML(token) }
        this.currentNode.attributes.push(token.val);
    }
    parseEvent(token: Token) {
        if (this.afterOpTagEnd) { return this.parseAsInnerHTML(token) }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.events.push(el)
    }
    parseForStatement(token: Token) {
        if (this.afterOpTagEnd) { return this.parseAsInnerHTML(token) }

        if (!token.val.startsWith("{{")) {
            let nativeFor = token.val.replace(/for=['"]/g, "for(");
            nativeFor = nativeFor.slice(0, -1) + ")"
            token.val = "{{ " + nativeFor + " }}";
        }
        let local = token.val;
        local = local.slice(local.indexOf("let") + 3, local.search(/[oi][nf]/)).trim()
        let arr = token.val;
        arr = arr.slice(arr.indexOf("of") + 2, arr.lastIndexOf(")"));
        arr = arr.trim()
        let el = this.parseSimpleAstElement(token);
        if (this.currentNode.locals) {
            this.currentNode.locals.push("let " + local + "=" + arr + "[0]")
        }
        this.currentNode.ForStatement = el;
    }
    parseIfStatement(token: Token) {
        if (this.afterOpTagEnd) { return this.parseAsInnerHTML(token) }

        //transforming non-native tyntax to natice syntax
        if (token.val.startsWith("if=")) {
            let nativeIf = token.val
            nativeIf = nativeIf.replace(/if=["']/, 'if(').slice(0, -1) + ")"
            token.val = "{{ " + nativeIf + " }}"
        }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    }
    parseElseIfStatement(token: Token) {
        if (this.afterOpTagEnd) { return this.parseAsInnerHTML(token) }

        if (token.val.startsWith("else-if=")) {
            let nativeIf = token.val
            nativeIf = nativeIf.replace(/else-if=["']/, 'else if(').slice(0, -1) + ")"
            token.val = "{{ " + nativeIf + " }}"
        }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    }
    parseElseStatement(token: Token) {
        if (this.afterOpTagEnd) { return this.parseAsInnerHTML(token) }
        if (token.val === "else") { token.val = "{{ " + token.val + " }}" }
        let el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    }
    parseSimpleAstElement(token: Token): simpleASTElement {
        return {
            type: token.type,
            val: token.val,
            line: token.pos.row,
            col: token.pos.col,
        }
    }
    parseOpenTagEnd() { this.currentNode.currentStatus = "innerHTML"; }
    parseDynamicData(token: Token) {
        let el = this.parseSimpleAstElement(token)
        this.currentNode.children.push(el)
    }
    parseText(token: Token) {
        let token_ = this.parseSimpleAstElement(token);
        this.currentNode.children.push(token_);
    }
    parseSelfClosingTag() {
        this.currentNode.type = "HtmlElement";
        this.currentNode.isSelfClosing = true;
        this.previousElementSibling = this.unclosedNodes[this.unclosedNodes.length - 1]
        this.unclosedNodes.pop();
        this.currentNode = this.unclosedNodes[this.unclosedNodes.length - 1]
    }
    parseCloseTag(token: Token) {
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
    private get afterOpTagEnd() {
        return this.currentNode.currentStatus === "innerHTML"
    }
    private parseAsInnerHTML(token: Token) {
        token.type = "Text"
        return this.parseText(token)
    }
}

