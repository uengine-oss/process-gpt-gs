<template>
  <v-card class="mx-auto my-8 container-setting-box" elevation="16" max-width="600">
    <v-row class="ma-0 pa-2">
      <v-card-title class="pb-0">
          {{ $t('ContainerSettingPanel.title') }}
      </v-card-title>
      <v-spacer></v-spacer>
      <v-btn @click="$emit('onClose')"
          icon variant="text" density="comfortable"
      >
          <Icons :icon="'close'" :size="16"/>
      </v-btn>
    </v-row>

    <v-card-text>
      <v-text-field ref="name" :label="$t('ContainerSettingPanel.id')" v-model.trim="localContainerProps.name"
                      @keyup.enter="save" persistent-placeholder></v-text-field>
      
      <v-text-field :label="$t('ContainerSettingPanel.name')" v-model.trim="localContainerProps.alias"
                      @keyup.enter="save" persistent-placeholder></v-text-field>
        
      <v-checkbox :label="$t('ContainerSettingPanel.multDataMode')" v-model="localContainerProps.isMultiDataMode"
                  @keyup.enter="save"></v-checkbox>
    </v-card-text>

    <v-btn @click="save" color="primary" rounded class="form-apply-btn">{{ $t('ContainerSettingPanel.save') }}</v-btn>
  </v-card>
</template>
  
<script>
  export default {
    name: 'container-setting-panel',

    emits: [
      "onClose",
      "onSave"
    ],
    props: {
      sectionId: String,
      containerProps: Object // {name, alias, isMultiDataMode}
    },

    data: () => ({
      localContainerProps: null
    }),

    watch: {
      containerProps: {
        deep: true,
        handler(newVal) {
          this.localContainerProps = {...newVal};
        }
      }
    },

    created() {
      this.localContainerProps = {...this.containerProps};
    },

    methods: {
      save() {
        if(this.localContainerProps.isMultiDataMode) {
          if(!this.localContainerProps.name || this.localContainerProps.name.length <= 0) {
            alert('Name is required');
            this.$refs.name.focus();
            return;
          }
        }

        this.$emit('onSave', this.sectionId, this.localContainerProps)
      }
    },

    mounted() {
      this.$nextTick(() => {
        this.$refs.name.focus()
      });
    }
  }
</script>