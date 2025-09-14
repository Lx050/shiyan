/**
 * 解析后的内容结构
 * @typedef {Object} ParsedContent
 * @property {string} title - 文档标题
 * @property {Section[]} sections - 内容区块数组
 */

/**
 * 内容区块
 * @typedef {Object} Section
 * @property {'text' | 'image' | 'subtitle'} type - 区块类型
 * @property {string} content - 区块内容
 * @property {number} position - 区块位置
 * @property {boolean} [manualEdit] - 是否为手动编辑内容
 */

module.exports = {
  // 这里可以导出类型定义或相关常量
};