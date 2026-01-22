/**
 * DMN XML 파싱 유틸리티
 */
export function parseDmnXml(xmlString) {
    if (!xmlString) return null;
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        // 파싱 에러 확인
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.warn('XML 파싱 에러:', parserError.textContent);
            return null;
        }

        const result = {
            decision: null,
            inputs: [],
            outputs: [],
            rules: [],
            hitPolicy: null
        };

        // Decision 정보 추출
        const decision = xmlDoc.querySelector('decision');
        if (decision) {
            result.decision = {
                id: decision.getAttribute('id') || '',
                name: decision.getAttribute('name') || ''
            };

            // Decision Table 정보 추출
            const decisionTable = decision.querySelector('decisionTable');
            if (decisionTable) {
                result.hitPolicy = decisionTable.getAttribute('hitPolicy') || 'UNIQUE';

                // Inputs 추출
                const inputs = decisionTable.querySelectorAll('input');
                inputs.forEach((input, index) => {
                    const inputExpression = input.querySelector('inputExpression');
                    const inputText = inputExpression ? inputExpression.querySelector('text')?.textContent || '' : '';
                    result.inputs.push({
                        id: input.getAttribute('id') || `input_${index}`,
                        label: input.getAttribute('label') || '',
                        typeRef: inputExpression?.getAttribute('typeRef') || '',
                        expression: inputText
                    });
                });

                // Outputs 추출
                const outputs = decisionTable.querySelectorAll('output');
                outputs.forEach((output, index) => {
                    result.outputs.push({
                        id: output.getAttribute('id') || `output_${index}`,
                        label: output.getAttribute('label') || '',
                        name: output.getAttribute('name') || '',
                        typeRef: output.getAttribute('typeRef') || ''
                    });
                });

                // Rules 추출
                const rules = decisionTable.querySelectorAll('rule');
                rules.forEach((rule, index) => {
                    const ruleData = {
                        id: rule.getAttribute('id') || `rule_${index}`,
                        inputs: [],
                        outputs: []
                    };

                    // Rule의 Input Entry 추출
                    const inputEntries = rule.querySelectorAll('inputEntry');
                    inputEntries.forEach((entry, entryIndex) => {
                        const text = entry.querySelector('text')?.textContent || '';
                        ruleData.inputs.push({
                            index: entryIndex,
                            value: text
                        });
                    });

                    // Rule의 Output Entry 추출
                    const outputEntries = rule.querySelectorAll('outputEntry');
                    outputEntries.forEach((entry, entryIndex) => {
                        const text = entry.querySelector('text')?.textContent || '';
                        ruleData.outputs.push({
                            index: entryIndex,
                            value: text
                        });
                    });

                    result.rules.push(ruleData);
                });
            }
        }

        return result;
    } catch (error) {
        console.error('DMN XML 파싱 실패:', error);
        return null;
    }
}

/**
 * 두 규칙이 같은지 비교
 */
export function isRuleEqual(rule1, rule2) {
    if (!rule1 && !rule2) return true;
    if (!rule1 || !rule2) return false;
    
    if (rule1.inputs.length !== rule2.inputs.length) return false;
    if (rule1.outputs.length !== rule2.outputs.length) return false;
    
    for (let i = 0; i < rule1.inputs.length; i++) {
        if (rule1.inputs[i].value !== rule2.inputs[i].value) return false;
    }
    
    for (let i = 0; i < rule1.outputs.length; i++) {
        if (rule1.outputs[i].value !== rule2.outputs[i].value) return false;
    }
    
    return true;
}

/**
 * 규칙의 변경 타입 확인
 */
export function getRuleChangeType(prevRule, currRule, prevIndex, currIndex) {
    if (!prevRule && currRule) return 'added';
    if (prevRule && !currRule) return 'removed';
    if (prevRule && currRule && !isRuleEqual(prevRule, currRule)) return 'modified';
    return 'unchanged';
}

