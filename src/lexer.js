"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.Lexer = void 0;
var commentStart_Re = "<!--";
var compOp_Re = /[<>]/;
var ifStatement_Re = /{{[ ]*if\([ \w.$\[\]"'=<>+\-,&\(\)\|]+\)[ ]*}}/;
var elseIfStatement_Re = /{{[ ]*else if\([ \w.$\[\]"'=<>+\-,'"&\(\)\|]+\)[ ]*}}/;
var elseStatement_Re = /{{[ ]*else[ ]*}}/;
var forStatement_Re = /{{[ ]*for\([ a-zA-Z0-9_\w.$\[\]=<>\-+,]+\)[ ]*}}/;
var forEach_Re = /{{[ ]*[a-zA-Z0-9.\[\]_]+[.]forEach\(\([ a-zA-Z0-9,._]+\)=>\)[ ]*}}/;
var on_Re = /\*on[a-z]+="[ a-z0-9_\(\).,]+"/i;
var text_Re = /[ \w"'=\(\)\n\t!&^%$#@{}\-:_+\\/,.?\[\]>]+/i;
var openTagStart_Re = /<[-_;:&%$#@+=*\w]+/i;
var attribute_Re = /[-_:&$#@*\w]+=["|'][ '\w\-_.:&$;#@=,\?\(\)\{\}\*\/\[\]\+]*['|"]/i;
var dynamicAttr_Re = /[-_:*a-z0-9]+={{[ a-z0-9._\[\]]+}}/i;
var css_Re = /style=["'][a-z\-\;0-9\: ]+['"]/i;
var link_Re = /href=["'][a-z\-\;0-9\://. ]+['"]/i;
var dynamicData_Re = /{{[ ]*[a-z0-9_.$\[\]\(\)\+"'\-_, ]+[ ]*}}/i;
var closeTag_Re = /<\/[-_;:&%$#@+=*\w]+>/i;
var setDocType_Re = "<!DOCTYPE html>";
var selfClosingTag_Re = /^(<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr|<command|<keygen|<menuitem)/;
var scriptTag_Re = "<script";
var Lexer = /** @class */ (function () {
    function Lexer(input, file) {
        this.input = input;
        this.file = file;
        this.pos = { col: 1, row: 1 };
        this.tokens = [];
        this.currentStatus = "innerHTML";
        this.cursor = 0;
        for (;;) {
            if (this.scriptTag) {
                /*Find end of JavaScript code */
                var jsCodeEnd = this.input.indexOf("</script>");
                var jsCode = this.input.slice(0, jsCodeEnd + 9);
                /*update the position, by counting line-ends and columns */
                this.pos.row += jsCode.split("\n").length - 1;
                this.pos.col = 0;
                this.tokens.push({
                    type: "JsCode",
                    val: jsCode.split("`").join("\`"),
                    pos: __assign({}, this.pos)
                });
                this.consume(jsCode);
            }
            else if (this.selfClosingTag) {
                this.tokens.push({
                    type: "SelfClosingTag",
                    val: this.selfClosingTag,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.selfClosingTag);
                this.currentStatus = "attributes";
            }
            else if (this.openTagStart) {
                this.tokens.push({
                    type: "OpenTagStart",
                    val: this.openTagStart,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.openTagStart);
                this.currentStatus = "attributes";
            }
            else if (this.dynamicAttr) {
                this.tokens.push({
                    type: "DynamicAttribute",
                    val: this.dynamicAttr,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.dynamicAttr);
            }
            else if (this.css) {
                this.tokens.push({
                    type: "CSS",
                    val: this.css,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.css);
            }
            else if (this.link) {
                this.tokens.push({
                    type: "Attribute",
                    val: this.link,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.link);
            }
            else if (this.elseIfStatement) {
                var type = this.currentStatus === "attributes" ?
                    "ElseIfStatement" : "DynamicData";
                this.tokens.push({
                    type: type,
                    val: this.elseIfStatement,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.elseIfStatement);
            }
            else if (this.elseStatement) {
                var type = this.currentStatus === "attributes" ?
                    "ElseStatement" : "DynamicData";
                this.tokens.push({
                    type: type,
                    val: this.elseStatement,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.elseStatement);
            }
            else if (this.ifStatement) {
                var type = this.currentStatus === "attributes" ?
                    "IfStatement" : "DynamicData";
                this.tokens.push({
                    type: type,
                    val: this.ifStatement,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.ifStatement);
            }
            else if (this.forStatement) {
                var type = this.currentStatus === "attributes" ?
                    "ForStatement" : "DynamicData";
                this.tokens.push({
                    type: type,
                    val: this.forStatement,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.forStatement);
            }
            else if (this.forEach) {
                var type = this.currentStatus === "attributes" ?
                    "ForStatement" : "DynamicData";
                this.tokens.push({
                    type: type,
                    val: this.forEach,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.forEach);
            }
            else if (this.on) {
                var type = this.currentStatus === "attributes" ?
                    "Event" : "DynamicData";
                this.tokens.push({
                    type: type,
                    val: this.on,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.on);
            }
            else if (this.attribute) {
                this.tokens.push({
                    type: "Attribute",
                    val: this.attribute,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.attribute);
            }
            else if (this.openTagEnd) {
                this.tokens.push({
                    type: "OpenTagEnd",
                    val: this.openTagEnd,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.openTagEnd);
                this.currentStatus = "innerHTML";
            }
            else if (this.whiteSpace) {
                this.tokens.push({
                    type: "Text",
                    val: " ",
                    pos: __assign({}, this.pos)
                });
                this.consume(this.whiteSpace);
            }
            else if (this.input[0] === "\n") {
                this.tokens.push({
                    type: "Text",
                    val: "\n",
                    pos: __assign({}, this.pos)
                });
                this.newLIne();
                this.consume("\n");
            }
            else if (this.dynamicData) {
                this.tokens.push({
                    type: "DynamicData",
                    val: this.dynamicData,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.dynamicData);
            }
            else if (this.closeTag) {
                this.tokens.push({
                    type: "CloseTag",
                    val: this.closeTag,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.closeTag);
            }
            else if (this.commentStart) {
                var commentEnd = this.input.indexOf("-->") + 3;
                var fullComment = this.input.substring(0, commentEnd);
                this.tokens.push({
                    type: "Comment",
                    val: fullComment,
                    pos: __assign({}, this.pos)
                });
                this.consume(fullComment);
            }
            else if (this.text) {
                var type = (this.currentStatus === "innerHTML" ? "InnerHTML" : "Attribute");
                if (type === "Attribute" && this.text.search(attribute_Re) === -1) {
                    var error = new Error("");
                    error.name = "Attribute Error";
                    error.message = "Attribute was not assigned to a value. " +
                        "An attribute need to be assigned to a value " +
                        "like this attributeName='attributeValue' " +
                        ", at line " + this.pos.row + " column " + this.pos.col +
                        ", " + this.text + "...";
                    throw error;
                }
                /*If the is a line end we stop lexing Text*/
                var text = this.text;
                if (this.text.search("\n") > -1) {
                    text = this.text.substring(0, this.text.search("\n"));
                }
                this.tokens.push({
                    type: type,
                    val: text,
                    pos: __assign({}, this.pos)
                });
                this.consume(text);
            }
            else if (this.setDocType) {
                this.tokens.push({
                    type: "DocType",
                    val: this.setDocType,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.setDocType);
            }
            else if (this.comparisonOp) {
                this.tokens.push({
                    type: "Text",
                    val: this.comparisonOp,
                    pos: __assign({}, this.pos)
                });
                this.consume(this.comparisonOp);
            }
            else if (this.eof) {
                this.tokens.push({
                    type: "eof",
                    val: "eof",
                    pos: __assign({}, this.pos)
                });
                break;
            }
            else {
                this.next();
            }
        }
    }
    Lexer.prototype.next = function () {
        this.pos.col++;
        this.cursor++;
        this.input = this.input.substring(1);
    };
    Lexer.prototype.consume = function (lexeme) {
        this.pos.col += lexeme.length;
        this.input = this.input.substring(lexeme.length);
    };
    Lexer.prototype.newLIne = function () {
        this.pos.row++;
        this.pos.col = -1;
    };
    Object.defineProperty(Lexer.prototype, "eof", {
        get: function () {
            return this.input[this.cursor] === undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "openTagStart", {
        get: function () {
            if (this.doesNotContain(openTagStart_Re))
                return false;
            var opTag = this.input.match(openTagStart_Re)[0];
            return this.input.indexOf(opTag) === 0 && opTag;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "setDocType", {
        get: function () {
            if (this.doesNotContain(setDocType_Re))
                return false;
            var docType = this.input.match(setDocType_Re)[0];
            return this.input.indexOf(docType) === 0 && docType;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "attribute", {
        get: function () {
            if (this.doesNotContain(attribute_Re))
                return false;
            var attr = this.input.match(attribute_Re)[0];
            return this.input.indexOf(attr) === 0 && attr;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "css", {
        get: function () {
            if (this.doesNotContain(css_Re))
                return false;
            var style = this.input.match(css_Re)[0];
            return this.input.indexOf(style) === 0 && style;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "link", {
        get: function () {
            if (this.doesNotContain(link_Re))
                return false;
            var link = this.input.match(link_Re)[0];
            return this.input.indexOf(link) === 0 && link;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "dynamicAttr", {
        get: function () {
            if (this.doesNotContain(dynamicAttr_Re))
                return false;
            var attr = this.input.match(dynamicAttr_Re)[0];
            return this.input.indexOf(attr) === 0 && attr;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "openTagEnd", {
        get: function () {
            if (this.doesNotContain(/>/) ||
                this.currentStatus === "innerHTML") {
                return false;
            }
            else {
                var tagENd = this.input.match(/>/)[0];
                return this.input.indexOf(tagENd) === 0 && tagENd;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "selfClosingTag", {
        get: function () {
            if (this.doesNotContain(selfClosingTag_Re))
                return false;
            var tagENd = this.input.match(selfClosingTag_Re)[0];
            return this.input.indexOf(tagENd) === 0 && tagENd;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "dynamicData", {
        get: function () {
            if (this.doesNotContain(dynamicData_Re))
                return false;
            var identifier = this.input.match(dynamicData_Re)[0];
            return this.input.indexOf(identifier) === 0 && identifier;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "comparisonOp", {
        get: function () {
            if (this.doesNotContain(compOp_Re))
                return false;
            var identifier = this.input.match(compOp_Re)[0];
            return this.input.indexOf(identifier) === 0 && identifier;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "closeTag", {
        get: function () {
            if (this.doesNotContain(closeTag_Re))
                return false;
            var closeTag = this.input.match(closeTag_Re)[0];
            return this.input.indexOf(closeTag) === 0 && closeTag;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "text", {
        get: function () {
            if (this.doesNotContain(text_Re))
                return false;
            var text = this.input.match(text_Re)[0];
            if (text.search(dynamicData_Re) > -1) {
                var dynamicDataStartPoint = text.search(dynamicData_Re);
                text = text.substring(0, dynamicDataStartPoint);
            }
            return this.input.indexOf(text) === 0 && text;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "whiteSpace", {
        get: function () {
            if (this.doesNotContain(/[ \t]+/))
                return false;
            var whiteSpace = this.input.match(/[ \t]+/)[0];
            return this.input.indexOf(whiteSpace) === 0 && whiteSpace;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "ifStatement", {
        get: function () {
            if (this.doesNotContain(ifStatement_Re))
                return false;
            var res = this.input.match(ifStatement_Re)[0];
            return this.input.indexOf(res) === 0 && res;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "elseIfStatement", {
        get: function () {
            if (!this.doesNotContain(elseIfStatement_Re)) {
                var res = this.input.match(elseIfStatement_Re)[0];
                return this.input.indexOf(res) === 0 && res;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "elseStatement", {
        get: function () {
            if (!this.doesNotContain(elseStatement_Re)) {
                var res = this.input.match(elseStatement_Re)[0];
                return this.input.indexOf(res) === 0 && res;
            }
            if (this.input.search(elseStatement_Re) !== -1) {
                var res = this.input.match(elseStatement_Re)[0];
                return this.input.indexOf(res) === 0 && res;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "forStatement", {
        get: function () {
            if (this.doesNotContain(forStatement_Re))
                return false;
            var forStatement = this.input.match(forStatement_Re)[0];
            return this.input.indexOf(forStatement) === 0 && forStatement;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "forEach", {
        get: function () {
            if (this.doesNotContain(forEach_Re))
                return false;
            var foreach = this.input.match(forEach_Re)[0];
            return this.input.indexOf(foreach) === 0 && foreach;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "on", {
        get: function () {
            if (this.doesNotContain(on_Re))
                return false;
            var on = this.input.match(on_Re)[0];
            return this.input.indexOf(on) === 0 && on;
        },
        enumerable: false,
        configurable: true
    });
    Lexer.prototype.tokenize = function () {
        return this.tokens;
    };
    Lexer.prototype.doesNotContain = function (arg) {
        return this.input.search(arg) === -1;
    };
    Object.defineProperty(Lexer.prototype, "commentStart", {
        /*NEW METHOD */
        get: function () {
            if (this.doesNotContain(commentStart_Re))
                return false;
            var commentStart = this.input.match(commentStart_Re)[0];
            return this.input.indexOf(commentStart) === 0 && commentStart;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "scriptTag", {
        get: function () {
            if (this.doesNotContain(scriptTag_Re))
                return false;
            var scriptTag = this.input.match(scriptTag_Re)[0];
            return this.input.indexOf(scriptTag) === 0 && scriptTag;
        },
        enumerable: false,
        configurable: true
    });
    return Lexer;
}());
exports.Lexer = Lexer;
