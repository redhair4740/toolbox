import { ref } from 'vue'

// 文件类型定义
interface FileType {
  id: string
  name: string
  category: string
  extensions: string[]
}

// 文件类型数据
const fileTypes: FileType[] = [
  // 媒体文件
  {
    id: 'image',
    name: '图片',
    category: 'media',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
  },
  {
    id: 'video',
    name: '视频',
    category: 'media',
    extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
  },
  {
    id: 'audio',
    name: '音频',
    category: 'media',
    extensions: ['mp3', 'wav', 'ogg', 'aac', 'wma', 'm4a', 'flac']
  },

  // 文档
  {
    id: 'document',
    name: '文档',
    category: 'document',
    extensions: ['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt']
  },
  {
    id: 'spreadsheet',
    name: '表格',
    category: 'document',
    extensions: ['xls', 'xlsx', 'csv', 'ods']
  },
  {
    id: 'presentation',
    name: '演示文稿',
    category: 'document',
    extensions: ['ppt', 'pptx', 'odp']
  },

  // 压缩文件
  {
    id: 'archive',
    name: '压缩文件',
    category: 'archive',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  },

  // 开发文件
  {
    id: 'source',
    name: '源代码',
    category: 'development',
    extensions: ['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go']
  },
  {
    id: 'markup',
    name: '标记语言',
    category: 'development',
    extensions: ['html', 'htm', 'xml', 'json', 'yaml', 'yml', 'md', 'markdown']
  },
  {
    id: 'config',
    name: '配置文件',
    category: 'development',
    extensions: ['ini', 'conf', 'config', 'env', 'lock', 'toml']
  }
]

export function useFileTypes() {
  // 获取所有文件类型
  const getAllFileTypes = () => fileTypes

  // 获取所有文件类型分类
  const fileCategories = ref([...new Set(fileTypes.map(type => type.category))])

  // 获取所有文件扩展名
  const fileExtensions = ref([...new Set(fileTypes.flatMap(type => type.extensions))])

  // 根据分类获取文件类型
  const getFileTypesByCategory = (category: string) => {
    return fileTypes.filter(type => type.category === category)
  }

  // 根据扩展名获取文件类型
  const getFileTypeByExtension = (extension: string) => {
    const ext = extension.toLowerCase().replace(/^\./, '')
    return fileTypes.find(type => type.extensions.includes(ext))
  }

  // 根据扩展名获取分类
  const getCategoryForExtension = (extension: string) => {
    const fileType = getFileTypeByExtension(extension)
    return fileType?.category
  }

  // 根据选定的文件类型ID获取文件匹配模式
  const getFileTypePattern = (selectedTypes: string[]) => {
    if (!selectedTypes.length) return undefined

    const patterns = selectedTypes.flatMap(typeId => {
      const fileType = fileTypes.find(type => type.id === typeId)
      return fileType ? fileType.extensions.map(ext => `*.${ext}`) : []
    })

    return patterns.length > 0 ? patterns.join(',') : undefined
  }

  // 检查文件是否匹配指定的文件类型
  const matchesFileType = (filename: string, selectedTypes: string[]) => {
    if (!selectedTypes.length) return true

    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext) return false

    return selectedTypes.some(typeId => {
      const fileType = fileTypes.find(type => type.id === typeId)
      return fileType?.extensions.includes(ext)
    })
  }

  // 获取文件类型选项（用于选择器）
  const getFileTypeOptions = () => {
    return fileTypes.map(type => ({
      value: type.id,
      label: type.name,
      category: type.category
    }))
  }

  // 获取常见文件类型的图标
  const getFileTypeIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext) return 'document'

    const fileType = getFileTypeByExtension(ext)
    if (!fileType) return 'document'

    switch (fileType.category) {
      case 'media':
        if (fileType.id === 'image') return 'picture'
        if (fileType.id === 'video') return 'video-play'
        if (fileType.id === 'audio') return 'headset'
        return 'document'
      case 'document':
        if (fileType.id === 'spreadsheet') return 'table'
        if (fileType.id === 'presentation') return 'presentation'
        return 'document'
      case 'archive':
        return 'folder-zip'
      case 'development':
        if (fileType.id === 'source') return 'code'
        if (fileType.id === 'markup') return 'html5'
        if (fileType.id === 'config') return 'setting'
        return 'document'
      default:
        return 'document'
    }
  }

  // 获取分类的显示名称
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'media':
        return '媒体文件'
      case 'document':
        return '文档'
      case 'archive':
        return '压缩文件'
      case 'development':
        return '开发文件'
      default:
        return category
    }
  }

  return {
    fileTypes,
    fileCategories,
    fileExtensions,
    getAllFileTypes,
    getFileTypesByCategory,
    getFileTypeByExtension,
    getCategoryForExtension,
    getFileTypePattern,
    matchesFileType,
    getFileTypeOptions,
    getFileTypeIcon,
    getCategoryLabel
  }
}