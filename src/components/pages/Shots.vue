<template>
<div class="columns fixed-page">
  <div class="column main-column">
    <div class="shots page">
      <div class="shot-list-header page-header">
        <div class="level header-title">
          <div class="level-left flexcolumn">
            <div class="filters-area flexcolumn-item">
              <search-field
                ref="shot-search-field"
                :can-save="true"
                @change="onSearchChange"
                @save="saveSearchQuery"
                placeholder="ex: e01 s01 anim=wip"
              />
            </div>
          </div>

          <div class="level-right">
            <div class="flexrow">
              <show-assignations-button class="flexrow-item" />
              <show-infos-button class="flexrow-item" />
              <div class="flexrow-item"></div>
            </div>
            <div class="flexrow" v-if="isCurrentUserManager">
              <button-link
                class="flexrow-item"
                :title="$t('main.csv.import_file')"
                icon="upload"
                :is-responsive="true"
                :path="importPath"
              />
              <button-href-link
                class="flexrow-item"
                :title="$t('main.csv.export_file')"
                icon="download"
                :is-responsive="true"
                :path="'/api/export/csv/projects/' + currentProduction.id + '/shots.csv'"
              />
              <button-simple
                class="flexrow-item"
                :text="$t('shots.manage')"
                icon="plus"
                :is-responsive="true"
                :path="manageShotsPath"
                @click="showManageShots"
              />
            </div>
          </div>
        </div>

        <div class="query-list">
          <search-query-list
            :queries="shotSearchQueries"
            @changesearch="changeSearch"
            @removesearch="removeSearchQuery"
            v-if="!isShotsLoading && !initialLoading"
          />
        </div>
      </div>

      <shot-list
        ref="shot-list"
        :entries="displayedShots"
        :is-loading="isShotsLoading || initialLoading"
        :is-error="isShotsLoadingError"
        :validation-columns="shotValidationColumns"
        @scroll="saveScrollPosition"
        @delete-all-tasks="onDeleteAllTasksClicked"
        @add-metadata="onAddMetadataClicked"
        @delete-metadata="onDeleteMetadataClicked"
        @edit-metadata="onEditMetadataClicked"
        @add-shots="showManageShots"
      />
    </div>
  </div>

  <div
    class="column side-column"
    v-if="nbSelectedTasks === 1"
  >
    <task-info
      :task="Object.values(selectedTasks)[0]"
    />
  </div>

  <manage-shots-modal
    :active="modals.isManageDisplayed"
    :is-loading="loading.manage"
    :is-error="false"
    :is-success="false"
    :cancel-route="shotsPath"
    @cancel="hideManageShots"
  />

  <edit-shot-modal
    :active="modals.isNewDisplayed"
    :is-loading="loading.edit"
    :is-loading-stay="loading.stay"
    :is-error="editShot.isCreateError"
    :is-success="editShot.isSuccess"
    :cancel-route="shotsPath"
    :shot-to-edit="shotToEdit"
    @confirm="confirmEditShot"
  />

  <delete-modal
    ref="delete-shot-modal"
    :active="modals.isDeleteDisplayed"
    :is-loading="deleteShot.isLoading"
    :is-error="deleteShot.isError"
    :cancel-route="shotsPath"
    :text="deleteText()"
    :error-text="$t('shots.delete_error')"
    @confirm="confirmDeleteShot"
  />

  <delete-modal
    ref="restore-shot-modal"
    :active="modals.isRestoreDisplayed"
    :is-loading="restoreShot.isLoading"
    :is-error="restoreShot.isError"
    :cancel-route="shotsPath"
    :text="restoreText()"
    :error-text="$t('shots.restore_error')"
    @confirm="confirmRestoreShot"
  />

  <delete-modal
    ref="delete-metadata-modal"
    :active="modals.isDeleteMetadataDisplayed"
    :is-loading="loading.deleteMetadata"
    :is-error="errors.deleteMetadata"
    @cancel="modals.isDeleteMetadataDisplayed = false"
    :text="$t('productions.metadata.delete_text')"
    :error-text="$t('productions.metadata.delete_error')"
    @confirm="confirmDeleteMetadata"
  />

  <hard-delete-modal
    ref="delete-all-tasks-modal"
    :active="modals.isDeleteAllTasksDisplayed"
    :is-loading="loading.deleteAllTasks"
    :is-error="errors.deleteAllTasks"
    :cancel-route="shotsPath"
    :text="deleteAllTasksText()"
    :error-text="$t('tasks.delete_all_error')"
    :lock-text="deleteAllTasksLockText"
    @confirm="confirmDeleteAllTasks"
  />

  <import-modal
    :active="modals.isImportDisplayed"
    :is-loading="loading.importing"
    :is-error="errors.importing"
    :cancel-route="shotsPath"
    :form-data="shotsCsvFormData"
    :columns="columns"
    @fileselected="selectFile"
    @confirm="uploadImportFile"
  />

  <create-tasks-modal
    :active="modals.isCreateTasksDisplayed"
    :is-loading="loading.creatingTasks"
    :is-loading-stay="loading.creatingTasksStay"
    :is-error="errors.creatingTasks"
    :cancel-route="shotsPath"
    :title="$t('tasks.create_tasks_shot')"
    :text="$t('tasks.create_tasks_shot_explaination')"
    :error-text="$t('tasks.create_tasks_shot_failed')"
    @confirm="confirmCreateTasks"
    @confirm-and-stay="confirmCreateTasksAndStay"
  />

  <add-metadata-modal
    :active="modals.isAddMetadataDisplayed"
    :is-loading="loading.addMetadata"
    :is-loading-stay="loading.addMetadata"
    :is-error="errors.addMetadata"
    :descriptor-to-edit="descriptorToEdit"
    @cancel="closeMetadataModal"
    @confirm="confirmAddMetadata"
  />
</div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import AddMetadataModal from '../modals/AddMetadataModal'
import ButtonHrefLink from '../widgets/ButtonHrefLink'
import ButtonLink from '../widgets/ButtonLink'
import ButtonSimple from '../widgets/ButtonSimple'
import CreateTasksModal from '../modals/CreateTasksModal'
import DeleteModal from '../widgets/DeleteModal'
import EditShotModal from '../modals/EditShotModal'
import ImportModal from '../modals/ImportModal'
import HardDeleteModal from '../modals/HardDeleteModal'
import ManageShotsModal from '../modals/ManageShotsModal'
import SearchField from '../widgets/SearchField'
import SearchQueryList from '../widgets/SearchQueryList'
import ShowAssignationsButton from '../widgets/ShowAssignationsButton'
import ShowInfosButton from '../widgets/ShowInfosButton'
import ShotList from '../lists/ShotList.vue'
import TaskInfo from '../sides/TaskInfo.vue'

export default {
  name: 'shots',

  components: {
    AddMetadataModal,
    ButtonLink,
    ButtonHrefLink,
    ButtonSimple,
    CreateTasksModal,
    DeleteModal,
    EditShotModal,
    ImportModal,
    HardDeleteModal,
    ManageShotsModal,
    SearchField,
    SearchQueryList,
    ShowAssignationsButton,
    ShowInfosButton,
    ShotList,
    TaskInfo
  },

  data () {
    return {
      initialLoading: true,
      modals: {
        isAddMetadataDisplayed: false,
        isCreateTasksDisplayed: false,
        isDeleteDisplayed: false,
        isDeleteMetadataDisplayed: false,
        isDeleteAllTasksDisplayed: false,
        isImportDisplayed: false,
        isManageDisplayed: false,
        isNewDisplayed: false,
        isRestoreDisplayed: false
      },
      loading: {
        addMetadata: false,
        creatingTasks: false,
        creatingTasksStay: false,
        deleteAllTasks: false,
        deleteMetadata: false,
        edit: false,
        importing: false,
        stay: false
      },
      errors: {
        addMetadata: false,
        deleteMetadata: false,
        creatingTasks: false,
        deleteAllTasks: false,
        importing: false
      },
      descriptorToEdit: {},
      shotToDelete: null,
      shotToEdit: null,
      columns: [
        'Episode',
        'Sequence',
        'Name',
        'Description',
        'FPS',
        'Frame In',
        'Frame Out'
      ],
      deleteAllTasksLockText: null
    }
  },

  computed: {
    ...mapGetters([
      'currentEpisode',
      'currentProduction',
      'deleteShot',
      'displayedShots',
      'editShot',
      'episodeMap',
      'episodes',
      'isCurrentUserManager',
      'isShotsLoading',
      'isShotsLoadingError',
      'isShowAssignations',
      'isTVShow',
      'nbSelectedTasks',
      'openProductions',
      'restoreShot',
      'sequences',
      'selectedTasks',
      'shotMap',
      'shotsCsvFormData',
      'shotSearchQueries',
      'shotSearchText',
      'shotsPath',
      'shotValidationColumns',
      'shotListScrollPosition',
      'taskTypeMap'
    ]),

    importPath () {
      return this.getPath('import-shots')
    },

    manageShotsPath () {
      return this.getPath('manage-shots')
    }
  },

  created () {
    this.setLastProductionScreen('shots')
  },

  mounted () {
    if (this.shotSearchText.length > 0) {
      this.$refs['shot-search-field'].setValue(this.shotSearchText)
    }

    if (
      Object.keys(this.shotMap).length < 2 ||
      (
        this.shotValidationColumns.length > 0 &&
        !Object.keys(this.shotMap)[0].validations
      )
    ) {
      setTimeout(() => {
        this.loadShots((err) => {
          setTimeout(() => {
            this.initialLoading = false
          }, 200)
          this.resizeHeaders()
          if (!err) {
            this.onSearchChange()
            this.handleModalsDisplay()
            setTimeout(() => {
              this.resizeHeaders()
              this.$refs['shot-list'].setScrollPosition(
                this.shotListScrollPosition
              )
            }, 500)
          }
        })
      }, 100)
    } else {
      if (!this.isShotsLoading) this.initialLoading = false
      this.resizeHeaders()
      this.onSearchChange()
      this.$refs['shot-list'].setScrollPosition(
        this.shotListScrollPosition
      )
    }
  },

  methods: {
    ...mapActions([
      'addMetadataDescriptor',
      'deleteAllTasks',
      'deleteMetadataDescriptor',
      'loadShots',
      'loadComment',
      'removeShotSearch',
      'saveShotSearch',
      'setLastProductionScreen',
      'setShotSearch',
      'showAssignations',
      'hideAssignations'
    ]),

    confirmAddMetadata (form) {
      this.loading.addMetadata = true
      form.entity_type = 'Shot'
      this.addMetadataDescriptor(form)
        .then(() => {
          this.loading.addMetadata = false
          this.modals.isAddMetadataDisplayed = false
        })
        .catch((err) => {
          console.error(err)
          this.loading.addMetadata = false
          this.errors.addMetadata = true
        })
    },

    closeMetadataModal () {
      this.modals.isAddMetadataDisplayed = false
    },

    confirmDeleteMetadata () {
      this.errors.deleteMetadata = false
      this.loading.deleteMetadata = true
      this.deleteMetadataDescriptor(this.descriptorIdToDelete)
        .then(() => {
          this.errors.deleteMetadata = false
          this.loading.deleteMetadata = false
          this.modals.isDeleteMetadataDisplayed = false
        }).catch((err) => {
          console.error(err)
          this.errors.deleteMetadata = true
          this.loading.deleteMetadata = false
        })
    },

    onAddMetadataClicked () {
      this.descriptorToEdit = {}
      this.modals.isAddMetadataDisplayed = true
    },

    onDeleteMetadataClicked (descriptorId) {
      this.descriptorIdToDelete = descriptorId
      this.modals.isDeleteMetadataDisplayed = true
    },

    onEditMetadataClicked (descriptorId) {
      this.descriptorToEdit = this.currentProduction.descriptors.find(
        d => d.id === descriptorId
      )
      this.modals.isAddMetadataDisplayed = true
    },

    confirmEditShot (form) {
      let action = 'newShot'
      this.loading.edit = true
      this.editShot.isCreateError = false
      if (this.shotToEdit && this.shotToEdit.id) {
        action = 'editShot'
        form.id = this.shotToEdit.id
      }

      this.$store.dispatch(action, {
        data: form,
        callback: (err) => {
          if (!err) {
            this.loading.edit = false
            this.modals.isNewDisplayed = false
            this.$router.push(this.shotsPath)
          } else {
            this.loading.edit = false
            this.editShot.isCreateError = true
          }
        }
      })
    },

    confirmDeleteAllTasks () {
      const taskTypeId = this.$route.params.task_type_id
      const projectId = this.currentProduction.id
      this.errors.deleteAllTasks = false
      this.loading.deleteAllTasks = true
      this.deleteAllTasks({ projectId, taskTypeId })
        .then(() => {
          this.loading.deleteAllTasks = false
          this.loadShots(() => {
            this.resizeHeaders()
          })
          this.$router.push(this.shotsPath)
        }).catch((err) => {
          console.error(err)
          this.loading.deleteAllTasks = false
          this.errors.deleteAllTasks = true
        })
    },

    confirmDeleteShot () {
      this.$store.dispatch('deleteShot', {
        shot: this.shotToDelete,
        callback: (err) => {
          if (!err) {
            this.$router.push(this.shotsPath)
          }
        }
      })
    },

    confirmRestoreShot () {
      this.$store.dispatch('restoreShot', {
        shot: this.shotToRestore,
        callback: (err) => {
          if (!err) {
            this.$router.push(this.shotsPath)
          }
        }
      })
    },

    confirmCreateTasks (form) {
      this.loading.creatingTasks = true
      this.runTasksCreation(form, (err) => {
        if (!err) this.$router.push(this.shotsPath)
        this.loading.creatingTasks = false
      })
    },

    confirmCreateTasksAndStay (form) {
      this.loading.creatingTasksStay = true
      this.runTasksCreation(form, () => {
        this.loading.creatingTasksStay = false
      })
    },

    runTasksCreation (form, callback) {
      this.errors.creatingTasks = false
      this.$store.dispatch('createTasks', {
        task_type_id: form.task_type_id,
        project_id: this.currentProduction.id,
        type: 'shots',
        callback: (err) => {
          if (err) {
            this.errors.creatingTasks = true
          } else {
            this.modals.isCreateTasks = false
            this.loadShots(() => {
              this.resizeHeaders()
            })
          }
          callback(err)
        }
      })
    },

    resetEditModal () {
      const form = { name: '' }
      if (this.sequences.length > 0) {
        form.sequence_id = this.sequences[0].id
      }
      if (this.openProductions.length > 0) {
        form.production_id = this.openProductions[0].id
      }
      this.shotToEdit = form
    },

    deleteText () {
      const shot = this.shotToDelete
      if (shot) {
        return this.$t('shots.delete_text', { name: shot.name })
      } else {
        return ''
      }
    },

    deleteAllTasksText () {
      const taskType = this.taskTypeMap[this.$route.params.task_type_id]
      if (taskType) {
        return this.$t('tasks.delete_all_text', { name: taskType.name })
      } else {
        return ''
      }
    },

    restoreText () {
      const shot = this.shotToRestore
      if (shot) {
        return this.$t('shots.restore_text', { name: shot.name })
      } else {
        return ''
      }
    },

    handleModalsDisplay () {
      const path = this.$route.path
      const shotId = this.$route.params.shot_id
      this.editShot.isSuccess = false
      this.editShot.isError = false

      Object.assign(this.modals, {
        isAddMetadataDisplayed: false,
        isCreateTasksDisplayed: false,
        isDeleteAllTasksDisplayed: false,
        isDeleteDisplayed: false,
        isDeleteMetadataDisplayed: false,
        isImportDisplayed: false,
        isNewDisplayed: false,
        isRestoreDisplayed: false
      })

      if (path.indexOf('new') > 0) {
        this.resetEditModal()
        this.modals.isNewDisplayed = true
      } else if (path.indexOf('edit') > 0) {
        this.shotToEdit = this.shotMap[shotId]
        this.modals.isNewDisplayed = true
      } else if (path.indexOf('delete-all-tasks') > 0) {
        this.modals.isDeleteAllTasksDisplayed = true
      } else if (path.indexOf('delete') > 0) {
        this.shotToDelete = this.shotMap[shotId]
        this.modals.isDeleteDisplayed = true
      } else if (path.indexOf('restore') > 0) {
        this.shotToRestore = this.shotMap[shotId]
        this.modals.isRestoreDisplayed = true
      } else if (path.indexOf('import') > 0) {
        this.modals.isImportDisplayed = true
      } else if (path.indexOf('create-tasks') > 0) {
        this.modals.isCreateTasksDisplayed = true
      }
    },

    selectFile (formData) {
      this.$store.commit('SHOT_CSV_FILE_SELECTED', formData)
    },

    uploadImportFile () {
      this.loading.importing = true
      this.errors.importing = false

      this.$store.dispatch('uploadShotFile', (err) => {
        if (!err) {
          this.loading.importing = false
          this.modals.isImportDisplayed = false
          this.loadShots(() => {
            this.resizeHeaders()
          })
        } else {
          this.loading.importing = false
          this.errors.importing = true
        }
      })
    },

    onDeleteAllTasksClicked (taskTypeId) {
      const route = this.getPath('delete-all-shot-tasks')
      const taskType = this.taskTypeMap[taskTypeId]
      route.params.task_type_id = taskTypeId
      this.deleteAllTasksLockText = taskType.name
      this.$router.push(route)
    },

    onSearchChange (event) {
      const searchQuery = this.$refs['shot-search-field'].getValue()
      if (searchQuery.length !== 1) {
        this.setShotSearch(searchQuery)
        this.resizeHeaders()
      }
    },

    saveScrollPosition (scrollPosition) {
      this.$store.commit(
        'SET_SHOT_LIST_SCROLL_POSITION',
        scrollPosition
      )
    },

    changeSearch (searchQuery) {
      this.$refs['shot-search-field'].setValue(searchQuery.search_query)
      this.$refs['shot-search-field'].$emit('change', searchQuery.search_query)
      this.resizeHeaders()
    },

    saveSearchQuery (searchQuery) {
      this.saveShotSearch(searchQuery)
        .then(() => {
        })
        .catch((err) => {
          if (err) console.log('error')
        })
    },

    removeSearchQuery (searchQuery) {
      this.removeShotSearch(searchQuery)
        .then(() => {
        })
        .catch((err) => {
          if (err) console.log('error')
        })
    },

    resizeHeaders () {
      setTimeout(() => {
        if (this.$refs['shot-list']) {
          this.$refs['shot-list'].resizeHeaders()
        }
      }, 0)
    },

    getPath (section) {
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
      return route
    },

    showManageShots () {
      this.modals.isManageDisplayed = true
    },

    hideManageShots () {
      console.log('cancel')
      this.modals.isManageDisplayed = false
    }
  },

  watch: {
    $route () {
      this.handleModalsDisplay()
    },

    currentProduction () {
      this.$refs['shot-search-field'].setValue('')
      this.$store.commit('SET_SHOT_LIST_SCROLL_POSITION', 0)

      this.initialLoading = true
      if (!this.isTVShow) {
        this.loadShots((err) => {
          this.initialLoading = false
          this.resizeHeaders()
          if (!err) {
            this.handleModalsDisplay()
          }
        })
      }
    },

    currentEpisode () {
      if (this.isTVShow && this.currentEpisode) {
        this.initialLoading = true
        this.loadShots((err) => {
          this.initialLoading = false
          this.resizeHeaders()
          if (!err) {
            this.handleModalsDisplay()
          }
        })
      }
    },

    displayedShots () {
      this.resizeHeaders()
    }
  },

  metaInfo () {
    if (this.isTVShow) {
      return {
        title: `${this.currentProduction ? this.currentProduction.name : ''}` +
               ` - ${this.currentEpisode ? this.currentEpisode.name : ''}` +
               ` | ${this.$t('shots.title')} - Kitsu`
      }
    } else {
      return {
        title: `${this.currentProduction.name} ${this.$t('shots.title')} - Kitsu`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.data-list {
  margin-top: 0;
}

.page-header {
  margin-bottom: 1em;
}

.level {
  align-items: flex-start;
}

.flexcolumn {
  align-items: flex-start;
}

.shots {
  display: flex;
  flex-direction: column;
}

.columns {
  display: flex;
  flex-direction: row;
  padding: 0;
}

.column {
  overflow-y: auto;
  padding: 0;
}

.main-column {
  border-right: 3px solid $light-grey;
}
</style>
