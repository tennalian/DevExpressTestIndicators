'use strict';
import { template } from 'lodash';
import { innerTemplate } from './tmp';

export default class Dashboard {
  constructor(id, options, data, loading) {
    this.id = id;
    this.options = options;
    this.data = data;
    this.loading = loading;
  }

  getSize() {
    return '';
  }

  getRows() {
    return '';
  }

  getClass() {
    const size = this.getSize();
    const rows = this.getRows();

    if (rows.length > 0) {
      return 'sv-col-' + size + ' sv-row-' + rows + ' sv-' + this.options.type;
    } else {
      return 'sv-col-' + size + ' sv-' + this.options.type;
    }
  }

  getInnerTemplate(templateBody) {
    templateBody = templateBody || '';
    let tmp = innerTemplate(templateBody);
    return tmp;
  }

  getTemplate() {
    const tmp = this.getInnerTemplate();
    const temp = template(tmp);
    return temp;
  }

  getDefaultColor() {
    return '#242e36';
  }

  getColor(extend) {
    const blue = '#0091d0';
    let color;

    if (this.data.color) {
      color = this.data.color;
    } else {
      color = blue;
    }

    return color;
  }

  getDafaultTmplOptions() {
    const color = this.getColor();
    return {
      color,
      title: this.data.title,
      webReport: this.data.webReportsLink || '',
      wiki: this.data.wiki || '',
      period: this.data.period || null,
      extendClass: ''
    };
  }

  drawOptions() {}

  getTmplOptions() {
    const defaultOptions = this.getDafaultTmplOptions();
    return defaultOptions;
  }

  getId() {
    return this.id;
  }

  draw() {
    const tmpl = this.getTemplate();
    const tmplOptions = this.getTmplOptions();
    const dashboard = tmpl(tmplOptions);
    const el = document.getElementById(this.id);

    if (el) {
      el.innerHTML = dashboard;
      el.className = 'sv-dashboard ' + this.getClass();

      this.drawOptions();
    }
  }
}

