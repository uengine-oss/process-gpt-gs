<template>
    <v-chip
      :color="chipColor"
      :text-color="textColor"
      :size="size"
      :variant="variant"
    >
      <v-icon v-if="showIcon" :icon="statusIcon" size="small" class="mr-1" />
        {{ statusText }}
    </v-chip>
  </template>
  
  <script>
  export default {
    name: 'StatusChip',
    props: {
      type: {
        type: String,
        default: null,
      },
      // 상태 값
      status: {
        type: String,
        required: true
      },
      // 크기
      size: {
        type: String,
        default: 'small',
        validator: (value) => ['x-small', 'small', 'default', 'large'].includes(value)
      },
      
      // 스타일 변형
      variant: {
        type: String,
        default: 'outlined',
        validator: (value) => ['elevated', 'outlined', 'flat', 'tonal'].includes(value)
      },
      
      // 아이콘 표시 여부
      showIcon: {
        type: Boolean,
        default: true
      }
    },
    
    computed: {
      // 상태별 색상 매핑
      chipColor() {
        if(!this.type) return 'grey'

        let colorMap = { 'DEFAULT': 'grey' }
        if(this.type == 'instance'){
          colorMap = {
            // 인스턴스 상태
            'NEW': 'grey',
            'IN_PROGRESS': 'blue',
            'PENDING': 'orange',
            'DONE': 'green',
            'COMPLETED': 'green',
            'CANCELLED': 'red',
            // 기본값
            'DEFAULT': 'white'
          }
        } else if(this.type == 'project'){
          colorMap = {
            // 프로젝트 상태
            'NEW': 'grey',
            'RUNNING': 'green',
            'PENDING': 'yellow',
            'CANCELLED': 'red',
            'DONE': 'green',
            // 기본값
            'DEFAULT': 'grey'
          }
        } else if(this.type == 'task'){
          colorMap = {
            // 태스크 상태
            'TODO': 'grey',
            'IN_PROGRESS': 'blue',
            'PENDING': 'yellow',
            'CANCELLED': 'red',
            'DONE': 'green',
            // 기본값
            'DEFAULT': 'grey'
          }
        }
        return colorMap[this.status] || colorMap.DEFAULT
      },
      
      // 텍스트 색상
      textColor() {
        const textColorMap = {
          'green': 'white',
          'blue': 'white',
          'red': 'white',
          'orange': 'white',
          'yellow': 'black',
          'grey': 'white'
        }
        return textColorMap[this.chipColor] || 'white'
      },
      
      // 상태별 텍스트
      statusText() {
        let textMap = { 'DEFAULT': this.status }
        if(this.type == 'instance'){
          textMap = {
            // 인스턴스 상태
            'TODO': this.$t('statusChip.scheduled'),
            'IN_PROGRESS': this.$t('statusChip.inProgress'),
            'PENDING': this.$t('statusChip.pending'),
            'CANCELLED': this.$t('statusChip.cancelled'),
            'COMPLETED': this.$t('statusChip.completed'),
            'DONE': this.$t('statusChip.completed'),

            // 기본값
            'DEFAULT': this.status
          }
        } else if(this.type == 'project'){
          textMap = {
            // 프로젝트 상태
            'TODO': this.$t('statusChip.scheduled'),
            'RUNNING': this.$t('statusChip.inProgress'),
            'PENDING': this.$t('statusChip.pending'),
            'CANCELLED': this.$t('statusChip.cancelled'),
            'DONE': this.$t('statusChip.completed'),
            
            // 기본값
            'DEFAULT': this.status
          }
        } else if(this.type == 'task'){
          textMap = {
            // 태스크 상태
            'TODO': this.$t('statusChip.scheduled'),
            'IN_PROGRESS': this.$t('statusChip.inProgress'),
            'PENDING': this.$t('statusChip.pending'),
            'CANCELLED': this.$t('statusChip.cancelled'),
            'DONE': this.$t('statusChip.completed'),
            // 기본값
            'DEFAULT': this.status
          }
        }
        return textMap[this.status] || textMap.DEFAULT
      },
      
      // 상태별 아이콘
      statusIcon() {
        let iconMap = { 'DEFAULT': 'mdi-circle' }
        if(this.type === 'instance'){
          iconMap = {
            // 인스턴스 상태
            'TODO': 'mdi-circle',
            'IN_PROGRESS': 'mdi-progress-clock',
            'PENDING':  'mdi-clock-outline',
            'DONE':  'mdi-check-circle',
            'CANCELLED': 'mdi-close-circle',
            'COMPLETED': 'mdi-check-circle',

            // 기본값
            'DEFAULT': 'mdi-circle'
          }
        } else if(this.type === 'project'){
          iconMap = {
            // 프로젝트 상태
            'TODO': 'mdi-circle',
            'RUNNING': 'mdi-progress-clock',
            'PENDING':  'mdi-clock-outline',
            'DONE':  'mdi-check-circle',
            'CANCELLED': 'mdi-close-circle',
            
            // 기본값
            'DEFAULT': 'mdi-circle'
          }
        } else if(this.type === 'task'){
          iconMap = {
            // 태스크 상태
            'TODO': 'mdi-circle',
            'IN_PROGRESS': 'mdi-progress-clock',
            'PENDING':  'mdi-clock-outline',
            'DONE':  'mdi-check-circle',
            'CANCELLED': 'mdi-close-circle',

            // 기본값
            'DEFAULT': 'mdi-circle'
          }
        }
        return iconMap[this.status] || iconMap.DEFAULT
      }
    }
  }
  </script>
  
  <style scoped>
  .status-chip {
    font-weight: 500;
    text-transform: none;
  }
  
  .status-chip .v-icon {
    opacity: 0.9;
  }
  </style>