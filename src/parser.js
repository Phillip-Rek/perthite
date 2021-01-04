"use strict";
exports.__esModule = true;
exports.Parser = void 0;
var Parser = /** @class */ (function () {
    function Parser(tokens) {
        var _this = this;
        this.getAST = function () { return _this.ast; };
        this.ast = {
            type: "Program",
            children: []
        };
        this.currentNode = this.ast;
        this.unclosedNodes = [this.currentNode];
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            //@ ts-ignore
            if (this["parse" + token.type]) {
                this["parse" + token.type](token);
            }
        }
    }
    Parser.prototype.logError = function (msg) {
        throw new Error(msg);
    };
    Parser.prototype.parseOpenTagStart = function (token) {
        var el = {
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
        };
        this.currentNode.children.push(el);
        this.unclosedNodes.push(el);
        this.currentNode = el;
    };
    Parser.prototype.parseAttribute = function (token) {
        if (this.afterOpTagEnd) {
            return this.parseAsInnerHTML(token);
        }
        this.currentNode.attributes.push(token.val);
    };
    Parser.prototype.parseDynamicAttribute = function (token) {
        if (this.afterOpTagEnd) {
            return this.parseAsInnerHTML(token);
        }
        this.currentNode.attributes.push(token.val);
    };
    Parser.prototype.parseEvent = function (token) {
        if (this.afterOpTagEnd) {
            return this.parseAsInnerHTML(token);
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.events.push(el);
    };
    Parser.prototype.parseForStatement = function (token) {
        if (this.afterOpTagEnd) {
            return this.parseAsInnerHTML(token);
        }
        if (!token.val.startsWith("{{")) {
            var nativeFor = token.val.replace(/for=['"]/g, "for(");
            nativeFor = nativeFor.slice(0, -1) + ")";
            token.val = "{{ " + nativeFor + " }}";
        }
        var local = token.val;
        local = local.slice(local.indexOf("let") + 3, local.search(/[oi][nf]/)).trim();
        var arr = token.val;
        arr = arr.slice(arr.indexOf("of") + 2, arr.lastIndexOf(")"));
        arr = arr.trim();
        var el = this.parseSimpleAstElement(token);
        if (this.currentNode.locals) {
            this.currentNode.locals.push("let " + local + "=" + arr + "[0]");
        }
        this.currentNode.ForStatement = el;
    };
    Parser.prototype.parseIfStatement = function (token) {
        if (this.afterOpTagEnd) {
            return this.parseAsInnerHTML(token);
        }
        //transforming non-native tyntax to natice syntax
        if (token.val.startsWith("if=")) {
            var nativeIf = token.val;
            nativeIf = nativeIf.replace(/if=["']/, 'if(').slice(0, -1) + ")";
            token.val = "{{ " + nativeIf + " }}";
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    };
    Parser.prototype.parseElseIfStatement = function (token) {
        if (this.afterOpTagEnd) {
            return this.parseAsInnerHTML(token);
        }
        if (token.val.startsWith("else-if=")) {
            var nativeIf = token.val;
            nativeIf = nativeIf.replace(/else-if=["']/, 'else if(').slice(0, -1) + ")";
            token.val = "{{ " + nativeIf + " }}";
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    };
    Parser.prototype.parseElseStatement = function (token) {
        if (this.afterOpTagEnd) {
            return this.parseAsInnerHTML(token);
        }
        if (token.val === "else") {
            token.val = "{{ " + token.val + " }}";
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    };
    Parser.prototype.parseSimpleAstElement = function (token) {
        return {
            type: token.type,
            val: token.val,
            line: token.pos.row,
            col: token.pos.col
        };
    };
    Parser.prototype.parseOpenTagEnd = function () { this.currentNode.currentStatus = "innerHTML"; };
    Parser.prototype.parseDynamicData = function (token) {
        var el = this.parseSimpleAstElement(token);
        this.currentNode.children.push(el);
    };
    Parser.prototype.parseText = function (token) {
        var token_ = this.parseSimpleAstElement(token);
        this.currentNode.children.push(token_);
    };
    Parser.prototype.parseSelfClosingTag = function () {
        this.currentNode.type = "HtmlElement";
        this.currentNode.isSelfClosing = true;
        this.previousElementSibling = this.unclosedNodes[this.unclosedNodes.length - 1];
        this.unclosedNodes.pop();
        this.currentNode = this.unclosedNodes[this.unclosedNodes.length - 1];
    };
    Parser.prototype.parseCloseTag = function (token) {
        var tagName = token.val.slice(2, -1);
        if (this.unclosedNodes[this.unclosedNodes.length - 1].name === tagName) {
            this.previousElementSibling = this.unclosedNodes[this.unclosedNodes.length - 1];
            this.unclosedNodes.pop();
        }
        else
            this.logError(token.val +
                " does not have a corresponding open tag at line " +
                token.pos.row +
                " col " +
                token.pos.col);
        this.currentNode = this.unclosedNodes[this.unclosedNodes.length - 1];
    };
    Object.defineProperty(Parser.prototype, "afterOpTagEnd", {
        get: function () {
            return this.currentNode.currentStatus === "innerHTML";
        },
        enumerable: false,
        configurable: true
    });
    Parser.prototype.parseAsInnerHTML = function (token) {
        token.type = "Text";
        return this.parseText(token);
    };
    return Parser;
}());
exports.Parser = Parser;
