const App = getApp();
const Dialog = require('../../../components/dialog/dialog');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_read: false,
    disabled: false,
    marketingChannel:['直播订货', '团购微商', '传统电商', '实体线下','礼品订货'],
    marketing_type:'',
    marketingIndex:'--请选择--',
    formData: [],
    imageList: [],
    submsgSetting: {}, // 订阅消息配置
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let _this = this;
    // 获取订阅消息配置
    _this.getSubmsgSetting();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let _this = this;
    // 获取分销商申请状态
    _this.getApplyState();
  },

  /**
   * 获取订阅消息配置
   */
  getSubmsgSetting() {
    let _this = this;
    App._get('wxapp.submsg/setting', {}, (result) => {
      _this.setData({
        submsgSetting: result.data.setting
      });
    });
  },

  /**
   * 获取分销商申请状态
   */
  getApplyState() {
    let _this = this;
    App._get('user.dealer/apply', {
      referee_id: _this.getRefereeid()
    }, (result) => {
      let data = result.data;
      // 当前是否已经为分销商
      if (data.is_dealer) {
        wx.redirectTo({
          url: '../index/index'
        });
      }
      // 设置当前页面标题
      wx.setNavigationBarTitle({
        title: data.words.apply.title.value
      });
      data.isData = true;
      _this.setData(data);
    });
  },

  /**
   * 显示申请协议
   */
  toggleApplyLicense() {
    Dialog({
      title: '申请协议',
      message: this.data.license,
      selector: '#zan-base-dialog',
      isScroll: true, // 滚动
      buttons: [{
        text: '我已阅读',
        color: 'red',
        type: 'cash'
      }]
    }).then(() => {
      // console.log('=== dialog resolve ===', 'type: confirm');
    });
  },

  /**
   * 已阅读
   */
  toggleSetRead() {
    let _this = this;
    _this.setData({
      is_read: !this.data.is_read
    });
  },

  /**
   * 提交申请 
   */
  onFormSubmit(e) {
    let _this = this,
      values = e.detail.value;
    values.marketing_type = this.data.marketing_type;
    // 验证姓名
    if (!values.name || values.name.length < 1) {
      App.showError('请填写姓名');
      return false;
    }

    // 验证手机号
    if (!/^\+?\d[\d -]{8,12}\d/.test(values.mobile)) {
      App.showError('手机号格式不正确');
      return false;
    }
    // 验证是否选择营销渠道
    if (_this.data.marketing_type == '') {
      App.showError('请选择营销渠道');
      return false;
    }
    // 验证是否输入直播号
    if (values.live_number == '') {
      App.showError('请输入直播号');
      return false;
    }
    // 验证是否输入粉丝数
    if (values.fans_num == '') {
      App.showError('请输入粉丝数');
      return false;
    }
    // 验证是否阅读协议
    if (!_this.data.is_read) {
      App.showError('请先阅读分销商申请协议');
      return false;
    }

    // 按钮禁用
    _this.setData({
      disabled: true
    });
    wx.showLoading({
      title: '正在提交...',
      mask: true
    });
    // 数据提交
    let fromPostCall = function(formData) {
      App._post_form('user.dealer.apply/submit', values, () => {
        // 获取分销商申请状态
        _this.getApplyState();
      }, null, () => {
        // 解除按钮禁用
        wx.hideLoading();
        _this.setData({
          disabled: false
        });
      });
    }
    // 统计图片数量
    let imagesLength = _this.data.imageList.length;
    // 判断是否需要上传图片
    imagesLength > 0 ? _this.uploadFile(imagesLength, values, fromPostCall) : fromPostCall(values);
    
  },
  /**
   * 上传图片
   */
  uploadFile: function(imagesLength, formData, callBack) {
    // POST 参数
    let params = {
      wxapp_id: App.getWxappId(),
      token: wx.getStorageSync('token')
    };
    // 文件上传
    let i = 0;
    formData.uploaded = [];
    this.data.imageList.forEach(function(filePath, fileKey) {
      wx.uploadFile({
        url: App.api_root + 'upload/image',
        filePath: filePath,
        name: 'iFile',
        formData: params,
        success: function(res) {
          let result = typeof res.data === "object" ? res.data : JSON.parse(res.data);
          if (result.code === 1) {
            formData.uploaded[fileKey] = result.data.file_id;
          }
        },
        complete: function() {
          i++;
          if (imagesLength === i) {
            // 所有文件上传完成
            console.log('upload complete');
            // 执行回调函数
            callBack && callBack(formData);
          }
        }
      });
    });

  },
  /**
   * 去商城逛逛
   */
  navigationToIndex(e) {
    // 跳转到首页
    wx.switchTab({
      url: '/pages/index/index',
    })
  },

  /**
   * 订阅消息通知
   */
  onSubMsg() {
    let _this = this;
    let tmplItem = _this.data.submsgSetting.dealer.apply.template_id;
    if (tmplItem.length > 0) {
      wx.requestSubscribeMessage({
        tmplIds: [tmplItem],
        success(res) {},
        fail(res) {},
        complete(res) {},
      });
    }
  },

  /**
   * 获取推荐人id
   */
  getRefereeid() {
    return wx.getStorageSync('referee_id');
  },
   /**
   * 销售渠道选择
   */
  bindPickerChange: function(e) {
    this.setData({
      marketingIndex:this.data.marketingChannel[e.detail.value],
      marketing_type:e.detail.value
    })
  },
    /**
   * 选择图片
   */
  chooseImage: function(e) {
    let _this = this,
      index = e.currentTarget.dataset.index;
    // 选择图片
    wx.chooseImage({
      count: 5,
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function(res) {
        console.log(_this.data)
        _this.setData({
          imageList: _this.data.imageList.concat(res.tempFilePaths)
        });
      }
    });
  },

  /**
   * 删除图片
   */
  deleteImage: function(e) {
    let dataset = e.currentTarget.dataset,
      image_list = this.data.imageList;
    image_list.splice(dataset.imageIndex, 1);
    this.setData({
      imageList: image_list
    });
  },
})