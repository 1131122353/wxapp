const App = getApp();
const pageIndex = 'category/list::';

Page({
  data: {
    scrollHeight: null,
    select: false,
    tihuoWay: '直播订货',
    showView: false, // 列表显示方式

    sortType: 'all', // 排序类型
    sortPrice: false, // 价格从低到高

    option: {}, // 当前页面参数
    list: {}, // 商品列表数据

    no_more: false, // 没有更多数据
    isLoading: true, // 是否正在加载中

    page: 1, // 当前页码
    
    marketing: {}, //营销渠道列表
    marketing_id: 0, //营销渠道id
    grade_id: null, //等级id
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    let _this = this;
    // 设置商品列表高度
    _this.setListHeight();
    // 记录option
    _this.setData({
      option
    });
    // 设置列表显示方式
    _this.setShowView();
    // 获取商品列表
    _this.getGoodsList();
    //获取渠道分类列表
    _this.getMarketingList();
    var grade_id= wx.getStorageSync('grade_id');
    this.setData({
      grade_id: grade_id
    });
    console.log(grade_id);
  },

  /**
   * 设置默认列表显示方式
   */
  setShowView() {
    let _this = this;
    _this.setData({
      showView: wx.getStorageSync(pageIndex + 'showView') || false
    });
  },
  addCard(e) {
    var goods_id = e.currentTarget.dataset.goods_id;
    var sku_id  = e.currentTarget.dataset.goods_sku_id;
    console.log(sku_id);
    App._post_form('cart/add', {
      goods_id: goods_id,
      goods_num: 1,
      goods_sku_id: sku_id,
    }, (result) => {
      App.showSuccess(result.msg);
      _this.setData(result.data);
    });
  },
  addDelivery(e) {
    var goods_id = e.currentTarget.dataset.goods_id;
    var user_id = wx.getStorageSync('user_id');
    App._post_form('cart/delivery', {
      goods_id: goods_id,
      user_id: user_id,
    }, (result) => {
      App.showSuccess(result.msg);
      _this.setData(result.data);
    });
  },
  /**
   * 确认购买弹窗
   */
  onToggleTrade(e) {
    let _this = this;
    if (typeof e === 'object') {
      // 记录formId
      e.detail.hasOwnProperty('formId') && App.saveFormId(e.detail.formId);
    }
    _this.setData({
      showBottomPopup: !_this.data.showBottomPopup
    });
  },

  /**
   * 获取渠道列表
   */
  getMarketingList() {
    let _this = this;
    App._get('goods/marketing', {}, result => {
        let marketing = result.data.list.all;
        _this.setData({
          marketing: marketing,
          isLoading: false,
      });
    });
  },

  /**
   * 获取商品列表
   * @param {bool} isPage 是否分页
   * @param {number} page 指定的页码
   */
  getGoodsList(isPage, page) {
    let _this = this;
    App._get('goods/lists', {
      page: page || 1,
      sortType: this.data.sortType,
      sortPrice: this.data.sortPrice ? 1 : 0,
      category_id: this.data.option.category_id || 0,
      search: this.data.option.search || '',
      marketing_id:  this.data.marketing_id,
    }, result => {
      let resList = result.data.list,
        dataList = _this.data.list;
      if (isPage == true) {
        _this.setData({
          'list.data': dataList.data.concat(resList.data),
          isLoading: false,
        });
      } else {
        _this.setData({
          list: resList,
          isLoading: false,
        });
      }
    });
  },

  //绑定下拉选项
  bindShowMsg() {
    this.setData({
        select:!this.data.select
    })
  },
  mySelect(e) {
    var name = e.currentTarget.dataset.name
    var marketing_id = e.currentTarget.dataset.marketing
    console.log(name);
    console.log(marketing_id);

    this.setData({
        tihuoWay: name,
        select: false,
        marketing_id: marketing_id,
    })
  },
  /**
   * 设置商品列表高度
   */
  setListHeight() {
    let _this = this;
    wx.getSystemInfo({
      success: res => {
        _this.setData({
          scrollHeight: res.windowHeight - 90,
        });
      }
    });
  },

  /**
   * 切换排序方式
   */
  switchSortType(e) {
    let _this = this,
      newSortType = e.currentTarget.dataset.type,
      newSortPrice = newSortType === 'price' ? !this.data.sortPrice : true;
    this.setData({
      list: {},
      isLoading: true,
      page: 1,
      sortType: newSortType,
      sortPrice: newSortPrice,
    }, () => {
      // 获取商品列表
      _this.getGoodsList();
    });
  },

  /**
   * 切换列表显示方式
   */
  onChangeShowState() {
    let _this = this,
      showView = !_this.data.showView;
    wx.setStorageSync(pageIndex + 'showView', showView);
    _this.setData({
      showView
    });
  },

  /**
   * 下拉到底加载数据
   */
  bindDownLoad() {
    // 已经是最后一页
    if (this.data.page >= this.data.list.last_page) {
      this.setData({
        no_more: true
      });
      return false;
    }
    // 加载下一页列表
    this.getGoodsList(true, ++this.data.page);
  },

  /**
   * 设置分享内容
   */
  onShareAppMessage() {
    // 构建分享参数
    return {
      title: "全部分类",
      path: "/pages/category/index?" + App.getShareUrlParams()
    };
  },

  /**
   * 商品搜索
   */
  triggerSearch() {
    let pages = getCurrentPages();
    // 判断来源页面
    if (pages.length > 1 &&
      pages[pages.length - 2].route === 'pages/search/index') {
      wx.navigateBack();
      return;
    }
    // 跳转到商品搜索
    wx.navigateTo({
      url: '../search/index',
    })
  },

});