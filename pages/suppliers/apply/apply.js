const App = getApp();
const Dialog = require('../../../components/dialog/dialog');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_read: false,
    disabled: false,
    formData: [],
    imageList: [],
    submsgSetting: {}, // 订阅消息配置
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let _this = this;
    // 获取供货商申请状态
    _this.getApplyState();
  },


  /**
   * 获取供货商申请状态
   */
  getApplyState() {
    let _this = this;
    App._get('user.supplier.apply/get_applys_tatus', {
      wxapp_id:App.getWxappId()
    }, (result) => {
      let data = result.data;
      // 当前是否已经为供货商
      if (data.length==0) {
        _this.setData({
          is_applying:false
        })
      }else{
        _this.setData({
          is_applying:true
        })
      }
      // 设置当前页面标题
      wx.setNavigationBarTitle({
        title: "我要供货"
      });
      data.isData = true;
      _this.setData(data);
    });
  },

  /**
   * 提交申请 
   */
  onFormSubmit(e) {
    let _this = this,
      values = e.detail.value;
    values.marketing_type = this.data.marketing_type;
    values.wxapp_id = App.getWxappId();
    // 验证供货商名称
    if (!values.supplier_name || values.supplier_name.length < 1) {
      App.showError('请填写供货商名称');
      return false;
    }
    // 验证负责人
    if (!values.supplier_director || values.supplier_director.length < 1) {
      App.showError('请填写负责人');
      return false;
    }
    // 验证手机号
    if (!/^\+?\d[\d -]{8,12}\d/.test(values.supplier_phone)) {
      App.showError('手机号格式不正确');
      return false;
    }
    // 验证联系地址
    if (values.supplier_address == '') {
      App.showError('请选择联系地址');
      return false;
    }
    // 验证供货商品简介
    if (values.comment == '') {
      App.showError('请输入供货商品简介');
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
      App._post_form('user.supplier.apply/submit', values, () => {
        // 获取供货商申请状态
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