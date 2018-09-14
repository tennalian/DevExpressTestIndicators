import { forEach, includes, template, isEmpty, assign } from 'lodash';
// import { d3.select, d3.selectAll } from 'd3-selection';
// import { d3.interpolateNumber, d3.interpolate } from 'd3-d3.interpolate';
// import { transition, duration, tween } from 'd3-transition';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';

'use strict';
export default class NumberDashboard extends Dashboard{
  constructor(...args) {
    super(...args);
  }

  getSize() {
    const sizes = ['xs','sm','md','lg','max'];
    let size;
    if (this.options.colSize && includes(sizes, this.options.colSize)) {
      size = this.options.colSize;
    } else {
      size = 'xs';
    }
    return size;
  }

  drawNumbers() {
    const self = this;
    const numbers = document.getElementById(this.id).querySelectorAll('.s-number');
    const block = document.getElementById(this.id).querySelector('.item-info');
    const rows = this.data.rows;
    const f = x => String(x).includes('.') ? (String(x).split('.')[1]).length : 0;
    forEach(numbers, function(el, i) {
      const imgSize = 48;

      let number = +el.dataset.number || 0;
      let label = el.dataset.label || null;
      let img = el.dataset.img || null;

      let more = null;
      let moreLabel = null;
      let moreFs;

      let color = el.dataset.color || self.getDefaultColor();
      let rgba = self.getRgba(color, '.6');

      if (rows.length > 1) {
        more = rows[1].val;
        moreLabel = rows[1].label;
        moreFs = 24;
      }

      let width = block.getBoundingClientRect().width;
      let height = block.getBoundingClientRect().height;

      let svg = block.querySelector('svg');
      if (svg == null) {
        svg = d3.select(el).append('svg:svg')
          .attr('width', width)
          .attr('height', height);
      }

      let fs = 72;
      let ls = 16;
      let dy = height - 16;
      let dx = 16;

      svg.append('svg:text')
        .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; font-size:' + fs + 'px; fill:' + color)
        .attr('dy', dy + 'px')
        .attr('dx', dx)
        .transition()
        .duration(750)
        .tween('text', function() {
          let that = d3.select(this);
          let i = d3.interpolateNumber(that.text(), number);
          return function(t) {
            if (f(number) === 0) {
              that.text(Math.round(i(t)));
            } else if (f(number) > 1) {
              let str = i(t).toFixed(2).replace('.', ',');
              that.text(str);
            } else {
              let str = i(t).toFixed(1).replace('.', ',');
              that.text(str);
            }
          };
        });

      if ((label !== null) && (more == null)) {
        svg.append('svg:text')
         .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size:' + ls + 'px; fill:' + rgba)
         .attr('dy', height - fs * 0.9 - dx + 'px')
         .attr('dx', dx)
         .text(label);
      }

      if (more !== null) {
        svg.append('svg:text')
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size:' + moreFs + 'px; fill:' + rgba)
          .attr('dy', height - fs * 0.9 - dx + 'px')
          .attr('dx', dx)
          .transition()
          .duration(750)
          .tween('text', function() {
            let that = d3.select(this);
            let i = d3.interpolateNumber(that.text(), more);
            return function(t) {
              that.text(Math.round(i(t)));
            };
          });

        if (moreLabel !== null) {
          let tmp = svg.append('svg:text')
          .attr('class', 'sv-number-percent')
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size:' + moreFs + 'px; fill:' + rgba)
          .text(more);
          let stw = svg.node().querySelector('.sv-number-percent').getBoundingClientRect().width;
          tmp.remove();
          svg.append('svg:text')
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size:' + moreFs + 'px; fill:' + rgba)
          .attr('dy', height - fs * 0.9 - dx + 'px')
          .attr('dx', dx + stw)
          .text(moreLabel);
        }
      }

      if (img !== null) {
        svg.append('svg:image')
          .attr('xlink:href', img)
          .attr('x', width - imgSize - dx)
          .attr('y', height - imgSize - dx)
          .attr('width', imgSize)
          .attr('height', imgSize)
          .attr('class', 'sv-image');
      }

      d3.select(window).on('resize.' + self.id + '_' + i, function() {
        let element = document.getElementById(self.id);
        if (element && element !== null) {
          width = block.getBoundingClientRect().width;
          if (img !== null) {
            svg.selectAll('.sv-image')
              .attr('x', width - imgSize - dx);
          }
        }
      });
    });
  }

  getTemplate() {
    const tmp = super.getInnerTemplate(templateBody);
    const temp = template(tmp);
    return temp;
  }

  getTmplOptions() {
    let defaultOptions = super.getTmplOptions();
    let color = this.data.color || null;
    let img = this.data.img || null;
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

    let options = {
      rows,
      color,
      img,
      loading
    };

    let tmplOptions = assign(defaultOptions, options);
    return tmplOptions;
  }

  drawOptions() {
    if (!this.loading) {
      this.drawNumbers();
    }
  }
}
