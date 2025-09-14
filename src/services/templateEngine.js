class TemplateEngine {
  /**
   * 应用模板生成HTML
   * @param {Object} content - 解析后的内容结构
   * @param {string} templateId - 模板ID（可选）
   * @returns {string} 生成的HTML内容
   */
  async applyTemplate(content, templateId) {
    try {
      // 如果未指定模板，则使用默认模板
      const template = templateId 
        ? templateRepository.getTemplateById(templateId) 
        : templateRepository.getDefaultTemplate();
      
      // 计算图片数量
      const imageCount = content.sections.filter(s => s.type === 'image').length;
      
      // 选择模板类型
      const templateType = template.selectTemplate(imageCount);
      
      // 生成HTML
      const html = this._generateHTML(content, templateType, template.id);
      
      return html;
    } catch (error) {
      throw new Error(`模板应用失败: ${error.message}`);
    }
  }

  /**
   * 根据图片数量选择模板（兼容旧版本）
   * @param {number} imageCount - 图片数量
   * @returns {string} 模板类型
   */
  _selectTemplate(imageCount) {
    // 根据PRD中的规则选择模板
    // 0-2张图片：使用带图注的双图布局或单图布局
    // 3张及以上图片：使用无图注双图布局
    if (imageCount > 0 && imageCount <= 2) {
      return 'double-image-with-caption'; // 需要图注的双图布局（适用于1-2张图片）
    } else if (imageCount >= 3) {
      return 'double-image-no-caption'; // 无图注双图布局（适用于3张及以上图片）
    } else {
      return 'single-image'; // 单图布局（适用于0张图片的情况）
    }
  }

  /**
   * 生成HTML内容
   * @param {Object} content - 内容结构
   * @param {string} template - 模板类型
   * @param {string} templateId - 模板ID
   * @returns {string} 生成的HTML
   */
  _generateHTML(content, template, templateId) {
    // 开始构建HTML
    let html = '';
    
    // 添加首图代码块（优先级最高）
    html += this._getHeaderImageBlock();
    
    // 添加基础容器
    if (templateId === 'creative') {
      html += '<section style="background-color: #f2f0ed; padding: 20px; border-radius: 12px; margin: 10px 0;">';
    } else {
      html += '<section style="background-color: #f5f7fa; padding: 20px; border-radius: 12px; margin: 10px 0;">';
    }
    
    // 添加标题
    if (content.title) {
      html += this._getTitleBlock(content.title, templateId);
    }
    
    // 添加装饰分隔线
    html += '<section style="height: 1px; background: linear-gradient(to right, transparent, #cbd5e0, transparent); margin: 20px 0;"></section>';
    
    // 处理内容区块
    html += this._processContentSections(content.sections, template, templateId);
    
    // 结束基础容器
    html += '</section>';
    
    // 添加尾部代码块（优先级最高）
    html += this._getFooterBlock();
    
    return html;
  }

  /**
   * 获取首图代码块
   * @returns {string} 首图HTML代码
   */
  _getHeaderImageBlock() {
    return `<!-- 首图代码块（优先级最高） -->
<section data-role="paragraph" class="_135editor" data-id="us-4707020" data-tools="135编辑器">
  <p>
    <img data-type="jpeg" src="https://image2.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9qcGcvdmlhY3R5Z2lhczlXMVBiOWdycWNDNGxVYjFiVkxMeHFtcTJmcmRwa1kxT1VGaEFrMXdFeVNyYTRFRXRtTWhKcmJVanNFQkxqUU9MTGRhRGZ0M0Ruc3Q3Zy82NDA=" style="caret-color: red; letter-spacing: 0.544px; text-align: center; visibility: visible !important; width: auto !important;vertical-align:baseline;box-sizing:border-box;font-family:-apple-system-font, BlinkMacSystemFont, Arial, sans-serif;" draggable="false" data-ratio="0.3527777777777778" data-w="1080"/>
  </p>
</section>`;
  }

  /**
   * 获取标题区块
   * @param {string} title - 标题内容
   * @param {string} templateId - 模板ID
   * @returns {string} 标题HTML代码
   */
  _getTitleBlock(title, templateId) {
    if (templateId === 'creative') {
      return `<section style="background-color: #eeece1; padding: 15px 25px; border-radius: 15px; 
              box-shadow: 6px 6px 8px rgba(169, 187, 223, 0.45), -2.5px -2.5px 5px #fff; 
              margin-bottom: 20px;">
  <p style="font-size: 20px; font-weight: bold; color: #000000; text-align: center; margin: 0; font-family: 微软雅黑;">
    ${title}
  </p>
</section>`;
    } else {
      return `<section style="background-color: #eef2f7; padding: 12px 20px; border-radius: 8px; 
              box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1), 
                          inset -1px -1px 2px rgba(255, 255, 255, 0.8);">
  <p style="font-size: 16px; font-weight: bold; color: #2c3e50; text-align: center; margin: 0;">
    ${title}
  </p>
</section>`;
    }
  }

  /**
   * 处理内容区块
   * @param {Array} sections - 内容区块数组
   * @param {string} template - 模板类型
   * @param {string} templateId - 模板ID
   * @returns {string} 处理后的HTML代码
   */
  _processContentSections(sections, template, templateId) {
    let html = '';
    let imageIndex = 1;
    
    // 提取所有图片注释内容
    const imageCaptions = sections
      .filter(section => section.type === 'image')
      .map(section => section.content);
    
    // 当前处理到的图片注释索引
    let captionIndex = 0;
    
    sections.forEach((section, index) => {
      switch (section.type) {
        case 'text':
          if (templateId === 'creative') {
            html += this._getCreativeTextBlock(section.content);
          } else {
            html += this._getTextBlock(section.content);
          }
          break;
          
        case 'subtitle':
          if (templateId === 'creative') {
            html += this._getCreativeSubtitleBlock(section.content);
          } else {
            html += this._getSubtitleBlock(section.content);
          }
          break;
          
        case 'image':
          // 根据模板类型添加图片区块
          if (template === 'double-image-with-caption') {
            // 带图注的双图布局，递增图片索引
            // 获取两张图片的图注内容
            const caption1 = captionIndex < imageCaptions.length 
              ? imageCaptions[captionIndex] 
              : '';
            captionIndex++;
            
            const caption2 = captionIndex < imageCaptions.length 
              ? imageCaptions[captionIndex] 
              : '';
            captionIndex++;
            
            if (templateId === 'creative') {
              html += this._getCreativeImageWithCaptionBlock(imageIndex, caption1, caption2);
            } else {
              html += this._getImageWithCaptionBlock(imageIndex, caption1, caption2);
            }
            imageIndex += 2;
          } else if (template === 'double-image-no-caption') {
            // 无图注双图布局，不递增图片索引
            if (templateId === 'creative') {
              html += this._getCreativeDoubleImageNoCaptionBlock();
            } else {
              html += this._getDoubleImageNoCaptionBlock();
            }
          } else {
            // 单图布局，不递增图片索引
            if (templateId === 'creative') {
              html += this._getCreativeSingleImageBlock();
            } else {
              html += this._getSingleImageBlock();
            }
          }
          break;
          
        default:
          // 未知区块类型，跳过
          console.warn(`未知内容区块类型: ${section.type}`);
          break;
      }
    });
    
    return html;
  }

  /**
   * 获取正文区块
   * @param {string} content - 正文内容
   * @returns {string} 正文HTML代码
   */
  _getTextBlock(content) {
    return `<section style="color: #334155; line-height: 1.75em; text-align: justify;">
  <p style="text-indent: 2.2em; margin: 10px 0;">${content}</p>
</section>`;
  }
  
  /**
   * 获取创意风格正文区块
   * @param {string} content - 正文内容
   * @returns {string} 正文HTML代码
   */
  _getCreativeTextBlock(content) {
    return `<section style="background-color: #f2f0ed; padding: 25px 20px; border-radius: 15px; 
            box-shadow: 6px 6px 8px rgba(169, 187, 223, 0.45), -2.5px -2.5px 5px #fff; 
            margin-top: 20px; box-sizing: border-box;">
  <p style="line-height: 1.75em; text-align: justify; color: #000000; font-family: 微软雅黑; font-size: 14px; margin: 0; text-indent: 2.2em;">
    ${content}
  </p>
</section>`;
  }

  /**
   * 获取小标题区块
   * @param {string} content - 小标题内容
   * @returns {string} 小标题HTML代码
   */
  _getSubtitleBlock(content) {
    return `<section style="background-color: #eef2f7; padding: 12px 20px; border-radius: 8px; 
            box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1), 
                        inset -1px -1px 2px rgba(255, 255, 255, 0.8);">
  <p style="font-size: 16px; font-weight: bold; color: #2c3e50; text-align: center; margin: 0;">
    ${content}
  </p>
</section>
<section style="height: 1px; background: linear-gradient(to right, transparent, #cbd5e0, transparent); 
                margin: 20px 0;"></section>`;
  }
  
  /**
   * 获取创意风格小标题区块
   * @param {string} content - 小标题内容
   * @returns {string} 小标题HTML代码
   */
  _getCreativeSubtitleBlock(content) {
    return `<section style="text-align: center; margin: 10px auto;">
  <section style="background-color: #eeece1; border-radius: 20px; padding: 0px 0px 15px; box-sizing: border-box;">
    <section style="display: flex; justify-content: flex-start; margin: 0 0 10px 25px;">
      <section style="width: 30px; height: 7px; background-color: #cd915d; box-sizing: border-box;"></section>
    </section>
    <section style="display: inline-block;">
      <section style="background-color: #eeece1; padding: 5px 35px 5px 5px; border-radius: 20px; 
                      box-shadow: rgba(169, 187, 223, 0.45) 6px 6px 8px, #a49375 -2.5px -2.5px 5px; 
                      box-sizing: border-box;">
        <section style="display: flex; justify-content: center; align-items: center;">
          <section style="width: 35px; height: 35px; border-radius: 50%; 
                          box-shadow: inset 3px 3px 4px rgba(169, 187, 223, 0.45), inset -2.5px -2.5px 5px #a49375; 
                          box-sizing: border-box;">
            <section style="font-size: 14px; letter-spacing: 1.5px; color: #6f85ac; line-height: 35px;">
              0<span class="autonum" data-original-title="" title="">1</span>
            </section>
          </section>
          <section class="135brush" data-brushtype="text" style="font-size: 16px; letter-spacing: 1.5px; 
                          color: #6f85ac; margin-left: 20px;">
            <strong><span style="color:#000000;">${content}</span></strong>
          </section>
        </section>
      </section>
    </section>
  </section>
</section>`;
  }

  /**
   * 获取带图注的图片区块
   * @param {number} startIndex - 起始图片索引
   * @param {string} caption1 - 第一张图片的图注
   * @param {string} caption2 - 第二张图片的图注
   * @returns {string} 图片HTML代码
   */
  _getImageWithCaptionBlock(startIndex, caption1, caption2) {
    // 根据索引选择不同的图片链接
    const imageSources = [
      'https://bcn.135editor.com/files/images/editor_styles/ff9cb06459e31801669bcff7c5540f81.png',
      'https://bcn.135editor.com/files/images/editor_styles/152761406d63a8a84e2a9a39760e8350.png'
    ];
    
    // 使用不同图片
    const imageSrc1 = imageSources[(startIndex - 1) % imageSources.length];
    const imageSrc2 = imageSources[startIndex % imageSources.length];
    
    // 动态生成图注编号
    const captionNumber1 = String.fromCharCode(0x2460 + (startIndex - 1)); // ① ② ③...
    const captionNumber2 = String.fromCharCode(0x2460 + startIndex % imageSources.length);
    
    // 使用原始图注内容，如果没有则使用默认图注
    const displayCaption1 = caption1 || `${captionNumber1} 图注`;
    const displayCaption2 = caption2 || `${captionNumber2} 图注`;
    
    return `<section class="_135editor" data-tools="135编辑器" data-id="2280">
  <section style="margin: 0px auto; display: flex; gap: 0.2em;">
    <section style="width: 50%; display:inline-block; box-sizing:border-box;max-width:50% !important;" class="layout" data-width="50%">
      <img src="${imageSrc1}" style="width: 100%; margin: 0px; height: auto !important;vertical-align:baseline;box-sizing:border-box;max-width:100% !important;" width="100%" height="auto" border="0" opacity="" mapurl="" title="" alt="" data-width="100%" draggable="false" data-ratio="0.6666666666666666" data-w="504"/>
      <section class="135brush">
        <p style="vertical-align: inherit; color: #555555; font-size: 13px; text-align: center; line-height: 1.75em; margin-top: 8px;" align="center">
          <span style="font-size: 13px;font-family:微软雅黑, &quot;Microsoft YaHei&quot;; background-color: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: inline-block;">
            ${displayCaption1}
          </span>
        </p>
      </section>
    </section>
    <section style="width: 50%;display:inline-block;box-sizing:border-box;max-width:50% !important;" class="layout" data-width="50%">
      <img src="${imageSrc2}" style="width: 100%; margin: 0px; height: auto !important;vertical-align:baseline;box-sizing:border-box;max-width:100% !important;" width="100%" height="auto" border="0" opacity="" mapurl="" title="" alt="" data-width="100%" draggable="false" data-ratio="0.6666666666666666" data-w="504"/>
      <section class="135brush">
        <p style="vertical-align: inherit; color: #555555; font-size: 13px; text-align: center; line-height: 1.75em; margin-top: 8px;" align="center">
          <span style="font-size: 13px;font-family:微软雅黑, &quot;Microsoft YaHei&quot;; background-color: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: inline-block;">
            ${displayCaption2}
          </span>
        </p>
      </section>
    </section>
    <section style="clear:both;"></section>
  </section>
</section>
<section data-role="paragraph" class="_135editor">
  <p >
    <br/>
  </p>
</section>`;
  }
  
  /**
   * 获取创意风格带图注的图片区块
   * @param {number} startIndex - 起始图片索引
   * @param {string} caption1 - 第一张图片的图注
   * @param {string} caption2 - 第二张图片的图注
   * @returns {string} 图片HTML代码
   */
  _getCreativeImageWithCaptionBlock(startIndex, caption1, caption2) {
    // 根据索引选择不同的图片链接
    const imageSources = [
      'https://bcn.135editor.com/files/images/editor_styles/ff9cb06459e31801669bcff7c5540f81.png',
      'https://bcn.135editor.com/files/images/editor_styles/152761406d63a8a84e2a9a39760e8350.png'
    ];
    
    // 使用不同图片
    const imageSrc1 = imageSources[(startIndex - 1) % imageSources.length];
    const imageSrc2 = imageSources[startIndex % imageSources.length];
    
    // 动态生成图注编号
    const captionNumber1 = String.fromCharCode(0x2460 + (startIndex - 1)); // ① ② ③...
    const captionNumber2 = String.fromCharCode(0x2460 + startIndex % imageSources.length);
    
    // 使用原始图注内容，如果没有则使用默认图注
    const displayCaption1 = caption1 || `${captionNumber1} 图注`;
    const displayCaption2 = caption2 || `${captionNumber2} 图注`;
    
    return `<section class="_135editor" data-tools="135编辑器" data-id="2280">
  <section style="margin: 15px auto; display: flex; gap: 0.5em;">
    <section style="width: 50%; display:inline-block; box-sizing:border-box; border-radius: 10px; overflow: hidden;" class="layout">
      <img src="${imageSrc1}" style="width: 100%; margin: 0px; height: auto !important;vertical-align:baseline;box-sizing:border-box;" width="100%" height="auto" border="0" opacity="" mapurl="" title="" alt="" data-width="100%" draggable="false" data-ratio="0.6666666666666666" data-w="504"/>
      <section class="135brush">
        <p style="vertical-align: inherit; color: #000000; font-size: 14px; text-align: center; line-height: 1.75em; margin-top: 8px; font-family: 微软雅黑;" align="center">
          <span style="font-size: 14px; background-color: #f2f0ed; padding: 6px 12px; border-radius: 20px; display: inline-block; box-shadow: 2px 2px 4px rgba(169, 187, 223, 0.45);">
            ${displayCaption1}
          </span>
        </p>
      </section>
    </section>
    <section style="width: 50%;display:inline-block;box-sizing:border-box; border-radius: 10px; overflow: hidden;" class="layout">
      <img src="${imageSrc2}" style="width: 100%; margin: 0px; height: auto !important;vertical-align:baseline;box-sizing:border-box;" width="100%" height="auto" border="0" opacity="" mapurl="" title="" alt="" data-width="100%" draggable="false" data-ratio="0.6666666666666666" data-w="504"/>
      <section class="135brush">
        <p style="vertical-align: inherit; color: #000000; font-size: 14px; text-align: center; line-height: 1.75em; margin-top: 8px; font-family: 微软雅黑;" align="center">
          <span style="font-size: 14px; background-color: #f2f0ed; padding: 6px 12px; border-radius: 20px; display: inline-block; box-shadow: 2px 2px 4px rgba(169, 187, 223, 0.45);">
            ${displayCaption2}
          </span>
        </p>
      </section>
    </section>
    <section style="clear:both;"></section>
  </section>
</section>
<section data-role="paragraph" class="_135editor">
  <p >
    <br/>
  </p>
</section>`;
  }

  /**
   * 获取单图区块
   * @returns {string} 单图HTML代码
   */
  _getSingleImageBlock() {
    return `<section class="_135editor" data-tools="135编辑器" data-id="149958">
  <section style="margin: 10px auto;">
    <section style="background: linear-gradient(to bottom,#ffefcd,#ffffff);/* padding: 12px; */box-sizing:border-box;">
      <section style="/* background-color: #ffffff; */padding: 3px;box-sizing:border-box;">
        <section style="width: 100%;max-width:100% !important;box-sizing:border-box;" data-width="100%">
          <img style="width: 100%; display: block;vertical-align:baseline;box-sizing:border-box;max-width:100% !important;" src="https://bcn.135editor.com/files/images/editor_styles/194203ed1fb963628dbf9a93e2430b30.png" data-width="100%" draggable="false" data-ratio="0.6487603305785123" data-w="484"/>
        </section>
      </section>
    </section>
  </section>
</section>`;
  }
  
  /**
   * 获取创意风格单图区块
   * @returns {string} 单图HTML代码
   */
  _getCreativeSingleImageBlock() {
    return `<section style="background-color: #f2f0ed; padding: 40px 30px; border-radius: 20px; 
            margin: 15px 0; width: 100%; flex: 0 0 100%; max-width:100% !important; box-sizing:border-box;" data-width="100%">
  <section style="width: 100%; max-width:100% !important; box-sizing:border-box;" data-width="100%" class="">
    <img class="rich_pages wxw-img" src="https://mmbiz.qpic.cn/sz_mmbiz_png/viactygias9W3gcNn3Sgs7pmLcmyQ97NrjNCOVqibv9rYG5SgvQNTI6qmBiaMAozVZVGLfRZ40k4hsX7UxicohmDqBg/640?from=appmsg" 
         data-width="100%" style="width: 100%; display: block; vertical-align:baseline; box-sizing:border-box; max-width:100% !important;" 
         draggable="false" data-ratio="1.7777777777777777" data-w="1080"/>
  </section>
</section>`;
  }

  /**
   * 获取无图注双图区块
   * @returns {string} 双图HTML代码
   */
  _getDoubleImageNoCaptionBlock() {
    return `<section class="_135editor" data-tools="135编辑器" data-id="94401">
  <section style="width: 100%; margin: 10px auto;max-width:100% !important;box-sizing:border-box;" data-width="100%">
    <section style="display: flex; justify-content: space-between;">
      <section style="width: 100%;max-width:100% !important;box-sizing:border-box;" class="" data-width="100%">
        <img style="width:100%;display: block;vertical-align:baseline;box-sizing:border-box;max-width:100% !important;" src="https://bcn.135editor.com/files/images/editor_styles/14df324fe8197ec294b38f540adb4b80.jpg" data-width="100%" draggable="false" data-ratio="1.35" data-w="600"/>
      </section>
      <section style="width: 100%;margin-left:12px;max-width:100% !important;box-sizing:border-box;" data-width="100%">
        <img style="width:100%;display: block;vertical-align:baseline;box-sizing:border-box;max-width:100% !important;" src="https://bcn.135editor.com/files/images/editor_styles/f89266a84c9697acc23068c2653045e2.png" data-width="100%" draggable="false" data-ratio="1.35" data-w="600"/>
      </section>
    </section>
  </section>
</section>`;
  }
  
  /**
   * 获取创意风格无图注双图区块
   * @returns {string} 双图HTML代码
   */
  _getCreativeDoubleImageNoCaptionBlock() {
    return `<section class="_135editor" data-tools="135编辑器" data-id="94401">
  <section style="width: 100%; margin: 15px auto; max-width:100% !important; box-sizing:border-box;" data-width="100%">
    <section style="display: flex; justify-content: space-between;">
      <section style="width: 100%; max-width:100% !important; box-sizing:border-box; border-radius: 10px; overflow: hidden;" class="" data-width="100%">
        <img style="width:100%; display: block; vertical-align:baseline; box-sizing:border-box; max-width:100% !important;" 
             src="https://bexp.135editor.com/files/users/755/7550510/202509/GZZQuUzN_DwSw.jpg?auth_key=1757865599-0-0-20702252cde8287c26fbfd81e33976f7&x-bce-process=image%2Fauto-orient%2Co_1" 
             data-width="100%" draggable="false" data-ratio="0.66640625" data-w="1280"/>
      </section>
      <section style="width: 100%; margin-left:12px; max-width:100% !important; box-sizing:border-box; border-radius: 10px; overflow: hidden;" data-width="100%" class="">
        <img style="width:100%; display: block; vertical-align:baseline; box-sizing:border-box; max-width:100% !important;" 
             src="https://bexp.135editor.com/files/users/755/7550510/202509/MvU54x8W_zgJm.jpg?auth_key=1757865599-0-0-3df514dd9c2a40f09607e213f616b1b2&x-bce-process=image%2Fauto-orient%2Co_1" 
             data-width="100%" draggable="false" data-ratio="0.66640625" data-w="1280"/>
      </section>
    </section>
  </section>
</section>`;
  }

  /**
   * 获取尾部代码块
   * @returns {string} 尾部HTML代码
   */
  _getFooterBlock() {
    return `<!-- 尾部代码块（优先级最高） -->
<section data-role="paragraph" class="_135editor">
  <p>
    <br/>
  </p>
</section>
<section data-role="paragraph" class="_135editor" data-id="us-4748760" data-tools="135编辑器">
  <section style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box; text-indent: 0em; text-align: center; color: #ffffff; line-height: 1.5em; letter-spacing: 0.54px; font-size: 14px; min-height: 14px; font-stretch: normal; background-color: #d32a63; overflow-wrap: break-word !important; border-style: none; border-width: 0px; border-color: #ffffff;font-family:微软雅黑;" class="">
    <p style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; clear: both; min-height: 1em; line-height: 1.75em;">
      <br/>
    </p>
  </section>
  <p style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box; text-indent: 0em; color: #ffffff; line-height: 1.5em; letter-spacing: 0.54px; font-size: 14px; min-height: 14px; font-stretch: normal; background-color: #d32a63; overflow-wrap: break-word !important;text-align:center;font-family:微软雅黑;" align="center">
    <strong><strong style="margin: 0px; padding: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; color: #ffffff; font-size: 14px;    letter-spacing: 0.54px;  text-align: center;       background-color: #d32a63; text-decoration-thickness: initial;   outline: 0px;font-family:微软雅黑;"><span data-brushtype="text" style="margin: 0px; padding: 10px 15px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; outline: 0px; border-color: #fbfbfb; border-style: solid; border-width: 1px; line-height: 42px; letter-spacing: 0.54px;">校团委青年媒体中心</span></strong></strong>
  </p>
  <p style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; clear: both; min-height: 14px;      text-indent: 0em;      text-decoration-thickness: initial; color: #ffffff; line-height: 1.5em; letter-spacing: 0.54px; font-size: 14px; font-stretch: normal; background-color: #d32a63;text-align:center;font-family:微软雅黑;" align="center">
    <br/>
  </p>
  <p style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; clear: both; min-height: 14px;      text-indent: 0em;      text-decoration-thickness: initial; color: #ffffff; line-height: 1.5em; letter-spacing: 0.54px; font-size: 14px; font-stretch: normal; background-color: #d32a63;text-align:center;font-family:微软雅黑;" align="center">
    图文来源：
  </p>
  <p style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; clear: both; min-height: 14px; text-indent: 0em; text-decoration-thickness: initial; color: #ffffff; line-height: 1.5em; letter-spacing: 0.54px; font-size: 14px; font-stretch: normal; background-color: #d32a63; box-sizing: border-box !important; overflow-wrap: break-word !important;text-align:center;" align="center">
    <span style="letter-spacing: 0.54px; text-indent: 0em; caret-color: red;font-family:微软雅黑, &quot;Microsoft YaHei&quot;;">编辑：</span>
  </p>
  <section style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important;      text-indent: 0em;      text-decoration-thickness: initial;   text-align: center; color: #ffffff; line-height: 1.5em; letter-spacing: 0.54px; font-size: 14px; min-height: 14px; font-stretch: normal; background-color: #d32a63;font-family:system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
    <section style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; line-height: 1.75em; text-indent: 0em; letter-spacing: 0.54px; min-height: 14px; font-stretch: normal;" class="">
      <p style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; clear: both; min-height: 1em; vertical-align: inherit; line-height: 1.75em; text-indent: 0em;">
        <span style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important;font-family:微软雅黑, &quot;Microsoft YaHei&quot;;">审核：</span>
      </p>
      <p style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; clear: both; min-height: 1em; vertical-align: inherit; line-height: 1.75em; text-indent: 0em;font-family:微软雅黑;">
        <span style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; letter-spacing: 1px; text-indent: 0em; caret-color: red;font-family:微软雅黑, &quot;Microsoft YaHei&quot;;">责编：朱梦鹤</span>
      </p>
    </section>
  </section>
  <section style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box; text-indent: 0em; color: #ffffff; line-height: 1.5em; letter-spacing: 0.54px; font-size: 14px; min-height: 14px; font-stretch: normal; background-color: #d32a63; overflow-wrap: break-word !important;text-align:center;font-family:微软雅黑;" class="">
    <section style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box; line-height: 1.75em; text-indent: 0em; letter-spacing: 0.54px; min-height: 14px; font-stretch: normal; overflow-wrap: break-word !important;" class="">
      <section style="margin: 0px; padding: 0px; max-width: 100%; box-sizing: border-box; overflow-wrap: break-word !important; color: #ffffff; font-size: 14px;     letter-spacing: 0.54px;  text-align: center; text-indent: 0em;      text-decoration-thickness: initial;   outline: 0px; line-height: 1.5em; min-height: 14px; font-stretch: normal;font-family:微软雅黑;" class="">
        <p style="margin: 0px; padding: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; clear: both; min-height: 1em; outline: 0px; line-height: 1.75em;">
          <span style="margin: 0px; padding: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; outline: 0px; letter-spacing: 1px;font-family:微软雅黑, &quot;Microsoft YaHei&quot;;"></span>
        </p>
      </section>
      <p>
        <span style="margin: 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; letter-spacing: 1px;"><img class="rich_pages wxw-img" data-s="300,640" data-type="png" data-index="7" src="https://image2.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9wbmcvdmlhY3R5Z2lhczlXMHVzTmQ2SG1JdEZqMHR6RmRnYVZWSEJCNlRCVjNKYnJzVDNMcnNRQ3Z4eWljWGpBSWNIM2lhbWUxZFUxSGRkaWFZTGhwdTVBcTNzcmljT2cvNjQw" _width="233px" alt="图片" data-fail="0" style="margin: 0px; padding: 0px; outline: 0px; overflow-wrap: break-word !important; height: auto !important; background-color: #c54072; line-height: 25.6px; visibility: visible !important; width: 233px !important;vertical-align:baseline;box-sizing:border-box;" draggable="false" width="233" data-ratio="0.9527896995708155" data-w="233"/></span>
      </p>
      <p>
        <br/>
      </p>
    </section>
  </section>
  <p>
    <br/>
  </p>
</section>
<section class="_135editor" data-role="paragraph">
  <p >
    <br/>
  </p>
</section>`;
  }
}

// 引入模板仓库服务
const templateRepository = require('./templateRepository');

module.exports = new TemplateEngine();