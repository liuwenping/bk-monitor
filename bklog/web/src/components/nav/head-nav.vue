<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<!--
* Tencent is pleased to support the open source community by making
* 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
*
* Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
*
* 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
*
* License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
*
* ---------------------------------------------------
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
* documentation files (the "Software"), to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
* to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of
* the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
* THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
* CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
* IN THE SOFTWARE.
-->

<template>
  <nav class="log-search-nav">
    <div class="nav-left fl">
      <div
        class="log-logo-container"
        @click.stop="jumpToHome"
      >
        <img
          class="logo-image"
          :src="platformData.logo"
          alt="logo"
        />
        <span class="logo-text">{{ platformData.name }}</span>
      </div>
    </div>
    <div
      class="nav-center fl"
      data-test-id="topNav_div_topNavBox"
    >
      <ul>
        <li
          v-for="menu in menuList"
          :class="['menu-item', { active: activeTopMenu.id === menu.id }]"
          :data-test-id="`topNavBox_li_${menu.id}`"
          :id="`${menu.id}MenuGuide`"
          :key="menu.id"
          @click="routerHandler(menu)"
        >
          <template>
            {{ menu.name }}
          </template>
        </li>
      </ul>
    </div>
    <div
      class="nav-right fr"
      v-show="usernameRequested"
    >
      <!-- 全局设置 -->
      <bk-dropdown-menu
        v-if="!isExternal"
        align="center"
        trigger="click"
        @hide="dropdownGlobalHide"
        @show="dropdownGlobalShow"
      >
        <template #dropdown-trigger>
          <div class="icon-language-container">
            <span
              :class="{
                'setting bk-icon icon-cog-shape': true,
                active: isShowGlobalDialog || isShowGlobalDropdown,
              }"
            ></span>
          </div>
        </template>
        <template #dropdown-content>
          <ul class="bk-dropdown-list">
            <li
              v-for="item in globalSettingList"
              class="language-btn"
              :key="item.id"
            >
              <a
                href="javascript:;"
                @click="handleClickGlobalDialog(item.id)"
              >
                {{ item.name }}
              </a>
            </li>
          </ul>
        </template>
      </bk-dropdown-menu>
      <!-- 语言 -->
      <bk-dropdown-menu
        align="center"
        trigger="click"
        @hide="dropdownLanguageHide"
        @show="dropdownLanguageShow"
      >
        <template #dropdown-trigger>
          <div
            class="icon-language-container"
            :class="isShowLanguageDropdown && 'active'"
          >
            <div class="icon-circle-container">
              <img
                class="icon-language"
                :src="language === 'en' ? require('@/images/icons/en.svg') : require('@/images/icons/zh.svg')"
              />
            </div>
          </div>
        </template>
        <template #dropdown-content>
          <ul class="bk-dropdown-list">
            <li
              v-for="item in languageList"
              class="language-btn"
              :key="item.id"
            >
              <a
                :class="{ active: language === item.id }"
                href="javascript:;"
                @click="changeLanguage(item.id)"
              >
                <img
                  class="icon-language"
                  :src="item.id === 'en' ? require('@/images/icons/en.svg') : require('@/images/icons/zh.svg')"
                />
                {{ item.name }}
              </a>
            </li>
          </ul>
        </template>
      </bk-dropdown-menu>
      <!-- 版本日志和产品文档 -->
      <bk-dropdown-menu
        ref="dropdownHelp"
        align="center"
        trigger="click"
        @hide="dropdownHelpHide"
        @show="dropdownHelpShow"
      >
        <template #dropdown-trigger>
          <div
            class="icon-language-container"
            :class="isShowHelpDropdown && 'active'"
          >
            <div class="icon-circle-container">
              <span
                class="icon log-icon icon-help"
                slot="dropdown-trigger"
              ></span>
            </div>
          </div>
        </template>
        <template #dropdown-content>
          <ul class="bk-dropdown-list">
            <li>
              <a
                href="javascript:;"
                @click.stop="dropdownHelpTriggerHandler('docCenter')"
              >
                {{ $t('产品文档') }}
              </a>
              <a
                v-if="!isExternal"
                href="javascript:;"
                @click.stop="dropdownHelpTriggerHandler('logVersion')"
              >
                {{ $t('版本日志') }}
              </a>
              <a
                href="javascript:;"
                @click.stop="dropdownHelpTriggerHandler('feedback')"
              >
                {{ $t('问题反馈') }}
              </a>
            </li>
          </ul>
        </template>
      </bk-dropdown-menu>
      <log-version :dialog-show.sync="showLogVersion" />
      <bk-dropdown-menu
        align="center"
        trigger="click"
        @hide="dropdownLogoutHide"
        @show="dropdownLogoutShow"
      >
        <template #dropdown-trigger>
          <div
            class="icon-language-container"
            :class="isShowLogoutDropdown && 'active'"
          >
            <span
              v-if="username"
              class="username"
              >{{ username }}
              <i class="bk-icon icon-down-shape"></i>
            </span>
          </div>
        </template>
        <template #dropdown-content>
          <ul class="bk-dropdown-list">
            <li>
              <a
                href="javascript:;"
                @click="handleGoToMyApplication"
              >
                {{ $t('我申请的') }}
              </a>
            </li>
            <li>
              <a
                href="javascript:;"
                @click="handleGoToMyReport"
              >
                {{ $t('我的订阅') }}
              </a>
            </li>
            <li>
              <a
                href="javascript:;"
                @click="handleQuit"
              >
                {{ $t('退出登录') }}
              </a>
            </li>
          </ul>
        </template>
      </bk-dropdown-menu>
    </div>

    <GlobalDialog
      v-model="showGlobalDialog"
      :title="globalDialogTitle"
    >
      <iframe
        style="width: 100%; height: 100%; border: none"
        :src="targetSrc"
      ></iframe>
    </GlobalDialog>
  </nav>
</template>

<script>
  import { useJSONP } from '@/common/jsonp';
  import GlobalDialog from '@/components/global-dialog';
  import logoImg from '@/images/log-logo.png';
  import navMenuMixin from '@/mixins/nav-menu-mixin';
  import platformConfigStore from '@/store/modules/platform-config';
  import jsCookie from 'js-cookie';
  import { mapState, mapGetters } from 'vuex';

  import { menuArr } from './complete-menu';
  import LogVersion from './log-version';

  export default {
    name: 'HeaderNav',
    components: {
      LogVersion,
      GlobalDialog,
    },
    mixins: [navMenuMixin],
    props: {},
    data() {
      return {
        isFirstLoad: true,
        isOpenVersion: window.RUN_VER.indexOf('open') !== -1,
        username: '',
        usernameRequested: false,
        isShowLanguageDropdown: false,
        isShowGlobalDropdown: false,
        isShowHelpDropdown: false,
        isShowLogoutDropdown: false,
        showLogVersion: false,
        language: 'zh-cn',
        languageList: [
          { id: 'zh-cn', name: '中文' },
          { id: 'en', name: 'English' },
        ],
        showGlobalDialog: false,
        globalDialogTitle: '',
        targetSrc: '',
      };
    },
    computed: {
      ...mapState({
        currentMenu: state => state.currentMenu,
        errorPage: state => state.errorPage,
        asIframe: state => state.asIframe,
        iframeQuery: state => state.iframeQuery,
        isExternal: state => state.isExternal,
        isShowGlobalDialog: state => state.isShowGlobalDialog,
        globalSettingList: state => state.globalSettingList,
      }),
      ...mapGetters('globals', ['globalsData']),
      platformData() {
        const { appLogo, i18n } = platformConfigStore.publicConfig;
        const bkRepoUrl = window.BK_SHARED_RES_URL;
        const publicConfigName = i18n?.name ?? this.$t('日志平台');
        return {
          name: !!bkRepoUrl ? publicConfigName : this.$t('日志平台'),
          logo: appLogo || logoImg,
        };
      },
      envConfig() {
        const { paas_api_host: host, bk_domain: bkDomain } = this.globalsData;
        return {
          host,
          bkDomain,
        };
      },
      dropDownActive() {
        let current;
        if (this.currentMenu.dropDown && this.currentMenu.children) {
          const routeName = this.$route.name;
          current = this.activeTopMenu(this.currentMenu.children, routeName);
        }
        return current || {};
      },
      isDisableSelectBiz() {
        return Boolean(this.$route.name === 'trace' && this.$route.query.traceId);
      },
      menuList() {
        return this.topMenu.filter(menu => {
          return menu.feature === 'on' && (this.isExternal ? this.externalMenu.includes(menu.id) : true);
        });
      },
    },
    watch: {
      $route() {
        /** 当路由改变时应该把 dialog 关闭掉 */
        this.showGlobalDialog = false;
      },
    },
    async created() {
      this.language = jsCookie.get('blueking_language') || 'zh-cn';
      this.$store.commit('updateMenuList', menuArr);
      setTimeout(() => this.requestMySpaceList(), 10);
      this.getUserInfo();
      window.bus.$on('showGlobalDialog', this.handleGoToMyReport);
    },
    beforeUnmount() {
      window.bus.$off('showGlobalDialog', this.handleGoToMyReport);
    },
    methods: {
      async getUserInfo() {
        try {
          const res = await this.$http.request('userInfo/getUsername');
          this.username = res.data.username;
          this.$store.commit('updateUserMeta', res.data);
          if (window.__aegisInstance) {
            window.__aegisInstance.setConfig({
              uin: res.data.username,
            });
          }
        } catch (e) {
          console.warn(e);
        } finally {
          this.usernameRequested = true;
        }
      },
      jumpToHome() {
        this.$store.commit('updateIsShowGlobalDialog', false);
        this.$router.push({
          name: 'retrieve',
          query: {
            spaceUid: this.$store.state.spaceUid,
          },
        });
        setTimeout(() => {
          this.$emit('reload-router');
        });
      },
      routerHandler(menu) {
        // 关闭全局设置弹窗
        this.$store.commit('updateIsShowGlobalDialog', false);
        if (menu.id === this.activeTopMenu.id) {
          if (menu.id === 'retrieve') {
            this.$router.push({
              name: menu.id,
              query: {
                spaceUid: this.$store.state.spaceUid,
              },
            });
            this.$emit('reload-router');
            return;
          }
          if (menu.id === 'extract') {
            if (this.$route.query.create) {
              this.$router.push({
                name: 'extract',
                query: {
                  spaceUid: this.$store.state.spaceUid,
                },
              });
            } else {
              this.$emit('reload-router');
            }
            return;
          }
          if (menu.id === 'trace') {
            if (this.$route.name === 'trace-detail') {
              this.$router.push({
                name: 'trace-list',
                query: {
                  spaceUid: this.$store.state.spaceUid,
                },
              });
            } else {
              this.$emit('reload-router');
            }
            return;
          }
          if (menu.id === 'dashboard') {
            // if (this.$route.query.manageAction) {
            //   const newQuery = { ...this.$route.query };
            //   delete newQuery.manageAction;
            //   this.$router.push({
            //     name: 'dashboard',
            //     query: newQuery,
            //   });
            // }
            // this.$emit('reload-router');
            // return;
            this.$router.push({
              name: menu.id,
              query: {
                spaceUid: this.$store.state.spaceUid,
              },
            });
            this.$emit('reload-router');
            return;
          }
          if (menu.id === 'manage') {
            if (this.$route.name !== 'collection-item') {
              this.$router.push({
                name: 'manage',
                query: {
                  spaceUid: this.$store.state.spaceUid,
                },
              });
            } else {
              this.$emit('reload-router');
            }
            return;
          }
          this.$emit('reload-router');
          return;
        }
        if (menu.id === 'monitor') {
          window.open(`${window.MONITOR_URL}/?bizId=${this.bkBizId}#/strategy-config`, '_blank');
        } else if (menu.id === 'trace') {
          this.$router.push({
            name: 'trace-list',
            query: {
              spaceUid: this.$store.state.spaceUid,
            },
          });
        } else {
          this.$router.push({
            name: menu.id,
            query: {
              spaceUid: this.$store.state.spaceUid,
            },
          });
        }
      },
      async changeLanguage(value) {
        // const domainList = location.hostname.split('.');

        // // 本项目开发环境因为需要配置了 host 域名比联调环境多 1 级
        // if (process.env.NODE_ENV === 'development') {
        //   domainList.splice(0, 1);
        // }

        // // handle duplicate cookie names
        // for (let i = 0; i < domainList.length - 1; i++) {
        //   jsCookie.remove('blueking_language', {
        //     domain: domainList.slice(i).join('.'),
        //   });
        // }

        // jsCookie.set('blueking_language', value, {
        //   expires: 30,
        //   // 和平台保持一致，cookie 种在上级域名
        //   domain: domainList.length > 2 ? domainList.slice(1).join('.') : domainList.join('.'),
        // });

        // window.location.reload();

        jsCookie.remove('blueking_language', { path: '' });
        jsCookie.set('blueking_language', value, {
          expires: 3600,
          domain:
            this.envConfig.bkDomain || location.host.split('.').slice(-2).join('.').replace(`:${location.port}`, ''),
        });
        if (this.envConfig.host) {
          try {
            useJSONP(
              `${this.envConfig.host
                .replace(/\/$/, '')
                .replace(/^http:/, location.protocol)}/api/c/compapi/v2/usermanage/fe_update_user_language`,
              {
                data: {
                  language: value,
                },
              },
            );
          } catch (error) {
            console.warn(error);
            location.reload();
          } finally {
            location.reload();
          }
          return;
        }
        location.reload();
      },
      dropdownLanguageShow() {
        this.isShowLanguageDropdown = true;
      },
      dropdownLanguageHide() {
        this.isShowLanguageDropdown = false;
      },
      dropdownGlobalShow() {
        this.isShowGlobalDropdown = true;
      },
      dropdownGlobalHide() {
        this.isShowGlobalDropdown = false;
      },
      dropdownHelpShow() {
        this.isShowHelpDropdown = true;
      },
      dropdownHelpHide() {
        this.isShowHelpDropdown = false;
      },
      dropdownLogoutShow() {
        this.isShowLogoutDropdown = true;
      },
      dropdownLogoutHide() {
        this.isShowLogoutDropdown = false;
      },
      dropdownHelpTriggerHandler(type) {
        this.$refs.dropdownHelp.hide();
        if (type === 'logVersion') {
          this.showLogVersion = true;
        } else if (type === 'docCenter') {
          // window.open(window.BK_DOC_URL);
          this.handleGotoLink('docCenter');
        } else if (type === 'feedback') {
          window.open(window.BK_FAQ_URL);
        }
      },
      /** 前往 我申请的 */
      handleGoToMyApplication() {
        this.showGlobalDialog = false;
        this.$nextTick(() => {
          const bizId = this.$store.state.bkBizId;
          const host =
            process.env.NODE_ENV === 'development' ? `http://${process.env.devHost}:7001` : window.MONITOR_URL;
          const targetSrc = `${host}/?bizId=${bizId}&needMenu=false#/trace/report/my-applied-report`;
          this.globalDialogTitle = this.$t('我申请的');
          this.showGlobalDialog = true;
          this.targetSrc = targetSrc;
        });
      },
      /** 前往 我的订阅 */
      handleGoToMyReport() {
        this.showGlobalDialog = false;
        this.$nextTick(() => {
          const bizId = this.$store.state.bkBizId;
          const host =
            process.env.NODE_ENV === 'development' ? `http://${process.env.devHost}:7001` : window.MONITOR_URL;
          const targetSrc = `${host}/?bizId=${bizId}&needMenu=false#/trace/report/my-report`;
          this.globalDialogTitle = this.$t('我的订阅');
          this.showGlobalDialog = true;
          this.targetSrc = targetSrc;
        });
      },
      /** 退出登录 */
      handleQuit() {
        location.href = `${window.BK_PLAT_HOST}/console/accounts/logout/`;
      },
      handleClickGlobalDialog(id) {
        // 打开全局设置弹窗
        this.$store.commit('updateGlobalActiveLabel', id);
        this.$store.commit('updateIsShowGlobalDialog', true);
      },
    },
  };
</script>

<style lang="scss">
  @import '../../scss/mixins/clearfix';
  @import '../../scss/conf';
  @import '../../scss/mixins/flex';

  .log-search-nav {
    height: 52px;
    color: #fff;
    background: #182132;

    @include clearfix;

    .nav-left {
      display: flex;
      align-items: center;
      width: 278px;
      height: 100%;
      padding-left: 16px;
      font-size: 18px;

      .log-logo-container {
        display: flex;
        align-items: center;
        height: 100%;
        color: #96a2b9;
        cursor: pointer;

        .logo-text {
          font-size: 16px;
          font-weight: 700;
          color: #96a2b9;
        }

        .logo-image {
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }
      }
    }

    .nav-center {
      font-size: 14px;

      ul {
        @include clearfix;
      }

      .menu-item {
        position: relative;
        float: left;
        height: 50px;
        padding: 0 20px;
        line-height: 50px;
        color: #979ba5;
        cursor: pointer;
        transition: color 0.3s linear;

        &.active {
          color: #fff;
          background: #0c1423;
          transition: all 0.3s linear;
        }

        &:hover {
          color: #fff;
          transition: color 0.3s linear;
        }

        &.guide-highlight {
          background: #000;
        }
      }

      .bk-dropdown-content {
        z-index: 2105;
        min-width: 112px;
        line-height: normal;

        /* stylelint-disable-next-line declaration-no-important */
        text-align: center !important;
      }

      .drop-menu-item > .active {
        color: #3a84ff;
      }
    }

    .nav-right {
      display: flex;
      align-items: center;
      height: 100%;
      color: #768197;

      @include clearfix;

      .setting {
        position: relative;
        margin-right: 10px;
        font-size: 15px;
        cursor: pointer;

        &::before {
          position: relative;
          top: 1px;
          z-index: 999;
        }

        &.active,
        &:hover {
          color: #fff;
        }

        &.active::after,
        &:hover::after {
          position: absolute;
          bottom: -8px;
          left: 50%;
          z-index: 99;
          width: 30px;
          height: 30px;
          content: '';
          background: #424e5a;
          border-radius: 50%;
          transform: translateX(-50%);
        }
      }

      .select-business {
        margin-right: 22px;
        color: #979ba5;
        border-color: #445060;
      }

      .icon-language-container {
        height: 50px;
        margin: 4px;
        cursor: pointer;

        @include flex-center;

        .icon-circle-container {
          width: 32px;
          height: 32px;
          border-radius: 16px;
          transition: all 0.2s;

          @include flex-center;

          .log-icon {
            font-size: 16px;
            transition: all 0.2s;
          }

          .icon-language {
            width: 20px;
          }
        }

        &:hover,
        &.active {
          .icon-circle-container {
            background: linear-gradient(270deg, #253047, #263247);
            transition: all 0.2s;

            .log-icon {
              color: #d3d9e4;
              transition: all 0.2s;
            }
          }
        }
      }

      .icon-icon-help-document-fill {
        font-size: 16px;
        cursor: pointer;
      }

      .username {
        margin: 0 28px 0 6px;
        font-size: 12px;
        line-height: 20px;
        color: #63656e;

        &:hover {
          color: #3a84ff;
          cursor: pointer;
        }
      }

      .bk-dropdown-list {
        .language-btn {
          a {
            display: flex;
            align-items: center;
          }

          .icon-language {
            width: 20px;
            margin-right: 2px;
          }
        }

        .active {
          color: #3c96ff;
        }
      }
    }
  }

  .select-business-dropdown-content {
    /* stylelint-disable-next-line declaration-no-important */
    border: none !important;

    .bk-select-search-wrapper {
      border: 1px solid #dcdee5;
      border-bottom: none;
      border-top-left-radius: 2px;
      border-top-right-radius: 2px;
    }

    .bk-options-wrapper {
      border-right: 1px solid #dcdee5;
      border-left: 1px solid #dcdee5;
    }

    .bk-select-extension {
      padding: 0;
      border: none;

      &:hover {
        background: #fafbfd;
      }

      .select-business-extension {
        display: flex;
        cursor: pointer;

        .extension-item {
          flex-grow: 1;
          width: 50%;
          text-align: center;
          border: 1px solid #dcdee5;

          &:nth-child(2) {
            margin-left: -1px;
            border-left-color: #dcdee5;
          }

          &:first-child {
            border-bottom-left-radius: 2px;
          }

          &:last-child {
            border-bottom-right-radius: 2px;
          }

          &:hover {
            z-index: 1;
            color: #3a84ff;
            background: #f0f5ff;
            border-color: #3a84ff;
          }
        }
      }
    }
  }
</style>
