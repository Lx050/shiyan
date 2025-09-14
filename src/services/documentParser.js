const mammoth = require('mammoth');

class DocumentParser {
  /**
   * 解析Word文档
   * @param {ArrayBuffer} arrayBuffer - Word文档的二进制数据
   * @returns {Promise<Object>} 解析后的内容结构
   */
  async parseDocument(arrayBuffer) {
    try {
      // 使用mammoth解析.docx文件
      // 将ArrayBuffer转换为Buffer，然后传递给mammoth
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer: buffer });
      
      // 提取标题（假设第一段为标题）
      const paragraphs = result.value.split('\n').filter(p => p.trim() !== '');
      const title = paragraphs.length > 0 ? paragraphs[0].trim() : '';
      
      // 分析内容结构
      const sections = this._analyzeContentStructure(paragraphs);
      
      return {
        title,
        sections
      };
    } catch (error) {
      console.error('Mammoth解析错误:', error);
      throw new Error(`文档解析失败: ${error.message}`);
    }
  }

  /**
   * 分析内容结构
   * @param {Array<string>} paragraphs - 段落数组
   * @returns {Array<Object>} 结构化的内容区块
   */
  _analyzeContentStructure(paragraphs) {
    const sections = [];
    let position = 1;
    
    // 跳过标题（第一个段落）
    for (let i = 1; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph === '') continue;
      
      // 简单的结构识别逻辑
      // 检查是否可能是图片占位符
      const imageInfo = this._isImagePlaceholder(paragraph);
      if (imageInfo.isImage) {
        sections.push({
          type: 'image',
          content: imageInfo.caption || '', // 保留图注内容
          position: position++
        });
      }
      // 检查是否可能是小标题（较短且可能包含特定关键词）
      else if (this._isSubtitle(paragraph, sections)) {
        sections.push({
          type: 'subtitle',
          content: paragraph,
          position: position++
        });
      } 
      // 默认为正文
      else {
        sections.push({
          type: 'text',
          content: paragraph,
          position: position++
        });
      }
    }
    
    return sections;
  }

  /**
   * 判断是否为小标题
   * @param {string} text - 文本内容
   * @param {Array<Object>} sections - 已识别的区块数组
   * @returns {boolean} 是否为小标题
   */
  _isSubtitle(text, sections) {
    // 改进的小标题判断逻辑：
    // 1. 文本长度适中（小于等于30个字符）
    // 2. 包含常见的小标题关键词
    // 3. 不以普通正文常见的开头词语开始（除非有特殊格式）
    // 4. 特殊处理一些特定格式的文本
    // 5. 考虑标点符号和格式特征
    const shortText = text.length <= 30;
    
    // 常见的小标题关键词
    const subtitleKeywords = [
      '介绍', '概述', '总结', '结论', '方法', '步骤', '注意', '要点',
      '背景', '目的', '意义', '问题', '分析', '讨论', '结果', '建议',
      '第一章', '第二章', '第三章', '第四章', '第五章', '第六章', '第七章', '第八章', '第九章',
      '一、', '二、', '三、', '四、', '五、', '六、', '七、', '八、', '九、',
      '首先', '其次', '最后', '第一', '第二', '第三',
      '助力', '陪伴', '成长', '课堂', '教学', '学习', '教育',
      '特点', '优势', '内容', '展示', '案例', '总结',
      '志愿', '服务', '活动', '实践', '体验', '中心', '之旅'
    ];
    
    // 正文常见的开头词语（通常不是小标题）
    const bodyStartWords = [
      '我们', '他们', '她们', '它', '这个', '这些', '那些', '那么', '因为', '所以',
      '但是', '然而', '虽然', '如果', '为了', '由于', '通过', '根据', '对于',
      '今天', '昨天', '明天', '现在', '目前', '已经', '正在', '将会'
    ];
    
    // 特殊的小标题格式（如"多彩课堂助力，陪伴成长每一刻"）
    const specialSubtitlePatterns = [
      /.*助力.*成长.*/,
      /.*课堂.*教学.*/,
      /.*学习.*教育.*/,
      /.*特点.*优势.*/,
      /.*内容.*展示.*/,
      /.*志愿.*能力.*/,
      /.*特教.*中心.*/
    ];
    
    // 小标题常见的结尾符号
    const subtitleEndings = ['：', ':', '】', '）', ')'];
    
    // 检查是否包含小标题关键词
    const hasSubtitleKeyword = subtitleKeywords.some(keyword => 
      text.includes(keyword));
    
    // 检查是否匹配特殊小标题模式
    const matchesSpecialPattern = specialSubtitlePatterns.some(pattern => 
      pattern.test(text));
    
    // 检查是否以正文开头词语开始
    const startsWithBodyWord = bodyStartWords.some(word => 
      text.startsWith(word));
    
    // 检查是否以小标题常见的结尾符号结束
    const endsWithSubtitleEnding = subtitleEndings.some(ending => 
      text.trim().endsWith(ending));
    
    // 检查是否以冒号结尾（常见于小标题）
    const endsWithColon = /.*[：:]$/.test(text.trim());
    
    // 检查是否以顿号、分号、感叹号、问号等标点符号结束（通常不是小标题）
    const endsWithBodyPunctuation = /[，。；！？]$/.test(text.trim());
    
    // 检查是否包含章节标识符（如"第一章"、"一、"等）
    const hasChapterIndicator = /^(第?[一二三四五六七八九十章]+|[\d]+[、.])/i.test(text.trim());
    
    // 检查是否为并列结构的小标题（如"交流互鉴，共促志愿能力提升"）
    const isParallelStructure = /.*[，、,].*/.test(text) && 
                               (text.includes('志愿') || text.includes('服务') || 
                                text.includes('活动') || text.includes('中心') ||
                                text.includes('之旅'));
    
    // 检查上下文，如果前一个是subtitle，当前文本较短且不以正文开头词开始，则可能是列表项形式的小标题
    const hasPreviousSubtitle = sections.length > 0 && 
                                sections[sections.length - 1].type === 'subtitle';
    const isListItemStyle = hasPreviousSubtitle && 
                            !startsWithBodyWord && 
                            text.length <= 20;
    
    // 综合判断：
    // 1. 文本长度不超过30字符
    // 2. 满足以下任一条件：
    //    - 包含小标题关键词
    //    - 匹配特殊小标题模式
    //    - 以小标题结尾符号结束
    //    - 以冒号结尾
    //    - 包含章节标识符
    //    - 是列表项风格的小标题
    //    - 是并列结构的小标题
    // 3. 不以正文标点符号结束（除非是冒号等小标题常用符号）
    const isLikelySubtitle = shortText && 
      (hasSubtitleKeyword || 
       matchesSpecialPattern || 
       endsWithSubtitleEnding || 
       endsWithColon ||
       hasChapterIndicator ||
       isListItemStyle ||
       isParallelStructure) && 
      !endsWithBodyPunctuation;
    
    return isLikelySubtitle;
  }

  /**
   * 判断是否为图片占位符
   * @param {string} text - 文本内容
   * @returns {Object} 包含isImage和caption属性的对象
   */
  _isImagePlaceholder(text) {
    // 改进的图片占位符判断逻辑：
    // 1. 包含"图片"、"图"等关键词
    // 2. 或者匹配特定的图片编号模式
    // 3. 或者是单独的"[image]"、"[img]"等标记
    // 4. 或者包含图片注释相关关键词
    // 5. 或者符合图片注释的格式特征
    
    // 检查常见的图片占位符标记
    const imageMarkers = ['[图片]', '[image]', '[img]', '【图片】', '【image】', '【img】'];
    const hasImageMarker = imageMarkers.some(marker => text.includes(marker));
    if (hasImageMarker) return { isImage: true, caption: text };
    
    // 检查是否包含"图"字及可能的编号
    const hasTuWord = text.includes('图');
    const matchesNumberPattern = text.match(/图\s*\d+/) !== null || 
                                text.match(/图\s*[一二三四五六七八九]/) !== null ||
                                text.match(/图\s*[A-Za-z]/) !== null;
    
    // 如果包含"图"字并且匹配编号模式，则识别为图片
    if (hasTuWord && matchesNumberPattern) return { isImage: true, caption: text };
    
    // 检查是否为单独的图片描述（整行只有"图片"二字）
    const isImageOnly = text.trim() === '图片' || text.trim() === '图像';
    if (isImageOnly) return { isImage: true, caption: text };
    
    // 检查是否包含图片注释相关关键词
    const imageCaptionKeywords = ['注释', '说明', '备注', '描述', 'caption', '图注', '配图', '插图'];
    const hasImageCaptionKeyword = imageCaptionKeywords.some(keyword => 
      text.includes(keyword));
    if (hasImageCaptionKeyword) return { isImage: true, caption: text };
    
    // 检查是否可能是图片注释（以数字开头后跟点或顿号，然后是描述）
    const isImageCaptionFormat = /^\d+[\.\、]/.test(text.trim());
    if (isImageCaptionFormat) return { isImage: true, caption: text };
    
    // 检查是否是图片描述文字（包含图片内容描述）
    const imageDescriptionPatterns = [
      /.*图.*展示.*/,
      /.*图.*显示.*/,
      /.*如图.*/,
      /.*图片.*[展|显]示.*/,
      /.*插图.*/,
      /.*配图.*/
    ];
    const matchesImageDescription = imageDescriptionPatterns.some(pattern => 
      pattern.test(text));
    if (matchesImageDescription) return { isImage: true, caption: text };
    
    // 检查是否以"图"字开头的描述
    const startsWithTu = text.trim().startsWith('图');
    if (startsWithTu) return { isImage: true, caption: text };
    
    // 对于包含"图"字但不匹配编号模式的文本，进一步判断是否为图片注释
    if (hasTuWord) {
      // 检查是否符合图片注释的格式，如"图7 带领孩子们外出活动"
      const tuCaptionPattern = /^图[\d一二三四五六七八九]+[\s\u3000]+.+/;
      if (tuCaptionPattern.test(text.trim())) {
        return { isImage: true, caption: text };
      }
    }
    
    return { isImage: false, caption: '' };
  }

  /**
   * 处理手动输入的内容
   * @param {Object} content - 手动输入的内容
   * @returns {Object} 处理后的内容结构
   */
  parseManualContent(content) {
    return {
      ...content,
      sections: content.sections.map((section, index) => ({
        ...section,
        position: index + 1,
        manualEdit: true
      }))
    };
  }
}

module.exports = new DocumentParser();