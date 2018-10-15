import { includes, template, isEmpty, assign } from 'lodash';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';

'use strict';

export default class ProgressDashboard extends Dashboard{
  constructor(...args) {
    super(...args);
  }

  getSize() {
    const sizes = ['xs','sm','md','lg','max'];
    let size;
    if (this.options.colSize && includes(sizes, this.options.colSize)) {
      size = this.options.colSize;
    } else {
      size = 'sm';
    }
    return size;
  }

  drawProgress() {
    $(`#${this.id} .sv-progress-line`).dxProgressBar({
      height: 10,
      readOnly: true,
      showStatus: false,
      value: this.data.chart.value.val,
      elementAttr: {
        class: `st-progress ${this.data.chart.value.val < 100 ? 'st-progress-red' : 'st-progress-green'}`
      }
    });
  }

  drawChart() {
    if (this.data.chart.value.val < 50) {
      $(`#${this.id} .sv-progress-chart`).dxBarGauge({
        startValue: 0,
        endValue: 100,
        tickInterval: 100,
        label: { visible: false },
        tooltip: {
          enabled: true,
          customizeTooltip: (arg) => `${arg}%`
        },
        values: [this.data.chart.value.val]
      });
    } else {
      $(`#${this.id} .sv-progress-chart`).dxCircularGauge({
        scale: {
          startValue: 0,
          endValue: 100,
          tickInterval: 100,
          label: { visible: false }
        },
        value: this.data.chart.value.val
      });
    }
  }

  getTemplate() {
    const tmp = super.getInnerTemplate(templateBody);
    const temp = template(tmp);
    return temp;
  }

  getTmplOptions() {
    let defaultOptions = super.getTmplOptions();
    let loading = this.loading;
    let chart;

    if (this.data.codeKey && !isEmpty(this.data.codeKey)) {
      let dbData = new DashboardData(this.options.type, this.data.codeKey.data).getData();
      if (dbData.type) {
        this.data = assign({}, this.data, dbData.data);
      } else {
        console.warn('Dashboard type is not defined (id: ' + this.id + ')');
      }
    }
    let rows = this.data.rows || [];

    if (isEmpty(this.data.chart)) {
      chart = {};
    } else {
      chart = {
        label: this.data.chart.value.label,
        value: this.data.chart.value.val,
        title: this.data.chart.title
      };
    }

    let options = {
      chart,
      rows,
      loading
    };

    let tmplOptions = assign(defaultOptions, options);

    console.log(this.data);

    return tmplOptions;
  }

  drawOptions() {
    if (!this.loading) {
      this.drawProgress();
      this.drawChart();
    }
  }

}
