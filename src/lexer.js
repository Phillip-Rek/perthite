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
exports.Lexer = exports.forEach_Re = void 0;
var ifStatement_Re = /if=["][ \w=<>&.\-_'"&\(\)\|]+["]/;
var ifStatement_Re_2 = /{{[ ]*if\([ \w.$\[\]"'=<>+\-,&\(\)\|]+\)[ ]*}}/;
var elseIfStatement_Re = /else-if=["][ \w=<>&.\-_'"&\(\)\|]+["]/;
var elseIfStatement_Re_2 = /{{[ ]*else if\([ \w.$\[\]"'=<>+\-,'"&\(\)\|]+\)[ ]*}}/;
var elseStatement_Re = /else/;
var elseStatement_Re_2 = /{{[ ]*else[ ]*}}/;
var forStatement_Re = /for=["']let[ \w.$\[\],;:'"]+['"]/;
var forStatement_Re_2 = /{{[ ]*for\([ a-zA-Z0-9_\w.$\[\]=<>\-+,]+\)[ ]*}}/;
exports.forEach_Re = /{{[ ]*[a-zA-Z0-9.\[\]_]+[.]forEach\(\([ a-zA-Z0-9,._]+\)=>\)[ ]*}}/;
var on_Re = /\*on[a-z]+="[ a-z0-9_\(\).,]+"/i;
var text_Re = /[ \w"'=\(\)\n\t!&^%$#@\-:_+\\/,.?\[\]>]+/i;
var openTagStart_Re = /<[-_;:&%$#@+=*\w]+/i;
var attribute_Re = /[-_:&$#@*\w]+=["|'][ '\w\-_.:&$#@\(\)\{\}*]+['|"]/i;
var dynamicAttr_Re = /[-_:*a-z0-9]+={{[ a-z0-9._\[\]]+}}/i;
var css_Re = /style=["'][a-z\-\;0-9\: ]+['"]/i;
var link_Re = /href=["'][a-z\-\;0-9\://. ]+['"]/i;
var dynamicData_Re = /{{[ ]*[a-z0-9_.$\[\]\(\)\+"'\-_, ]+[ ]*}}/i;
var closeTag_Re = /<\/[-_;:&%$#@+=*\w]+>/i;
var javascriptSrc_Reg = /<script>[ \w"'=\(\)\n\t!&^%$#@\-:_<>+\/,.\?\[\]><?;\\]+<\/script>/i;
var Lexer = /** @class */ (function () {
    function Lexer(input) {
        this.input = input;
        this.pos = { col: 1, row: 1 };
        this.tokens = [];
        this.cursor = 0;
        for (;;) {
            if (this.openTagStart) {
                if (this.openTagStart === "<script") {
                    var jsCodeEnd = this.input.indexOf("</script>", this.cursor);
                    var jsCode = "\n" + this.input.slice(this.cursor, jsCodeEnd + 9);
                    this.tokens.push({
                        type: "Text",
                        val: jsCode,
                        pos: Object.freeze(__assign({}, this.pos))
                    });
                    this.consume(jsCode);
                }
                else {
                    this.tokens.push({
                        type: "OpenTagStart",
                        val: this.openTagStart,
                        tagName: this.openTagStart.substring(1),
                        pos: Object.freeze(__assign({}, this.pos))
                    });
                    this.currentStatus = "attributes";
                    this.consume(this.openTagStart);
                }
            }
            else if (this.dynamicAttr) {
                this.tokens.push({
                    type: "DynamicAttribute",
                    val: this.dynamicAttr,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.dynamicAttr);
            }
            else if (this.css) {
                this.tokens.push({
                    type: "CSS",
                    val: this.css,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.css);
            }
            else if (this.link) {
                this.tokens.push({
                    type: "Attribute",
                    val: this.link,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.link);
            }
            else if (this.elseIfStatement) {
                this.tokens.push({
                    type: "ElseIfStatement",
                    val: this.elseIfStatement,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.elseIfStatement);
            }
            else if (this.elseStatement) {
                this.tokens.push({
                    type: "ElseStatement",
                    val: this.elseStatement,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.elseStatement);
            }
            else if (this.ifStatement) {
                this.tokens.push({
                    type: "IfStatement",
                    val: this.ifStatement,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.ifStatement);
            }
            else if (this.ifStatement2) {
                this.tokens.push({
                    type: "IfStatement",
                    val: this.ifStatement2,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.ifStatement2);
            }
            else if (this.forStatement2) {
                this.tokens.push({
                    type: "ForStatement",
                    val: this.forStatement2,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.forStatement2);
            }
            else if (this.forStatement) {
                this.tokens.push({
                    type: "ForStatement",
                    val: this.forStatement,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.forStatement);
            }
            else if (this.forEach) {
                this.tokens.push({
                    type: "ForStatement",
                    val: this.forEach,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.forEach);
            }
            else if (this.on) {
                this.tokens.push({
                    type: "Event",
                    val: this.on,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.on);
            }
            else if (this.attribute) {
                this.tokens.push({
                    type: "Attribute",
                    val: this.attribute,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.attribute);
            }
            else if (this.selfClosingTag) {
                this.tokens.push({
                    type: "SelfClosingTag",
                    val: this.selfClosingTag,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.selfClosingTag);
            }
            else if (this.openTagEnd) {
                this.currentStatus = "innerHTML";
                this.tokens.push({
                    type: "OpenTagEnd",
                    val: this.openTagEnd,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.openTagEnd);
            }
            else if (this.whiteSpace) {
                var lastToken = this.tokens[this.tokens.length - 1].type;
                if (lastToken !== "CloseTag" &&
                    lastToken !== "SelfClosingTag") {
                    this.tokens.push({
                        type: "Text",
                        val: this.whiteSpace,
                        pos: Object.freeze(__assign({}, this.pos))
                    });
                }
                this.consume(this.whiteSpace);
            }
            else if (this.input[0] === "\n") {
                this.newLIne();
                this.consume("\n");
            }
            else if (this.dynamicData) {
                var type = void 0;
                if (this.dynamicData.search(elseStatement_Re_2) > -1 && this.currentStatus === "attributes") {
                    type = "IfStatement";
                }
                else {
                    type = "DynamicData";
                }
                this.tokens.push({
                    type: type,
                    val: this.dynamicData,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.dynamicData);
            }
            else if (this.text) {
                var type = this.currentStatus = "innerHTML" ?
                    "Text" : "Attribute";
                this.tokens.push({
                    type: type,
                    val: this.text,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.text);
            }
            else if (this.closeTag) {
                this.tokens.push({
                    type: "CloseTag",
                    val: this.closeTag,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.closeTag);
            }
            else if (this.comparisonOp) {
                this.tokens.push({
                    type: "Text",
                    val: this.comparisonOp,
                    pos: Object.freeze(__assign({}, this.pos))
                });
                this.consume(this.comparisonOp);
            }
            else if (this.eof) {
                this.tokens.push({
                    type: "eof",
                    val: "eof",
                    pos: Object.freeze(__assign({}, this.pos))
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
            if (this.doesNotContain(">"))
                return false;
            var tagENd = this.input.match(">")[0];
            return this.input.indexOf(tagENd) === 0 && tagENd;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "selfClosingTag", {
        get: function () {
            if (this.doesNotContain("/>"))
                return false;
            var tagENd = this.input.match("/>")[0];
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
            var compOp_Re = /[<>]/;
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
    Object.defineProperty(Lexer.prototype, "ifStatement2", {
        get: function () {
            if (this.doesNotContain(ifStatement_Re_2))
                return false;
            var res = this.input.match(ifStatement_Re_2)[0];
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
            if (!this.doesNotContain(elseIfStatement_Re_2)) {
                var res = this.input.match(elseIfStatement_Re_2)[0];
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
            if (this.input.search(elseStatement_Re_2) !== -1) {
                var res = this.input.match(elseStatement_Re_2)[0];
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
    Object.defineProperty(Lexer.prototype, "forStatement2", {
        get: function () {
            if (this.doesNotContain(forStatement_Re_2))
                return false;
            var forStatement = this.input.match(forStatement_Re_2)[0];
            return this.input.indexOf(forStatement) === 0 && forStatement;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "lexJSCode", {
        get: function () {
            if (this.doesNotContain(javascriptSrc_Reg))
                return false;
            var forStatement = this.input.match(forStatement_Re)[0];
            return this.input.indexOf(forStatement) === 0 && forStatement;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "forEach", {
        get: function () {
            if (this.doesNotContain(exports.forEach_Re))
                return false;
            var foreach = this.input.match(exports.forEach_Re)[0];
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
    return Lexer;
}());
exports.Lexer = Lexer;
