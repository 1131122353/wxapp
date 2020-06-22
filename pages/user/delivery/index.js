let App = getApp();

Page({
  data: {
    list: [],
    default_id: null,
    // 分享按钮组件
    share: {
      show: false,
      cancelWithMask: true,
      cancelText: '关闭',
      actions: [{
        name: '生成商品海报',
        className: 'action-class',
        loading: false
      }, {
        name: '发送给朋友',
        openType: 'share'
      }],
      // 商品海报
      showPopup: false,
    },
    goods_id: null,
  },

  onLoad: function(options) {
    // 当前页面参数
    this.data.options = options;
  },

  onShow: function() {
    // 获取收货地址列表
    this.getDeliveryList();
  },

  /**
   * 获取收货地址列表
   */
  getDeliveryList: function() {
    let _this = this;
    App._get('user.index/delivery', {}, function(result) {
      _this.setData(result.data);
    });
  },

  /**
   * 显示商品海报图
   */
  _showPoster() {
    let _this = this;
    wx.showLoading({
      title: '加载中',
    });
    console.log(_this.data);
    App._get('goods/poster', {
      goods_id: _this.data.goods_id,
      wxapp_id: 10001,
    }, (result) => {
      _this.setData(result.data, () => {
        _this.onTogglePopup();
      });
    }, null, () => {
      wx.hideLoading();
    });
  },

  /**
   * 移除收货地址
   */
  removeDelivery: function(e) {
    let _this = this;
      let id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "提示",
      content: "您确定要移除当前带货商品吗?",
      success: function(o) {
        o.confirm && App._post_form('user.index/remove', {
          id:id
        }, function(result) {
          _this.getDeliveryList();
        });
      }
    });
  },
  /**
   * 点击生成商品海报
   */
  onClickShareItem(e) {
    let _this = this;
    console.log(e.currentTarget.dataset.goods_id);
    _this.setData({
      goods_id: e.currentTarget.dataset.goods_id
    });
    if (_this.data.goods_id > 0) {
      // 显示商品海报
      _this._showPoster();
    }
    _this.onCloseShare();
  },

  /**
   * 分享当前页面
   */
  onShareAppMessage() {
    let _this = this;
    // 构建页面参数
    let params = App.getShareUrlParams({
      'goods_id': _this.data.goods_id
    });
    return {
      title: _this.data.detail.goods_name,
      path: "/pages/goods/index?" + params
    };
  },

  /**
   * 显示分享选项
   */
  onClickShare(e) {
    let _this = this;
    this._showPoster;
    // 记录formId
    App.saveFormId(e.currentTarget.dataset.goods_id);
    _this.setData({
      'share.show': true
    });
  },

    /**
   * 切换商品海报
   */
  onTogglePopup() {
    let _this = this;
    _this.setData({
      'share.showPopup': !_this.data.share.showPopup
    });
  },
  /**
   * 关闭分享选项
   */
  onCloseShare() {
    let _this = this;
    _this.setData({
      'share.show': false
    });
  },

  /**
   * 保存海报图片
   */
  onSavePoster(e) {
    let _this = this;
    // 记录formId
    App.saveFormId(e.currentTarget.dataset.goods_id);
    wx.showLoading({
      title: '加载中',
    });
    // 下载海报图片
    wx.downloadFile({
      url: _this.data.qrcode,
      success(res) {
        wx.hideLoading();
        // 图片保存到本地
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success(data) {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            });
            // 关闭商品海报
            _this.onTogglePopup();
          },
          fail(err) {
            console.log(err.errMsg);
            if (err.errMsg === 'saveImageToPhotosAlbum:fail auth deny') {
              wx.showToast({
                title: "请允许访问相册后重试",
                icon: "none",
                duration: 1000
              });
              setTimeout(() => {
                wx.openSetting();
              }, 1000);
            }
          },
          complete(res) {
            console.log('complete');
            // wx.hideLoading();
          }
        })
      }
    })
  },
});