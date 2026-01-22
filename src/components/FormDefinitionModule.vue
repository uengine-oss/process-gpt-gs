<script>
export default {
    methods: {
        /**
         * 마지막 최종 결과 Html이 표시된 JSON을 추출하기 위해서
         */
         extractLastJSON(inputString) {
            let textFragments = [];
            if (typeof inputString === 'string' && inputString.includes('```')) {
                textFragments = inputString.split('```');
            } else {
                console.warn('Invalid input string or no code blocks found');
                return null; // or handle this case as appropriate for your application
            }
            for (let i = textFragments.length - 1; i >= 0; i--) {
                const textFragment = textFragments[i];
                if (!textFragment.includes('{') || !textFragment.includes('}')) continue;
                if (!textFragment.includes('htmlOutput') && !textFragment.includes('modifications')) continue;
                const isFirstCreated = textFragment.includes('htmlOutput');

                let fragmentToParse = '';
                try {
                    const processedFragment = textFragment
                        .match(/\{[\s\S]*\}/)[0]
                        .replaceAll('\n', '')
                        .replaceAll('`', `"`); // JSON에서 유효하지 않은 '\n', '`' 문자 제거

                    // AI가 잘못된 응답을 냈을 경우, 이를 대응하기 위한 수단들

                    // AI 응답이 `"` 문자열을 '\'로 파싱하지 않은 경우, 수동으로 파싱하기 위해서
                    if (isFirstCreated) {
                        const matchedHtmlOutput = processedFragment.match(/"htmlOutput"\s*:\s*"(.*)".*}/)[1];
                        if (matchedHtmlOutput.includes(`\\"`)) fragmentToParse = processedFragment;
                        else fragmentToParse = processedFragment.replace(matchedHtmlOutput, matchedHtmlOutput.replaceAll(`"`, `\\"`));
                    } else {
                        const matchedItems = [...processedFragment.matchAll(/items='\[(.*?)\]'>/g)].map((g) => g[1]);

                        fragmentToParse = processedFragment;
                        if (matchedItems) {
                            for (let j = 0; j < matchedItems.length; j++) {
                                const matchedItem = matchedItems[j];
                                if (!matchedItem.includes(`\\"`))
                                    fragmentToParse = fragmentToParse.replace(matchedItem, matchedItem.replaceAll(`"`, `\\"`));
                            }
                        }
                    }

                    // AI 응답이 items에서 items='[{'남자':'male'},{'여자':'female'}' 와 같이 '안에서 "로 감싸지 않은 경우, 이를 대응하기 위해서
                    const matchedItems = [...fragmentToParse.matchAll(/items='\[(.*?)\]'>/g)].map((g) => g[1]);
                    if (matchedItems) {
                        for (let j = 0; j < matchedItems.length; j++) {
                            const matchedItem = matchedItems[j];
                            if (matchedItem.includes(`'`)) {
                                fragmentToParse = fragmentToParse.replace(matchedItem, matchedItem.replaceAll(`'`, `\\"`));
                            }
                        }
                    }

                    // AI 응답에서 code-field 관련 필드의 문자열들을 파싱하기 위해서
                    const matchedCodeFields = [...fragmentToParse.matchAll(/<code-field .*?>(.*)<\/code-field>/g)].map((g) => g[1]);
                    if (matchedCodeFields) {
                        for (let j = 0; j < matchedCodeFields.length; j++) {
                            const matchedCodeField = matchedCodeFields[j];
                            if (!matchedCodeField.includes(`\\\\`)) {
                                fragmentToParse = fragmentToParse.replace(matchedCodeField, matchedCodeField.replaceAll(`\\`, `\\\\`));
                            }
                        }
                    }

                    // AI가 ">\"와 같은 이상한 응답을 하는 경우, 이를 제거하기 위해서
                    fragmentToParse = fragmentToParse.replace(/>\\n\\/g, '>');
                    fragmentToParse = fragmentToParse.replace(/>\\n/g, '>');
                    fragmentToParse = fragmentToParse.replace(/>\\/g, '>');
                    
                    // 문자열 내부의 제어 문자와 이스케이프 문자 처리 개선
                    // 백슬래시를 모두 제거하는 대신 JSON 파싱을 위한 적절한 이스케이프 처리
                    fragmentToParse = fragmentToParse.replace(/\\n/g, '\\\\n');
                    fragmentToParse = fragmentToParse.replace(/\\'/g, '\\\\\'');
                    
                    // 파싱 가능한 형태로 추가 보정
                    fragmentToParse = fragmentToParse.replace(/\\"/g, '\\\\"');
                } catch (error) {
                    console.log('### 유효 문자열을 JSON에 적합한 문자열로 변환시키는 과정에서 오류 발생! ###');
                    console.log(error);
                    console.log(textFragment);
                    return null;
                }

                try {
                    // 단계적 파싱 시도 함수 추가
                    function partialParse(str) {
                        try {
                            // 정규식을 사용하여 JSON 구조의 문제를 해결
                            const cleanedStr = str
                                .replace(/\\\\n/g, '\\n')  // 이스케이프된 줄바꿈 정규화
                                .replace(/\\\\\"/g, '\\"')  // 이스케이프된 따옴표 정규화
                                .replace(/\\\\/g, '\\');   // 중복 백슬래시 정규화
                            
                            return JSON.parse(cleanedStr);
                        } catch(e) {
                            console.log('부분 파싱 시도 실패:', e);
                            throw e;
                        }
                    }
                    
                    try {
                        return JSON.parse(fragmentToParse);
                    } catch (error) {
                        return partialParse(fragmentToParse);
                    }
                } catch (error) {
                    console.log('### JSON 문자열을 최종 파싱하는 과정에서 오류 발생! ###');
                    console.log(error);
                    console.log(textFragment);
                    console.log(fragmentToParse);
                    return null;
                }
            }

            return null;
        },
        
        /**
         * KEditor에서 추출한 내용을 실제로 DynamicForm 컴포넌트에 적용할 수 있는 형태로 변환시키기 위해서
         */
        keditorContentHTMLToDynamicFormHTML(html, isRewrite = false) {
            const dom = new DOMParser().parseFromString(html, 'text/html');


            // 이름 중복 여부를 검사하고 자동으로 고유하게 만들기
            const nameSet = new Set();
            const nameCountMap = new Map(); // 이름별 카운터
            
            (dom.querySelectorAll('[name]')).forEach((el) => {
                let name = el.getAttribute('name');
                if(!name || name.length <= 0) return;

                // 중복된 이름이면 고유하게 만들기
                if (nameSet.has(name)) {
                    const originalName = name;
                    let counter = nameCountMap.get(originalName) || 1;
                    
                    // 고유한 이름이 될 때까지 카운터 증가
                    do {
                        counter++;
                        name = `${originalName}_${counter}`;
                    } while (nameSet.has(name));
                    
                    nameCountMap.set(originalName, counter);
                    
                    // 실제 DOM 요소의 name 속성 업데이트
                    el.setAttribute('name', name);
                    console.warn(`중복된 이름 '${originalName}'을 '${name}'으로 자동 변경했습니다.`);
                } else if (!nameCountMap.has(name)) {
                    // 첫 번째 등장이면 카운터 초기화
                    nameCountMap.set(name, 0);
                }
                
                nameSet.add(name);
            });


            const rows = dom.querySelectorAll('div.row');

            // rows의 is_multidata_mode가 true인 경우, 그 안에는 code-field가 존재하면 안되며, 그럴경우, 예외 발생
            for(let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const isMultiDataMode = row.getAttribute('is_multidata_mode');
                if (isMultiDataMode === "true") {
                    const codeField = row.querySelector('code-field');
                    if(codeField) throw new Error(`multidataMode가 설정된 레이아웃 안에 code-field가 존재할 수 없습니다.`);
                }
            }
            

            rows.forEach(row => {
                const isMultiDataMode = row.getAttribute('is_multidata_mode');
                if (!isMultiDataMode || (isMultiDataMode === 'false')) {
                    // row의 부모 노드를 계속 탐색해서. 그 노드가 is_multidata_mode="true"의 속성을 가졌는지 확인함
                    let isPerentNodeMultiDataMode = false;
                    let parentNode = row.parentNode;
                    while(parentNode && parentNode.tagName.toLowerCase() !== 'body') {
                        if(parentNode.getAttribute('is_multidata_mode') === "true") {
                            isPerentNodeMultiDataMode = true;
                            break;
                        }
                        parentNode = parentNode.parentNode;
                    }
                    

                    const newRow = document.createElement('row-layout');
                    

                    newRow.setAttribute('name', row.getAttribute('name') ?? "");
                    newRow.setAttribute('alias', row.getAttribute('alias') ?? "");
                    newRow.setAttribute('is_multidata_mode', row.getAttribute('is_multidata_mode') ?? "false");

                    newRow.setAttribute('v-model', (isPerentNodeMultiDataMode) ? 'item' : 'formValues');
                    newRow.setAttribute('v-slot', 'slotProps');


                    const innerRow = document.createElement('div');
                    innerRow.setAttribute('class', 'row');

                    Array.from(row.children).forEach(child => {
                        innerRow.appendChild(child);
                    });


                    $(innerRow).children('[class^="col-sm-"]').children('[name]').each(function () {
                        var field = ($(this))[0];
                        
                        if(field.tagName.toLowerCase() === "code-field") {
                            const name = field.getAttribute('name');
                            field.setAttribute('v-model', `codeInfos['${name}']`);

                            const event_type = field.getAttribute('event_type');
                            if(event_type === "click") {
                                field.setAttribute('v-on:on_click', `executeCode('${name}')`);
                            }
                        } else {
                            const name = field.getAttribute('name');
                            field.setAttribute('v-model', `slotProps.modelValue['${name}']`);
                        }
                    });


                    newRow.appendChild(innerRow);

                    row.parentNode.replaceChild(newRow, row);
                } else {
                    if((!row.getAttribute('name')) || (row.getAttribute('name').length <= 0)) {
                        throw new Error(`multidataMode가 설정된 레이아웃에 'name' 속성이 없습니다.`);
                    }

                    // row의 부모 노드를 계속 탐색해서. 그 노드가 is_multidata_mode="true"의 속성을 가졌는지 확인함
                    let isPerentNodeMultiDataMode = false;
                    let parentNode = row.parentNode;
                    while(parentNode && parentNode.tagName.toLowerCase() !== 'body') {
                        if(parentNode.getAttribute('is_multidata_mode') === "true") {
                            isPerentNodeMultiDataMode = true;
                            break;
                        }
                        parentNode = parentNode.parentNode;
                    }


                    const newRow = document.createElement('row-layout');

                    newRow.setAttribute('name', row.getAttribute('name'));
                    newRow.setAttribute('alias', row.getAttribute('alias') ?? "");
                    newRow.setAttribute('is_multidata_mode', row.getAttribute('is_multidata_mode'));

                    newRow.setAttribute('v-model', (isPerentNodeMultiDataMode) ? 'item' : 'formValues');
                    newRow.setAttribute('v-slot', 'slotProps');


                    const containerDiv = document.createElement('div');
                    containerDiv.setAttribute('v-for', '(item, index) in slotProps.modelValue');
                    containerDiv.setAttribute(':key', 'index');

                    const head = document.createElement('row-layout-item-head');
                    head.setAttribute(':index', 'index');
                    head.setAttribute('v-on:on_delete_item', 'slotProps.deleteItem(index)');
                    containerDiv.appendChild(head);

                    const rowDiv = document.createElement('div');
                    rowDiv.classList.add('row');

                    Array.from(row.children).forEach(child => {
                        rowDiv.appendChild(child);
                    });

                    containerDiv.appendChild(rowDiv);

                    newRow.appendChild(containerDiv);

                    $(newRow).children('div').children('div.row')
                        .children('[class^="col-sm-"]').children('[name]').each(function () {
                        var field = ($(this))[0];
                        const name = field.getAttribute('name');
                        field.setAttribute('v-model', `item['${name}']`);
                    })


                    row.parentNode.replaceChild(newRow, row);
                }
            });


            return dom.body.innerHTML.replace(/&quot;/g, `'`).replace("<br>", "\n");
        },
    }
}
</script>