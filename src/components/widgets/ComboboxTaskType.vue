<template>
<div
  class="task-type-combo"
>
  <div
    class="flexrow"
    @click="toggleTaskTypeList"
  >
    <div
      class="selected-task-type-line flexrow-item"
    >
      <task-type-name
        :task-type="currentTaskType"
        v-if="currentTaskType"
      />
    </div>
    <chevron-down-icon class="down-icon flexrow-item"/>
  </div>
  <div
    class="select-input"
    ref="select"
    v-if="showTaskTypeList"
  >
    <div
      class="task-type-line"
      v-for="taskType in taskTypeList"
      @click="selectTaskType(taskType)"
      :key="taskType.id"
    >
      <task-type-name
        :task-type="taskType"
      />
    </div>
  </div>
</div>

</template>

<script>
import { mapGetters } from 'vuex'
import { ChevronDownIcon } from 'vue-feather-icons'

import TaskTypeName from './TaskTypeName'

export default {
  name: 'combobox-task-type',

  components: {
    ChevronDownIcon,
    TaskTypeName
  },

  data () {
    return {
      showTaskTypeList: false
    }
  },

  props: {
    taskTypeList: {
      default: () => [],
      type: Array
    },
    value: {
      default: '',
      type: String
    }
  },

  mounted () {
    this.selectedTaskType = this.taskType
  },

  computed: {
    ...mapGetters([
      'taskTypeMap'
    ]),

    currentTaskType () {
      if (this.value) {
        return this.taskTypeMap[this.value]
      } else {
        return this.taskTypeList[0]
      }
    }
  },

  methods: {
    selectTaskType (taskType) {
      this.$emit('input', taskType.id)
      this.showTaskTypeList = false
    },

    toggleTaskTypeList () {
      this.showTaskTypeList = !this.showTaskTypeList
    }
  }
}
</script>

<style lang="scss" scoped>
.dark {
  .select-input,
  .selected-task-type-line,
  .task-type-line,
  .task-type-combo {
    background: $dark-grey-light;
    border-color: $dark-grey;
  }

  .task-type-line:hover {
    background: $dark-purple;
  }
}

.task-type-combo {
  background: $white;
  min-width: 150px;
  width: 150px;
  border: 1px solid $light-grey-light;
  user-select: none;
  cursor: pointer;
  border-radius: 3px;
  margin: 0;
}

.selected-task-type-line {
  background: $white;
  padding: 0.4em;
  text-transform: uppercase;
  flex: 1;
}

.task-type-line {
  background: $white;
  cursor: pointer;
  padding: 0.4em;
  margin: 0;
  text-transform: uppercase;

  &:hover {
    background: $purple;
  }
}

.down-icon {
  width: 15px;
  min-width: 15px;
  margin-right: 0.4em;
  color: $grey;
  cursor: pointer;
}

.select-input {
  background: $white;
  width: 150px;
  position: fixed;
  border: 1px solid $light-grey-light;
  z-index: 200;
  margin-left: -1px;
  max-height: 180px;
  overflow-y: auto;
}
</style>
