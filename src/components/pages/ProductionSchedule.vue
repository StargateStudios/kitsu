<template>
<div
  class="columns fixed-page"
>
  <div
    class="column main-column"
  >
    <div class="flexrow project-dates">
      <div class="flexrow-item">
        {{ $t('main.start_date') }}
      </div>
      <div class="flexrow-item">
        <datepicker
          wrapper-class="datepicker"
          input-class="date-input input"
          :language="locale"
          :disabled-dates="{ days: [6, 0] }"
          :monday-first="true"
          format="d MMMM yyyy"
          v-model="selectedStartDate"
        />
      </div>
      <div class="flexrow-item">
        {{ $t('main.end_date') }}
      </div>
      <div class="flexrow-item">
        <datepicker
          wrapper-class="datepicker"
          input-class="date-input input"
          :language="locale"
          :disabled-dates="{ days: [6, 0] }"
          :monday-first="true"
          format="d MMMM yyyy"
          v-model="selectedEndDate"
        />
      </div>
      <div class="flexrow-item">
        {{ $t('schedule.overall_man_days') }}
      </div>
      <text-field
        class="flexrow-item overall-man-days"
        type="number"
        v-model="overallManDays"
        :disabled="!isCurrentUserAdmin"
        v-focus
      />
      <div class="flexrow-item">
        {{ $t('schedule.zoom_level') }}
      </div>
      <combobox-number
        class="flexrow-item"
        :options="zoomOptions"
        v-model="zoomLevel"
      />
    </div>

    <schedule
      :start-date="startDate"
      :end-date="endDate"
      :hierarchy="scheduleItems"
      :zoom-level="zoomLevel"
      :is-loading="loading.schedule"
      :is-error="errors.schedule"
      @item-changed="saveScheduleItem"
      @change-zoom="changeZoom"
    />
  </div>

  <div
    class="column side-column is-hidden-mobile hide-small-screen"
    v-if="currentTask"
  >
    <task-info
      :task="currentTask"
      :is-loading="false"
    />
  </div>
</div>

</template>

<script>
/*
 * Page to manage the schedule of the big steps of the production. It allows
 * to set milestones too.
 */
import { mapGetters, mapActions } from 'vuex'
import moment from 'moment-timezone'
import { en, fr } from 'vuejs-datepicker/dist/locale'
import Datepicker from 'vuejs-datepicker'

import { sortScheduleItems } from '../../lib/sorting'

import ComboboxNumber from '../widgets/ComboboxNumber'
import TaskInfo from '../sides/TaskInfo'
import TextField from '../widgets/TextField'
import Schedule from './schedule/Schedule'

export default {
  name: 'production-schedule',
  components: {
    ComboboxNumber,
    Datepicker,
    Schedule,
    TaskInfo,
    TextField
  },

  data () {
    return {
      currentTask: null,
      overallManDays: 0,
      endDate: moment().add(6, 'months'),
      scheduleItems: [],
      startDate: moment(),
      selectedStartDate: null,
      selectedEndDate: null,
      zoomLevel: 3,
      zoomOptions: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 }
      ],
      loading: {
        schedule: false
      },
      errors: {
        schedule: false
      }
    }
  },

  mounted () {
    this.reset()
  },

  computed: {
    ...mapGetters([
      'currentEpisode',
      'currentProduction',
      'isCurrentUserAdmin',
      'taskTypeMap',
      'user'
    ]),

    locale () {
      if (this.user.locale === 'fr_FR') {
        return fr
      } else {
        return en
      }
    }
  },

  methods: {
    ...mapActions([
      'editProduction',
      'loadScheduleItems',
      'saveScheduleItem'
    ]),

    loadData () {
      this.loading.schedule = true
      this.loadScheduleItems(this.currentProduction)
        .then((scheduleItems) => {
          scheduleItems = scheduleItems.map((item) => {
            const taskType = this.taskTypeMap[item.task_type_id]
            return {
              ...item,
              color: taskType.color,
              for_shots: taskType.for_shots,
              name: taskType.name,
              priority: taskType.priority,
              startDate: moment(item.start_date, 'YYYY-MM-DD'),
              endDate: moment(item.end_date, 'YYYY-MM-DD')
            }
          })
          this.scheduleItems =
            sortScheduleItems(scheduleItems, this.taskTypeMap)
          this.loading.schedule = false
        })
        .catch((err) => {
          console.error(err)
          this.loading.schedule = false
        })
    },

    changeZoom (event) {
      if (event.wheelDelta < 0 && this.zoomLevel > 1) this.zoomLevel--
      if (event.wheelDelta > 0 && this.zoomLevel < 3) this.zoomLevel++
    },

    reset () {
      if (this.currentProduction.start_date) {
        this.startDate = moment(this.currentProduction.start_date)
      }
      if (this.currentProduction.end_date) {
        this.endDate = moment(this.currentProduction.end_date)
      }
      this.overallManDays = this.currentProduction.man_days
      this.selectedStartDate = this.startDate.toDate()
      this.selectedEndDate = this.endDate.toDate()
      this.loadData()
    }
  },

  socket: {
  },

  watch: {
    selectedStartDate () {
      this.startDate = moment(this.selectedStartDate)
      this.editProduction({
        data: {
          ...this.currentProduction,
          start_date: this.startDate.format('YYYY-MM-DD')
        }
      })
    },

    selectedEndDate () {
      this.endDate = moment(this.selectedEndDate)
      this.editProduction({
        data: {
          ...this.currentProduction,
          end_date: this.endDate.format('YYYY-MM-DD')
        }
      })
    },

    overallManDays () {
      if (this.overallManDays !== this.currentProduction.man_days) {
        this.editProduction({
          data: {
            ...this.currentProduction,
            man_days: this.overallManDays
          }
        })
      }
    },

    currentProduction () {
      this.reset()
    }
  },

  metaInfo () {
    if (this.isTVShow) {
      return {
        title: `${this.currentProduction ? this.currentProduction.name : ''}` +
               ` - ${this.currentEpisode ? this.currentEpisode.name : ''}` +
               ` | ${this.$t('schedule.title')} - Kitsu`
      }
    } else {
      return {
        title: `${this.currentProduction.name} ` +
               `| ${this.$t('schedule.title')} - Kitsu`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dark {
  .project-dates {
    color: $white-grey;
    border-bottom: 1px solid $grey;
  }
}

.project-dates {
  border-bottom: 1px solid #EEE;
  margin-left: 235px;
  padding-bottom: 1em;

  .field {
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .overall-man-days {
    width: 80px;
    font-size: 0.9em;
    margin-right: 1em;
  }
}

.fixed-page {
  padding: 1em;
  padding-top: 90px;
  padding-left: 2em;
}

.main-column {
  display: flex;
  border: 0;
  overflow: hidden;
  flex-direction: column;
}
</style>
