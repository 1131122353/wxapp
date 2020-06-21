const App = getApp();

// 工具类
import util from '../../../utils/util.js';

// 倒计时插件
import CountDown from '../../../utils/countdown.js';

// 枚举类：秒杀会场活动状态
import StateEnum from '../../../utils/enum/sharp/ActiveStatus.js';

Page({

  /**
   * 页面的初始数据
   */
  data: {

    // 当前tab索引
    curTabIndex: 0,

    noMore: false, // 没有更多数据
    isLoading: true, // 是否正在加载中
    page: 1, // 当前页码

    StateEnum, // 枚举类：秒杀会场活动状态

    // 倒计时
    countDownList: [],

    // 秒杀活动场次
    tabbar: [],

    // 秒杀商品列表
    goodsList: [],

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
    if (_this.data.curTabIndex == 0) {
      // 获取列表数据
      _this.getApiData();
    }
  },

  /**
   * 获取列表数据
   */
  getApiData() {
    let _this = this;
    App._get('sharp.index/index', {}, (result) => {
      _this.setData(result.data);
      // 初始化倒计时组件
      _this._initCountDownData();
    });
  },

  /**
   * 初始化倒计时组件
   */
  _initCountDownData(data) {
    let _this = this,
      curTabbar = _this.data.tabbar[_this.data.curTabIndex];
    // 记录倒计时的时间
    _this.setData({
      [`countDownList[0]`]: {
        date: curTabbar.count_down_time,
      }
    });
    // 执行倒计时
    CountDown.onSetTimeList(_this, 'countDownList');
  },

  /**
   * 切换tabbar
   */
  onToggleTab(e) {
    let _this = this;
    // 保存formid
    App.saveFormId(e.detail.formId);
    // 设置当前tabbar索引，并重置数据
    _this.setData({
      curTabIndex: e.detail.target.dataset.index,
      goodsList: [],
      page: 1,
      isLoading: true,
      noMore: false,
    });
    // 获取列表数据
    _this.getGoodsList();
    // 初始化倒计时组件
    _this._initCountDownData();
  },

  /**
   * 跳转到砍价商品详情
   */
  onTargetActive(e) {
    let _this = this,
      curTabbar = _this.data.tabbar[_this.data.curTabIndex];
    // 保存formid
    App.saveFormId(e.detail.formId);
    let query = util.urlEncode({
      active_time_id: curTabbar.active_time_id,
      sharp_goods_id: e.detail.target.dataset.id,
    });
    console.log(query);
    wx.navigateTo({
      url: `../goods/index?${query}`,
    })
  },

  /**
   * 下拉到底部加载下一页
   */
  onReachBottom() {
    let _this = this,
      listData = _this.data.goodsList;
    // 已经是最后一页
    if (_this.data.page >= listData.last_page) {
      _this.setData({
        noMore: true
      });
      return false;
    }
    // 加载下一页列表
    _this.setData({
      page: ++_this.data.page
    });
    _this.getGoodsList(true);
  },

  /**
   * 获取列表数据
   */
  getGoodsList(isNextPage) {
    let _this = this,
      curTabbar = _this.data.tabbar[_this.data.curTabIndex];;
    App._get('sharp.goods/lists', {
      page: _this.data.page || 1,
      active_time_id: curTabbar.active_time_id
    }, (result) => {
      let resList = result.data.list,
        dataList = _this.data.goodsList;
      if (isNextPage == true) {
        _this.setData({
          'goodsList.data': dataList.data.concat(resList.data),
          isLoading: false,
        });
      } else {
        _this.setData({
          goodsList: resList,
          isLoading: false,
        });
      }
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    let _this = this;
    // 构建页面参数
    let params = App.getShareUrlParams();
    return {
      title: '整点秒杀',
      path: `/pages/sharp/index/index?${params}`
    };
  },

})