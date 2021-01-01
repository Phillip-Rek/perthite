export declare type Pos = {
    col: number;
    row: number;
    file?: string;
}
export declare type Token = {
    type: string;
    val: string;
    tagName?: string;
    pos: Pos;
}
const ifStatement_Re = /if=["][ \w=<>&.\-_'"&\(\)\|]+["]/;
const ifStatement_Re_2 = /{{[ ]*if\([ \w.$\[\]"'=<>+\-,&\(\)\|]+\)[ ]*}}/;
const elseIfStatement_Re = /else-if=["][ \w=<>&.\-_'"&\(\)\|]+["]/;
const elseIfStatement_Re_2 = /{{[ ]*else if\([ \w.$\[\]"'=<>+\-,'"&\(\)\|]+\)[ ]*}}/;
const elseStatement_Re = /else/;
const elseStatement_Re_2 = /{{[ ]*else[ ]*}}/;
const forStatement_Re = /for=["']let[ \w.$\[\],;:'"]+['"]/;
const forStatement_Re_2 = /{{[ ]*for\([ a-zA-Z0-9_\w.$\[\]=<>\-+,]+\)[ ]*}}/;
export const forEach_Re = /{{[ ]*[a-zA-Z0-9.\[\]_]+[.]forEach\(\([ a-zA-Z0-9,._]+\)=>\)[ ]*}}/;
const on_Re = /\*on[a-z]+="[ a-z0-9_\(\).,]+"/i;
const text_Re = /[ \w"'=\(\)\n\t!&^%$#@\-:_+\\/,.?\[\]>]+/i;
const openTagStart_Re = /<[-_;:&%$#@+=*\w]+/i;
const attribute_Re = /[-_:&$#@*\w]+=["|'][ '\w\-_.:&$#@\(\)\{\}*]+['|"]/i;
const dynamicAttr_Re = /[-_:*a-z0-9]+={{[ a-z0-9._\[\]]+}}/i;
const css_Re = /style=["'][a-z\-\;0-9\: ]+['"]/i;
const link_Re = /href=["'][a-z\-\;0-9\://. ]+['"]/i;
const dynamicData_Re = /{{[ ]*[a-z0-9_.$\[\]\(\)\+"'\-_, ]+[ ]*}}/i;
const closeTag_Re = /<\/[-_;:&%$#@+=*\w]+>/i;
const javascriptSrc_Reg = /<script>[ \w"'=\(\)\n\t!&^%$#@\-:_<>+\/,.\?\[\]><?;\\]+<\/script>/i;
export class Lexer {
    private pos: Pos = { col: 1, row: 1 };
    private cursor: number;
    private tokens: Array<Token> = [];
    private currentStatus: string;
    constructor(private input: string) {
        this.cursor = 0;
        for (; ;) {
            if (this.openTagStart) {
                if (this.openTagStart === "<script") {
                    let jsCodeEnd = this.input.indexOf("</script>", this.cursor)
                    let jsCode = "\n" + this.input.slice(this.cursor, jsCodeEnd + 9)
                    this.tokens.push({
                        type: "Text",
                        val: jsCode,
                        pos: Object.freeze({ ...this.pos })
                    })
                    this.consume(jsCode)
                }
                else {
                    this.tokens.push({
                        type: "OpenTagStart",
                        val: this.openTagStart,
                        tagName: this.openTagStart.substring(1),
                        pos: Object.freeze({ ...this.pos })
                    })
                    this.currentStatus = "attributes"
                    this.consume(this.openTagStart)
                }
            }
            else if (this.dynamicAttr) {
                this.tokens.push({
                    type: "DynamicAttribute",
                    val: this.dynamicAttr,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.dynamicAttr)
            }
            else if (this.css) {
                this.tokens.push({
                    type: "CSS",
                    val: this.css,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.css)
            }
            else if (this.link) {
                this.tokens.push({
                    type: "Attribute",
                    val: this.link,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.link)
            }
            else if (this.elseIfStatement) {
                this.tokens.push({
                    type: "ElseIfStatement",
                    val: this.elseIfStatement,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.elseIfStatement)
            }
            else if (this.elseStatement) {
                this.tokens.push({
                    type: "ElseStatement",
                    val: this.elseStatement,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.elseStatement)
            }
            else if (this.ifStatement) {
                this.tokens.push({
                    type: "IfStatement",
                    val: this.ifStatement,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.ifStatement)
            }
            else if (this.ifStatement2) {
                this.tokens.push({
                    type: "IfStatement",
                    val: this.ifStatement2,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.ifStatement2)
            }
            else if (this.forStatement2) {
                this.tokens.push({
                    type: "ForStatement",
                    val: this.forStatement2,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.forStatement2)
            }
            else if (this.forStatement) {
                this.tokens.push({
                    type: "ForStatement",
                    val: this.forStatement,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.forStatement)
            }
            else if (this.forEach) {
                this.tokens.push({
                    type: "ForStatement",
                    val: this.forEach,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.forEach)
            }
            else if (this.on) {
                this.tokens.push({
                    type: "Event",
                    val: this.on,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.on)
            }
            else if (this.attribute) {
                this.tokens.push({
                    type: "Attribute",
                    val: this.attribute,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.attribute)
            }
            else if (this.selfClosingTag) {
                this.tokens.push({
                    type: "SelfClosingTag",
                    val: this.selfClosingTag,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.selfClosingTag)
            }
            else if (this.openTagEnd) {
                this.currentStatus = "innerHTML"
                this.tokens.push({
                    type: "OpenTagEnd",
                    val: this.openTagEnd,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.openTagEnd)
            }
            else if (this.whiteSpace) {
                let lastToken = this.tokens[this.tokens.length - 1].type
                if (
                    lastToken !== "CloseTag" &&
                    lastToken !== "SelfClosingTag"
                ) {
                    this.tokens.push({
                        type: "Text",
                        val: this.whiteSpace,
                        pos: Object.freeze({ ...this.pos })
                    })
                }
                this.consume(this.whiteSpace);
            }
            else if (this.input[0] === "\n") {
                this.newLIne()
                this.consume("\n")
            }
            else if (this.dynamicData) {
                let type: string;
                if (this.dynamicData.search(elseStatement_Re_2) > -1 && this.currentStatus === "attributes") {
                    type = "IfStatement"
                } else {
                    type = "DynamicData"
                }

                this.tokens.push({
                    type,
                    val: this.dynamicData,
                    pos: Object.freeze({ ...this.pos })
                })

                this.consume(this.dynamicData)
            }
            else if (this.text) {
                let type = this.currentStatus = "innerHTML" ?
                    "Text" : "Attribute";
                this.tokens.push({
                    type,
                    val: this.text,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.text);
            }
            else if (this.closeTag) {
                this.tokens.push({
                    type: "CloseTag",
                    val: this.closeTag,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.closeTag)
            }
            else if (this.comparisonOp) {
                this.tokens.push({
                    type: "Text",
                    val: this.comparisonOp,
                    pos: Object.freeze({ ...this.pos })
                })
                this.consume(this.comparisonOp);
            }
            else if (this.eof) {
                this.tokens.push({
                    type: "eof",
                    val: "eof",
                    pos: Object.freeze({ ...this.pos })
                })
                break;
            }
            else {
                this.next()
            }
        }
    }
    private next() {
        this.pos.col++;
        this.cursor++;
        this.input = this.input.substring(1)
    }
    private consume(lexeme: string) {
        this.pos.col += lexeme.length;
        this.input = this.input.substring(lexeme.length)
    }
    private newLIne() {
        this.pos.row++;
        this.pos.col = -1;
    }
    private get eof() {
        return this.input[this.cursor] === undefined;
    }
    private get openTagStart() {
        if (this.doesNotContain(openTagStart_Re)) return false;
        let opTag = this.input.match(openTagStart_Re)[0];
        return this.input.indexOf(opTag) === 0 && opTag;
    }
    private get attribute() {
        if (this.doesNotContain(attribute_Re)) return false;
        let attr = this.input.match(attribute_Re)[0];
        return this.input.indexOf(attr) === 0 && attr;
    }
    private get css() {
        if (this.doesNotContain(css_Re)) return false;
        let style = this.input.match(css_Re)[0];
        return this.input.indexOf(style) === 0 && style;
    }
    private get link() {
        if (this.doesNotContain(link_Re)) return false;
        let link = this.input.match(link_Re)[0];
        return this.input.indexOf(link) === 0 && link;
    }
    private get dynamicAttr() {
        if (this.doesNotContain(dynamicAttr_Re)) return false;
        let attr = this.input.match(dynamicAttr_Re)[0];
        return this.input.indexOf(attr) === 0 && attr;
    }
    private get openTagEnd() {
        if (this.doesNotContain(">")) return false;
        let tagENd = this.input.match(">")[0];
        return this.input.indexOf(tagENd) === 0 && tagENd;
    }
    public get selfClosingTag() {
        if (this.doesNotContain("/>")) return false;
        let tagENd = this.input.match("/>")[0];
        return this.input.indexOf(tagENd) === 0 && tagENd;
    }
    private get dynamicData() {
        if (this.doesNotContain(dynamicData_Re)) return false;
        let identifier = this.input.match(dynamicData_Re)[0];
        return this.input.indexOf(identifier) === 0 && identifier;
    }
    private get comparisonOp() {
        let compOp_Re = /[<>]/;
        if (this.doesNotContain(compOp_Re)) return false;
        let identifier = this.input.match(compOp_Re)[0];
        return this.input.indexOf(identifier) === 0 && identifier;
    }
    private get closeTag() {
        if (this.doesNotContain(closeTag_Re)) return false;
        let closeTag = this.input.match(closeTag_Re)[0];
        return this.input.indexOf(closeTag) === 0 && closeTag;
    }
    private get text() {
        if (this.doesNotContain(text_Re)) return false;
        let text = this.input.match(text_Re)[0];
        return this.input.indexOf(text) === 0 && text;
    }
    private get whiteSpace() {
        if (this.doesNotContain(/[ \t]+/)) return false;
        let whiteSpace = this.input.match(/[ \t]+/)[0];
        return this.input.indexOf(whiteSpace) === 0 && whiteSpace;
    }
    private get ifStatement() {
        if (this.doesNotContain(ifStatement_Re)) return false;
        let res = this.input.match(ifStatement_Re)[0];
        return this.input.indexOf(res) === 0 && res;
    }
    private get ifStatement2() {
        if (this.doesNotContain(ifStatement_Re_2)) return false;
        let res = this.input.match(ifStatement_Re_2)[0];
        return this.input.indexOf(res) === 0 && res;
    }
    private get elseIfStatement() {
        if (!this.doesNotContain(elseIfStatement_Re)) {
            let res = this.input.match(elseIfStatement_Re)[0];
            return this.input.indexOf(res) === 0 && res;
        }
        if (!this.doesNotContain(elseIfStatement_Re_2)) {
            let res = this.input.match(elseIfStatement_Re_2)[0];
            return this.input.indexOf(res) === 0 && res;
        }
        return false;
    }
    private get elseStatement() {
        if (!this.doesNotContain(elseStatement_Re)) {
            let res = this.input.match(elseStatement_Re)[0];
            return this.input.indexOf(res) === 0 && res;
        }
        if (this.input.search(elseStatement_Re_2) !== -1) {
            let res = this.input.match(elseStatement_Re_2)[0];
            return this.input.indexOf(res) === 0 && res;
        }
        return false;
    }
    private get forStatement() {
        if (this.doesNotContain(forStatement_Re)) return false;
        let forStatement = this.input.match(forStatement_Re)[0];
        return this.input.indexOf(forStatement) === 0 && forStatement;
    }
    private get forStatement2() {
        if (this.doesNotContain(forStatement_Re_2)) return false;
        let forStatement = this.input.match(forStatement_Re_2)[0];
        return this.input.indexOf(forStatement) === 0 && forStatement;
    }
    private get lexJSCode() {
        if (this.doesNotContain(javascriptSrc_Reg)) return false;
        let forStatement = this.input.match(forStatement_Re)[0];
        return this.input.indexOf(forStatement) === 0 && forStatement;
    }
    private get forEach() {
        if (this.doesNotContain(forEach_Re)) return false;
        let foreach = this.input.match(forEach_Re)[0];
        return this.input.indexOf(foreach) === 0 && foreach;
    }
    private get on() {
        if (this.doesNotContain(on_Re)) return false;
        let on = this.input.match(on_Re)[0];
        return this.input.indexOf(on) === 0 && on;
    }
    public tokenize() {
        return this.tokens;
    }
    private doesNotContain(arg: RegExp | string) {
        return this.input.search(arg) === -1
    }
}
