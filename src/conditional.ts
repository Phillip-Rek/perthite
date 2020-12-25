class ConditionalRender {
    constructor() {
        let output: Boolean;
        Array.from(document.querySelectorAll("[p-if]"))
            .forEach((ifStatementElement: HTMLElement) => {
                let condition = ifStatementElement.attributes.getNamedItem('p-if').value
                output = ifStatement(condition);
                elseIf(output, ifStatementElement);
                if (output === false) ifStatementElement.remove()
            });

        function ifStatement(condition: String): Boolean {
            let conditionMembers: String[] = condition.split(" ");
            let result: Boolean;
            result = checkConditions(conditionMembers, result);
            return result;
        }

        function elseIf(output: Boolean, ifStatementElement: HTMLElement | Element) {
            if (ifStatementElement.nextElementSibling === null)
                return;
            if (ifStatementElement.nextElementSibling.attributes.getNamedItem("p-else-if") === null)
                return;
            let elseiftElement = ifStatementElement.nextElementSibling;
            if (output === true) {
                while (elseiftElement.attributes.getNamedItem("p-else-if") !== null) {
                    elseiftElement = ifStatementElement.nextElementSibling;
                    elseiftElement.remove();
                }
                _else(output, elseiftElement);

            }
            else {
                let condition = elseiftElement.attributes.getNamedItem("p-else-if").value
                let conditionMembers: String[] = condition.split(" ");

                output = checkConditions(conditionMembers, output)
                if (output === false) {
                    elseIf(output, elseiftElement);
                    elseiftElement.remove();
                }
                else {
                    _else(output, elseiftElement.nextElementSibling)
                }
            }
        }

        function _else(output: Boolean, elseElement: HTMLElement | Element) {
            if (output === true) {
                elseElement.remove()
            }
            else {
                console.log(elseElement)
            }
        }

        function evaluate(
            conditionMembers: String[],
            i: number,
            operator: String
        ): Boolean {
            if (operator === "===") {
                return conditionMembers[i - 1] === conditionMembers[i + 1] ?
                    true : false;
            }
            else if (operator === "!==") {
                return conditionMembers[i - 1] !== conditionMembers[i + 1] ?
                    true : false;
            }
            else if (operator === '>') {
                return conditionMembers[i - 1] > conditionMembers[i + 1] ?
                    true : false;
            }
            else if (operator === '<') {
                return conditionMembers[i - 1] < conditionMembers[i + 1] ?
                    true : false;
            }
            else if (operator === '>=') {
                return conditionMembers[i - 1] >= conditionMembers[i + 1] ?
                    true : false;
            }
            else if (operator === '>=') {
                return conditionMembers[i - 1] >= conditionMembers[i + 1] ?
                    true : false;
            }
        }
        function checkConditions(
            conditionMembers: String[],
            result: Boolean
        ): Boolean {
            conditionMembers.forEach((member, i) => {
                if (member === "&&") {
                    result = evaluate(conditionMembers, i - 2, conditionMembers[i - 2]);
                    result = result === true ? evaluate(conditionMembers, i + 2, conditionMembers[i - 2]) : false;
                }
                else if (member === "||") {
                    result = evaluate(conditionMembers, i - 2, conditionMembers[i - 2]);
                    result = result === false ? evaluate(conditionMembers, i + 2, conditionMembers[i - 2]) : true;
                }
                else if (conditionMembers.length === 3) {
                    //no multiple logic statements e.g 1===1 && 1===2
                    result = evaluate(conditionMembers, 1, conditionMembers[1])
                }
            })
            return result;
        }
    }
}

new ConditionalRender() 