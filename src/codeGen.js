"use strict";
exports.__esModule = true;
exports.engine = exports.render = void 0;
var parser_1 = require("./parser");
var lexer_1 = require("./lexer");
var fs = require("fs");
var mode = process.env.NODE_ENV || "development";
var templateBuffer = 'let template = \`\`\n';
var buffer = "";
var globalVars = "";
var status;
var GenerateCode = /** @class */ (function () {
    function GenerateCode(ast, data, file) {
        this.blockStatementsStack = 0;
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
        this.file = file;
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
                case "number":
                case "boolean":
                case "function":
                    expression = expression;
                    break;
                default:
                    expression = "`" + expression + "`";
                    break;
            }
            if (!status) {
                globalVars += "let " + identifier + " = " + expression + ";\n";
                buffer += "let " + identifier + " = " + expression + ";\n";
            }
            else {
                globalVars += identifier + " = " + expression + ";\n";
                buffer += identifier + " = " + expression + ";\n";
            }
        }
        status = true;
        this.visitChildren(node);
    };
    GenerateCode.prototype.visitChildren = function (node) {
        var children = node.children;
        var typ = node.name && node.name === "script" && "Text";
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            child.type = typ ? typ : child.type;
            new GenerateCode(child, this.data, this.file);
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
        //if an element has a forStatement, then a forStatement
        //will render it
        if (!node.ForStatement) {
            buffer = buffer.concat("template += \">\";\n");
            this.visitChildren(node);
        }
        buffer = buffer.concat("template += \`</" + node.name + ">\`;\n");
    };
    GenerateCode.prototype.visitOpenTag = function (node) {
        buffer = buffer.concat("template += \`<" + node.name + "\`;\n");
    };
    GenerateCode.prototype.vivitAttributes = function (node) {
        var identifier = /\w={{[ ]*[a-z0-9._\[\]]+[ ]*}}/i;
        for (var _i = 0, _a = node.attributes; _i < _a.length; _i++) {
            var attr = _a[_i];
            if (attr.search(identifier) > -1) {
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
            return;
        var statement = node.ifStatement.val;
        var statementForTest = statement.slice(2, -2).trim();
        if (statement.search(/{{[ ]*else if\(/) === 0) {
            var start = statement.indexOf("else if");
            var end = statement.lastIndexOf(")") + 1;
            statement = statement.slice(start, end);
            statementForTest = "if(false){}" + statement;
        }
        else if (statement.search(/{{[ ]*else[ ]*}}/) === 0) {
            statement = statement.slice(2, -2).trim();
            statementForTest = "if(false){}" + statement;
        }
        else {
            var start = statement.indexOf("if");
            var end = statement.lastIndexOf(")") + 1;
            statement = statement.slice(start, end);
            statementForTest = statement;
        }
        //we know that node.locals contains identifiers
        //of all declared variables so we redeclare them
        //to to able to handle errors
        var locals = '';
        for (var _i = 0, _a = node.locals; _i < _a.length; _i++) {
            var local = _a[_i];
            if (globalVars.search(new RegExp("let " + local)) === -1) {
                locals += local + ";\n";
            }
        }
        if (mode === "development") {
            statementForTest = globalVars + locals + statementForTest;
            try {
                new Function(statementForTest + "{}")();
            }
            catch (e) {
                console.error(e + " at line " +
                    node.ifStatement.line + ", col " +
                    node.ifStatement.col + " " +
                    ", file " + this.file +
                    ", src: " + node.ifStatement.val);
            }
        }
        buffer += statement + "{\n";
        //remove ifStatement to avoid recursion
        node.ifStatement = null;
        this.visitHTMLElement(node);
        buffer += "}\n";
        return true;
    };
    GenerateCode.prototype.visitForStatement2 = function (node) {
        if (!node.ForStatement)
            return;
        //end an open-tag-start
        buffer += "template +=`>`\n";
        var statement = node.ForStatement.val;
        var statementForTest;
        if (statement.search(lexer_1.forEach_Re) > -1) {
            statement = statement.slice(2, -2).trim();
            statement = statement.slice(0, statement.lastIndexOf("=>"));
            buffer += statement + "=>{\n";
            this.visitChildren(node);
            buffer += "\n})\n";
            statementForTest = globalVars + "\n" + statement + "=>{})";
        }
        else {
            statement = statement.slice(2, -2).trim();
            buffer += statement + "{\n";
            this.visitChildren(node);
            buffer += "}\n";
            statementForTest = globalVars + "\n" + statement + "{}";
        }
        if (mode === "development") {
            try {
                new Function(statementForTest)();
            }
            catch (e) {
                console.error(e + " at line " +
                    node.ForStatement.line + " col " +
                    node.ForStatement.col + " " +
                    node.ForStatement.val);
            }
        }
    };
    GenerateCode.prototype.visitText = function (node) {
        buffer += "template += \`" + node.val + "\`;\n";
    };
    GenerateCode.prototype.visitDynamicData = function (node) {
        var val = node.val.slice(2, -2).trim();
        //get a variable from expression like users[0]
        //let variable = this.extractLocalVariable(val)
        //check if a variable was declared
        // if (buffer.search("let " + variable) === -1) {
        //     this.refErr(node)
        // }
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
function render(tmplateSrsCode, file, data) {
    // if (!tmplateSrsCode) {
    //     tmplateSrsCode = fs.readFileSync(file, "utf8").toString()
    // }
    var tokens = new lexer_1.Lexer(tmplateSrsCode).tokenize();
    var AST = JSON.parse(JSON.stringify(new parser_1.Parser(tokens).getAST()));
    var template = new GenerateCode(AST, data, file).compile();
    //    fs.writeFileSync(__dirname + '/template.js', template, "utf8")
    var output;
    if (mode === "development") {
        var output_1 = new Function(template + "return template;\n")();
        return output_1;
    }
    else {
        try {
            output = new Function(template + "return template;\n")();
            return output;
        }
        catch (e) {
            console.error("failed to compile: " + e);
            return output;
            //return "<h1 style='color: red'>failed to compile</h1>"
        }
    }
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
