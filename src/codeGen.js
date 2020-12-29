"use strict";
exports.__esModule = true;
exports.render = void 0;
var parser_1 = require("./parser");
var lexer_1 = require("./lexer");
var fs = require("fs");
var templateBuffer = 'let template = \`\`\n';
var buffer = "";
var GenerateCode = /** @class */ (function () {
    function GenerateCode(ast, data) {
        this.extractLocalVariable = function (expression) {
            var variable = "";
            for (var i = 0; i < expression.length; i++) {
                var char = expression[i];
                if (char === "." || char === "[" || char === "(")
                    break;
                variable += char;
            }
            return variable;
        };
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
    GenerateCode.prototype.compile = function () { return buffer; };
    GenerateCode.prototype.initProgram = function (node) {
        buffer = templateBuffer;
        //declare local variables
        var data = Object.entries(this.data);
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            var identifier = item[0];
            var expression = item[1];
            switch (typeof expression) {
                case "object":
                    expression = JSON.stringify(expression);
                    break;
                case "function":
                    expression = expression;
                    break;
                default:
                    expression = "`" + expression + "`";
                    break;
            }
            buffer += "let " + identifier + " = " + expression + ";\n";
        }
        this.visitChildren(node);
    };
    GenerateCode.prototype.visitChildren = function (node) {
        var children = node.children;
        var typ = node.name && node.name === "script" && "Text";
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            child.type = typ ? typ : child.type;
            new GenerateCode(child, this.data);
        }
    };
    GenerateCode.prototype.visitHTMLElement = function (node) {
        var ifStatement = this.visitIfStatement(node);
        if (ifStatement)
            return;
        this.visitOpenTag(node);
        this.vivitAttributes(node);
        this.visitEvents(node);
        if (node.isSelfClosing)
            return buffer = buffer.concat("template += \"/>\";\n");
        //this.visitForStatement(node)
        this.visitForStatement2(node);
        if (!node.EachOf) {
            buffer = buffer.concat("template += \">\";\n");
            this.visitChildren(node);
        }
        buffer = buffer.concat("template += \`</" + node.name + ">\`;\n");
    };
    GenerateCode.prototype.visitOpenTag = function (node) {
        buffer = buffer.concat("template += \`<" + node.name + "\`;\n");
    };
    GenerateCode.prototype.vivitAttributes = function (node) {
        var identifier = /\w={{[a-z0-9._\[\]]+}}/i;
        var identifier2 = /\w={{ [a-z0-9._\[\]]+ }}/i;
        for (var _i = 0, _a = node.attributes; _i < _a.length; _i++) {
            var attr = _a[_i];
            if (attr.search(identifier) > -1 ||
                attr.search(identifier2) > -1) {
                var attrVal = attr.substring(attr.indexOf("=") + 1).trim();
                var attrKey = attr.substring(0, attr.indexOf("="));
                buffer = buffer.concat("template += ` " + attrKey + "=\\\"`;\n");
                this.visitDynamicData({
                    type: "DynamicData",
                    val: attrVal,
                    line: node.line,
                    col: node.col
                });
                buffer = buffer.concat("template += '\"';\n");
            }
            else {
                buffer = buffer.concat("template += ` " + attr + "`;\n");
            }
        }
    };
    GenerateCode.prototype.visitEvents = function (node) {
        node.events.forEach(function (ev) {
            // buffer = buffer.concat(` ${ev.val}`)
        });
    };
    GenerateCode.prototype.visitIfStatement = function (node) {
        if (!node.ifStatement)
            return false;
        if (node.ifStatement.val.startsWith("{{"))
            return this.visitIfStatement2(node);
        if (node.ifStatement.val.startsWith("if=")) {
            var statement = node.ifStatement.val;
            statement = statement.slice(4, -1);
            buffer += "if(" + statement + "){\n";
            node.ifStatement = null;
            this.visitHTMLElement(node);
            buffer += "}\n";
        }
        else if (node.ifStatement.val.startsWith("else-if=")) {
            var statement = node.ifStatement.val;
            statement = statement.slice(9, -1);
            buffer += "else if(" + statement + "){\n";
            node.ifStatement = null;
            this.visitHTMLElement(node);
            buffer += "}\n";
        }
        else if (node.ifStatement.val = "else") {
            buffer += "else{\n";
            node.ifStatement = null;
            this.visitHTMLElement(node);
            buffer += "}\n";
        }
        return true;
    };
    GenerateCode.prototype.visitIfStatement2 = function (node) {
        var statement = node.ifStatement.val;
        if (statement.indexOf("else if(") > -1) {
            statement = statement.slice(statement.indexOf("else if"), statement.lastIndexOf(")") + 1);
        }
        else if (statement.indexOf("else") > -1) {
            statement = statement.slice(2, -2).trim();
        }
        else {
            statement = statement.slice(statement.indexOf("if"), statement.lastIndexOf(")") + 1);
        }
        buffer += statement + "{\n";
        node.ifStatement = null;
        this.visitHTMLElement(node);
        buffer += "}\n";
        return true;
    };
    GenerateCode.prototype.visitForStatement2 = function (node) {
        if (!node.EachOf)
            return;
        //exclude other syntax
        if (!node.EachOf.val.startsWith("{{"))
            return this.visitForStatement(node);
        buffer += "template +=`>`\n";
        var statement = node.EachOf.val.slice(2, -2).trim();
        var variable = statement.slice(statement.indexOf(" "), statement.indexOf("of")).trim();
        var arr = statement.slice(statement.indexOf(" of ") + 4, -1).trim();
        node = this.visitForVariable2(node, variable, arr);
        buffer += statement + "{\n";
        this.visitChildren(node);
        buffer += "}\n";
        if (this.data[arr] === undefined)
            this.data[arr] = [];
    };
    GenerateCode.prototype.visitForVariable2 = function (node, variable, arr) {
        var _this = this;
        node.children.forEach(function (child) {
            if (child.type === "HtmlElement") {
                _this.visitForVariable(child, variable, arr);
            }
            else if (child.type === "DynamicData") {
                child.type = "ParsedText";
                child.val = child.val.slice(2, -2);
            }
        });
        return node;
    };
    GenerateCode.prototype.visitForStatement = function (node) {
        if (!node.EachOf)
            return;
        buffer += "template +=`>`\n";
        var statement = node.EachOf.val;
        var variable = statement.slice(statement.indexOf(" "), statement.indexOf("of")).trim();
        var arr = statement.slice(statement.indexOf(" of ") + 4, -1).trim();
        node = this.visitForVariable(node, variable, arr);
        var forStatement = "for(let i=0;i<" + arr + ".length;i++){\n";
        buffer += forStatement + "\n";
        buffer += "let " + variable + " = " + arr + "[i];\n";
        this.visitChildren(node);
        buffer += "}\n";
        if (this.data[arr] === undefined)
            this.data[arr] = [];
    };
    GenerateCode.prototype.visitForVariable = function (node, variable, arr) {
        var _this = this;
        node.children.forEach(function (child) {
            if (child.type === "HtmlElement") {
                _this.visitForVariable(child, variable, arr);
            }
            else if (child.type === "DynamicData") {
                if (child.val.search("{{" + arr) !== 0) {
                    child.type = "ParsedText";
                    child.val = child.val.slice(2, -2);
                }
            }
        });
        return node;
    };
    GenerateCode.prototype.visitText = function (node) {
        buffer += "template += \`" + node.val + "\`;\n";
    };
    GenerateCode.prototype.visitDynamicData = function (node) {
        var val = node.val.slice(2, -2).trim();
        //get a variable from expression like users[0]
        var variable = this.extractLocalVariable(val);
        //check if a variable was declared
        if (buffer.search(variable) === -1) {
            this.refErr(node);
        }
        buffer = buffer.concat("template += " + val + ";\n");
    };
    GenerateCode.prototype.refErr = function (node) {
        var msg = node.val +
            " is not defined at line : " +
            node.line + " col: " +
            node.col;
        throw new ReferenceError(msg);
    };
    return GenerateCode;
}());
function render(input, data) {
    var tmplt = input.template;
    if (input.srcFile) {
        tmplt = fs.readFileSync(input.srcFile, "utf8").toString();
    }
    var tokens = new lexer_1.Lexer(tmplt).tokenize();
    var AST = JSON.parse(JSON.stringify(new parser_1.Parser(tokens).getAST()));
    var template = new GenerateCode(AST, data).compile();
    var output = new Function(template + "return template;\n")();
    return output;
}
exports.render = render;
