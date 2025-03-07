<template>
  <el-dialog v-model="visible" title="选择目录" width="500px" @closed="handleClosed">
    <el-row :gutter="20">
      <el-col :span="18">
        <el-input v-model="path" disabled placeholder="请选择目录路径" />
      </el-col>
      <el-col :span="6">
        <el-button type="primary" @click="selectDirectory">选择目录</el-button>
      </el-col>
    </el-row>

    <template #footer>
      <span>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="confirmPath">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedPath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'update:selected-path', 'confirm'])

// 内部状态
const path = ref('')

// 计算属性：从props到内部状态的转换
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听selectedPath变化
watch(
  () => props.selectedPath,
  (newValue) => {
    path.value = newValue
  },
  { immediate: true }
)

// 选择目录
const selectDirectory = async () => {
  try {
    const selectedPath = await window.api.openDirectoryDialog()
    if (selectedPath) {
      path.value = selectedPath
    }
  } catch (error) {
    console.error('Error opening directory dialog:', error)
  }
}

// 确认路径
const confirmPath = () => {
  emit('update:selected-path', path.value)
  emit('confirm')
  visible.value = false
}

// 关闭时清空路径
const handleClosed = () => {
  if (!props.selectedPath) {
    path.value = ''
  }
}
</script>

<style scoped>
.el-row {
  margin-bottom: 20px;
}
</style>
