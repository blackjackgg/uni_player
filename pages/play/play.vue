<template>
  <view class="play">
    <view class="play-box">
      <video class="player" :autoplay="true" :src="url" :initial-time="initialtime" @timeupdate="videoTimeUpdateEvent"></video>
    </view>
    <view class="icon-box">
      <u-icon name="share" size="60" color="#1e88e5" style="margin-right: 30rpx"></u-icon>
      <u-icon v-if="!starShow" name="star" size="60" @click="addStar()"></u-icon>
      <u-icon v-if="starShow" name="star-fill" color="#ff4445" size="60" @click="removeStar()"></u-icon>
      <u-icon name="play-circle" size="70" color="#6dd143" @click="selectPlay()" style="margin-left: 30rpx" v-if="playList.length > 0"></u-icon>
    </view>
    <view class="box-info">
      <view class="name-box">
        <text class="name">{{ detail.name }}</text>
      </view>
      <view class="info-box">
        <text>{{ detail.area }}</text>
        <text class="gap">|</text>
        <text>{{ detail.lang }}</text>
        <text class="gap">|</text>
        <text>{{ detail.type }}</text>
        <text class="gap">|</text>
        <text>{{ detail.year }}</text>
        <text class="gap">|</text>
        <text>{{ detail.note }}</text>
      </view>
      <view class="info-box">
        <text>导演: {{ detail.director }}</text>
      </view>
      <view class="info-box">
        <text>演员: {{ detail.actor }}</text>
      </view>
      <view class="info-box">
        <text>简介: {{ detail.des }}</text>
      </view>
    </view>
    <u-select
      v-model="playShow"
      :list="playList"
      confirm-text="播放"
      @confirm="playConfirm"
    ></u-select>
    <u-toast ref="uToast" />
  </view>
</template>

<script>
import db from "../../utils/database.js";
import http from "../../utils/request.js";
export default {
  data() {
    return {
      siteKey: "",
      id: "",
      name: "",
      url: "",
      initialtime: 0,
      playShow: false,
      playList: [],
      detail: {},
      starShow: true,
      videoUpdateCounter: 0
    };
  },
  methods: {
    async videoTimeUpdateEvent (e) {
      // 播放进度变化时触发timeupdate，event.detail = {currentTime, duration} 。触发频率 250ms 一次
      this.videoUpdateCounter += 1
      if (this.videoUpdateCounter % 40 === 0) {
        // 每10秒更新一下历史记录的时间进度
        this.videoUpdateCounter = 0
        await this.updateHistory(e.detail)
      }
    },
    async updateHistory (detail) {
      const res = await db.get('history', `${this.siteKey}-${this.id}`)
      if (res.flag) {
        res.data.currentTime = detail.currentTime
        res.data.duration = detail.duration
        await db.update('history', res.data)
      }
    },
    selectPlay() {
      this.playShow = !this.playShow;
    },
    playConfirm(e) {
      const d = e[0];
      this.url = d.value
      uni.setNavigationBarTitle({ title: d.label });
    },
    async getDetail(key, id) {
      const res = await http.detail(key, id);
      this.detail = res;
      const arr = [];
      let num = 1
      for (const i of res.m3u8List) {
        const j = i.split('$')
        let label = res.m3u8List.length > 1 ? `第${num}集`: this.detail.name
        if (j.length > 1) {
          for (let m = 0; m < j.length; m++) {
            if (j[m].indexOf('.m3u8') >= 0 && j[m].startsWith('http')) {
              let d = {
                index: i,
                value: j[m],
                label: label,
                extra: {
                  site: key,
                  id: id,
                },
              };
              arr.push(d);
              break
            }
          }
        } else {
          let d = {
            index: i,
            value: j[0],
            label: label,
            extra: {
              site: key,
              id: id,
            },
          };
          arr.push(d);
        }
        num++
      }
      this.playList = arr;
    },
    async checkStar () {
      const res = await db.get('star', `${this.siteKey}-${this.id}`)
      this.starShow = res.flag
    },
    async removeStar () {
      const res = await db.remove('star', `${this.siteKey}-${this.id}`)
      if (res.flag) {
        this.$refs.uToast.show({ title: '移除收藏成功', type: 'success', duration: '2300' })
      } else {
        this.$refs.uToast.show({ title: '移除收藏失败', type: 'warning', duration: '2300' })
      }
      this.checkStar()
    },
    async addStar () {
      let s = {...this.detail}
      s.key = `${this.siteKey}-${this.id}`
      const res = await db.add('star', s)
      if (res.flag) { 
        this.$refs.uToast.show({ title: '添加收藏成功', type: 'success', duration: '2300' })
      } else {
        this.$refs.uToast.show({ title: '添加收藏失败', type: 'warning', duration: '2300' })
      }
      this.checkStar()
    }
  },
  onLoad(opt) {
    this.siteKey = opt.site;
    this.id = opt.id;
    this.name = opt.name;
    this.url = opt.url;
    this.initialtime = opt.initialtime;
    this.getDetail(this.siteKey, this.id)
    this.checkStar()
    uni.setNavigationBarTitle({ title: opt.name });
  }
};
</script>

<style lang="scss" scoped>
.play {
  .play-box {
    .player {
      width: 100vw;
    }
  }
  .icon-box {
    padding: 20px 10%;
    display: flex;
    justify-content: flex-end;
  }
  .box-info {
    padding: 0 10% 10px;
    .name-box {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .name {
        font-size: 40rpx;
      }
    }
    .info-box {
      margin-top: 20rpx;
      .gap {
        margin: 0 10rpx;
      }
    }
  }
}
</style>
