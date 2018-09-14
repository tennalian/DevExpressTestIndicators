import { forEach, includes, template, isEmpty, assign, trim, map, sortBy, isNaN } from 'lodash';
import { select } from 'd3-selection';
import { transition, duration, delay } from 'd3-transition';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';

'use strict';
export default class TableDashboard extends Dashboard{
  constructor(...args) {
    super(...args);
  }

  getSize() {
    const sizes = ['sm','md','lg','max'];
    let size;
    if (this.options.colSize && includes(sizes, this.options.colSize)) {
      size = this.options.colSize;
    } else {
      size = 'sm';
    }
    return size;
  }

  getRows() {
    const rows = ['xs','sm','md','lg','max'];
    let row;
    if (this.options.rowSize && includes(rows, this.options.rowSize)) {
      row = this.options.rowSize;
    } else {
      row = 'xs';
    }
    return row;
  }

  drawLines() {
    const self = this;
    const progress = document.getElementById(this.id).querySelectorAll('.s-progress');
    const round = document.getElementById(this.id).querySelectorAll('.s-round');

    const backColor = super.getRgba('#000000', '0.1');
    forEach(progress, function(el) {
      const percent = +el.dataset.percent || 0;
      const index = +el.dataset.index || 0;
      const min = +el.dataset.min || 0;
      const delay = index * 300;

      const color = (percent < min) ? '#da5e51' : '#54c089';
      const height = 4;

      let svg = select(el)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', height);

      svg.append('rect')
        .attr('class', 'p-back')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', '100%')
        .attr('height', height)
        .attr('fill', backColor);

      svg.append('rect')
       .attr('class', 'p-front')
       .attr('height', height)
       .attr('x', 0)
       .attr('y', 0)
       .attr('width', 0)
       .transition()
       .duration(2000)
       .delay(0)
       .attr('width', percent + '%')
       .attr('fill', color);
    });

    forEach(round, function(r) {
      const percent = +r.dataset.percent || 0;
      const min = +r.dataset.min || 0;
      const color = (percent < min) ? '#da5e51' : '#54c089';
      const width = 7;
      const height = 7;

      let svg = select(r)
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height);

      svg.append('circle')
        .attr('r', width / 2)
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('fill', color);
    });
  }

  getTemplate() {
    const tmp = super.getInnerTemplate(templateBody);
    const temp = template(tmp);
    return temp;
  }

  getTmplOptions() {
    let defaultOptions = super.getTmplOptions();
    let loading = this.loading;

    if (this.data.codeKey && !isEmpty(this.data.codeKey)) {
      let dbData = new DashboardData(this.options.type, this.data.codeKey.data).getData();
      if (dbData.type) {
        this.data = assign({}, this.data, dbData.data);
      } else {
        console.warn('Dashboard type is not equal CodeKey type (id: ' + this.id + ')');
      }
    }

    let rows = this.data.rows || [];
    let extend = this.data.extend || {val: false};
    let sorted = this.data.sorted || {};

    let titles = [];
    extend.values = [];

    if (!isEmpty(sorted)) {
      rows = this.sortRows(sorted.label);
    }

    forEach(rows, function(row) {
      forEach(row, function(item) {
        if (!includes(titles, item.title)) {
          titles.push(item.title);
        }
        if (extend.val) {
          if (item.title == extend.label) {
            extend.values.push(item.value.val);
          }
        }
      });
    });

    let options = {
      rows,
      titles,
      extend,
      sorted,
      loading
    };

    let tmplOptions = assign(defaultOptions, options);
    return tmplOptions;
  }

  drawOptions() {
    const self = this;
    const id = this.id;
    const options = this.options;
    const data = this.data;

    if (!this.loading) {
      this.drawLines();
      const table = document.getElementById(id).querySelector('.s-table');

      if (table) {
        table.addEventListener('click', this.sortTable.bind(this));
      }
    }
  }

  sortTable(e) {
    const id = this.id;
    const data = this.data;
    const table = document.getElementById(id).querySelector('.s-table');

    // span, svg, path
    if ((e.target.className !== 'target') && (e.target.parentNode.className !== 'target') && (e.target.parentNode.parentNode.className !== 'target') ) {
      return ;
    }

    let element = e.target;
    if (e.target.parentNode.className === 'target') {
      element = e.target.parentNode;
    }
    if (e.target.parentNode.parentNode.className === 'target') {
      element = e.target.parentNode.parentNode;
    }
    const label = element.dataset.label;

    table.removeEventListener('click', this.sortTable);
    document.getElementById(id).querySelector('.dashboard-item').remove();

    const type = (data.sorted && (data.sorted.type == 'up') && (data.sorted.label == label)) ? 'down' : 'up';

    this.data.sorted = {label, type};
    this.data.rows = this.sortRows(label);
    this.data.codeKey = {};

    super.draw();
  }

  sortRows(label) {
    const rows = this.data.rows || [];
    const sorted = this.data.sorted;
    let index = 0;

    let sortedRow = [];
    let newRows = [];

    map(rows, (row, i) => {
      forEach(row, item => {
        item.index = i
      });
      return row;
    });

    forEach(rows[0], function(item, i) {
      if (item.title == label) {
        index = i;
      }
    });

    forEach(rows, function(row) {
      sortedRow.push(row[index]);
    });

    sortedRow = sortBy(sortedRow, el => {
      return (isNaN(Number(String(el.value.val).split(" ").join("")))) ? el.value.val : +(String(el.value.val).split(" ").join(""));
    });

    forEach(sortedRow, function(item, i) {
      forEach(rows, function(row, j) {
        if ((item.value.val === row[index].value.val) && (item.index === row[index].index)) {
          newRows.push(row);
        }
      });
    });

    if (sorted.type == 'down') {
      newRows.reverse();
    }

    return newRows;
  }

}
