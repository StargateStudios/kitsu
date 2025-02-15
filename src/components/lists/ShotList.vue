<template>
<div class="data-list">

  <table-header-menu
    ref="headerMenu"
    :is-minimized="hiddenColumns[lastHeaderMenuDisplayed]"
    :is-current-user-admin="isCurrentUserAdmin"
    @minimize-clicked="onMinimizeColumnToggled()"
    @delete-all-clicked="onDeleteAllTasksClicked()"
  />

  <table-metadata-header-menu
    ref="headerMetadataMenu"
    :is-current-user-admin="isCurrentUserAdmin"
    @edit-clicked="onEditMetadataClicked()"
    @delete-clicked="onDeleteMetadataClicked()"
  />

  <div class="table-header-wrapper">
    <table class="table table-header" ref="headerWrapper">
      <thead>
        <tr>
          <th class="thumbnail"></th>
          <th class="sequence" ref="th-sequence" >
            {{ $t('shots.fields.sequence') }}
          </th>
          <th class="name shot-name" ref="th-shot" >
            {{ $t('shots.fields.name') }}
          </th>
          <th
            class="description"
            v-if="!isCurrentUserClient && isShowInfos"
          >
            {{ $t('shots.fields.description') }}
            <button-simple
              class="is-small"
              icon="plus"
              :text="''"
              @click="onAddMetadataClicked"
              v-if="isCurrentUserAdmin && !isLoading"
            />
          </th>
          <th
            class="metadata-descriptor"
            :key="descriptor.id"
            v-for="descriptor in shotMetadataDescriptors"
            v-if="isShowInfos"
          >
            <div class="flexrow">
              <span class="flexrow-item">
              {{ descriptor.name }}
              </span>
              <chevron-down-icon
                @click="showMetadataHeaderMenu(descriptor.id, $event)"
                class="header-icon flexrow-item"
              />
            </div>
          </th>

          <th
            ref="th-spent"
            class="time-spent"
            v-if="!isCurrentUserClient && isShowInfos && isTime"
           >
            {{ $t('shots.fields.time_spent') }}
          </th>
          <th class="frames" v-if="isShowInfos">
            {{ $t('shots.fields.nb_frames') }}
          </th>
          <th class="framein" v-if="isFrameIn && isShowInfos">
            {{ $t('shots.fields.frame_in') }}
          </th>
          <th class="frameout" v-if="isFrameOut && isShowInfos">
            {{ $t('shots.fields.frame_out') }}
          </th>
          <th class="fps" v-if="isFps && isShowInfos">
            {{ $t('shots.fields.fps') }}
          </th>

          <th
            :class="{
              'validation-cell': !hiddenColumns[columnId],
              'hidden-validation-cell': hiddenColumns[columnId]
            }"
            :key="columnId"
            :style="getValidationStyle(columnId)"
            v-for="columnId in sortedValidationColumns"
            v-if="!isLoading && (!hiddenColumns[columnId] || isShowInfos)"
          >
            <div class="flexrow">
              <router-link
                class="flexrow-item"
                style="margin-right: 0;"
                :to="taskTypePath(columnId)"
              >
                {{ !hiddenColumns[columnId] ? taskTypeMap[columnId].name : '' }}
              </router-link>
              <chevron-down-icon
                @click="showHeaderMenu(columnId, $event)"
                class="header-icon flexrow-item"
              />
            </div>
          </th>
          <th class="actions">
            <button-link
              :class="{
                'is-small': true,
                highlighted: isEmptyTask
              }"
              icon="plus"
              :text="$t('tasks.create_tasks')"
              :path="createTasksPath"
              v-if="isCurrentUserManager"
            />
          </th>
        </tr>
      </thead>
    </table>
  </div>

  <table-info
    :is-loading="isLoading"
    :is-error="isError"
  >
  </table-info>

  <div
    class="has-text-centered"
    v-if="isEmptyList && !isCurrentUserClient && !isLoading"
  >
    <p class="info">
      <img src="../../assets/illustrations/empty_shot.png" />
    </p>
    <p class="info">{{ $t('shots.empty_list') }}</p>
    <button-simple
      class="level-item big-button"
      :text="$t('shots.new_shots')"
      @click="$emit('add-shots')"
    />
  </div>
  <div
    class="has-text-centered"
    v-if="isEmptyList && isCurrentUserClient && !isLoading"
  >
    <p class="info">
      <img src="../../assets/illustrations/empty_shot.png" />
    </p>
    <p class="info">{{ $t('shots.empty_list_client') }}</p>
  </div>

  <div
    ref="body"
    class="table-body"
    v-scroll="onBodyScroll"
    v-if="!isLoading"
  >
    <table class="table">
      <tbody ref="body-tbody">
        <tr
          :key="shot.id"
          :class="{canceled: shot.canceled}"
          v-for="(shot, i) in entries"
        >
          <td class="thumbnail">
            <entity-thumbnail :entity="shot" />
          </td>
          <td :class="{name: true, bold: !shot.canceled}">
            {{ shot.sequence_name }}
          </td>
          <td :class="{'shot-name': true, name: true, bold: !shot.canceled}">
            <router-link :to="shotPath(shot.id)">
              {{ shot.name }}
            </router-link>
          </td>
          <description-cell
            class="description"
            :entry="shot"
            v-if="!isCurrentUserClient && isShowInfos"
          />
          <td
            class="metadata-descriptor"
            :key="shot.id + '-' + descriptor.id"
            v-for="descriptor in shotMetadataDescriptors"
            v-if="isShowInfos"
          >
            {{ shot.data ? shot.data[descriptor.field_name] : '' }}
          </td>
          <td
            class="time-spent"
            v-if="!isCurrentUserClient && isShowInfos && isTime"
          >
            {{ formatDuration(shot.timeSpent) }}
          </td>
          <td class="frames"
            v-if="!isCurrentUserClient && isShowInfos"
          >
            {{ shot.nb_frames }}
          </td>
          <td class="framein" v-if="isFrameIn && isShowInfos">
            {{ shot.data && shot.data.frame_in ? shot.data.frame_in : ''}}
          </td>
          <td class="frameout" v-if="isFrameIn && isShowInfos">
            {{ shot.data && shot.data.frame_out ? shot.data.frame_out : ''}}
          </td>
          <td class="fps" v-if="isFps && isShowInfos">
            {{ shot.data && shot.data.fps ? shot.data.fps : ''}}
          </td>
          <validation-cell
            :class="{
              'validation-cell': !hiddenColumns[columnId],
              'hidden-validation-cell': hiddenColumns[columnId]
            }"
            :key="columnId + '-' + shot.id"
            :ref="'validation-' + i + '-' + j"
            :column="taskTypeMap[columnId]"
            :entity="shot"
            :task-test="taskMap[shot.validations[columnId]]"
            :minimized="hiddenColumns[columnId]"
            :selected="shotSelectionGrid[i][j]"
            :rowX="i"
            :columnY="j"
            :is-assignees="isShowAssignations"
            @select="onTaskSelected"
            @unselect="onTaskUnselected"
            v-for="(columnId, j) in sortedValidationColumns"
            v-if="!isLoading && (!hiddenColumns[columnId] || isShowInfos)"
          />
          <row-actions v-if="isCurrentUserManager"
            :entry="shot"
            :edit-route="editPath(shot.id)"
            :restore-route="restorePath(shot.id)"
            :delete-route="deletePath(shot.id)"
          />
          <td class="actions" v-else></td>
        </tr>
      </tbody>
    </table>
  </div>

  <p
    class="has-text-centered nb-shots"
    v-if="!isEmptyList && !isLoading"
  >
    {{ displayedShotsLength }} {{ $tc('shots.number', displayedShotsLength) }}
    ({{ formatDuration(displayedShotsTimeSpent) }}
     {{ $tc('main.days_spent', displayedShotsTimeSpent) }}, {{ displayedShotsFrames }} {{ $tc('main.nb_frames', displayedShotsFrames) }})

  </p>

</div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import {
  ChevronDownIcon
} from 'vue-feather-icons'
import { entityListMixin } from './base'
import { selectionListMixin } from './selection'
import { formatListMixin } from './format_mixin'

import ButtonLink from '../widgets/ButtonLink'
import ButtonSimple from '../widgets/ButtonSimple'
import DescriptionCell from '../cells/DescriptionCell'
import EntityThumbnail from '../widgets/EntityThumbnail'
import TableMetadataHeaderMenu from '../widgets/TableMetadataHeaderMenu'
import RowActions from '../widgets/RowActions'
import TableHeaderMenu from '../widgets/TableHeaderMenu'
import TableInfo from '../widgets/TableInfo'
import ValidationCell from '../cells/ValidationCell'

export default {
  name: 'shot-list',
  mixins: [entityListMixin, selectionListMixin, formatListMixin],

  props: [
    'entries',
    'isLoading',
    'isError',
    'validationColumns'
  ],

  data () {
    return {
      lastSelection: null,
      hiddenColumns: {},
      lastHeaderMenuDisplayed: null
    }
  },

  components: {
    ButtonLink,
    ButtonSimple,
    ChevronDownIcon,
    DescriptionCell,
    EntityThumbnail,
    RowActions,
    TableHeaderMenu,
    TableMetadataHeaderMenu,
    TableInfo,
    ValidationCell
  },

  computed: {
    ...mapGetters([
      'currentProduction',
      'currentEpisode',
      'displayedShotsLength',
      'displayedShotsTimeSpent',
      'displayedShotsFrames',
      'isCurrentUserAdmin',
      'isCurrentUserManager',
      'isCurrentUserClient',
      'isFps',
      'isFrameIn',
      'isFrameOut',
      'isSingleEpisode',
      'isShowAssignations',
      'isShowInfos',
      'isTime',
      'isTVShow',
      'nbSelectedTasks',
      'shotFilledColumns',
      'shotMap',
      'shotMetadataDescriptors',
      'shotSearchText',
      'shotSelectionGrid',
      'taskMap',
      'taskTypeMap'
    ]),

    isEmptyList () {
      return this.entries &&
             this.entries.length === 0 &&
             !this.isLoading &&
             !this.isError &&
             (!this.shotSearchText || this.shotSearchText.length === 0)
    },

    createTasksPath () {
      return this.getPath('create-shot-tasks')
    },

    manageShotsPath () {
      let route = {
        name: 'manage-shots',
        params: {
          production_id: this.currentProduction.id
        }
      }

      if (this.isTVShow && this.currentEpisode) {
        route.name = 'episode-manage-shots'
        route.params.episode_id = this.currentEpisode.id
      }

      return route
    },

    isEmptyTask () {
      return !this.isEmptyList &&
      !this.isLoading &&
      this.validationColumns &&
      this.validationColumns.length === 0
    }
  },

  methods: {
    ...mapActions([
      'displayMoreShots'
    ]),

    onHeaderScroll (event, position) {
      this.$refs.tableWrapper.scrollLeft = position.scrollLeft
    },

    onBodyScroll (event, position) {
      this.$refs.headerWrapper.style.left = `-${position.scrollLeft}px`
      this.$emit('scroll', position.scrollTop)
      const maxHeight =
        this.$refs.body.scrollHeight - this.$refs.body.offsetHeight
      if (maxHeight < (position.scrollTop + 100)) {
        this.loadMoreShots()
      }
    },

    loadMoreShots () {
      this.displayMoreShots()
      this.$nextTick(this.resizeHeaders)
    },

    resizeHeaders () {
      if (
        this.$refs['body-tbody'] &&
        this.$refs['body-tbody'].children.length > 0
      ) {
        let sequenceWidth, shotWidth
        sequenceWidth =
          this.$refs['body-tbody'].children[0].children[1].offsetWidth
        shotWidth =
          this.$refs['body-tbody'].children[0].children[2].offsetWidth

        this.$refs['th-sequence'].style = `min-width: ${sequenceWidth}px`
        this.$refs['th-shot'].style = `min-width: ${shotWidth}px`
      }
    },

    taskTypePath (taskTypeId) {
      if (this.isTVShow && this.currentEpisode) {
        return {
          name: 'episode-task-type',
          params: {
            production_id: this.currentProduction.id,
            episode_id: this.currentEpisode.id,
            task_type_id: taskTypeId,
            type: 'shots'
          }
        }
      } else {
        return {
          name: 'task-type',
          params: {
            production_id: this.currentProduction.id,
            task_type_id: taskTypeId,
            type: 'shots'
          }
        }
      }
    },

    shotPath (shotId) {
      return this.getPath('shot', shotId)
    },

    editPath (shotId) {
      return this.getPath('edit-shot', shotId)
    },

    deletePath (shotId) {
      return this.getPath('delete-shot', shotId)
    },

    restorePath (shotId) {
      return this.getPath('restore-shot', shotId)
    },

    getPath (section, shotId) {
      let route = {
        name: section,
        params: {
          production_id: this.currentProduction.id
        }
      }

      if (this.isTVShow && this.currentEpisode) {
        route.name = `episode-${section}`
        route.params.episode_id = this.currentEpisode.id
      }

      if (shotId) {
        route.params.shot_id = shotId
      }

      return route
    }
  },

  watch: {
    validationColumns () {
      this.initHiddenColumns(this.validationColumns, this.hiddenColumns)
    }
  }
}
</script>

<style lang="scss" scoped>
.project {
  min-width: 60px;
  width: 60px;
}

.actions {
  min-width: 100px;
}

th.actions {
  padding: 0.4em;
}

.name {
  min-width: 100px;
  width: 100px;
}

.bold {
  font-weight: bold;
}

.name a {
  color: inherit;
}

.name.shot-name {
  min-width: 110px;
  width: 110px;
}

.episode {
  min-width: 100px;
  width: 100px;
}

.sequence {
  min-width: 100px;
  width: 100px;
  font-weight: bold;
}

.framein {
  min-width: 60px;
  width: 60px;
}

.frameout {
  min-width: 60px;
  width: 60px;
}

.fps {
  min-width: 50px;
  max-width: 50px;
  width: 50px;
}

.description {
  min-width: 200px;
  max-width: 200px;
  width: 200px;
}

.validation-cell {
  min-width: 150px;
  max-width: 150px;
  width: 150px;
}

.frames {
  min-width: 80px;
  max-width: 80px;
  width: 80px;
}

.time-spent {
  min-width: 80px;
  max-width: 80px;
  width: 80px;
}

td.name {
  font-size: 1.2em;
}

td.sequence {
  font-size: 1.2em;
}

.canceled {
  text-decoration: line-through;
}

.thumbnail {
  min-width: 50px;
  max-width: 50px;
  width: 50px;
  padding: 0;
}

.thumbnail img {
  margin-top: 5px;
}

span.thumbnail-empty {
  display: block;
  width: 50px;
  height: 30px;
  background: #F3F3F3;
}

.info {
  margin-top: 2em;
}

.hidden-validation-cell {
  min-width: 30px;
  max-width: 30px;
  width: 30px;
  padding: 4px;
}

tbody {
  user-select: none;
}

.metadata-descriptor {
  min-width: 120px;
  max-width: 120px;
  width: 120px;
}

.table th {
  vertical-align: middle;
}

.header-icon {
  min-width: 15px;
}

th {
  word-break: break-all
}

.info img {
  max-width: 80vh;
}
</style>
