"use strict";
exports.__esModule = true;
exports.Parser = void 0;
var Parser = /** @class */ (function () {
    function Parser(tokens, options) {
        this.tokens = tokens;
        this.options = options;
        this.ast = {
            type: "Program",
            value: "Program",
            name: "Program",
            forStatement: null,
            ifStatement: null,
            attributes: [],
            children: [],
            line: null,
            column: null
        };
        this.unclosedTagsStack = [this.ast];
        this.currentTag = this.unclosedTagsStack[this.unclosedTagsStack.length - 1];
        this.currentCursorState = null;
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            //@ ts-ignore
            if (this["parse" + token.type]) {
                if (token.type === "SelfClosingTag") {
                    i = this["parse" + token.type](token, i, tokens);
                }
                else
                    this["parse" + token.type](token);
            }
        }
        // console.log(JSON.stringify(this.ast))
        // console.log(this.ast.children)
    }
    Parser.prototype.parseOpenTagStart = function (token) {
        var tag = {
            type: "Tag",
            value: null,
            name: token.val.substring(1),
            attributes: [],
            children: [],
            forStatement: null,
            ifStatement: null,
            line: token.pos.row,
            column: token.pos.col
        };
        this.currentTag.children.push(tag);
        this.unclosedTagsStack.push(tag);
        this.currentTag = tag;
    };
    Parser.prototype.parseOpenTagEnd = function (token) {
        this.currentCursorState = "parsingInnerHtml";
    };
    Parser.prototype.parseIfStatement = function (token) {
        this.currentTag.ifStatement = token.val;
    };
    Parser.prototype.parseForStatement = function (token) {
        this.currentTag.forStatement = token.val;
    };
    Parser.prototype.parseAttribute = function (token) {
        this.currentTag.attributes.push(token.val);
    };
    Parser.prototype.parseInnerHTML = function (token) {
        this.currentTag.children.push({
            type: "InnerHTML",
            value: token.val,
            line: token.pos.row,
            column: token.pos.col
        });
    };
    Parser.prototype.parseDynamicData = function (token) {
        this.currentTag.children.push({
            type: "DynamicData",
            value: token.val,
            line: token.pos.row,
            column: token.pos.col
        });
    };
    Parser.prototype.parseJsCode = function (token) {
        this.currentTag.children.push({
            type: "JsCode",
            value: token.val,
            line: token.pos.row,
            column: token.pos.col
        });
    };
    Parser.prototype.parseDocType = function (token) {
        this.currentTag.children.push({
            type: "DocType",
            value: token.val,
            line: token.pos.row,
            column: token.pos.col
        });
    };
    Parser.prototype.parseSelfClosingTag = function (token, start, tokens) {
        var tag = {
            type: "SelfClosingTag",
            value: null,
            name: token.val.substring(1),
            line: token.pos.row,
            column: token.pos.col,
            attributes: [],
            children: [],
            forStatement: null,
            ifStatement: null
        };
        this.currentTag.children.push(tag);
        var end = null;
        for (var i = start; i < tokens.length; i++) {
            var token_1 = tokens[i];
            if (token_1.type === "OpenTagEnd")
                break;
            else if (token_1.type === "Attribute")
                tag.attributes.push(token_1.val);
            end = i;
        }
        return end;
    };
    Parser.prototype.parseText = function (token) {
        this.currentTag.children.push({
            type: "Text",
            value: token.val,
            line: token.pos.row,
            column: token.pos.col
        });
    };
    Parser.prototype.parseCloseTag = function (token) {
        if ("</" + this.currentTag.name + ">" === token.val) {
            this.unclosedTagsStack.pop();
            this.currentTag = this.unclosedTagsStack[this.unclosedTagsStack.length - 1];
        }
        else {
            var error = new Error();
            error.name = "Unexpected CloseTag";
            error.message = token.val +
                " Does not have a corresponding" +
                " OpenTag " + ", At line " + token.pos.row + " column" +
                " " + token.pos.col;
            throw error;
        }
    };
    return Parser;
}());
exports.Parser = Parser;
