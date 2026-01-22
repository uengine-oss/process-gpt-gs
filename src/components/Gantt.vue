<template>
    <div ref="ganttContainer"
        class="custom-gantt-container"
        style="width: 100%; height: 100%"
    ></div>
</template>
  
<script>
  import { onMounted, ref, watch, onUnmounted } from 'vue'
  import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
  import 'dhtmlx-gantt'

  export default {
    props: {
        tasks: {
            type: Array,
            required: true
        },
        dependencies: {
            type: Array,
            required: true
        },
        users: {
            type: Array,
            required: true
        }
    },
    emits: ['task-updated', 'task-added', 'link-event', 'task-panel-close', 'task-tree-opened', 'task-clicked', 'link-clicked', 'message'],
    setup(props, { emit }) {
        const ganttContainer = ref(null)
        const lastClickTime = ref(0)
        const originalTaskData = ref(null) // 원본 태스크 데이터 저장용
        const currentOpenTaskId = ref(null) // 현재 열린 태스크 ID 추적
        
        const loadGanttData = () => {

            // 1. 현재 열린 트리 상태 저장
            const openedTasks = [];
            gantt.eachTask(function(task){
                if (task.$open) {
                    openedTasks.push(task.id);
                }
            });
        
            gantt.clearAll()

            const formattedTasks = props.tasks.map(task => ({
                ...task,
                id: task.taskId || task.instId,
                text: task.name || task.title,
                origin_end_date: task.endDate,
                start_date: formatGanttDate(task.startDate),
                end_date: formatGanttDate(task.dueDate, true), // 의존성은 납기일정(듀데이트)과 연결
            }));
            

            formattedTasks.sort((a, b) => {
                return new Date(a.startDate)- new Date(b.startDate);
            });
            const formattedData = {
                data: formattedTasks,
                links: createLinksFromReferences(props.dependencies)
            }
            gantt.parse(formattedData)

            // 2. 트리 상태 복원
            openedTasks.forEach(id => {
                gantt.open(id);
            });
        }

        // 전역 삭제 함수 정의
        window.deleteGanttTask = (taskId) => {
            if (confirm("업무를 삭제하시겠습니까?")) {
                gantt.deleteTask(taskId);
                gantt.render();
            }
        };

        onMounted(() => {
            gantt.config.date_format = "%Y-%m-%d"
            
            // 한글 라벨 설정
            gantt.i18n = {
                ...gantt.i18n,
                ko: {
                    date: {
                        month_full: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
                        month_short: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
                        day_full: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
                        day_short: ["일", "월", "화", "수", "목", "금", "토"]
                    },
                    labels: {
                        new_task: "새 업무",
                        icon_save: "저장",
                        icon_cancel: "취소",
                        icon_details: "상세",
                        icon_edit: "수정",
                        icon_delete: "삭제",
                        confirm_closing: "",
                        confirm_deleting: "업무를 삭제하시겠습니까?",
                        section_description: "설명",
                        section_time: "기간",
                        section_업무명: "업무명",
                        section_담당자: "담당자",
                        section_기간: "기간",

                        /* 링크 확인 */
                        link: "연결",
                        link_start: " (시작)",
                        link_end: " (종료)",
                        type_task: "업무",
                        
                        /* 날짜 관련 */
                        minutes: "분",
                        hours: "시간",
                        days: "일",
                        weeks: "주",
                        months: "월",
                        years: "년",

                        /* 버튼 텍스트 */
                        save: "저장",
                        cancel: "취소",
                        delete_task: "삭제",
                        confirm: "확인",

                        /* 라이트박스 삭제 버튼 */
                        buttons_left: ["dhx_delete_btn"],
                        buttons_right: ["dhx_save_btn", "dhx_cancel_btn"],
                        gantt_save_btn: "저장",
                        gantt_delete_btn: "삭제",
                        gantt_cancel_btn: "취소",

                        /* 새 업무 기본값 */
                        new_task_text: "새 업무"
                    }
                }
            };
            
            // 한글 적용
            gantt.locale = gantt.i18n.ko;
            
            gantt.config.scales = [
                { unit: "month", step: 1, format: date => `${date.getMonth() + 1}월` }, // 5월
                { unit: "day", step: 1, format: date => `${date.getDate()}일` }     // 21일, 22일, ...
            ];

            // 그리드 컬럼 설정
            gantt.config.columns = [
                {name: "name", label: "업무명", tree: true, width: 200, resize: true},
                {name: "start_date", label: "시작일", align: "center", width: 100, resize: true},
                {   
                    name: "end_date", 
                    label: "만료일", 
                    align: "center", 
                    width: 100, 
                    resize: true,
                    template: function(task) {
                        if (!task.end_date) return "";
                        const date = new Date(task.end_date);
                        date.setDate(date.getDate());
                        return date.toISOString().split('T')[0];
                    }
                },
                { name: "duration", label: "기간", align: "center", width: 60, resize: true},
                {
                    name: "assignees", 
                    label: "담당자", 
                    align: "center", 
                    width: 80,
                    resize: true,
                    template: function(task) {
                        // task.taskId와 일치하는 workitem에서 username 찾기
                        if (task.taskId && props.tasks) {
                            const workItem = props.tasks.find(item => item.taskId === task.taskId);
                            if (workItem && workItem.username) {
                                return workItem.username;
                            }
                        }
                        
                        // 기존 로직 유지 (fallback)
                        if (task.assignees) {
                            let assigneeId = task.assignees;
                            if (Array.isArray(task.assignees)) {
                                assigneeId = task.assignees[0];
                            } else if (typeof task.assignees === 'object') {
                                assigneeId = task.assignees.id || task.assignees.userId;
                            }
                            
                            const user = props.users.find(u => u.id === assigneeId);
                            if (user) {
                                return user.email ? `${user.username}(${user.email})` : user.username;
                            }
                            // assigneeId가 문자열이면 그대로 반환, 아니면 빈 문자열
                            return typeof assigneeId === 'string' ? assigneeId : "";
                        }
                        return "";
                    }
                },
                {
                    name: "delete", 
                    width: 40, 
                    align: "center",
                    template: function(task) {
                        return `<button class="gantt-delete-btn" onclick="deleteGanttTask('${task.id}')" title="업무 삭제">
                                    <i class="mdi mdi-delete"></i>
                                </button>`;
                    }
                },
                {name: "add", width: 40}
            ];
            
            // 자동 일정 조정 활성화
            gantt.config.auto_scheduling = true;
            gantt.config.auto_scheduling_strict = true;
            gantt.config.auto_scheduling_compatibility = true;
            
            // Critical Path 활성화
            gantt.config.highlight_critical_path = true;
            
            // 링크 제약조건 설정
            gantt.config.links = {
                "finish_to_start": "0",
                "start_to_start": "1",
                "finish_to_finish": "2",
                "start_to_finish": "3"
            };
            
            gantt.config.lightbox.sections = [
                { 
                    name: "업무명", 
                    height: 70, 
                    map_to: "name", 
                    type: "textarea", 
                    focus: true 
                },
                {
                    name: "담당자", // 담당자 필드
                    height: 40,
                    type: "select", 
                    map_to: "assignees",
                    options: props.users.map(user => ({
                        key: user.id,
                        label: user.email ? `${user.username}(${user.email})` : user.username
                    })),
                    default_value: null
                },
                { 
                    name: "시작일", 
                    height: 60,
                    type: "calendar_picker", 
                    map_to: "start_date"
                },
                { 
                    name: "종료일", 
                    height: 60,
                    type: "calendar_picker", 
                    map_to: "end_date"
                }
            ];
            
            // 실제 달력 위젯을 사용하는 커스텀 섹션 정의
            gantt.form_blocks["calendar_picker"] = {
                render: function(sns) {
                    return `<div class='gantt_cal_ltext custom-calendar-section'>
                        <div class="calendar-input-wrapper">
                            <input type='text' class='gantt_calendar_input' readonly placeholder='날짜를 선택하세요' />
                            <button type='button' class='gantt_calendar_btn'><i class="mdi mdi-calendar"></i></button>
                        </div>
                    </div>`;
                },
                set_value: function(node, value, task, section) {
                    const input = node.querySelector('.gantt_calendar_input');
                    if (value) {
                        const date = new Date(value);
                        input.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    }
                    
                    // 달력 버튼 클릭 이벤트
                    const btn = node.querySelector('.gantt_calendar_btn');
                    btn.onclick = (e) => {
                        e.preventDefault();
                        
                        // HTML5 날짜 입력기를 버튼 위치에 표시
                        const dateInput = document.createElement('input');
                        dateInput.type = 'date';
                        dateInput.className = 'gantt-date-picker-overlay';
                        
                        // 버튼 위치 계산
                        const btnRect = btn.getBoundingClientRect();
                        dateInput.style.position = 'fixed';
                        dateInput.style.top = (btnRect.bottom - 16) + 'px';
                        dateInput.style.left = btnRect.left + 'px';
                        dateInput.style.zIndex = '10001';
                        dateInput.style.backgroundColor = 'transparent';
                        dateInput.style.border = 'none';
                        dateInput.style.color = 'transparent';
                        dateInput.style.fontSize = '0px';
                        dateInput.style.width = '0px';
                        dateInput.style.height = '0px';
                        dateInput.style.opacity = '0';
                        dateInput.style.cursor = 'pointer';
                        
                        if (input.value) {
                            dateInput.value = input.value;
                        }
                        
                        document.body.appendChild(dateInput);
                        
                        // 즉시 포커스하여 달력 열기
                        setTimeout(() => {
                            dateInput.focus();
                            dateInput.showPicker && dateInput.showPicker();
                        }, 10);
                        
                        dateInput.onchange = function() {
                            if (dateInput.value) {
                                input.value = dateInput.value;
                                input.dispatchEvent(new Event('change'));
                            }
                            if (document.body.contains(dateInput)) {
                                document.body.removeChild(dateInput);
                            }
                        };
                        
                        dateInput.onblur = function() {
                            setTimeout(() => {
                                if (document.body.contains(dateInput)) {
                                    document.body.removeChild(dateInput);
                                }
                            }, 100);
                        };
                        
                        // ESC 키로 닫기
                        const handleKeydown = (event) => {
                            if (event.key === 'Escape') {
                                if (document.body.contains(dateInput)) {
                                    document.body.removeChild(dateInput);
                                }
                                document.removeEventListener('keydown', handleKeydown);
                            }
                        };
                        document.addEventListener('keydown', handleKeydown);
                        
                        // 외부 클릭으로 닫기
                        const handleClickOutside = (event) => {
                            if (!dateInput.contains(event.target) && !btn.contains(event.target)) {
                                if (document.body.contains(dateInput)) {
                                    document.body.removeChild(dateInput);
                                }
                                document.removeEventListener('click', handleClickOutside);
                            }
                        };
                        setTimeout(() => {
                            document.addEventListener('click', handleClickOutside);
                        }, 10);
                    };
                    
                    // 입력 필드 클릭 시에도 달력 열기
                    input.onclick = () => btn.click();
                },
                get_value: function(node, task, section) {
                    const input = node.querySelector('.gantt_calendar_input');
                    if (input.value) {
                        // YYYY-MM-DD 형식의 문자열을 Date 객체로 변환
                        const dateValue = new Date(input.value + 'T00:00:00');
                        return dateValue;
                    }
                    return new Date(); // 기본값으로 오늘 날짜 반환
                },
                focus: function(node) {
                    const input = node.querySelector('.gantt_calendar_input');
                    input.focus();
                }
            };
            
            // 라이트박스에 커스텀 클래스 추가
            gantt.attachEvent("onLightbox", function(taskId) {
                setTimeout(() => {
                    const lightbox = document.querySelector('.gantt_cal_light');
                    if (lightbox) {
                        lightbox.classList.add('custom-gantt-lightbox');
                    }
                    
                    const lightboxHeader = document.querySelector('.gantt_cal_lheader');
                    if (lightboxHeader) {
                        lightboxHeader.classList.add('custom-gantt-lightbox-header');
                    }
                    
                    const lightboxContent = document.querySelector('.gantt_cal_larea');
                    if (lightboxContent) {
                        lightboxContent.classList.add('custom-gantt-lightbox-content');
                        
                        // 라이트박스 내부 폼 요소들에 클래스 추가
                        const sections = lightboxContent.querySelectorAll('.gantt_cal_lsection');
                        sections.forEach(section => {
                            section.classList.add('custom-gantt-lightbox-section');
                        });
                        
                        const textInputs = lightboxContent.querySelectorAll('textarea, input[type="text"]');
                        textInputs.forEach(input => {
                            input.classList.add('custom-gantt-lightbox-text-input');
                        });
                        
                        const selects = lightboxContent.querySelectorAll('select');
                        selects.forEach(select => {
                            select.classList.add('custom-gantt-lightbox-select');
                            
                            // select의 option들에도 클래스 추가
                            const options = select.querySelectorAll('option');
                            options.forEach(option => {
                                option.classList.add('custom-gantt-lightbox-option');
                            });
                        });
                        
                        const dateInputs = lightboxContent.querySelectorAll('input[type="date"], .gantt_cal_ltext');
                        dateInputs.forEach(input => {
                            input.classList.add('custom-gantt-lightbox-date-input');
                        });
                        
                        const labels = lightboxContent.querySelectorAll('.gantt_cal_ltext');
                        labels.forEach(label => {
                            label.classList.add('custom-gantt-lightbox-label');
                        });
                    }
                    
                    const lightboxButtons = document.querySelector('.gantt_btn_set');
                    if (lightboxButtons) {
                        lightboxButtons.classList.add('custom-gantt-lightbox-buttons');
                        
                        // 전체 버튼 영역에도 이벤트 위임 추가
                        lightboxButtons.addEventListener('click', function(e) {
                            if (e.target.classList.contains('gantt_save_btn')) {
                                // 라이트박스에서 직접 데이터 수집
                                const task = gantt.getTask(taskId);
                                const lightbox = document.querySelector('.gantt_cal_light');
                                
                                if (lightbox) {
                                    const nameInput = lightbox.querySelector('textarea[name="name"]');
                                    const assigneeSelect = lightbox.querySelector('select[name="assignees"]');
                                    
                                    if (nameInput?.value) {
                                        task.name = nameInput.value;
                                        task.text = nameInput.value;
                                    }
                                    if (assigneeSelect?.value) {
                                        task.assignees = assigneeSelect.value;
                                    }
                                    
                                    emit('task-updated', task);
                                    gantt.hideLightbox();
                                    gantt.render();
                                }
                            }
                        }, true);
                        
                        // 개별 버튼들에도 클래스 추가 및 직접 이벤트 핸들러 추가
                        const buttons = lightboxButtons.querySelectorAll('div[class*="gantt_"]');
                        
                        buttons.forEach((button, index) => {
                            if (button.classList.contains('gantt_save_btn')) {
                                button.classList.add('custom-gantt-lightbox-save-btn');
                                
                                // 기존 이벤트 리스너 제거 (중복 방지)
                                button.removeEventListener('click', handleSaveClick);
                                
                                // 저장 버튼 클릭 핸들러 함수 정의
                                function handleSaveClick(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // 라이트박스에서 직접 데이터 수집
                                    const task = gantt.getTask(taskId);
                                    const lightbox = document.querySelector('.gantt_cal_light');
                                    
                                    if (lightbox) {
                                        const nameInput = lightbox.querySelector('textarea[name="name"]');
                                        const assigneeSelect = lightbox.querySelector('select[name="assignees"]');
                                        
                                        if (nameInput?.value) {
                                            task.name = nameInput.value;
                                            task.text = nameInput.value;
                                        }
                                        if (assigneeSelect?.value) {
                                            task.assignees = assigneeSelect.value;
                                        }
                                        
                                        // 수동으로 저장 이벤트 발생
                                        emit('task-updated', task);
                                        gantt.hideLightbox();
                                        gantt.render();
                                    }
                                }
                                
                                // 다양한 방법으로 이벤트 리스너 등록
                                button.addEventListener('click', handleSaveClick, true); // 캡처링
                                button.addEventListener('click', handleSaveClick, false); // 버블링
                                button.addEventListener('mousedown', handleSaveClick, true);
                                
                                // onclick 속성도 직접 설정
                                const originalOnClick = button.onclick;
                                button.onclick = function(e) {
                                    handleSaveClick(e);
                                    if (originalOnClick) originalOnClick.call(this, e);
                                };
                                
                            } else if (button.classList.contains('gantt_delete_btn')) {
                                button.classList.add('custom-gantt-lightbox-delete-btn');
                            } else if (button.classList.contains('gantt_cancel_btn')) {
                                // 취소 버튼 처리
                            }
                            button.classList.add('custom-gantt-lightbox-btn');
                        });
                    }
                }, 10);
                return true;
            });
            gantt.templates.task_text = function(start, end, task) {
                let assigneeName = '';
                
                // task.taskId와 일치하는 workitem에서 username 찾기 (그리드 컬럼과 동일한 로직)
                if (task.taskId && props.tasks) {
                    const workItem = props.tasks.find(item => item.taskId === task.taskId);
                    if (workItem && workItem.username) {
                        assigneeName = workItem.username;
                    }
                }
                
                // workItem에서 찾지 못한 경우 기존 로직 사용
                if (!assigneeName && task.assignees) {
                    // assignees가 배열이나 객체인 경우 처리
                    let assigneeId = task.assignees;
                    if (Array.isArray(task.assignees)) {
                        assigneeId = task.assignees[0]; // 첫 번째 담당자만 표시
                    } else if (typeof task.assignees === 'object') {
                        assigneeId = task.assignees.id || task.assignees.userId;
                    }
                    
                    // users 배열에서 담당자 찾기
                    const user = props.users.find(u => u.id === assigneeId);
                    if (user) {
                        assigneeName = user.email ? `${user.username}(${user.email})` : user.username;
                    } else {
                        // assigneeId가 문자열이면 그대로 사용, 아니면 빈 문자열
                        assigneeName = typeof assigneeId === 'string' ? assigneeId : '';
                    }
                }
                
                return `<div class="custom-gantt-task-content gantt-task-content">
                    <span class="custom-task-text task-text">${task.name}</span>
                    ${assigneeName ? `
                        <span class="custom-task-assignee task-assignee">
                            <i class="fas fa-user"></i> 
                            ${assigneeName}
                        </span>
                    ` : ''}
                </div>`;
            };
            // 작업 바 스타일 커스터마이징
            gantt.templates.task_class = function(start, end, task) {
                let classes = ['custom-gantt-task-bar'];
                if (task.assignees) {
                    classes.push('has-assignee');
                }
                if (task.status) {
                    classes.push(`status-${task.status}`);
                }

                return classes.join(' ');
            };
            // 작업 바 오른쪽 끝에 담당자 아이콘 표시
            gantt.templates.rightside_text = function(start, end, task) {
                if (task.assignees) {
                    const user = props.users.find(u => u.id === task.assignees);
                    return `<div class="custom-task-assignee-icon task-assignee-icon">
                              <i class="fas fa-user-circle"></i>
                           </div>`;
                }
                return "";
            };
            // 작업 바 스타일 커스터마이징 (deprecated 함수 대신 새로운 함수 사용)
            gantt.templates.timeline_cell_class = function(task, date) {
                return "";
            };

            // 작업 바 스타일 설정
            gantt.templates.grid_row_class = function(start, end, task) {
                return `custom-gantt-grid-row`;
            };

            // 작업 바 배경색 설정
            gantt.templates.task_background = function(start, end, task) {
                const colorSet = statusColors[task.status] || statusColors.default;
                return colorSet.background;
            };

            // 작업 진행률 바 스타일 설정
            gantt.templates.progress_text = function(start, end, task) {
                return "";  // 진행률 텍스트 숨김
            };

            gantt.templates.progress_class = function(start, end, task) {
                return `custom-gantt-progress progress-${task.status ? task.status.toLowerCase() : 'default'}`;
            };

            ////////////////////////////////// EVENTS //////////////////////////////////
            
            // 라이트박스 이벤트 핸들러들
            gantt.attachEvent("onBeforeLightbox", function(id) {
                return true;
            });
            
            gantt.attachEvent("onLightbox", function(id) {
                return true;
            });
            
            gantt.attachEvent("onAfterLightbox", function() {
                return true;
            });
            
            gantt.attachEvent("onLightboxCancel", function() {
                return true;
            });
            
            gantt.attachEvent("onLightboxDelete", function(id) {
                return true;
            });
            
            // 라이트박스 저장 이벤트
            gantt.attachEvent("onLightboxSave", (id, task, is_new) => {
                if (!task.name) {
                    gantt.message({
                        type: "error",
                        text: "작업명을 입력해주세요"
                    });
                    return false;
                }

                // 날짜 검증 개선
                let startDate, endDate;
                
                if (task.start_date instanceof Date) {
                    startDate = task.start_date;
                } else {
                    startDate = new Date(task.start_date);
                }
                
                if (task.end_date instanceof Date) {
                    endDate = task.end_date;
                } else {
                    endDate = new Date(task.end_date);
                }
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    gantt.message({
                        type: "error",
                        text: "유효한 날짜를 입력해주세요"
                    });
                    return false;
                }
                
                // 시작일이 종료일보다 늦은 경우 체크
                if (startDate > endDate) {
                    gantt.message({
                        type: "error",
                        text: "시작일은 종료일보다 빨라야 합니다"
                    });
                    return false;
                }

                // 새로운 작업인 경우
                if (is_new) {
                    try {
                        // 날짜를 Gantt 형식으로 설정
                        task.start_date = startDate;
                        task.end_date = endDate;
                        
                        // 부모 컴포넌트에 이벤트 발생 task.parent == 0 ? "INSTANCE": "WORKITEM"
                        emit('task-added', {
                            name: task.name,
                            startDate: dateToTimestamp(startDate),
                            dueDate: dateToTimestamp(endDate, true),
                            endDate: null,
                            duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1,
                            progress: 0,
                            parent: task.parent || 0,
                            assignees: task.assignees || [],
                            status: task.parent == 0 ? 'NEW' : 'TODO',
                            adhoc: true
                        });
                        //새 작업 추가
                        gantt.addTask(task); 
                        // 라이트박스 수동으로 닫기
                        gantt.hideLightbox();
                        // 차트 다시 그리기
                        gantt.render();
                        return false; // 기본 저장 동작 방지
                    } catch (error) {
                        console.error('작업 추가 중 오류 발생:', error);
                        gantt.message({
                            type: "error",
                            text: "작업 추가 중 오류가 발생했습니다"
                        });
                        return false;
                    }
                } else {
                    // 기존 작업 업데이트
                    // 날짜를 Gantt 형식으로 설정
                    task.start_date = startDate;
                    task.end_date = endDate;
                    
                    // 부모 컴포넌트에 업데이트 이벤트 발생
                    emit('task-updated', {
                        ...task,
                        startDate: dateToTimestamp(startDate),
                        dueDate: dateToTimestamp(endDate, true),
                        duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1
                    });
                }

                return true;
            });


            // 라이트박스가 열릴 때 이벤트
            gantt.attachEvent("onLightbox", (taskId) => {
                const task = gantt.getTask(taskId);
                if (!task.type) {
                    task.type = "task";
                }
                return true;
            });

            // 라이트박스가 닫힐 때 이벤트
            gantt.attachEvent("onAfterLightbox", () => {
                gantt.render();
                return true;
            });

             // 트리 확장(펼침) 이벤트
            gantt.attachEvent("onTaskOpened", function(id) {
                emit('task-tree-opened', id);
            });

            // 태스크 클릭
            gantt.attachEvent("onTaskClick", (id, e) => {
                // 클릭된 요소 확인
                const target = e.target || e.srcElement;
                
                // +아이콘 (추가 버튼) 클릭인지 확인
                const isAddIcon = target && (
                    target.classList.contains('gantt_add') ||
                    target.classList.contains('gantt_grid_add') ||
                    (target.closest && target.closest('.gantt_add')) ||
                    (target.closest && target.closest('.gantt_grid_add'))
                );
                
                if (isAddIcon) {
                    // +아이콘 클릭 시 기본 동작만 허용 (새 태스크 추가)
                    return true;
                }
                
                // 트리 아이콘 또는 그 직접적인 부모 요소인지 확인
                const isTreeIcon = target && (
                    target.classList.contains('gantt_tree_icon') ||
                    target.classList.contains('gantt_tree_indent') ||
                    (target.parentElement && target.parentElement.classList.contains('gantt_tree_icon')) ||
                    (target.closest && target.closest('.gantt_tree_icon'))
                );
                
                if (isTreeIcon) {
                    // 트리 확장/축소만 처리 (패널과 라이트박스 모두 방지)
                    const task = gantt.getTask(id);
                    if (task.$open) {
                        gantt.close(id);
                    } else {
                        gantt.open(id);
                    }
                    return false; // 다른 동작 방지
                }
                
                // 트리 아이콘이 아닌 다른 부분 클릭 시 패널 토글
                const task = gantt.getTask(id);
                
                // 초기화 시점에 currentOpenTaskId가 null이므로 첫 클릭에서도 정상 동작하도록 수정
                if (currentOpenTaskId.value === id) {
                    // 같은 태스크를 다시 클릭한 경우 패널 닫기
                    currentOpenTaskId.value = null;
                    emit('task-panel-close');
                    return false; // 라이트박스 열기 방지
                } else {
                    // 다른 태스크 클릭하거나 첫 클릭 시 패널 열기
                    currentOpenTaskId.value = id;
                    emit('task-clicked', task);
                    return true;
                }
            });
            gantt.attachEvent("onTaskDblClick", function(id,e){
                //any custom logic here
                return false;
            });

            gantt.attachEvent("onLinkClick", (id, e) => {
                let link = gantt.getLink(id)
                let source = gantt.getTask(link.source)
                let target = gantt.getTask(link.target)
                emit('link-clicked', link, source, target);
                return true;
            });
            gantt.attachEvent("onLinkDblClick", function(id,e){
                //any custom logic here
                return false;
            });


            ////////////////////////// TaskDrag 기간 이동 //////////////////////////
            gantt.attachEvent("onBeforeTaskDrag", function(id, mode, event){
                let task = gantt.getTask(id);
                task.startDate = dateToTimestamp(task.start_date);
                task.dueDate = dateToTimestamp(task.end_date, true);
                task.endDate = dateToTimestamp(task.origin_end_date, true);

                // 드래그 시작 시 원본 데이터 저장
                originalTaskData.value = JSON.parse(JSON.stringify(task));
                
                // 조건 검사 함수
                const validateDrag = () => {
                    let incommingLinks = task.$target
                    let outgoingLinks = task.$source

                    // 조건 검사 로직
                if(incommingLinks && incommingLinks.length > 0) {
                        for(let linkId of incommingLinks) {
                            let link = gantt.getLink(linkId)
                        let source = gantt.getTask(link.source)
                        let target = gantt.getTask(link.target)

                            return validateTaskConstraint(source, target);
                        } 
                }

                if(outgoingLinks && outgoingLinks.length > 0) {
                        for(let linkId of outgoingLinks) {
                            let link = gantt.getLink(linkId)
                        let source = gantt.getTask(link.source)
                        let target = gantt.getTask(link.target)

                            return validateTaskConstraint(source, target);
                        }
                    }
                    return true;
                };

                if(mode == 'resize' || mode == 'move') {
                    // 조건 검사
                    if (!validateDrag()) {
                        return false;
                    }
                }

                return true;
            });

            gantt.attachEvent("onAfterTaskDrag", (id, mode) => {
                if(mode == 'resize' || mode == 'move') {
                    let task = gantt.getTask(id)
                    let incommingLinks = task.$target
                    let outgoingLinks = task.$source

                    task.startDate = dateToTimestamp(task.start_date);
                    task.dueDate = dateToTimestamp(task.end_date, true);
                    task.endDate = dateToTimestamp(task.origin_end_date, true);

                    // 최종 검증
                    let isValid = true;
                    if(incommingLinks && incommingLinks.length > 0) {
                        for(let linkId of incommingLinks) {
                            let link = gantt.getLink(linkId)
                            let source = gantt.getTask(link.source)
                            let target = gantt.getTask(link.target)

                            if(!validateTaskConstraint(source, target)){
                                isValid = false;
                                break;
                            }
                        }
                    }

                    if(isValid && outgoingLinks && outgoingLinks.length > 0) {
                        for(let linkId of outgoingLinks) {
                            let link = gantt.getLink(linkId)
                            let source = gantt.getTask(link.source)
                            let target = gantt.getTask(link.target)

                            if(!validateTaskConstraint(source, target)){
                                isValid = false;
                                break;
                            }
                        }
                    }

                    if (isValid) {
                    // 부모 컴포넌트에 업데이트된 태스크 전달
                    emit('task-updated', task)
                    } else {
                        // 조건에 맞지 않으면 원상복구
                        if (originalTaskData.value && originalTaskData.value.id == id) {
                            // 개별 속성을 복원
                            task.start_date = originalTaskData.value.start_date;
                            task.end_date = originalTaskData.value.end_date;
                            task.startDate = originalTaskData.value.startDate;
                            task.dueDate = originalTaskData.value.dueDate;
                            task.endDate = originalTaskData.value.endDate;
                            
                            // gantt 업데이트
                            gantt.refreshTask(id);
                            gantt.render();
                        }
                    }
                    originalTaskData.value = null;
                } 
            })

            ////////////////////////// 선연결 이전 이벤트 처리 //////////////////////////
            gantt.attachEvent("onBeforeLinkAdd", function(id, link) {
                // 상위 컴포넌트에 이벤트 발생
                let source = gantt.getTask(link.source)
                let target = gantt.getTask(link.target)

                if(target.status == 'DONE') {
                    emit('message', {
                        color: "error",
                        text: `"${target.name}"태스크는 완료된 태스크입니다.`
                    });
                    return false;
                }
                return validateTaskConstraint(source, target);
            });
            gantt.attachEvent("onAfterLinkAdd", function(id, link) {
                const typeMap = {
                    "FS": "0", // Finish to Start (기본)
                    "FF": "2", // Finish to Finish
                    "SF": "3", // Start to Finishaa
                    "SS": "1"  // Start to Start
                };

                let copyLink = JSON.parse(JSON.stringify(link));
                copyLink.type = Object.keys(typeMap).find(key => typeMap[key] == link.type);
                
                emit('link-event', {type: 'add', link: copyLink});
                return true;
            });
            // 선 삭제 이전 이벤트 처리
            gantt.attachEvent("onBeforeLinkDelete", function(id, link) {
                // BPM태스크간 선 삭제 제한 
                let source = gantt.getTask(link.source)
                let target = gantt.getTask(link.target)

                if(!source.adhoc && !target.adhoc) {
                    emit('message', {
                            color: "error",
                            text: `태스크[BPM] 선은 삭제 할 수 없습니다.`
                        });
                        return false;
                }

                return true;
            });
            // 선 삭제 이후 이벤트 처리
            gantt.attachEvent("onAfterLinkDelete", function(id, link) {
                // link: { id, source, target, type }
                // 여기서 원하는 동작 수행 (예: 부모 컴포넌트로 emit)
                emit('link-event', {type: 'delete', link: link});
                return true;
            });
            ///////////////////////////////////////////////////////////////////////////////
            gantt.init(ganttContainer.value)
            loadGanttData()
        })
  
        function validateTaskConstraint(source, target){
            if(source.parent == 0 && target.parent == 0) {
                // INSTANCE <> INSTANCE 인 경우 통과
                return true;
            }

            // BPM <> BPM X
            if(!source.adhoc && !target.adhoc) {
                emit('message', {
                    color: "error",
                    text: "태스크[BPM]간 선 연결은 할 수 없습니다."
                });
                return false;
            } 
            // BPM > ADHOC 0 / BPM 이후 날짜
            else if(!source.adhoc && target.adhoc) {
                if(source.start_date > target.start_date) {
                    emit('message', {
                        color: "error",
                        text: `"${source.name}"태스크[BPM]는 이전 태스크 업무에 연결 할 수 없습니다.`
                    });
                    return false;
                } 
            }
            // ADHOC > BPM 0 / BPM 이전 날짜
            else if(source.adhoc && !target.adhoc) {
                if(source.end_date <= target.start_date) {
                    emit('message', {
                        color: "error",
                        text: `"${source.name}"태스크의 시작일은 "${target.name}"태스크[BPM] 만기일 이후여야 합니다.`
                    });
                    return false;
                }
            }

            // 나머지 가능 
            return true;
        }
       
        function formatGanttDate(date, isEndDate) {
            if (!date) return;
            let year, month, day;
            if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
                const [d, m, y] = date.split('-');
                year = y;
                month = m.padStart(2, '0');
                day = d.padStart(2, '0');
            } else {
                // 여기서 "2025-04-29T00:00:00" 같은 문자열도 Date로 파싱됨
                const d = new Date(date);
                year = d.getFullYear();
                month = String(d.getMonth() + 1).padStart(2, '0');
                day = String(d.getDate()).padStart(2, '0');
            }

            // isEndDate면 하루를 더해서 00:00:00으로 반환
            if (isEndDate) {
                const end = new Date(`${year}-${month}-${day}`);
                end.setUTCDate(end.getUTCDate() + 1);
                return end.toISOString().split('T')[0];
            }

            // 여기서 "YYYY-MM-DD"만 리턴
            return `${year}-${month}-${day}`;
        }

        function dateToTimestamp(date, isEnd) {
            if(!date) return null;
            const d = new Date(date);

            // pad 함수
            const pad = (n, z = 2) => ('00' + n).slice(-z);
            if(isEnd) {
                d.setUTCDate(d.getUTCDate() - 1); // 하루 빼기
                d.setHours(23, 59, 59, 0); // 23:59:59로 세팅
            }
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
                `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }

        const createLinksFromReferences = (dependencies) => {
            const links = [];
            if(!dependencies) return links;
            const typeMap = {
                "FS": "0", // Finish to Start (기본)
                "FF": "2", // Finish to Finish
                "SF": "3", // Start to Finish
                "SS": "1"  // Start to Start
            };
          
            dependencies.forEach(dependeny => {
                if (dependeny) {
                    links.push({
                        id: dependeny.id,
                        source: dependeny.dependsId, // 참조된 작업의 ID
                        target: dependeny.taskId,       // 현재 작업의 ID
                        type: typeMap[dependeny.type] || "0"              // 기본 링크 타입 (Finish to Start)
                    });
                }
            });
            
            return links;
        };


        // 태스크 삭제 메서드
        function deleteTaskById(taskId) {
            gantt.deleteTask(taskId);
        }

        watch(() => props.tasks, () => {
            loadGanttData();
        }, { deep: true })

        onUnmounted(() => {
            if (gantt) {
                gantt.clearAll();
                gantt.detachAllEvents && gantt.detachAllEvents();
            }
            // 전역 함수 정리
            delete window.deleteGanttTask;
        });


      return {
            ganttContainer,
            deleteTaskById,
            // getTaskStyle,
            // getProgressStyle
      }
    }
  }
  </script>
  
  <style>
  .gantt-container {
    height: 500px;
    width: 100%;
  }
  .gantt-task-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    padding: 0 5px;
}

.task-text {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.task-assignee {
    margin-left: 10px;
    font-size: 0.9em;
    display: flex;
    align-items: center;
}

.task-assignee i {
    margin-right: 4px;
    font-size: 12px;
}

.task-assignee-icon {
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.task-assignee-icon i {
    font-size: 16px;
    color: #666;
}

/* 담당자가 있는 작업 바 스타일 */
.gantt_task_line.has-assignee {
    border-radius: 20px;
}

/* 작업 진행률 바 스타일 */
.has-assignee .gantt_task_progress {
    border-radius: 20px 0 0 20px;
}
/* 줌 컨트롤 스타일링 */
.gantt_zoom_bar {
    padding: 10px;
    background-color: #f5f5f5;
    border-top: 1px solid #cecece;
}

.gantt_zoom_bar button {
    margin: 0 5px;
    padding: 5px 10px;
    border: 1px solid #cecece;
    border-radius: 4px;
    background: white;
    cursor: pointer;
}

.gantt_zoom_bar button:hover {
    background: #e6e6e6;
}

.gantt_zoom_bar button.active {
    background: #4a90e2;
    color: white;
    border-color: #357abd;
}
/* 상태별 스타일 */
.status-todo .gantt_task_progress {
    background-color: #1976D2;
}

.status-IN_PROGRESS .gantt_task_progress {
    background-color: #388E3C;
}

.status-DONE .gantt_task_progress {
    background-color: #FFA000;
}

.status-NEW .gantt_task_content {
    color: #FFFFFF;
}

.status-IN_PROGRESS .gantt_task_content {
    color: #FFFFFF;
}

.status-done .gantt_task_content {
    color: #000000;
}

/* 작업 바 스타일 */
.gantt_task_line {
    border-radius: 4px;
}

.gantt_task_progress {
    border-radius: 4px 0 0 4px;
}

/* 상태별 작업 바 스타일 */
.gantt_task_line {
    border-radius: 20px !important;
    border: none !important;
}

.gantt_task_progress {
    border-radius: 20px 0 0 20px !important;
}

/* DONE 상태 */
.status-DONE .gantt_task_progress {
    background-color: #2E7D32 !important;
}
.status-DONE.gantt_task_line {
    background-color: #4CAF50 !important;
}

/* IN_PROGRESS 상태 */
.status-IN_PROGRESS .gantt_task_progress {
    background-color: #1565C0 !important;
}
.status-IN_PROGRESS.gantt_task_line {
    background-color: #2196F3 !important;
}

/* NEW 상태 */
.status-NEW .gantt_task_progress {
    background-color: #616161 !important;
}
.status-NEW.gantt_task_line {
    background-color: #9E9E9E !important;
}

/* PENDING 상태 */
.status-PENDING .gantt_task_progress {
    background-color: #C62828 !important;
}
.status-PENDING.gantt_task_line {
    background-color: #F44336 !important;
}

/* 기본 상태 */
.gantt_task_line:not(.status-DONE):not(.status-IN_PROGRESS):not(.status-NEW):not(.status-PENDING) {
    background-color: #9E9E9E !important;
}
.gantt_task_line:not(.status-DONE):not(.status-IN_PROGRESS):not(.status-NEW):not(.status-PENDING) .gantt_task_progress {
    background-color: #616161 !important;
}

/* 작업 텍스트 스타일 */
.gantt_task_content {
    color: #FFFFFF !important;
    font-weight: 500;
  }
.gantt_message {
    z-index: 10000 !important;
    position: fixed !important;
    top: 50px !important;
    right: 20px !important;
}

.custom-gantt-lightbox {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 10001 !important;
    /* Vuetify3 카드 스타일 적용 */
    background: #FFFFFF !important;
    border-radius: 12px !important;
    box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12) !important;
    border: none !important;
    overflow: hidden !important;
}

.gantt_cal_ltitle {
    padding: 16px 16px 0px 16px !important
}

/* 커스텀 달력 섹션 스타일링 */
.custom-calendar-section {
    padding: 8px 0 !important;
}

.calendar-input-wrapper {
    display: flex !important;
    align-items: center !important;
    gap: 0px !important;
    border: 1px solid #e0e0e0 !important;
    border-radius: 8px !important;
    overflow: hidden !important;
    transition: all 0.2s ease !important;
}

.calendar-input-wrapper:hover {
    border-color: #1976d2 !important;
    box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1) !important;
}

.calendar-input-wrapper:focus-within {
    border-color: #1976d2 !important;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2) !important;
}

.gantt_calendar_input {
    flex: 1 !important;
    border: none !important;
    outline: none !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    font-family: 'Roboto', sans-serif !important;
    color: #333333 !important;
    background: transparent !important;
    cursor: pointer !important;
}

.gantt_calendar_input::placeholder {
    color: #999999 !important;
    font-style: italic !important;
}

.gantt_calendar_btn {
    border: none !important;
    padding: 12px 16px !important;
    cursor: pointer !important;
    font-size: 16px !important;
    transition: background-color 0.2s ease !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.gantt_calendar_btn:hover {
    background: #e0e0e0 !important;
}

.gantt_calendar_btn:active {
    background: #d0d0d0 !important;
}

/* 달력 오버레이 스타일 */
.gantt-date-picker-overlay {
    position: fixed !important;
    z-index: 10001 !important;
    background-color: white !important;
    border: 2px solid #1976d2 !important;
    border-radius: 8px !important;
    padding: 8px !important;
    font-size: 14px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    font-family: 'Roboto', sans-serif !important;
}

.gantt-date-picker-overlay:focus {
    outline: none !important;
    border-color: #1976d2 !important;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2) !important;
}
.custom-gantt-lightbox-text-input,
.custom-gantt-lightbox-select {
    border-radius: 8px !important;
}
/* 간트차트 추가 UI 상의 취소버튼  */
.gantt_cancel_btn_set {
    display: none !important;
}
.gantt_save_btn_set {
    background: rgb(var(--v-theme-primary)) !important;
    color: white !important;
    border: none !important;
    border-radius: 50px !important;
    padding: 8px 16px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
    text-transform: none !important;
    min-height: 32px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
}
.custom-gantt-lightbox-save-btn {
    display: none !important;
}

/* 간트차트 그리드 삭제 버튼 스타일 */
.gantt-delete-btn {
    color: #808080 !important;
    border: none !important;
    border-radius: 4px !important;
    padding: 4px 6px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 28px !important;
    height: 28px !important;
}

.gantt_add {
    color: #808080 !important;
    opacity: 1 !important;
}

.gantt_grid_head_add {
    color: #808080 !important;
    opacity: 1 !important;
}

.gantt-delete-btn i {
    font-size: 14px !important;
}
.gantt_grid_head_delete {
    border-right: none !important;
}
.gantt_delete_btn_set {
    display: none !important;
}
.custom-task-assignee {
    margin-right: 8px;
}
</style>