"use strict";
exports.__esModule = true;
exports.engine = exports.render = void 0;
var parser_1 = require("./parser");
var lexer_1 = require("./lexer");
var fs = require("fs");
var mode = process.env.NODE_ENV || "development";
var templateBuffer = "let template = ``\n";
var buffer = "let template=\"\";\n";
var globalVars = "";
var status;
var serverRunsForTheFirstTime = true;
var GenerateCode = /** @class */ (function () {
    //initialize a program
    function GenerateCode(ast, options, srcFile) {
        this.ast = ast;
        this.options = options;
        buffer = "let template=\"\";\n";
        switch (this.ast.type) {
            case "Program":
                this.init(this.ast);
        }
    }
    GenerateCode.prototype.init = function (ast) {
        buffer += "\n/*START-OF-BLOBAL-VARIALE-DECLARATION-55522555*/\n";
        for (var key in this.options) {
            if (this.options.hasOwnProperty(key)) {
                var value = this.options[key];
                switch (typeof value) {
                    case "object":
                        value = JSON.stringify(value);
                        break;
                    case "number":
                    case "boolean":
                    case "function":
                        value = value;
                        break;
                    default:
                        value = "`" + value + "`";
                        break;
                }
                if (serverRunsForTheFirstTime) {
                    buffer += "let " + key + " = " + value + ";\n";
                    serverRunsForTheFirstTime = false;
                }
                else
                    buffer += key + " = " + value + ";\n";
            }
        }
        /*mark the end of global variables declarations*/
        buffer += "\n/*END-OF-BLOBAL-VARIALE-DECLARATION-55522555*/\n";
        this.visitChildren(ast);
    };
    GenerateCode.prototype.visitChildren = function (node) {
        var children = node.children;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            switch (child.type) {
                case "Tag":
                    this.visitTag(child);
                    break;
                case "SelfClosingTag":
                    this.visitSelfClosingTag(child);
                    break;
                case "Text":
                    this.visitText(child);
                    break;
                case "JsCode":
                    this.visitJsCode(child);
                    break;
                case "InnerHTML":
                    this.visitInnerHTML(child);
                    break;
                case "DynamicData":
                    this.visitDynamicData(child);
                    break;
                case "DocType":
                    this.visitDocType(child);
                    break;
                default:
                    throw new Error("Unknown token type, " + child.type);
            }
        }
    };
    Object.defineProperty(GenerateCode.prototype, "byteCode", {
        get: function () { return buffer; },
        enumerable: false,
        configurable: true
    });
    GenerateCode.prototype.visitTag = function (node) {
        if (node.ifStatement) {
            this.visitIfStatement(node.ifStatement);
            buffer += "template += \"<" + node.name + "\";\n";
            this.visitAttributes(node);
            buffer += "template += \">\";\n";
            /*
                if its selfclosing tag then,
                we stop here since it does not have
                children or forstatement
            */
            if (node.type === "SelfClosingTag")
                return;
            if (node.forStatement) {
                this.visitForStatement(node);
            }
            else {
                this.visitChildren(node);
            }
            buffer += "template += \"</" + node.name + ">\";\n";
            buffer += "}\n";
        }
        else {
            buffer += "template += \"<" + node.name + "\";\n";
            this.visitAttributes(node);
            buffer += "template += \">\";\n";
            /*
                if its selfclosing tag then,
                we stop here since it does not have
                children of forstatement
            */
            if (node.type === "SelfClosingTag")
                return;
            if (node.forStatement) {
                this.visitForStatement(node);
            }
            else {
                this.visitChildren(node);
            }
            buffer += "template += \"</" + node.name + ">\";\n";
        }
    };
    GenerateCode.prototype.visitDocType = function (node) {
        buffer += "template += \"" + node.value + "\";\n";
    };
    GenerateCode.prototype.visitForStatement = function (node) {
        var forStatementExpression = node.forStatement.slice(2, -2).trim();
        buffer += forStatementExpression + "{\n";
        this.visitChildren(node);
        buffer += "}\n";
    };
    GenerateCode.prototype.visitIfStatement = function (ifStatement) {
        var expression = ifStatement.substring(2, ifStatement.length - 2).trim();
        buffer += expression + "{\n";
    };
    GenerateCode.prototype.visitSelfClosingTag = function (node) {
        this.visitTag(node);
    };
    GenerateCode.prototype.visitAttributes = function (node) {
        var attributes = node.attributes;
        for (var i = 0; i < attributes.length; i++) {
            var attr = attributes[i];
            buffer += "template += ` " + attr + "`;\n";
        }
    };
    GenerateCode.prototype.visitText = function (node) {
        buffer += "template += `" + node.value + "`;\n";
    };
    GenerateCode.prototype.visitJsCode = function (node) {
        buffer += "template += `" + node.value + "`;\n";
    };
    GenerateCode.prototype.visitInnerHTML = function (node) {
        buffer += "template += `" + node.value + "`;\n";
    };
    GenerateCode.prototype.visitDynamicData = function (node) {
        var val = node.value.slice(2, -2);
        buffer += "template += " + val + ";\n";
    };
    return GenerateCode;
}());
function render(tmplateSrsCode, file, data) {
    var tokens = new lexer_1.Lexer(tmplateSrsCode, "index.html").tokenize();
    var AST = JSON.parse(JSON.stringify(new parser_1.Parser(tokens, data).ast));
    var template = new GenerateCode(AST, data, file).byteCode;
    var output = new Function(template + "return template;\n")();
    return output;
    // let output;
    // if (mode === "development") {
    //   let output = new Function(template + "return template;\n")();
    //   return output;
    // } else {
    //   try {
    //     output = new Function(template + "return template;\n")();
    //     return output;
    //   } catch (e) {
    //     console.error("failed to compile: " + e);
    //     return output;
    //     //return "<h1 style='color: red'>failed to compile</h1>"
    //   }
    // }
}
exports.render = render;
function engine(filePath, options, callback) {
    fs.readFile(filePath, function (err, content) {
        if (err)
            return callback(err);
        var res = render(content.toString(), filePath, options);
        return callback(null, res);
    });
}
exports.engine = engine;
