<template>
  <div class="min-h-screen">
    <div v-if="activity" class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h2 class="text-xl font-semibold">{{ activity.config.name || '新建活动' }}</h2>
            <p class="text-sm text-gray-400">{{ activityId ? `活动ID: ${activityId}` : '' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="activity.status === 'draft'"
            @click="saveActivity"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            保存草稿
          </button>
          <button
            v-if="activity.status === 'draft'"
            @click="submitForApproval"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            提交审核
          </button>
        <button
          v-if="activity?.status === 'pending'"
          @click="approve"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          审核通过
        </button>
        <button
          v-if="activity?.status === 'active' || activity?.status === 'paused'"
          @click="toggleStatus"
          class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
        >
          {{ activity?.status === 'active' ? '暂停活动' : '恢复活动' }}
        </button>
        <button
          v-if="activity?.status === 'active' || activity?.status === 'paused'"
          @click="endActivity"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          结束活动
        </button>
      </div>
    </div>

    <div class="flex gap-4">
      <div class="flex-1 space-y-6">
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText class="w-5 h-5 text-purple-400" />
            基本信息
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">活动名称</label>
              <input
                v-model="activity.config.name"
                type="text"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="请输入活动名称"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">优先级</label>
              <input
                v-model.number="activity.config.priority"
                type="number"
                min="1"
                max="100"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-300 mb-2">活动描述</label>
              <textarea
                v-model="activity.config.description"
                rows="3"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                placeholder="请输入活动描述"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">活动Banner图片URL</label>
              <input
                v-model="activity.config.bannerImage"
                type="text"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="可选"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">倒计时预警阈值(小时)</label>
              <input
                v-model.number="countdownWarningHours"
                type="number"
                min="1"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="默认24小时"
              />
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-purple-400" />
            时间排期
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">开始时间</label>
              <input
                :value="formatDateTimeLocal(activity.config.schedule.startTime)"
                @input="updateStartTime($event)"
                type="datetime-local"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">结束时间</label>
              <input
                :value="formatDateTimeLocal(activity.config.schedule.endTime)"
                @input="updateEndTime($event)"
                type="datetime-local"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">排期类型</label>
              <select
                v-model="activity.config.schedule.type"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="fixed">固定时间</option>
                <option value="recurring">循环</option>
                <option value="trigger">触发</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">时区</label>
              <select
                v-model="activity.config.schedule.timezone"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers class="w-5 h-5 text-purple-400" />
            阶段解锁
          </h3>
          <div class="space-y-3">
            <div
              v-for="(stage, index) in activityStages"
              :key="stage.id"
              class="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-sm font-bold text-purple-300">
                    {{ index + 1 }}
                  </span>
                  <div>
                    <p class="font-medium text-white">{{ stage.name }}</p>
                    <p class="text-xs text-gray-400">{{ stage.description }}</p>
                  </div>
                  <span
                    class="px-2 py-0.5 text-xs rounded-full"
                    :class="stage.isUnlocked ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
                  >
                    {{ stage.isUnlocked ? '已解锁' : '未解锁' }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="!stage.isUnlocked && stage.unlockType === 'manual'"
                    @click="manualUnlockStage(stage.id)"
                    class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    手动解锁
                  </button>
                  <button
                    @click="removeStageById(stage.id)"
                    class="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span class="text-gray-400">解锁方式:</span>
                  <span class="text-white ml-1">{{ unlockTypeLabels[stage.unlockType] }}</span>
                </div>
                <div v-if="stage.unlockType === 'time' && stage.unlockTime">
                  <span class="text-gray-400">解锁时间:</span>
                  <span class="text-white ml-1">{{ formatDate(stage.unlockTime) }}</span>
                </div>
                <div v-if="stage.unlockType === 'condition' && stage.unlockConditions">
                  <span class="text-gray-400">条件逻辑:</span>
                  <span class="text-white ml-1">{{ stage.unlockConditions.logic }} ({{ stage.unlockConditions.conditions.length }}条)</span>
                </div>
                <div v-if="stage.unlockedAt">
                  <span class="text-gray-400">解锁于:</span>
                  <span class="text-green-400 ml-1">{{ formatDate(stage.unlockedAt) }}</span>
                </div>
              </div>
              <div v-if="stage.unlockType === 'condition' && stage.unlockConditions && stage.unlockConditions.conditions.length > 0" class="mt-2 space-y-1">
                <div
                  v-for="cond in stage.unlockConditions.conditions"
                  :key="cond.id"
                  class="flex items-center gap-2 text-xs bg-gray-700/40 rounded px-2 py-1"
                >
                  <span class="text-purple-300">{{ conditionTypeLabels[cond.type] || cond.type }}</span>
                  <span class="text-gray-400">{{ operatorLabels[cond.operator] }}</span>
                  <span class="text-yellow-300">{{ JSON.stringify(cond.value) }}</span>
                </div>
              </div>
            </div>

            <div v-if="activityStages.length === 0" class="py-6 text-center text-gray-500 text-sm">
              暂无阶段配置，点击下方按钮添加
            </div>

            <div class="border-t border-gray-600 pt-3 mt-3">
              <h4 class="text-sm font-medium text-gray-300 mb-3">添加新阶段</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">阶段名称</label>
                  <input
                    v-model="newStageName"
                    type="text"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                    placeholder="如: 第一阶段"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">阶段描述</label>
                  <input
                    v-model="newStageDescription"
                    type="text"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                    placeholder="阶段说明"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">解锁方式</label>
                  <select
                    v-model="newStageUnlockType"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="time">定时解锁</option>
                    <option value="condition">条件解锁</option>
                    <option value="manual">手动解锁</option>
                  </select>
                </div>
                <div v-if="newStageUnlockType === 'time'">
                  <label class="block text-xs text-gray-500 mb-1">解锁时间</label>
                  <input
                    v-model="newStageUnlockTime"
                    type="datetime-local"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div v-if="newStageUnlockType === 'condition'" class="col-span-2">
                  <label class="block text-xs text-gray-500 mb-1">解锁条件</label>
                  <div class="space-y-2 bg-gray-700/50 rounded p-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-xs text-gray-400">逻辑:</span>
                      <select
                        v-model="newStageConditionLogic"
                        class="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="AND">全部满足 (AND)</option>
                        <option value="OR">任一满足 (OR)</option>
                      </select>
                    </div>
                    <div
                      v-for="(cond, ci) in newStageConditions"
                      :key="ci"
                      class="flex items-center gap-2"
                    >
                      <select
                        v-model="cond.type"
                        class="flex-1 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-xs text-white focus:outline-none"
                      >
                        <option v-for="(label, key) in conditionTypeLabels" :key="key" :value="key">{{ label }}</option>
                      </select>
                      <select
                        v-model="cond.operator"
                        class="w-20 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-xs text-white focus:outline-none"
                      >
                        <option v-for="(label, key) in operatorLabels" :key="key" :value="key">{{ label }}</option>
                      </select>
                      <input
                        v-model="cond.value"
                        type="text"
                        class="flex-1 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-xs text-white focus:outline-none"
                        placeholder="值"
                      />
                      <button
                        @click="newStageConditions.splice(ci, 1)"
                        class="p-1 text-red-400 hover:text-red-300"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      @click="addNewStageCondition"
                      class="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                    >
                      + 添加条件
                    </button>
                  </div>
                </div>
                <div class="col-span-2">
                  <button
                    @click="addNewStage"
                    :disabled="!newStageName"
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus class="w-4 h-4 inline mr-1" />
                    添加阶段
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield class="w-5 h-5 text-purple-400" />
            条件校验
          </h3>
          <div class="space-y-4">
            <div class="flex items-end gap-3">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">玩家ID</label>
                <input
                  v-model="validationPlayerId"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="输入玩家ID进行校验"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">玩家等级</label>
                <input
                  v-model.number="validationPlayerLevel"
                  type="number"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="模拟等级"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">VIP等级</label>
                <input
                  v-model.number="validationVipLevel"
                  type="number"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="模拟VIP"
                />
              </div>
              <button
                @click="runValidation"
                :disabled="!validationPlayerId"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                执行校验
              </button>
            </div>

            <div v-if="validationReport" class="space-y-2">
              <div
                class="flex items-center gap-2 p-3 rounded-lg"
                :class="validationReport.overallResult
                  ? 'bg-green-900/30 border border-green-700/50'
                  : 'bg-red-900/30 border border-red-700/50'"
              >
                <component
                  :is="validationReport.overallResult ? CheckCircle : XCircle"
                  class="w-5 h-5"
                  :class="validationReport.overallResult ? 'text-green-400' : 'text-red-400'"
                />
                <span
                  class="font-medium"
                  :class="validationReport.overallResult ? 'text-green-400' : 'text-red-400'"
                >
                  {{ validationReport.overallResult ? '条件校验通过' : '条件校验未通过' }}
                </span>
              </div>

              <div
                v-for="result in validationReport.results"
                :key="result.conditionId"
                class="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg"
              >
                <component
                  :is="result.result === 'pass' ? CheckCircle : result.result === 'fail' ? XCircle : AlertCircle"
                  class="w-4 h-4 mt-0.5"
                  :class="result.result === 'pass'
                    ? 'text-green-400'
                    : result.result === 'fail'
                      ? 'text-red-400'
                      : 'text-yellow-400'"
                />
                <div class="flex-1">
                  <p class="text-sm text-white">{{ result.description }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ result.message }}</p>
                  <div v-if="result.actualValue !== undefined" class="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>期望: {{ JSON.stringify(result.expectedValue) }}</span>
                    <span>实际: {{ result.actualValue }}</span>
                    <span>运算符: {{ result.operator }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift class="w-5 h-5 text-purple-400" />
            奖励补发
          </h3>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">玩家ID</label>
                <input
                  v-model="reissuePlayerId"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="输入玩家ID"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">奖励ID</label>
                <input
                  v-model="reissueRewardId"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="输入奖励ID"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">奖励名称</label>
                <input
                  v-model="reissueRewardName"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="奖励名称"
                />
              </div>
              <div class="col-span-2">
                <label class="block text-xs text-gray-500 mb-1">补发原因</label>
                <input
                  v-model="reissueReason"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="如: 系统异常导致奖励未发放"
                />
              </div>
              <div class="flex items-end">
                <button
                  @click="handleReissueReward"
                  :disabled="!reissuePlayerId || !reissueRewardId || !reissueRewardName || !reissueReason"
                  class="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  补发奖励
                </button>
              </div>
            </div>

            <div v-if="activityReissueRecords.length > 0" class="mt-4">
              <h4 class="text-sm font-medium text-gray-300 mb-2">补发记录</h4>
              <div class="space-y-2 max-h-60 overflow-auto">
                <div
                  v-for="record in activityReissueRecords"
                  :key="record.id"
                  class="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                >
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="reissueStatusStyles[record.status]?.bg"
                  >
                    <component
                      :is="reissueStatusStyles[record.status]?.icon"
                      class="w-4 h-4"
                      :class="reissueStatusStyles[record.status]?.color"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-white">{{ record.playerId }}</span>
                      <span class="text-xs text-gray-400">→ {{ record.rewardName }}</span>
                      <span
                        class="px-1.5 py-0.5 text-xs rounded"
                        :class="reissueStatusStyles[record.status]?.badge"
                      >
                        {{ reissueStatusLabels[record.status] }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5 truncate">
                      原因: {{ record.reason }}
                      <span v-if="record.retryCount > 0"> | 重试: {{ record.retryCount }}次</span>
                    </p>
                  </div>
                  <button
                    v-if="record.status === 'failed' && record.retryCount < 5"
                    @click="retryReissueRecord(record.id)"
                    class="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors whitespace-nowrap"
                  >
                    重试
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-72 space-y-6">
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 class="text-sm font-semibold text-gray-400 mb-4">活动状态</h3>
          <div class="flex items-center gap-3 mb-4">
            <span
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
              :class="statusStyles[activity.status]"
            >
              <component :is="statusIcons[activity.status]" class="w-3 h-3" />
              {{ statusLabels[activity.status] }}
            </span>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">创建人</span>
              <span class="text-white">{{ activity.createdBy }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">创建时间</span>
              <span class="text-white">{{ formatDate(activity.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">更新时间</span>
              <span class="text-white">{{ formatDate(activity.updatedAt) }}</span>
            </div>
            <div v-if="activity.approvedBy" class="flex justify-between">
              <span class="text-gray-400">审核人</span>
              <span class="text-white">{{ activity.approvedBy }}</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 class="text-sm font-semibold text-gray-400 mb-4">倒计时</h3>
          <div v-if="activity.status === 'active' || activity.status === 'paused'" class="text-center">
            <p
              class="text-2xl font-mono font-bold"
              :class="countdownInfo.warningLevel === 'urgent'
                ? 'text-red-400'
                : countdownInfo.warningLevel === 'warning'
                  ? 'text-yellow-400'
                  : 'text-green-400'"
            >
              {{ countdownInfo.days }}天 {{ String(countdownInfo.hours).padStart(2, '0') }}:{{ String(countdownInfo.minutes).padStart(2, '0') }}:{{ String(countdownInfo.seconds).padStart(2, '0') }}
            </p>
            <p class="text-xs text-gray-500 mt-2">
              结束于 {{ formatDate(activity.config.schedule.endTime) }}
            </p>
            <div
              v-if="countdownInfo.warningLevel === 'urgent'"
              class="mt-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded text-center animate-pulse"
            >
              即将到期！
            </div>
            <div
              v-else-if="countdownInfo.warningLevel === 'warning'"
              class="mt-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded text-center"
            >
              即将结束
            </div>
          </div>
          <p v-else class="text-sm text-gray-500 text-center">活动未在进行中</p>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 border-dashed p-5">
          <h3 class="text-sm font-semibold text-gray-400 mb-4">目标人群</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">玩家等级范围</label>
              <div class="flex gap-2">
                <input
                  v-model.number="playerLevelMin"
                  type="number"
                  placeholder="最低"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <span class="text-gray-500 flex items-center">-</span>
                <input
                  v-model.number="playerLevelMax"
                  type="number"
                  placeholder="最高"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">VIP等级范围</label>
              <div class="flex gap-2">
                <input
                  v-model.number="vipLevelMin"
                  type="number"
                  placeholder="最低"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <span class="text-gray-500 flex items-center">-</span>
                <input
                  v-model.number="vipLevelMax"
                  type="number"
                  placeholder="最高"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">用户标签</label>
              <input
                v-model="audienceTags"
                type="text"
                placeholder="多个标签用逗号分隔"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div v-if="activity.archiveStatus" class="bg-gray-800 rounded-xl border border-blue-700/50 p-5">
          <h3 class="text-sm font-semibold text-blue-400 mb-4">归档信息</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">归档状态</span>
              <span
                class="px-2 py-0.5 text-xs rounded-full"
                :class="activity.archiveStatus === 'archived'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-yellow-500/20 text-yellow-400'"
              >
                {{ activity.archiveStatus === 'archived' ? '已归档' : '归档中' }}
              </span>
            </div>
            <div v-if="archiveInfo" class="flex justify-between">
              <span class="text-gray-400">归档大小</span>
              <span class="text-white">{{ formatArchiveSize(archiveInfo.archiveSize) }}</span>
            </div>
            <div v-if="archiveInfo?.archivedAt" class="flex justify-between">
              <span class="text-gray-400">归档时间</span>
              <span class="text-white">{{ formatDate(archiveInfo.archivedAt) }}</span>
            </div>
            <div v-if="archiveInfo?.archivedBy" class="flex justify-between">
              <span class="text-gray-400">归档人</span>
              <span class="text-white">{{ archiveInfo.archivedBy }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <div v-if="showTemplateModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4 border border-gray-700">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-white">选择活动模板</h2>
            <p class="text-sm text-gray-400 mt-1">选择一个模板快速创建活动</p>
          </div>
          <button @click="goBack" class="p-2 text-gray-400 hover:text-white transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="template in activityStore.templates"
            :key="template.id"
            @click="selectTemplate(template.id)"
            class="p-5 bg-gray-700/50 rounded-xl border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all group"
          >
            <div class="flex items-center gap-4 mb-3">
              <div class="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/40 transition-colors">
                <component :is="getTemplateIconComponent(template.icon)" class="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h4 class="font-medium text-white">{{ template.name }}</h4>
                <p class="text-xs text-gray-400">{{ template.type }}</p>
              </div>
            </div>
            <p class="text-sm text-gray-400">{{ template.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  FileText,
  Play,
  Pause,
  Square,
  Clock,
  X,
  Trophy,
  Calendar,
  CheckSquare,
  Gift,
  ShoppingBag,
  Layout,
  Layers,
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Loader2,
  Archive,
} from 'lucide-vue-next'
import { useActivityStore } from '@/stores/activityStore'
import type {
  ActivityStatus,
  ActivityStage,
  StageUnlockType,
  ConditionValidationReport,
  RewardReissueRecord,
  RewardReissueStatus,
  ActivityArchive,
  TriggerConditionType,
} from '@/types/activity'

const route = useRoute()
const router = useRouter()
const activityStore = useActivityStore()

const isNewRoute = route.name === 'admin-activity-new' || route.params.id === 'new'
const activityId = computed(() => route.params.id as string | undefined)
const showTemplateModal = ref(isNewRoute)
const activity = ref<ReturnType<typeof activityStore.getActivityById>>(
  isNewRoute ? null : activityStore.getActivityById(route.params.id as string)
)

let countdownTimer: ReturnType<typeof setInterval> | null = null
const tickCounter = ref(0)

onMounted(() => {
  countdownTimer = setInterval(() => {
    tickCounter.value++
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

watch(
  [() => route.name, () => route.params.id],
  ([name, id]) => {
    const isNew = name === 'admin-activity-new' || id === 'new'
    if (isNew) {
      showTemplateModal.value = true
      activity.value = null
    } else if (id) {
      showTemplateModal.value = false
      activity.value = activityStore.getActivityById(id as string)
    }
  }
)

const audienceTags = ref('')
const playerLevelMin = ref<number | undefined>(undefined)
const playerLevelMax = ref<number | undefined>(undefined)
const vipLevelMin = ref<number | undefined>(undefined)
const vipLevelMax = ref<number | undefined>(undefined)
const countdownWarningHours = ref(24)

const newStageName = ref('')
const newStageDescription = ref('')
const newStageUnlockType = ref<StageUnlockType>('time')
const newStageUnlockTime = ref('')
const newStageConditionLogic = ref<'AND' | 'OR'>('AND')
const newStageConditions = ref<Array<{ type: TriggerConditionType; operator: string; value: string; description: string }>>([])

const conditionTypeLabels: Record<string, string> = {
  player_level: '玩家等级',
  player_vip: 'VIP等级',
  login_days: '登录天数',
  order_count: '订单数量',
  total_payment: '累计充值',
  first_login: '首次登录',
  date_range: '日期范围',
  custom_event: '自定义事件',
}

const operatorLabels: Record<string, string> = {
  gt: '大于',
  gte: '大于等于',
  lt: '小于',
  lte: '小于等于',
  eq: '等于',
  ne: '不等于',
  between: '介于',
  contains: '包含',
}

const validationPlayerId = ref('')
const validationPlayerLevel = ref<number | undefined>(undefined)
const validationVipLevel = ref<number | undefined>(undefined)
const validationReport = ref<ConditionValidationReport | null>(null)

const reissuePlayerId = ref('')
const reissueRewardId = ref('')
const reissueRewardName = ref('')
const reissueReason = ref('')

const statusLabels: Record<ActivityStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
  cancelled: '已取消',
  archived: '已归档',
}

const statusStyles: Record<ActivityStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-300',
  pending: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-orange-500/20 text-orange-400',
  ended: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
  archived: 'bg-blue-500/20 text-blue-400',
}

const statusIcons: Record<ActivityStatus, any> = {
  draft: FileText,
  pending: Clock,
  active: Play,
  paused: Pause,
  ended: Square,
  cancelled: Square,
  archived: Archive,
}

const unlockTypeLabels: Record<StageUnlockType, string> = {
  time: '定时解锁',
  condition: '条件解锁',
  manual: '手动解锁',
}

const reissueStatusLabels: Record<RewardReissueStatus, string> = {
  pending: '等待中',
  processing: '处理中',
  success: '成功',
  failed: '失败',
}

const reissueStatusStyles: Record<RewardReissueStatus, { bg: string; color: string; badge: string; icon: any }> = {
  pending: { bg: 'bg-gray-500/20', color: 'text-gray-400', badge: 'bg-gray-500/20 text-gray-400', icon: Clock },
  processing: { bg: 'bg-blue-500/20', color: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400', icon: Loader2 },
  success: { bg: 'bg-green-500/20', color: 'text-green-400', badge: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  failed: { bg: 'bg-red-500/20', color: 'text-red-400', badge: 'bg-red-500/20 text-red-400', icon: XCircle },
}

const activityStages = computed<ActivityStage[]>(() => {
  if (!activity.value) return []
  return activityStore.getStages(activity.value.id)
})

const countdownInfo = computed(() => {
  tickCounter.value
  if (!activity.value) {
    return { remainingMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, warningLevel: 'safe' as const, isExpired: true }
  }
  return activityStore.getCountdownInfo(activity.value.id)
})

const archiveInfo = computed<ActivityArchive | null>(() => {
  if (!activity.value) return null
  return activityStore.getArchive(activity.value.id)
})

const activityReissueRecords = computed<RewardReissueRecord[]>(() => {
  if (!activity.value) return []
  return activityStore.getReissueRecords(activity.value.id)
})

watch(countdownWarningHours, (val) => {
  if (activity.value && val > 0) {
    activity.value.config.countdownWarningThresholdMs = val * 60 * 60 * 1000
  }
})

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTimeLocal(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatArchiveSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function updateStartTime(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (activity.value && value) {
    activity.value.config.schedule.startTime = new Date(value).getTime()
  }
}

function updateEndTime(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (activity.value && value) {
    activity.value.config.schedule.endTime = new Date(value).getTime()
  }
}

function goBack() {
  router.push('/admin/activities')
}

function addNewStage() {
  if (!activity.value || !newStageName.value) return

  const unlockTime = newStageUnlockType.value === 'time' && newStageUnlockTime.value
    ? new Date(newStageUnlockTime.value).getTime()
    : undefined

  let unlockConditions = undefined
  if (newStageUnlockType.value === 'condition' && newStageConditions.value.length > 0) {
    unlockConditions = {
      id: activityStore.generateId('cond'),
      logic: newStageConditionLogic.value,
      conditions: newStageConditions.value.map(c => ({
        id: activityStore.generateId('sc'),
        type: c.type,
        operator: c.operator as any,
        value: isNaN(Number(c.value)) ? c.value : Number(c.value),
        description: `${conditionTypeLabels[c.type] || c.type} ${operatorLabels[c.operator] || c.operator} ${c.value}`,
      })),
    }
  }

  activityStore.addStage(activity.value.id, {
    name: newStageName.value,
    description: newStageDescription.value,
    unlockType: newStageUnlockType.value,
    unlockTime,
    unlockConditions,
    order: activityStages.value.length + 1,
    rewardRules: [],
  })

  newStageName.value = ''
  newStageDescription.value = ''
  newStageUnlockType.value = 'time'
  newStageUnlockTime.value = ''
  newStageConditionLogic.value = 'AND'
  newStageConditions.value = []
}

function addNewStageCondition() {
  newStageConditions.value.push({
    type: 'player_level',
    operator: 'gte',
    value: '',
    description: '',
  })
}

function removeStageById(stageId: string) {
  if (!activity.value) return
  activityStore.removeStage(activity.value.id, stageId)
}

function manualUnlockStage(stageId: string) {
  if (!activity.value) return
  activityStore.unlockStage(activity.value.id, stageId)
}

function runValidation() {
  if (!activity.value || !validationPlayerId.value) return

  const playerData: Record<string, number | string | boolean> = {}
  if (validationPlayerLevel.value !== undefined) {
    playerData.player_level = validationPlayerLevel.value
  }
  if (validationVipLevel.value !== undefined) {
    playerData.player_vip = validationVipLevel.value
  }

  validationReport.value = activityStore.validateConditions(
    activity.value.id,
    validationPlayerId.value,
    playerData,
  )
}

function handleReissueReward() {
  if (!activity.value || !reissuePlayerId.value || !reissueRewardId.value || !reissueRewardName.value || !reissueReason.value) return

  activityStore.reissueReward(
    activity.value.id,
    reissuePlayerId.value,
    reissueRewardId.value,
    reissueRewardName.value,
    reissueReason.value,
  )

  reissuePlayerId.value = ''
  reissueRewardId.value = ''
  reissueRewardName.value = ''
  reissueReason.value = ''
}

function retryReissueRecord(recordId: string) {
  activityStore.retryReissue(recordId)
}

function saveActivity() {
  if (activity.value) {
    activityStore.updateActivity(activity.value.id, { config: activity.value.config })
    alert('保存成功！')
  }
}

function submitForApproval() {
  if (activity.value && confirm('确定要提交审核吗？')) {
    activityStore.submitForApproval(activity.value.id)
    alert('已提交审核！')
  }
}

function approve() {
  if (activity.value && confirm('确定要审核通过此活动吗？')) {
    activityStore.approveActivity(activity.value.id)
    alert('活动已上线！')
  }
}

function toggleStatus() {
  if (!activity.value) return
  if (activity.value.status === 'active') {
    if (confirm('确定要暂停此活动吗？')) {
      activityStore.pauseActivity(activity.value.id)
    }
  } else if (activity.value.status === 'paused') {
    activityStore.resumeActivity(activity.value.id)
  }
}

function endActivity() {
  if (activity.value && confirm('确定要结束此活动吗？结束后将自动触发数据归档，此操作不可撤销。')) {
    activityStore.endActivity(activity.value.id)
  }
}

watch(
  () => activity.value,
  (act) => {
    if (act) {
      audienceTags.value = act.config.audience.tags?.join(', ') || ''
      playerLevelMin.value = act.config.audience.playerLevel?.[0]
      playerLevelMax.value = act.config.audience.playerLevel?.[1]
      vipLevelMin.value = act.config.audience.vipLevel?.[0]
      vipLevelMax.value = act.config.audience.vipLevel?.[1]
      countdownWarningHours.value = act.config.countdownWarningThresholdMs
        ? Math.round(act.config.countdownWarningThresholdMs / (60 * 60 * 1000))
        : 24
    }
  },
  { immediate: true }
)

watch(audienceTags, (val) => {
  if (activity.value) {
    activity.value.config.audience.tags = val
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)
  }
})

watch([playerLevelMin, playerLevelMax], ([min, max]) => {
  if (activity.value) {
    if (min !== undefined || max !== undefined) {
      activity.value.config.audience.playerLevel = [
        min ?? 1,
        max ?? 999,
      ]
    } else {
      delete activity.value.config.audience.playerLevel
    }
  }
})

watch([vipLevelMin, vipLevelMax], ([min, max]) => {
  if (activity.value) {
    if (min !== undefined || max !== undefined) {
      activity.value.config.audience.vipLevel = [
        min ?? 1,
        max ?? 999,
      ]
    } else {
      delete activity.value.config.audience.vipLevel
    }
  }
})

function getTemplateIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    Trophy,
    Calendar,
    CheckSquare,
    Gift,
    ShoppingBag,
    Layout,
  }
  return icons[iconName] || Layout
}

function selectTemplate(templateId: string) {
  const newActivity = activityStore.createActivity(templateId)
  activity.value = newActivity
  showTemplateModal.value = false
  router.replace(`/admin/activities/${newActivity.id}`)
}

onMounted(() => {
  const isNew = route.name === 'admin-activity-new' || route.params.id === 'new'
  const id = route.params.id as string | undefined
  if (isNew) {
    showTemplateModal.value = true
  } else if (id && !activity.value) {
    router.push('/admin/activities')
  }
})
</script>
