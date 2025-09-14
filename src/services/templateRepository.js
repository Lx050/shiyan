class TemplateRepository {
  constructor() {
    // 初始化模板库
    this.templates = {
      'business': {
        id: 'business',
        name: '商务风格',
        description: '适用于商务类文章的模板风格',
        selectTemplate: this._selectBusinessTemplate.bind(this)
      },
      'simple': {
        id: 'simple',
        name: '简约风格',
        description: '简洁明了的文章模板风格',
        selectTemplate: this._selectSimpleTemplate.bind(this)
      },
      'education': {
        id: 'education',
        name: '教育风格',
        description: '适用于教育类文章的模板风格',
        selectTemplate: this._selectEducationTemplate.bind(this)
      },
      'creative': {
        id: 'creative',
        name: '创意风格',
        description: '富有创意设计感的文章模板风格',
        selectTemplate: this._selectCreativeTemplate.bind(this)
      }
    };
    
    // 默认模板
    this.defaultTemplate = 'business';
  }
  
  /**
   * 获取所有模板
   * @returns {Object} 模板列表
   */
  getAllTemplates() {
    return this.templates;
  }
  
  /**
   * 根据ID获取模板
   * @param {string} templateId - 模板ID
   * @returns {Object|null} 模板对象或null
   */
  getTemplateById(templateId) {
    return this.templates[templateId] || null;
  }
  
  /**
   * 获取默认模板
   * @returns {Object} 默认模板
   */
  getDefaultTemplate() {
    return this.templates[this.defaultTemplate];
  }
  
  /**
   * 设置默认模板
   * @param {string} templateId - 模板ID
   */
  setDefaultTemplate(templateId) {
    if (this.templates[templateId]) {
      this.defaultTemplate = templateId;
    }
  }
  
  /**
   * 添加新模板
   * @param {Object} template - 模板对象
   */
  addTemplate(template) {
    // 参数验证
    if (!template) {
      throw new Error('模板对象不能为空');
    }
    
    if (!template.id || !template.name || !template.selectTemplate) {
      throw new Error('模板必须包含id、name和selectTemplate属性');
    }
    
    // 检查模板是否已存在
    if (this.templates[template.id]) {
      throw new Error(`模板ID "${template.id}" 已存在`);
    }
    
    // 检查selectTemplate是否为函数
    if (typeof template.selectTemplate !== 'function') {
      throw new Error('selectTemplate必须是一个函数');
    }
    
    this.templates[template.id] = template;
  }
  
  /**
   * 删除模板
   * @param {string} templateId - 模板ID
   */
  removeTemplate(templateId) {
    // 参数验证
    if (!templateId) {
      throw new Error('模板ID不能为空');
    }
    
    // 检查模板是否存在
    if (!this.templates[templateId]) {
      throw new Error(`模板 "${templateId}" 不存在`);
    }
    
    // 防止删除所有模板
    if (Object.keys(this.templates).length <= 1) {
      throw new Error('不能删除所有模板，至少需要保留一个模板');
    }
    
    delete this.templates[templateId];
    
    // 如果删除的是默认模板，则设置第一个模板为默认模板
    if (this.defaultTemplate === templateId) {
      const templateIds = Object.keys(this.templates);
      this.defaultTemplate = templateIds.length > 0 ? templateIds[0] : null;
    }
  }
  
  /**
   * 创建自定义模板
   * @param {Object} templateConfig - 模板配置
   * @returns {Object} 新创建的模板
   */
  createCustomTemplate(templateConfig) {
    const { id, name, description, baseTemplate, imageRules } = templateConfig;
    
    // 参数验证
    if (!id || !name) {
      throw new Error('模板必须包含ID和名称');
    }
    
    // 检查模板是否已存在
    if (this.templates[id]) {
      throw new Error(`模板ID "${id}" 已存在`);
    }
    
    // 如果没有指定基础模板，则使用默认模板
    const base = baseTemplate && this.templates[baseTemplate] 
      ? this.templates[baseTemplate] 
      : this.getDefaultTemplate();
    
    // 创建新的模板选择函数
    const selectTemplate = imageRules 
      ? this._createCustomSelectTemplate(imageRules)
      : base.selectTemplate;
    
    // 创建新模板
    const newTemplate = {
      id,
      name,
      description: description || base.description,
      selectTemplate
    };
    
    this.addTemplate(newTemplate);
    return newTemplate;
  }
  
  /**
   * 根据图片规则创建模板选择函数
   * @param {Object} imageRules - 图片规则配置
   * @returns {Function} 模板选择函数
   */
  _createCustomSelectTemplate(imageRules) {
    return (imageCount) => {
      // 根据图片数量选择模板类型
      if (imageCount >= imageRules.minImagesForDoubleNoCaption) {
        return 'double-image-no-caption';
      } else if (imageCount >= imageRules.minImagesForDoubleWithCaption) {
        return 'double-image-with-caption';
      } else {
        return 'single-image';
      }
    };
  }
  
  /**
   * 商务风格模板选择逻辑
   * @param {number} imageCount - 图片数量
   * @returns {string} 模板类型
   */
  _selectBusinessTemplate(imageCount) {
    if (imageCount > 0 && imageCount <= 2) {
      return 'double-image-with-caption';
    } else if (imageCount >= 3) {
      return 'double-image-no-caption';
    } else {
      return 'single-image';
    }
  }
  
  /**
   * 简约风格模板选择逻辑
   * @param {number} imageCount - 图片数量
   * @returns {string} 模板类型
   */
  _selectSimpleTemplate(imageCount) {
    // 简约风格始终使用单图布局
    return 'single-image';
  }
  
  /**
   * 教育风格模板选择逻辑
   * @param {number} imageCount - 图片数量
   * @returns {string} 模板类型
   */
  _selectEducationTemplate(imageCount) {
    if (imageCount > 0 && imageCount <= 1) {
      return 'single-image';
    } else if (imageCount >= 2) {
      return 'double-image-with-caption';
    } else {
      return 'single-image';
    }
  }
  
  /**
   * 创意风格模板选择逻辑
   * @param {number} imageCount - 图片数量
   * @returns {string} 模板类型
   */
  _selectCreativeTemplate(imageCount) {
    if (imageCount > 0 && imageCount <= 2) {
      return 'double-image-with-caption';
    } else if (imageCount >= 3) {
      return 'double-image-no-caption';
    } else {
      return 'single-image';
    }
  }
}

module.exports = new TemplateRepository();