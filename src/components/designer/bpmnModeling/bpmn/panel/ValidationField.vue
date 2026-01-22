<template>
    <v-list class="validate">
      <template v-if="countingValidation() === 1">
        <v-list-item class="validation-item">
          <v-list-item-content class="validation-item-content">
            <v-list-item-icon>
              <v-icon :style="{ color: getIconColor(validation[0].errorLevel) }">
                {{ getIconClass(validation[0].errorLevel) }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              {{ validation[0].message }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
      <template v-else>
        <v-list-group no-action append-icon="">
          <template v-slot:activator="{ props, on }">
            <v-list-item v-bind="props" v-on="on" class="validation-item activator-item">
              <v-list-item-content class="validation-item-content">
                <v-list-item-icon>
                  <v-icon :style="{ color: getIconColor(validation[0].errorLevel) }">
                    {{ getIconClass(validation[0].errorLevel) }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  {{ validation[0].message + (countingValidation() > 1 ? " (+" + (countingValidation() - 1) + " Others)" : "") }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
  
          <v-list-item
            v-for="(item, index) in validation"
            :key="index"
            class="validation-item validation-group"
          >
            <v-list-item-content class="validation-item-content">
              <v-list-item-icon>
                <v-icon :style="{ color: getIconColor(item.errorLevel) }">
                  {{ getIconClass(item.errorLevel) }}
                </v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ item.message }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </template>
    </v-list>
  </template>
  
  <script>
  export default {
    name: "ValidationField",
    props: {
      validation: {
        type: Array,
        required: true,
      },
    },
    methods: {
      getIconClass(errorLevel) {
        switch (errorLevel) {
          case 0:
            return "mdi-alert-outline";
          case 1:
            return "mdi-close-circle-outline";
          default:
            return "mdi-information";
        }
      },
      getIconColor(errorLevel) {
        switch (errorLevel) {
          case 0:
            return "orange";
          case 1:
            return "red";
          default:
            return "blue";
        }
      },
      countingValidation(){
        return this.validation.length;
      }
    },
  };
  </script>
  
  <style scoped>
  .validate .validation-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0px 0;
    font-size: 20px;
    color: #263238;
    padding-left: 0px;
  }
  
  .validate .validation-item-content {
    display: flex;
    align-items: center;
    color: #263238;
  }
  
  .validate .v-icon {
    font-size: 24px;
    margin-right: 8px;
  }


  .validate .v-list-item-title{
    font-size: 14px;
    font-weight: bold;
    white-space: normal;
    word-wrap: break-word; 
    overflow: visible; 
  }

  .validate .validation-group .v-list-item-title{
    font-weight: bold;
    color: #263238;
  }
    
  .validate .v-list-item-action {
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  </style>
  