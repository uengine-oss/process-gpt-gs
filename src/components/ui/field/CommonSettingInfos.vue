<script>
/**
 * 사용되는 속성들을 종합적으로 관리하기 위해서
 * dataToUse: 실제로 설정이나 HTML 변수로 반영시킬 data 변수명
 * htmlAttribute: HTML 속성으로 사용되는 이름
 * settingLabel: 변수 값 설정창에서 표시되는 라벨
 * settingType: 설정창에서 입력을 받기 위한 타입
 *     text: 문자열로 입력받는 속성
 *     textarea: 여러줄의 텍스트를 입력받는 속성
 *         rows: 입력 텍스트 줄 수
 *     number: 숫자값만 입력받도록 만들기 위한 속성
 *     checkbox: true / false로 입력받는 속성
 *     items: [{"key1":"value1"}, {"key2":"value2"}] 와 같은 형태로 입력받는 속성
 *       items_dynamic: 동적으로 데이터를 불러오기 위해서 추가되는 고정 속성
 *     select: 여러 값 중에서 하나를 선택하는 속성
 *       settingValue: 입력받을 항목을 리스트로 나열할 수 있음
 * validCheck(value, settingProps): 설정창에서 입력 완료시에 유효성을 확인하는데 사용되는 함수
 * isShowCheck(settingProps): 설정창에서 특정 조건에 따라 입력이 가능하도록 만들기위해서 사용되는 함수
 * addOns: 특수한 동작을 수행하도록 하기 위해서 관련 문자열들을 리스트 형태로 전달할 수 있음
 *     inputableNameItems: settingType이 select인 경우 입력 항목들이 입력 가능한 요소들의 이름들로 초기화됨
 *     encodedAsBase64: 세팅에 값을 입력하고 저장시에 Base64로 인코딩되어서 저장됨
 *     savedAsInnerText: 이 속성은 KEditor를 벗어나서 얻을시에 태그의 내부 텍스트로 저장되서 얻어짐
 */
let commonSettingInfos = {
    "localName": {
        dataToUse: "localName",
        htmlAttribute: "name",
        settingLabel: "FormDefinitionPanel.id",
        settingType: "text",
        validCheck: (value) => {
            if (!value || value.length <= 0) return "Name 속성에 값을 입력해 주세요."
            if (!/^[가-힣a-zA-Z0-9_\-. ]+$/.test(value)) return "Name 속성은 한글, 영문, 숫자, 공백, 밑줄(_), 대시(-), 점(.) 만 입력 가능합니다!"
            return null
        }
    },

    "localAlias": {
        dataToUse: "localAlias",
        htmlAttribute: "alias",
        settingLabel: "FormDefinitionPanel.name",
        settingType: "text"
    },

    "localDisabled": {
        dataToUse: "localDisabled",
        htmlAttribute: "disabled"
    },

    "localReadonly": {
        dataToUse: "localReadonly",
        htmlAttribute: "readonly",
        settingLabel: "FormDefinitionPanel.readOnly",
        settingType: "checkbox"
    },

    "localItems": {
        dataToUse: "localItems",
        htmlAttribute: "items",
        settingLabel: "Items",
        settingType: "items"
    },

    "localIsDynamicLoad": {
        dataToUse: "localIsDynamicLoad",
        htmlAttribute: "is_dynamic_load",
        settingType: "items_dynamic"
    },

    "localDynamicLoadURLName": {
        dataToUse: "localDynamicLoadURLName",
        htmlAttribute: "dynamic_load_url_name",
        settingType: "items_dynamic"
    },

    "localDynamicLoadURL": {
        dataToUse: "localDynamicLoadURL",
        htmlAttribute: "dynamic_load_url",
        settingType: "items_dynamic",
        validCheck: (value, props) => {
            if(props.localIsDynamicLoad === "urlBinding")
            {
                if(!value || value.length <= 0) return "URL 속성에 값을 입력해 주세요."
            }
            return null
        }
    },

    "localDynamicLoadKeyJsonPath": {
        dataToUse: "localDynamicLoadKeyJsonPath",
        htmlAttribute: "dynamic_load_key_json_path",
        settingType: "items_dynamic",
        validCheck: (value, props) => {
            if(props.localIsDynamicLoad === "urlBinding")
            {
                if(!value || value.length <= 0) return "Key JSON Path 속성에 값을 입력해 주세요."
            }
            return null
        }
    },

    "localDynamicLoadValueJsonPath": {
        dataToUse: "localDynamicLoadValueJsonPath",
        htmlAttribute: "dynamic_load_value_json_path",
        settingType: "items_dynamic",
        validCheck: (value, props) => {
            if(props.localIsDynamicLoad === "urlBinding")
            {
                if(!value || value.length <= 0) return "Value JSON Path 속성에 값을 입력해 주세요."
            }
            return null
        }
    },

    "localDynamicLoadKeyColumn": {
        dataToUse: "localDynamicLoadKeyColumn",
        htmlAttribute: "dynamic_load_key_column",
        settingType: "items_dynamic",
        validCheck: (value, props) => {
            if(props.localIsDynamicLoad === "dataBinding")
            {
                if(!value || value.length <= 0) return "Key Column 속성에 값을 입력해 주세요."
            }
            return null
        }
    },

    "localDynamicLoadValueColumn": {
        dataToUse: "localDynamicLoadValueColumn",
        htmlAttribute: "dynamic_load_value_column",
        settingType: "items_dynamic",
        validCheck: (value, props) => {
            if(props.localIsDynamicLoad === "dataBinding")
            {
                if(!value || value.length <= 0) return "Value Column 속성에 값을 입력해 주세요."
            }
            return null
        }
    },
    "localDynamicDataSource": {
        dataToUse: "localDynamicDataSource",
        htmlAttribute: "dynamic_data_source",
        settingType: "items_dynamic", 
        validCheck: (value, props) => {
            if(props.localIsDynamicLoad === "dataBinding")
            {
                if(!value || value.length <= 0) return "Data Source 속성에 값을 입력해 주세요."
            }
            return null
        }
    }
};

commonSettingInfos["localItemsWithDynamicList"] = [
    commonSettingInfos["localItems"],
    commonSettingInfos["localIsDynamicLoad"],
    commonSettingInfos["localDynamicLoadURL"],
    commonSettingInfos["localDynamicLoadKeyJsonPath"],
    commonSettingInfos["localDynamicLoadValueJsonPath"],
    commonSettingInfos["localDynamicLoadURLName"],
    commonSettingInfos["localDynamicLoadKeyColumn"],
    commonSettingInfos["localDynamicLoadValueColumn"],
    commonSettingInfos["localDynamicDataSource"]
];

export { commonSettingInfos }
</script>

