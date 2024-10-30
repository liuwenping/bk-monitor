/*
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
 */

import { Component, Prop, Watch, Emit, ProvideReactive } from 'vue-property-decorator';
import { Component as tsc } from 'vue-tsx-support';

import dayjs from 'dayjs';
import { copyText } from 'monitor-common/utils/utils';
import TableSkeleton from 'monitor-pc/components/skeleton/table-skeleton';
import DashboardPanel from 'monitor-ui/chart-plugins/components/flex-dashboard-panel';

import CallerBarChart from '../chart/caller-bar-chart';
import CallerPieChart from '../chart/caller-pie-chart';
import { TAB_TABLE_TYPE, CHART_TYPE, LIMIT_TYPE_LIST } from '../utils';
import TabBtnGroup from './common-comp/tab-btn-group';

import type { PanelModel } from '../../../typings';
import type { IColumn, IDataItem, IListItem, DimensionItem, CallOptions } from '../type';

import './multi-view-table.scss';
interface IMultiViewTableProps {
  dimensionList: DimensionItem[];
  tableColData: IListItem[];
  tableListData: IDataItem[];
  tableTabData: IDataItem[];
  panel: PanelModel;
  sidePanelCommonOptions: Partial<CallOptions>;
  isLoading?: boolean;
  supportedCalculationTypes?: IListItem[];
  tableTotal?: number;
  totalList?: IDataItem[];
  activeTabKey?: string;
  resizeStatus?: boolean;
}
interface IMultiViewTableEvent {
  onShowDetail?: () => void;
  onDrill?: () => void;
  onTabChange?: () => void;
}
@Component({
  name: 'MultiViewTable',
  components: {},
})
export default class MultiViewTable extends tsc<IMultiViewTableProps, IMultiViewTableEvent> {
  @Prop({ type: Array, default: () => [] }) supportedCalculationTypes: IListItem[];
  @Prop({ required: true, type: Array }) dimensionList: DimensionItem[];
  @Prop({ required: true, type: Array }) tableColData: IColumn[];
  @Prop({ required: true, type: Array }) tableListData: IDataItem[];
  @Prop({ required: true, type: Array }) tableTabData: IDataItem[];
  @Prop({ required: true, type: Boolean }) isLoading: boolean;
  @Prop({ required: true, type: Object }) panel: PanelModel;
  @Prop({ required: true, type: Object }) sidePanelCommonOptions: Partial<CallOptions>;
  @Prop({ required: true, type: Number }) tableTotal: number;
  @Prop({ required: true, type: Array }) totalList: IDataItem[];
  @Prop({ type: String }) activeTabKey: string;
  @ProvideReactive('callOptions') callOptions: Partial<CallOptions> = {};
  @Prop({ required: true, type: Boolean }) resizeStatus: boolean;

  active = 'request';
  cachePanels = TAB_TABLE_TYPE;
  panels = TAB_TABLE_TYPE;
  isShowDetail = false;
  isShowDimension = false;
  chartPanels = CHART_TYPE;
  chartActive = 'caller-pie-chart';
  dimensionValue = 1;
  drillValue = '';
  column = [
    {
      label: '被调 IP',
      prop: 'caller_service',
    },
    {
      label: '被调接口',
      prop: 'formal',
      props: {},
    },
  ];
  curDimensionKey = '';
  curRowData = {};
  request = ['request_total'];
  timeout = ['success_rate', 'timeout_rate', 'exception_rate'];
  consuming = ['avg_duration', 'p50_duration', 'p95_duration', 'p99_duration'];
  // 侧滑面板 维度id
  filterDimensionValue = '';
  pagination = {
    current: 1,
    count: 0,
    limit: 10,
    limitList: [10, 20, 50],
  };
  tableAppendWidth = 0;
  prefix = ['growth_rates', 'proportions', 'success_rate', 'exception_rate', 'timeout_rate'];
  sortProp: null | string = null;
  sortOrder: 'ascending' | 'descending' | null = null;
  /** 是否需要展示百分号 */
  hasPrefix(fieldName: string) {
    return this.prefix.some(pre => fieldName.startsWith(pre));
  }
  @Watch('resizeStatus')
  handleResizeStatus() {
    this.tableAppendWidth = this.$refs.tableAppendRef?.offsetParent?.children[0]?.offsetWidth || 0;
  }
  @Watch('sidePanelCommonOptions', { immediate: true })
  handleRawCallOptionsChange() {
    const selectItem = this.dimensionOptions.find(item => item.id === this.filterDimensionValue);
    const list = [];
    for (const [key, val] of Object.entries(selectItem?.dimensions || {})) {
      if (key === 'time') continue;
      if (val !== null) {
        list.push({
          key,
          value: [val],
          method: 'eq',
          condition: 'and',
        });
      }
    }
    this.callOptions = {
      ...this.sidePanelCommonOptions,
      call_filter: [...this.sidePanelCommonOptions.call_filter, ...list],
    };
  }
  @Watch('tableTotal')
  handleTableTotal(val) {
    this.pagination.count = val;
    this.pagination.current = 1;
  }
  @Watch('activeTabKey')
  handleTableData() {
    this.pagination.current = 1;
  }
  @Watch('supportedCalculationTypes', { immediate: true })
  handlePanelChange(val) {
    const txtVal = {
      avg_duration: '平均耗时',
      p95_duration: 'P95',
      p99_duration: 'P99',
      p50_duration: 'P50',
    };
    this.panels.map(item => {
      if (item.id !== 'request') {
        item.columns = val
          .map(opt => Object.assign(opt, { prop: `${opt.value}_0s`, label: txtVal[opt.value] || opt.text }))
          .filter(key => this[item.id].includes(key.value));
      }
    });
    this.cachePanels = JSON.parse(JSON.stringify(this.panels));
  }

  get dialogSelectList() {
    return LIMIT_TYPE_LIST;
  }
  get dimensionOptions() {
    if (!this.tableListData?.length) return [];
    const options = new Map();
    for (const item of this.tableListData) {
      const dimensions = item.dimensions;
      const name = this.getDimensionId(dimensions);
      if (!options.has(name)) {
        options.set(name, { name, id: name, dimensions });
      }
    }
    return Array.from(options.values());
  }

  get showTableList() {
    const { limit, current } = this.pagination;
    const groupByList = this.dimensionList.filter(item => item.active);
    if (this.totalList.length > 0) {
      groupByList.map((item, ind) => {
        Object.assign(this.totalList[0], {
          isTotal: true,
          [item.value]: ind === 0 ? '汇总' : '  ',
        });
      });
    }
    this.tableAppendWidth = this.$refs.tableAppendRef?.offsetParent?.children[0]?.offsetWidth || 0;
    let list = this.tableListData || [];
    if (this.sortProp && this.sortOrder && list.length) {
      list = list.toSorted((a, b) => {
        if (this.sortOrder === 'ascending') {
          return a[this.sortProp] > b[this.sortProp] ? 1 : -1;
        }
        return a[this.sortProp] < b[this.sortProp] ? 1 : -1;
      });
    }
    return list.slice((current - 1) * limit, current * limit);
  }
  mounted() {
    TAB_TABLE_TYPE.find(item => item.id === 'request').handle = this.handleGetDistribution;
  }
  handleGetDistribution() {
    this.isShowDimension = true;
  }
  getDimensionId(dimensions: Record<string, string>) {
    let name = '';
    for (const [key, val] of Object.entries(dimensions)) {
      if (key === 'time') continue;
      const tag = this.dimensionList.find(item => item.value === key);
      name += ` ${tag.text}:${val || '--'} `;
    }
    return name;
  }
  changeTab(id: string) {
    this.active = id;
    this.$emit('tabChange', this[id]);
  }
  changeChartTab(id: string) {
    this.chartActive = id;
  }

  /** 动态处理表格要展示的数据 */
  @Watch('tableColData')
  handleChangeCol(val: IListItem[]) {
    const key = {
      '1d': '昨天',
      '0s': '当前',
      '1w': '上周',
    };
    for (const { value, text } of val) {
      const name = key[value];
      if (name) {
        key[value] = name;
        continue;
      }
      key[value] = text;
    }
    this.panels = JSON.parse(JSON.stringify(this.cachePanels));
    const panelList = [];
    const keyList = ['0s', ...val.map(item => item.value)];
    const hastCompare = val.length > 0;
    for (const panel of this.panels) {
      const columns = [];
      if (panel.id === 'request') {
        columns.push(
          ...[
            {
              label: this.$t('占比'),
              prop: 'proportions_request_total_0s',
            },
            {
              label: this.$t('当前'),
              prop: 'request_total_0s',
            },
          ]
        );
        for (const { value } of val) {
          columns.push(
            ...[
              {
                label: key[value],
                prop: `request_total_${value}`,
              },
              {
                label: this.$t('波动'),
                prop: `growth_rates_request_total_${value}`,
              },
            ]
          );
        }
      } else if (panel.id === 'timeout') {
        const colList = ['success_rate', 'timeout_rate', 'exception_rate'].filter(Boolean);
        const nameMap = {
          success_rate: this.$t('成功率'),
          timeout_rate: this.$t('超时率'),
          exception_rate: this.$t('异常率'),
        };
        for (const col of colList) {
          for (const name of keyList) {
            columns.push({
              label: (hastCompare ? key[name] : '') + nameMap[col],
              prop: `${col}_${name}`,
            });
            if (name !== '0s') {
              columns.push({
                label: this.$t('波动'),
                prop: `growth_rates_${col}_${name}`,
              });
            }
          }
        }
      } else if (panel.id === 'consuming') {
        const colList = ['avg_duration', 'p50_duration', 'p95_duration', 'p99_duration'].filter(Boolean);
        const nameMap = {
          avg_duration: this.$t('平均耗时'),
          p50_duration: this.$t('P50平均耗时'),
          p95_duration: this.$t('P95平均耗时'),
          p99_duration: this.$t('P99平均耗时'),
        };
        for (const col of colList) {
          for (const name of keyList) {
            columns.push({
              label: (hastCompare ? key[name] : '') + nameMap[col],
              prop: `${col}_${name}`,
            });
            if (name !== '0s') {
              columns.push({
                label: this.$t('波动'),
                prop: `growth_rates_${col}_${name}`,
              });
            }
          }
        }
      }
      panelList.push({
        ...panel,
        columns,
      });
    }
    this.panels = panelList;
  }

  @Emit('showDetail')
  handleShowDetail(row, key) {
    if (!row?.isTotal && key !== 'time' && row[key]) {
      this.isShowDetail = true;
      this.filterDimensionValue = this.getDimensionId(row.dimensions);
      this.handleRawCallOptionsChange();
      this.curRowData = row;
      return { row, key };
    }
  }
  handleFilterChange(id: string) {
    this.filterDimensionValue = id;
    this.handleRawCallOptionsChange();
  }

  handleDimension(row, key) {
    this.isShowDimension = true;
    this.curDimensionKey = key;
  }
  pageChange(page) {
    this.pagination.current = page;
  }
  limitChange(limit) {
    this.pageChange(1);
    this.pagination.limit = limit;
  }
  // 下钻选择key值之后的处理
  @Emit('drill')
  chooseSelect(option: IListItem, row: IDataItem) {
    this.drillValue = option.value;
    return { option, row };
  }
  copyValue(text) {
    copyText(text, msg => {
      this.$bkMessage({
        message: msg,
        theme: 'error',
      });
      return;
    });
    this.$bkMessage({
      message: this.$t('复制成功'),
      theme: 'success',
    });
  }
  handleSort({ prop, order }) {
    this.sortProp = prop;
    this.sortOrder = order;
  }
  // 渲染左侧表格的列
  handleMultiColumn() {
    const operationCol = (
      <bk-table-column
        scopedSlots={{
          default: ({ row }) => {
            if (row?.isTotal) {
              return;
            }
            return (
              <div class='multi-view-table-link'>
                <bk-dropdown-menu
                  ref='dropdown'
                  ext-cls='drill-down-popover'
                  trigger='click'
                  position-fixed
                >
                  <div
                    class='drill-down-btn'
                    slot='dropdown-trigger'
                  >
                    <span>{this.$t('下钻')}</span>
                    <i class='icon-monitor icon-arrow-down' />
                  </div>
                  <ul
                    class='drill-down-list'
                    slot='dropdown-content'
                  >
                    {this.dimensionList.map(option => {
                      const isActive = this.drillValue === option.value;
                      return (
                        <li
                          key={option.text}
                          class={['drill-down-item', { active: isActive }]}
                          onClick={() => this.chooseSelect(option, row)}
                        >
                          {option.text}
                        </li>
                      );
                    })}
                  </ul>
                </bk-dropdown-menu>
              </div>
            );
          },
        }}
        label={this.$t('操作')}
        min-width='100'
      />
    );
    const baseCol = this.dimensionList
      .filter(item => item.active)
      .map(item => (
        <bk-table-column
          key={item.value}
          scopedSlots={{
            default: a => {
              const timeTxt = a.row.time ? dayjs.tz(a.row.time * 1000).format('YYYY-MM-DD HH:mm:ss') : '--';
              const txt = item.value === 'time' && !a.row?.isTotal ? timeTxt : a.row[item.value];
              return (
                <span
                  class={[
                    'multi-view-table-link',
                    { 'block-link': a.row?.isTotal || item.value === 'time' || !a.row[item.value] },
                  ]}
                >
                  <span
                    class='item-txt'
                    v-bk-overflow-tips
                    onClick={() => this.handleShowDetail(a.row, item.value)}
                  >
                    {txt || '--'}
                  </span>
                  {!a.row?.isTotal && a.row[item.value] && (
                    <i
                      class='icon-monitor icon-mc-copy tab-row-icon'
                      onClick={() => this.copyValue(a.row[item.value])}
                    />
                  )}
                </span>
              );
            },
          }}
          label={item.text}
          min-width={120}
          prop={item.value}
        />
      ));
    return [baseCol, operationCol];
  }
  /** 检查是否需要保留2位小数 */
  formatToTwoDecimalPlaces(value: number) {
    if (!value) {
      return;
    }
    // 首先检查值是否为数字
    if (typeof value !== 'number') {
      throw new Error('Input must be a number');
    }
    // 将数字转换为字符串并分割为整数部分和小数部分
    const parts = value.toString().split('.');

    // 检查小数部分是否存在以及其长度是否大于2
    if (parts.length > 1 && parts[1].length > 2) {
      // 如果小数部分多于两位，使用 toFixed 方法保留两位小数
      return Number.parseFloat(value.toFixed(2));
    }
    return value;
  }

  // 渲染tab表格的列
  handleMultiTabColumn() {
    const curColumn = this.panels.find(item => item.id === this.active);
    return (curColumn.columns || []).map((item, index) => (
      <bk-table-column
        key={index}
        scopedSlots={{
          default: ({ row }) => {
            const txt = this.formatTableValShow(row[item.prop], item.prop);
            return (
              <span
                class={[
                  'multi-view-table-txt',
                  { 'red-txt': item.prop.startsWith('growth_rates') && row[item.prop] > 0 },
                  { 'green-txt': item.prop.startsWith('growth_rates') && row[item.prop] < 0 },
                ]}
              >
                <span
                  class='item-txt'
                  v-bk-overflow-tips
                >
                  {item.prop.startsWith('growth_rates') && row[item.prop] > 0 ? `+${txt}` : txt}
                </span>
                {/* {!row[item.prop] && (
                  <i
                    class='icon-monitor icon-mc-line tab-row-icon'
                    onClick={() => this.handleDimension(row, 'request')}
                  />
                )} */}
              </span>
            );
          },
        }}
        label={item.label}
        min-width={130}
        prop={item.prop}
        sortable
      />
    ));
  }
  createOption(dimensions: Record<string, string>) {
    return (
      <div class='options-wrapper'>
        {Object.entries(dimensions)
          .map(([key, value]) => {
            if (key === 'time') return undefined;
            const tag = this.dimensionList.find(item => item.value === key);
            return (
              <div
                key={key}
                class='options-wrapper-item'
              >
                <span>
                  {tag.text}:{value || '--'}
                </span>
              </div>
            );
          })
          .filter(Boolean)}
      </div>
    );
  }
  /** 格式化表格里要展示内容 */
  formatTableValShow(val: number, key: string) {
    const txt = this.hasPrefix(key)
      ? val
        ? `${this.formatToTwoDecimalPlaces(val)}%`
        : val === 0
          ? `${val}%`
          : '--'
      : this.formatToTwoDecimalPlaces(val) || '--';
    return txt;
  }
  get appendTabWidth() {
    const current = this.panels.find(item => item.id === this.active);
    return this.tableAppendWidth / current.columns.length;
  }
  /** 渲染表格的汇总 */
  renderTableAppend() {
    if (this.totalList.length === 0) {
      return;
    }
    const current = this.panels.find(item => item.id === this.active);

    return current.columns.map(item => {
      const val = this.totalList[0][item.prop];
      const txt = this.formatTableValShow(val, item.prop);
      return (
        <span
          key={item.prop}
          style={{ width: `${this.appendTabWidth}px` }}
          class={[
            'span-append pl-15',
            { 'red-txt': item.prop.startsWith('growth_rates') && val > 0 },
            { 'green-txt': item.prop.startsWith('growth_rates') && val < 0 },
          ]}
        >
          {item.prop.startsWith('growth_rates') && val > 0 ? `+${txt}` : txt}
        </span>
      );
    });
  }
  render() {
    return (
      <div class='multi-view-table-main'>
        <div class='multi-view-table-view'>
          <div class='multi-view-left'>
            {this.dimensionList && (
              <bk-table
                ext-cls='multi-view-table'
                data={this.showTableList}
                header-border={false}
                header-cell-class-name={() => 'multi-table-head'}
                max-height={600}
                outer-border={false}
                virtual-render={this.pagination.limit > 20}
              >
                {this.handleMultiColumn()}
                <div slot='empty' />
                <div
                  class='multi-view-tab-table-append pl-15 bor-bt'
                  slot='append'
                >
                  {this.$t('汇总')}
                </div>
              </bk-table>
            )}
          </div>
          <div class='multi-view-right'>
            <div class='head-tab'>
              <TabBtnGroup
                height={42}
                activeKey={this.active}
                list={this.panels}
                type='tab'
                onChange={this.changeTab}
              />
            </div>
            <div>
              <bk-table
                ref='tabTableRef'
                ext-cls='multi-view-tab-table'
                data={this.showTableList}
                header-border={false}
                header-cell-class-name={() => 'multi-table-tab-head'}
                max-height={600}
                outer-border={false}
                virtual-render={this.pagination.limit > 10}
                on-sort-change={this.handleSort}
              >
                {this.handleMultiTabColumn()}
                <div slot='empty' />
                <div
                  ref='tableAppendRef'
                  class='multi-view-tab-table-append'
                  slot='append'
                >
                  {this.renderTableAppend()}
                </div>
              </bk-table>
            </div>
          </div>
          {this.isLoading ? (
            <TableSkeleton
              class='view-empty-block pt-8'
              type={1}
            />
          ) : (
            this.showTableList.length < 1 && (
              <div class='view-empty-block'>
                <bk-exception
                  scene='part'
                  type='empty'
                >
                  {this.$t('查无数据')}
                </bk-exception>
              </div>
            )
          )}
        </div>
        {this.tableTotal > this.pagination.limit && (
          <bk-pagination
            class='mt-8'
            align='right'
            count={this.pagination.count}
            current={this.pagination.current}
            limit={this.pagination.limit}
            limit-list={this.pagination.limitList}
            show-limit={false}
            size='small'
            show-total-count
            on-change={this.pageChange}
            on-limit-change={this.limitChange}
            {...{ on: { 'update:current': v => (this.pagination.current = v) } }}
          />
        )}
        {/* 维度趋势图侧栏 */}
        <bk-sideslider
          width={640}
          ext-cls='multi-detail-slider'
          isShow={this.isShowDetail}
          quick-close={true}
          title={this.$t('维度趋势图')}
          transfer={true}
          {...{ on: { 'update:isShow': v => (this.isShowDetail = v) } }}
        >
          {this.isShowDetail && (
            <div
              class='content-wrap'
              slot='content'
            >
              <div class='multi-slider-filter'>
                <span class='filter-title'>{this.$t('维度')} ：</span>
                <bk-select
                  class='filter-select'
                  behavior='simplicity'
                  clearable={false}
                  value={this.filterDimensionValue}
                  searchable
                  onChange={this.handleFilterChange}
                >
                  {this.dimensionOptions.map(option => (
                    <bk-option
                      id={option.id}
                      key={option.id}
                      name={option.name}
                    >
                      {this.createOption(option.dimensions)}
                    </bk-option>
                  ))}
                </bk-select>
              </div>
              <div class='multi-slider-chart'>
                <DashboardPanel
                  id={'apm-table-extra_panels'}
                  column={1}
                  panels={this.panel.extra_panels}
                />
              </div>
            </div>
          )}
        </bk-sideslider>
        {/* 维度值分布弹窗 */}
        {false && (
          <bk-dialog
            width={640}
            ext-cls='multi-detail-dialog'
            v-model={this.isShowDimension}
            header-position={'left'}
            show-footer={false}
            theme='primary'
          >
            <div
              class='multi-dialog-header'
              slot='header'
            >
              <span class='head-title'>{this.$t('维度值分布')}</span>
              <TabBtnGroup
                class='multi-dialog-tab'
                activeKey={this.chartActive}
                list={this.chartPanels}
                onChange={this.changeChartTab}
              />
              <bk-select
                class='multi-dialog-select ml10'
                v-model={this.dimensionValue}
              >
                {this.dialogSelectList.map(option => (
                  <bk-option
                    id={option.id}
                    key={option.id}
                    name={option.name}
                  />
                ))}
              </bk-select>
            </div>
            <div class='multi-dialog-content'>
              <span class='tips'>{this.$t('仅展示前 30 条数据')}</span>
              {this.isShowDimension &&
                (this.chartActive === 'caller-pie-chart' ? <CallerPieChart /> : <CallerBarChart />)}
            </div>
          </bk-dialog>
        )}
      </div>
    );
  }
}