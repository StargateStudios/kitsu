<template>
<div class="data-list">
  <div class="table-header-wrapper">
    <table class="table table-header" ref="headerWrapper">
      <thead ref="thead">
        <tr>
          <th class="thumbnail" ref="th-thumbnail">
          </th>
          <th class="asset-type" ref="th-type" v-if="isAssets">
            {{ $t('tasks.fields.asset_type') }}
          </th>
          <th class="sequence" ref="th-type" v-else>
            {{ $t('tasks.fields.sequence') }}
          </th>
          <th class="name" ref="th-name">
            {{ $t('tasks.fields.entity_name') }}
          </th>
          <th class="status" ref="th-status">
            {{ $t('tasks.fields.task_status') }}
          </th>
          <th class="assignees" ref="th-assignees">
            {{ $t('tasks.fields.assignees') }}
          </th>
          <th class="frames" ref="th-frames" v-if="!isAssets">
            {{ $t('tasks.fields.frames') }}
          </th>
          <th class="estimation" ref="th-estimation">
            {{ $t('tasks.fields.estimation').substring(0, 3) }}.
          </th>
          <th class="duration" ref="th-duration">
            {{ $t('tasks.fields.duration').substring(0, 3) }}.
          </th>
          <th class="retake-count" ref="th-retake-count">
            {{ $t('tasks.fields.retake_count') }}
          </th>
          <th class="real-start-date" ref="th-status">
            {{ $t('tasks.fields.real_start_date') }}
          </th>
          <th class="real-end-date" ref="th-status">
            {{ $t('tasks.fields.real_end_date') }}
          </th>
          <th class="last-comment-date" ref="th-status">
            {{ $t('tasks.fields.last_comment_date') }}
          </th>
          <th class="empty" ref="">
            &nbsp;
          </th>
        </tr>
      </thead>
    </table>
  </div>

  <table-info
    :is-loading="isLoading"
    :is-error="isError"
  />

  <div
    ref="body"
    class="table-body"
    v-scroll="onBodyScroll"
    v-if="!isLoading"
  >
    <table
      class="table unselectable"
    >
      <tbody
        class="tbody"
        ref="body-tbody"
      >
        <tr
          :ref="'task-' + task.id"
          :key="task.id"
          :class="{
            'task-line': true,
            selected: selectionGrid[task.id]
          }"
          @click="selectTask($event, index, task)"
          v-for="(task, index) in displayedTasks"
        >
          <td class="thumbnail">
            <entity-thumbnail
              :entity="getEntity(task.entity.id)"
              :width="50"
              :height="33"
            />
          </td>
          <td class="asset-type" v-if="isAssets">
            {{ getEntity(task.entity.id).asset_type_name }}
          </td>
          <td class="sequence" v-else>
            {{ getEntity(task.entity.id).sequence_name }}
          </td>
          <td class="name">
            {{ getEntity(task.entity.id).name }}
          </td>
          <validation-cell
            class="status unselectable"
            :task-test="task"
            :is-border="false"
            :is-assignees="false"
            :selectable="false"
            :is-static="true"
          />
          <td class="assignees">
            <div class="flexrow">
              <people-avatar
                class="flexrow-item"
                :key="task.id + '-' + personId"
                :person="personMap[personId]"
                :size="30"
                :font-size="17"
                v-for="personId in task.assignees"
              />
            </div>
          </td>
          <td class="frames" v-if="!isAssets">
            {{ getEntity(task.entity.id).nb_frames }}
          </td>
          <td class="estimation">
            {{ formatEstimation(task.estimation) }}
          </td>
          <td :class="{
            duration: true,
            error: isEstimationBurned(task)
          }">
            {{ formatDuration(task.duration) }}
          </td>
          <td class="retake-count">
            <span
              v-for="index in task.retake_count"
              :key="index"
            >
              &bull;
            </span>
          </td>
          <td class="real-start-date">
            {{ formatDate(task.real_start_date) }}
          </td>
          <td class="real-end-date">
            {{ formatDate(task.real_end_date) }}
          </td>
          <td class="last-comment-date">
            {{ formatDate(task.last_comment_date) }}
          </td>
          <td>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p
    class="has-text-centered nb-tasks"
    v-if="!isLoading"
  >
    {{ tasks.length }} {{ $tc('tasks.number', tasks.length) }}
    ({{ formatDuration(timeSpent) }}
     {{ $tc('main.days_spent', Math.floor((timeSpent ? timeSpent : 0) / 60) / 8) }}<span v-if="!isAssets">, {{ nbFrames }} {{ $tc('main.nb_frames', nbFrames) }}</span>)
  </p>
</div>
</template>

<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import moment from 'moment-timezone'
import { range } from '../../lib/helpers'
import { formatListMixin } from './format_mixin'

import EntityThumbnail from '../widgets/EntityThumbnail'
import TableInfo from '../widgets/TableInfo'
import PeopleAvatar from '../widgets/PeopleAvatar'
import ValidationCell from '../cells/ValidationCell'

export default {
  name: 'task-list',
  mixins: [formatListMixin],

  components: {
    EntityThumbnail,
    PeopleAvatar,
    TableInfo,
    ValidationCell
  },

  data () {
    return {
      lastSelection: null,
      page: 1,
      selectionGrid: {}
    }
  },

  props: {
    isAssets: {
      type: Boolean,
      default: true
    },
    isError: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    tasks: {
      type: Array,
      default: () => []
    },
    taskType: {
      type: Object,
      default: () => {}
    }
  },

  mounted () {
    window.addEventListener('keydown', this.onKeyDown, false)
    this.$nextTick(this.resizeHeaders)
  },

  beforeDestroy () {
    window.removeEventListener('keydown', this.onKeyDown)
  },

  computed: {
    ...mapGetters([
      'assetMap',
      'nbSelectedTasks',
      'personMap',
      'selectedTasks',
      'shotMap'
    ]),

    timeSpent () {
      let total = 0
      this.tasks.forEach(task => {
        total += task.duration
      })
      return total
    },

    nbFrames () {
      let total = 0
      this.tasks.forEach(task => {
        const entity = this.shotMap[task.entity.id]
        if (entity && entity.nb_frames) total += entity.nb_frames
      })
      return total
    },

    displayedTasks () {
      if (this.tasks && this.tasks.length > 0) {
        return this.tasks.slice(0, 60 * this.page)
      } else {
        return []
      }
    }
  },

  methods: {
    ...mapActions([
      'addSelectedTask',
      'addSelectedTasks',
      'clearSelectedTasks',
      'removeSelectedTask'
    ]),

    formatEstimation (estimation) {
      if (estimation) {
        if (estimation < 10) {
          return estimation
        } else {
          return this.formatDuration(estimation)
        }
      } else {
        return 0
      }
    },

    formatDate (date) {
      if (date) return moment(date).format('YYYY-MM-DD')
      else return ''
    },

    isEstimationBurned (task) {
      return task.estimation &&
        task.estimation > 0 &&
        task.duration > task.estimation
    },

    onBodyScroll (event, position) {
      this.$refs.headerWrapper.style.left = `-${position.scrollLeft}px`
      this.$emit('scroll', position.scrollTop)
      const maxHeight =
        this.$refs.body.scrollHeight - this.$refs.body.offsetHeight
      if (maxHeight < (position.scrollTop + 100)) {
        this.page++
      }
    },

    getEntity (entityId) {
      if (this.isAssets) {
        return this.assetMap[entityId]
      } else {
        return this.shotMap[entityId]
      }
    },

    onKeyDown (event) {
      if (this.tasks.length > 0 && event.ctrlKey) {
        let index = this.lastSelection ? this.lastSelection : 0
        if ([37, 38].includes(event.keyCode)) {
          index = (index - 1) < 0 ? index = this.tasks.length - 1 : index - 1
          this.selectTask({}, index, this.tasks[index])
        } else if ([39, 40].includes(event.keyCode)) {
          index = (index + 1) >= this.tasks.length ? index = 0 : index + 1
          this.selectTask({}, index, this.tasks[index])
        }
      }
    },

    selectTask (event, index, task) {
      const isSelected = this.selectionGrid[task.id]
      const isManySelection = Object.keys(this.selectionGrid).length > 1
      if (!event.ctrlKey && !event.shiftKey) {
        this.clearSelectedTasks({ task })
        this.resetSelection()
      }

      if (!event.shiftKey) {
        if (this.selectionGrid[task.id]) {
          this.removeSelectedTask({ task })
          Vue.set(this.selectionGrid, task.id, undefined)
        } else if (!isSelected || isManySelection) {
          this.addSelectedTask({ task })
          this.$emit('task-selected', task)
          Vue.set(this.selectionGrid, task.id, true)
          this.lastSelection = index
        }
      } else {
        this.selectionGrid = {}
        let taskIndices = []
        if (this.lastSelection > index) {
          taskIndices = range(index, this.lastSelection)
        } else {
          taskIndices = range(this.lastSelection, index)
        }
        const selection = taskIndices.map(i => ({ task: this.tasks[i] }))
        selection.forEach(task => {
          Vue.set(this.selectionGrid, task.task.id, true)
        })
        this.addSelectedTasks(selection)
      }
      this.scrollToLine(task.id)
    },

    setScrollPosition (scrollPosition) {
      if (this.$refs.body) {
        this.$refs.body.scrollTop = scrollPosition
      }
    },

    scrollToLine (taskId) {
      const taskLine = this.$refs['task-' + taskId]
      if (taskLine) {
        const margin = 30
        const rect = taskLine.getBoundingClientRect()
        const listRect = this.$refs.body.getBoundingClientRect()
        const isBelow = rect.bottom > listRect.bottom - margin
        const isAbove = rect.top < listRect.top + margin

        if (isBelow) {
          const scrollingRequired = rect.bottom - listRect.bottom + margin
          this.setScrollPosition(
            this.$refs.body.scrollTop + scrollingRequired
          )
        } else if (isAbove) {
          const scrollingRequired = listRect.top - rect.top + margin
          this.setScrollPosition(
            this.$refs.body.scrollTop - scrollingRequired
          )
        }
      }
    },

    resetSelection () {
      this.selectionGrid = {}
      this.lastSelection = null
    },

    resizeHeaders () {
      if (
        this.$refs['body-tbody'] &&
        this.$refs['body-tbody'].children.length > 0
      ) {
        const bodyElement = this.$refs['body-tbody'].children[0]
        const columnDescriptors = [
          { index: 1, name: 'type' },
          { index: 2, name: 'name' },
          { index: 4, name: 'assignees' }
        ]
        columnDescriptors.forEach(desc => {
          const width = Math.max(
            bodyElement.children[desc.index].offsetWidth,
            100
          )
          this.$refs['th-' + desc.name].style['min-width'] = `${width}px`
        })
      }
    },

    getTableData () {
      const headers = [
        this.isAssets ? this.$t('tasks.fields.asset_type') : this.$t('tasks.fields.sequence'),
        this.$t('tasks.fields.entity_name'),
        this.$t('tasks.fields.task_status'),
        this.$t('tasks.fields.assignees'),
        this.$t('tasks.fields.estimation'),
        this.$t('tasks.fields.duration'),
        this.$t('tasks.fields.retake_count'),
        this.$t('tasks.fields.real_start_date'),
        this.$t('tasks.fields.real_end_date'),
        this.$t('tasks.fields.last_comment_date')
      ]
      if (!this.isAssets) {
        headers.splice(4, 0, 'otot')
      }
      const taskLines = [headers]
      this.tasks.forEach((task) => {
        const assignees = task.assignees.map(personId => {
          const person = this.personMap[personId]
          if (person) return person.name
          else return ''
        }).join(', ')
        const line = [
          this.isAssets ? this.getEntity(task.entity.id).asset_type_name : this.getEntity(task.entity.id).sequence_name,
          this.getEntity(task.entity.id).name,
          task.task_status_short_name,
          assignees,
          task.estimation,
          this.formatDuration(task.duration),
          task.retake_count,
          this.formatDate(task.real_start_date),
          this.formatDate(task.real_end_date),
          this.formatDate(task.last_comment_date)
        ]
        if (!this.isAssets) {
          const value = this.getEntity(task.entity.id).nb_frames
          line.splice(4, 0, value)
        }
        taskLines.push(line)
      })
      return taskLines
    }
  },

  watch: {
    tasks () {
      this.page = 1
      this.resetSelection()
      this.$nextTick(this.resizeHeaders)
    },

    nbSelectedTasks () {
      if (this.nbSelectedTasks === 0) this.resetSelection()
    }
  }
}
</script>

<style scoped lang="scss">
.dark .table-body tr.task-line.selected {
  background: $dark-purple;
}

.thumbnail {
  min-width: 80px;
  width: 80px;
  max-width: 80px;
}

.asset-type {
  min-width: 120px;
  width: 120px;
}

.sequence {
  min-width: 120px;
  width: 120px;
}

.name {
  min-width: 120px;
  width: 120px;
  font-weight: bold;
}

.status {
  min-width: 100px;
  width: 100px;
}

.assignees {
  min-width: 130px;
  width: 130px;
}

.frames,
.duration,
.estimation {
  min-width: 60px;
  width: 60px;
  text-align: center;
}

.last-comment-date,
.real-start-date,
.real-end-date {
  min-width: 130px;
  width: 130px;
}

.retake-count {
  min-width: 90px;
  width: 90px;
}

td.retake-count {
  line-height: 0.5em;
  color: $red;
  font-weight: bold;
  font-size: 1.6em;
  padding-left: 2px;
}

.empty {
  width: 100%
}

.nb-tasks {
  padding: 0.5em;
}

.table-header th {
  padding: 0.5em 0;

  &.retake-count {
    padding-right: 1em;
  }

  &.status {
    padding-left: 1em;
  }
}

.table-body {
  td,
  tr {
    padding: 0;
  }

  td.retake-count {
    padding-right: 1em;
  }

  td.status {
    padding-left: 1em;
    padding-right: 1em;
  }

  tr.task-line {
    cursor: pointer;

    &.selected {
      border: 0;
      background: $purple;
    }
  }
}
</style>
