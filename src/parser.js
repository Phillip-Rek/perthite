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
            switch (token.type) {
                case "OpenTagStart":
                    this.parseOpenTagStart(token);
                    break;
                case "SelfClosingTag":
                    this.parseSelfClosingTag();
                    break;
                case "CloseTag":
                    this.parseCloseTag(token);
                    break;
                case "CSS":
                case "Attribute":
                    this.parseAttribute(token);
                    break;
                case "DynamicAttribute":
                    this.parseDynamicAttribute(token);
                    break;
                case "IfStatement":
                    this.parseIfStatement(token);
                    break;
                case "ElseIfStatement":
                    this.parseElseIfStatement(token);
                    break;
                case "ElseStatement":
                    this.parseElseStatement(token);
                    break;
                case "ForStatement":
                    this.parseForStatement(token);
                    break;
                case "Event":
                    this.parseEvent(token);
                    break;
                case "OpenTagEnd":
                    this.parseOpenTagEnd();
                    break;
                case "DynamicData":
                    this.parseDynamicData(token);
                    break;
                case "Text":
                    this.parseText(token);
                    break;
                default:
                    break;
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
            EachOf: null,
            line: token.pos.row,
            col: token.pos.col,
            children: [],
            nextSibling: null,
            nextElementSibling: null,
            previousElementSibling: this.previousElementSibling
        };
        this.currentNode.children.push(el);
        this.unclosedNodes.push(el);
        this.currentNode = el;
    };
    Parser.prototype.parseAttribute = function (token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text";
            return this.parseText(token);
        }
        this.currentNode.attributes.push(token.val);
    };
    Parser.prototype.parseDynamicAttribute = function (token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text";
            return this.parseText(token);
        }
        this.currentNode.attributes.push(token.val);
    };
    Parser.prototype.parseEvent = function (token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text";
            return this.parseText(token);
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.events.push(el);
    };
    Parser.prototype.parseForStatement = function (token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text";
            return this.parseText(token);
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.EachOf = el;
    };
    Parser.prototype.parseIfStatement = function (token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text";
            return this.parseText(token);
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    };
    Parser.prototype.parseElseIfStatement = function (token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text";
            return this.parseText(token);
        }
        var el = this.parseSimpleAstElement(token);
        this.currentNode.ifStatement = el;
    };
    Parser.prototype.parseElseStatement = function (token) {
        if (this.currentNode.currentStatus === "innerHTML") {
            token.type = "Text";
            return this.parseText(token);
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
    Parser.prototype.parseOpenTagEnd = function () {
        this.currentNode.currentStatus = "innerHTML";
    };
    Parser.prototype.parseDynamicData = function (token) {
        var el = {
            type: token.type,
            val: token.val,
            replacement: '',
            line: token.pos.row,
            col: token.pos.col
        };
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
    return Parser;
}());
exports.Parser = Parser;