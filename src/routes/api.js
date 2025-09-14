const express = require('express');
const router = express.Router();

// 文档解析服务
const documentParser = require('../services/documentParser');
// 模板引擎服务
const templateEngine = require('../services/templateEngine');
// 模板仓库服务
const templateRepository = require('../services/templateRepository');

// 上传并解析Word文档
router.post('/parse-document', async (req, res) => {
  try {
    const { document, template } = req.body;
    console.log('收到文档数据，类型:', typeof document, '是否为数组:', Array.isArray(document));
    
    if (!document) {
      return res.status(400).json({ error: '缺少文档数据' });
    }

    // 检查document是否为数组
    if (!Array.isArray(document)) {
      return res.status(400).json({ error: '文档数据格式不正确' });
    }

    console.log('文档数组长度:', document.length);
    
    // 将数组转换为ArrayBuffer
    const uint8Array = new Uint8Array(document);
    const arrayBuffer = uint8Array.buffer;
    
    console.log('ArrayBuffer大小:', arrayBuffer.byteLength);

    // 检查ArrayBuffer是否有效
    if (arrayBuffer.byteLength === 0) {
      return res.status(400).json({ error: '文档数据为空' });
    }

    // 解析文档
    console.log('开始解析文档...');
    const parsedContent = await documentParser.parseDocument(arrayBuffer);
    console.log('文档解析完成:', parsedContent);
    
    // 应用模板
    console.log('开始应用模板...');
    const htmlContent = await templateEngine.applyTemplate(parsedContent, template);
    console.log('模板应用完成');
    
    res.json({
      success: true,
      data: {
        parsedContent,
        htmlContent
      }
    });
  } catch (error) {
    console.error('解析文档时出错:', error);
    res.status(500).json({ 
      success: false, 
      error: '文档解析失败',
      message: error.message 
    });
  }
});

// 手动输入内容处理
router.post('/manual-content', async (req, res) => {
  try {
    const { content, template } = req.body;
    if (!content) {
      return res.status(400).json({ error: '缺少内容数据' });
    }

    // 标记为手动编辑内容
    const manualContent = {
      ...content,
      sections: content.sections.map((section, index) => ({
        ...section,
        position: index + 1,
        manualEdit: true
      }))
    };

    // 应用模板
    const htmlContent = await templateEngine.applyTemplate(manualContent, template);
    
    res.json({
      success: true,
      data: {
        parsedContent: manualContent,
        htmlContent
      }
    });
  } catch (error) {
    console.error('处理手动内容时出错:', error);
    res.status(500).json({ 
      success: false, 
      error: '内容处理失败',
      message: error.message 
    });
  }
});

// 获取模板列表
router.get('/templates', (req, res) => {
  try {
    const templates = templateRepository.getAllTemplates();
    const templateList = Object.values(templates).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      isBuiltIn: t.isBuiltIn || false
    }));
    
    res.json({
      success: true,
      data: {
        templates: templateList
      }
    });
  } catch (error) {
    console.error('获取模板列表时出错:', error);
    res.status(500).json({
      success: false,
      error: '获取模板失败',
      message: error.message
    });
  }
});

// 创建自定义模板
router.post('/templates/create-custom', (req, res) => {
  try {
    const { templateConfig } = req.body;
    
    if (!templateConfig) {
      return res.status(400).json({
        success: false,
        error: '缺少模板配置'
      });
    }
    
    const newTemplate = templateRepository.createCustomTemplate(templateConfig);
    
    res.json({
      success: true,
      message: '自定义模板创建成功',
      data: {
        template: {
          id: newTemplate.id,
          name: newTemplate.name,
          description: newTemplate.description
        }
      }
    });
  } catch (error) {
    console.error('创建自定义模板时出错:', error);
    res.status(500).json({
      success: false,
      error: '创建自定义模板失败',
      message: error.message
    });
  }
});

// 删除模板
router.delete('/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: '缺少模板ID'
      });
    }
    
    // 防止删除内置模板
    const builtInTemplates = ['business', 'simple', 'education', 'creative'];
    if (builtInTemplates.includes(templateId)) {
      return res.status(403).json({
        success: false,
        error: '不能删除内置模板'
      });
    }
    
    templateRepository.removeTemplate(templateId);
    
    res.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error) {
    console.error('删除模板时出错:', error);
    res.status(500).json({
      success: false,
      error: '删除模板失败',
      message: error.message
    });
  }
});

// 设置默认模板
router.post('/set-default-template', (req, res) => {
  try {
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: '缺少模板ID'
      });
    }
    
    const template = templateRepository.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }
    
    templateRepository.setDefaultTemplate(templateId);
    
    res.json({
      success: true,
      message: '默认模板设置成功'
    });
  } catch (error) {
    console.error('设置默认模板时出错:', error);
    res.status(500).json({
      success: false,
      error: '设置默认模板失败',
      message: error.message
    });
  }
});

module.exports = router;