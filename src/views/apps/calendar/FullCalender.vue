<template>
    <div class='demo-app'>
        <div class='demo-app-main '>
            <FullCalendar class='demo-app-calendar rounded-md' :options='calendarOptions' :key="calendarKey">
                <template v-slot:eventContent='arg'>
                    <div class="text-subtitle-1 pa-1 text-truncate">{{ arg.event.title }}</div>
                </template>
            </FullCalendar>
            <v-dialog v-model="updateModalShow" max-width="500px">
                <v-card>
                    <v-card-text>
                        <div class="event-details-header">
                            <h4 class="text-h4">{{ $t('calendar.evnet') }}</h4>
                            <v-btn v-if="!editMode" icon @click="toggleEditMode">
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn v-else icon @click="toggleEditMode">
                                <v-icon>mdi-arrow-left</v-icon>
                            </v-btn>
                        </div>
                        <div v-if="!editMode" class="event-details">
                            <div class="event-detail-item">
                                <span class="event-label">{{ $t('calendar.scheduleTitle') }}:</span>
                                <span class="event-value">{{ selectedEvent.title }}</span>
                            </div>
                            <div class="event-detail-item">
                                <span class="event-label">{{ $t('calendar.start') }}:</span>
                                <span class="event-value">{{ selectedEvent.start }}</span>
                            </div>
                            <div class="event-detail-item">
                                <span class="event-label">{{ $t('calendar.end') }}:</span>
                                <span class="event-value">{{ selectedEvent.end }}</span>
                            </div>
                            <div class="event-detail-item" v-if="selectedEvent.description">
                                <span class="event-label">{{ $t('calendar.description') }}:</span>
                                <span class="event-value">{{ selectedEvent.description }}</span>
                            </div>
                        </div>
                        <div v-if="editMode">
                            <v-text-field
                                v-model="selectedEvent.title"
                                :label="$t('calendar.scheduleTitle')"
                                outlined
                            ></v-text-field>
                            <v-text-field
                                v-model="selectedEvent.start"
                                :label="$t('calendar.start')"
                                outlined
                                type="datetime-local"
                            ></v-text-field>
                            <v-text-field
                                v-model="selectedEvent.end"
                                :label="$t('calendar.end')"
                                outlined
                                type="datetime-local"
                            ></v-text-field>
                            <v-textarea
                                v-model="selectedEvent.description"
                                :label="$t('calendar.description')"
                                outlined
                            ></v-textarea>
                            <v-select 
                                v-model="selectedEvent.color" 
                                :label="$t('calendar.color')"
                                :items="colorItems"
                                item-title="text"
                                item-value="value"
                            >
                                <template v-slot:append>
                                    <v-btn icon @click="showColorPicker = !showColorPicker">
                                        <v-icon :style="showColorPicker ? 'color: #2196F3':''">mdi-palette</v-icon>
                                    </v-btn>
                                </template>
                            </v-select>
                            <v-color-picker
                                v-if="showColorPicker"
                                v-model="selectedEvent.color"
                                label="Custom Color"
                                hide-inputs
                                outlined
                            ></v-color-picker>
                            <v-row class="pa-0 ma-0" style="margin-top: 10px;">
                                <v-spacer></v-spacer>
                                <v-btn style="margin-right: 5px;" color="primary" @click="updateEvent">{{ $t('calendar.save') }}</v-btn>
                                <v-btn color="error" @click="deleteEvent">{{ $t('calendar.delete') }}</v-btn>
                            </v-row>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
import StorageBaseFactory from '@/utils/StorageBaseFactory'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import FullCalendar from '@fullcalendar/vue3'
import { defineComponent } from 'vue'

export default defineComponent({
    components: {
        FullCalendar,
    },
    data() {
        return {
            updateModalShow: false,
            editMode: false, 
            calendarOptions: {
                plugins: [
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin 
                ],
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                initialView: 'dayGridMonth',
                initialEvents: [], 
                editable: true,
                selectable: true,
                selectMirror: true,
                dayMaxEvents: true,
                weekends: true,
                select: this.handleDateSelect,
                eventClick: this.handleEventClick,
                eventsSet: this.handleEvents,
                datesSet: this.handleDateSet,
                initialView: 'dayGridMonth',
                initialDate: null,
                longPressDelay: 0, // 모바일에서 터치 꾹 누름 문제 해결
                locale: this.$i18n.locale,
            },
            currentEvents: [],
            calendarKey: 0,
            selectedEvent: {},
            showColorPicker: false,
            colorItems: [
                {
                    text: 'Red',
                    value: '#EC4545'
                },
                {
                    text: 'Blue',
                    value: '#2196F3'
                },
                {
                    text: 'Green',
                    value: '#4CAF50'
                },
                {
                    text: 'Yellow',
                    value: '#FFEB3B'
                },
                {
                    text: 'Purple',
                    value: '#9C27B0'
                }
            ],
            calendarData: null,
            currentMonth: null,
        }
    },
    methods: {
        handleDateSet(info){
            const startDate = new Date(info.startStr);
            let currentMonth;
            let currentYear = startDate.getFullYear();

            if (startDate.getDate() === 1) {
                currentMonth = startDate.getMonth();
            } else {
                if (startDate.getMonth() === 11) {
                    currentMonth = 0;
                    currentYear += 1;
                } else {
                    currentMonth = startDate.getMonth() + 1;
                }
            }

            const newCurrentMonth = `${currentYear}_${currentMonth < 9 ? `0${currentMonth + 1}` : currentMonth + 1}`;
            if (!this.currentMonth || this.currentMonth !== newCurrentMonth) {
                this.currentMonth = newCurrentMonth;
                this.setCalendar()
            }
        },
        async setCalendar(){
            this.storage = StorageBaseFactory.getStorage();
            let option = {
                    key: "uid"
            }
            if(!this.calendarData){
                const res = await this.storage.getObject(`db://calendar/${localStorage.getItem('uid')}`, option);
                if(res && res.data){
                        this.calendarData = res.data
                }
            } 
            if(this.calendarData) {
                if(this.calendarData[this.currentMonth]){
                    this.calendarOptions.initialEvents = Object.values(this.calendarData[this.currentMonth])
                } else {
                    this.calendarOptions.initialEvents = []
                }
                this.calendarOptions.initialDate = this.currentMonth.replace('_', "-")
            }
            this.calendarKey++;
        },
        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        },
        handleWeekendsToggle() {
            this.calendarOptions.weekends = !this.calendarOptions.weekends 
        },
        handleDateSelect(selectInfo) {
            const title = this.$t('calendar.newEventTitle')
            const calendarApi = selectInfo.view.calendar
            calendarApi.unselect()
            if (title) {
                let data = {
                    id: this.uuid(),
                    title,
                    start: selectInfo.startStr,
                    end: selectInfo.endStr,
                    allDay: selectInfo.allDay
                }
                calendarApi.addEvent(data)
                this.calendarOptions.initialEvents.push(data)
            }
            
        },
        handleEventClick(clickInfo) {
            let selectedEvent = this.calendarOptions.initialEvents.find(x => x.id == clickInfo.event.id)
            if(selectedEvent){
                this.selectedEvent = selectedEvent
            } else {
                this.selectedEvent = clickInfo.event
            }
            this.showColorPicker = false;
            this.updateModalShow = true;
        },
        handleEvents(events) {
            this.currentEvents = events;
        },
        async saveCalendar(option) {
            const startDate = new Date(this.selectedEvent.start);
            const endDate = new Date(this.selectedEvent.end);

            if (option == 'update' && startDate > endDate) {
                alert('종료일은 시작일 이후여야 합니다.');
                return;
            }

            this.updateModalShow = false;
            this.editMode = false;

            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');

            if(option == 'update'){
                if(!this.calendarData){
                    this.calendarData = {}
                }
                if(!this.calendarData[`${year}_${month}`]){
                    this.calendarData[`${year}_${month}`] = {}
                }
                this.calendarData[`${year}_${month}`][this.selectedEvent.id] = this.selectedEvent;
            } else {
                delete this.calendarData[`${year}_${month}`][this.selectedEvent.id]
            }

            let uid = localStorage.getItem('uid');
            if (!uid) {
                const firstMonthKey = Object.keys(this.calendarData)[0];
                if (firstMonthKey && this.calendarData[firstMonthKey]) {
                    const firstEventKey = Object.keys(this.calendarData[firstMonthKey])[0];
                    if (firstEventKey && this.calendarData[firstMonthKey][firstEventKey]) {
                        uid = this.calendarData[firstMonthKey][firstEventKey].id;
                        localStorage.setItem('uid', uid);
                    }
                }
            }

            let calendarObj = {
                "uid": uid,
                "data": this.calendarData
            }
            await this.storage.putObject(`calendar`, calendarObj);
            this.calendarKey++;
        },
        updateEvent() {
            this.saveCalendar('update')
        },
        deleteEvent() {
            let eventIdx = this.calendarOptions.initialEvents.findIndex(x => x.id == this.selectedEvent.id);
            if (eventIdx !== -1) {
                this.calendarOptions.initialEvents.splice(eventIdx, 1);
            }
            this.saveCalendar('delete')
        },
        toggleEditMode() {
            this.editMode = !this.editMode; 
        },
    }
})
</script>

<style lang='css'>
.fc-daygrid-day-bottom {
    margin-top: -15px !important;
}
.fc .fc-button-group>.fc-button {
    display: flex;
    align-items: center;
    padding: 6px 22px;
}

.fc .fc-button {
    font-size: 1rem;
    font-weight: 500;
    text-transform: capitalize
}

.fc .fc-button .fc-icon {
    font-size: 1.5em;
    vertical-align: unset;
}

.fc .fc-button-primary {
    background: rgb(var(--v-theme-primary));
    border-color: rgb(var(--v-theme-primary));

}

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
    background-color: rgb(var(--v-theme-primary));
    border-color: rgb(var(--v-theme-primary));
}

.fc .fc-button-primary:not(:disabled).fc-button-active:focus,
.fc .fc-button-primary:not(:disabled):active:focus {
    box-shadow: none;
}

.fc-theme-standard td,
.fc-theme-standard th {
    border: 1px solid rgba(var(--v-border-color), 1) !important;
}

.fc-theme-standard .fc-scrollgrid {
    border: 0 !important;
}

.fc-theme-standard th {
    border-bottom: 0 !important;
}

.fc-h-event {
    background-color: rgb(var(--v-theme-primary));
    border: 1px solid rgb(var(--v-theme-primary));
    display: block;
}

.fc .fc-col-header-cell-cushion {
    display: inline-block;
    padding: 10px 5px;
    font-size: 14px;
}

.fc-direction-ltr .fc-button-group>.fc-button:not(:last-child) {
    border-bottom-left-radius: 9999px;
    border-top-left-radius: 9999px;
}

.fc-direction-ltr .fc-button-group>.fc-button:not(:first-child) {
    border-bottom-right-radius: 9999px;
    border-top-right-radius: 9999px;
    margin-left: -1px;
}

.fc-button-group .fc-dayGridMonth-button {
    border-bottom-right-radius: 9999px !important;
    border-top-right-radius: 9999px !important;
}

.fc-button-group .fc-timeGridDay-button {
    border-bottom-left-radius: 9999px !important;
    border-top-left-radius: 9999px !important;
}

.fc-today-button {
    border-radius: 9999px !important;
}

.fc-timeGridWeek-button {
    margin: 0 10px !important;
}

.fc .fc-daygrid-day.fc-day-today {
    background-color: #eaf6ff;
}

/* 추가된 스타일 */
.event-details {
    padding: 10px;
}

.event-detail-item {
    margin-bottom: 10px;
}

.event-label {
    font-weight: bold;
}

.event-value {
    margin-left: 5px;
}

.event-details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.event-details-title {
    margin: 0;
}

@media screen and (max-width:600px) {
    .fc .fc-toolbar {
        display: block;
        text-align: center;
    }

    .fc-toolbar-chunk .fc-toolbar-title {
        margin: 15px 0
    }

    .fc .fc-button-group>.fc-button {
        display: flex;
        align-items: center;
        padding: 2px 10px;
    }
    .fc-toolbar-title {
        padding:10px;
    }
}
</style>
