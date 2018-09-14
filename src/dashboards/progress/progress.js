import { forEach, includes, template, isEmpty, assign, size } from 'lodash';
import { select } from 'd3-selection';
import { interpolateNumber } from 'd3-interpolate';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';
const column = 216;

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

  resizeWidth() {
    const el = document.getElementById(this.id);
    const width = el.offsetWidth;

    return width;
  }

  checkVersion(name) {
    var ua = navigator.userAgent;
    var version;
    if (ua.indexOf(name) > 0) {
      version = ua.split(name)[1].replace('/', '').split('.')[0];
    }
    return version;
  }

  drawProgress() {
    const el = document.getElementById(this.id).querySelector('.sv-progress-line');
    if (el) {
      const percent = el.dataset.value || 0;
      const bgColor = this.data.bgColor || null;
      let color = el.dataset.color || '#0091d0';
      let backColor = this.getRgba('#000000', '0.1');
      if (!isEmpty(bgColor) && !!bgColor.value) {
        color = (bgColor.text) ? bgColor.text : '#ffffff';
        backColor = this.getRgba(color, '0.1');
      }
      const height = 6;

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
       .attr('width', percent + '%')
       .attr('fill', color);
    }
  }

  getFontSize() {
    let width = this.resizeWidth();
    let rows = this.data.rows;
    let fs;
    let ls;
    let dy;
    let ts = 14;
    if ((rows.length > 1) && (width <= 820)) {
      fs = 24;
      ls = 18;
      dy = 30;
    } else if ((rows.length > 1) && (width >= 820)) {
      fs = 40;
      ls = 28;
      dy = 45;
    } else {
      fs = 36;
      ls = 20;
      dy = 45;
    }
    return {
      fs,
      ls,
      ts,
      dy
    };
  }

  getSvgNumberSize(svg, number, label, fonts, integer) {
    let ie = this.checkVersion('IE');
    let edge = this.checkVersion('Edge');
    let txt = number;
    if (!integer) {
      txt = Math.round(number) + 0.99;
    }

    let svgNumber = svg.append('svg:text')
      .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; font-size:' + fonts.fs + 'px;')
      .attr('dy', fonts.dy + 'px')
      .attr('class','n-text')
      .text(txt);

    let snw = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().width;
    let snh = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().height;

    if (ie || edge) {
      snh = snh / 3;
    }

    let sizeNumber = {
      width: snw,
      height: snh
    };
    svgNumber.remove();

    let sizeText = {
      width: 0
    };

    if (label !== null) {
      let svgText = svg.append('svg:text')
        .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; font-size:' + fonts.ls + 'px;')
        .attr('dy', (fonts.dy - 1) + 'px')
        .attr('class', 't-text')
        .text(' ' + label);

      let stw = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().width + 4;
      let sth = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().height;

      if (ie || edge) {
        sth = sth / 3;
        stw = stw + 8;
      }
      sizeText = {
        width: stw,
        height: sth
      };
      svgText.remove();
    }

    return {
      numberWidth: sizeNumber.width,
      labelWidth: sizeText.width,
      heigth: sizeNumber.height
    };
  }

  drawNumbers() {
    let self = this;
    let numbers = document.getElementById(this.id).querySelectorAll('.s-progress-number');
    if (numbers) {
      let bgColor = this.data.bgColor || null;
      forEach(numbers, (el, i) => {
          let number = +el.dataset.number || 0;
          let color = el.dataset.color || self.getDefaultColor();
          if (!isEmpty(bgColor) && !!bgColor.value) {
            color = (bgColor.text) ? bgColor.text : '#ffffff';
          }
          let label = el.dataset.label || null;

          const f = x => String(x).includes('.') ? (String(x).split('.')[1]).length : 0;
          const integer = f(number) === 0;

          let rgba = self.getRgba(color, '.6');
          let fonts = self.getFontSize();
          let svg = select(el).append('svg:svg')
          let size = self.getSvgNumberSize(svg, number, label, fonts, integer);
          svg
            .attr('height', size.heigth)
            .attr('width', size.labelWidth + size.numberWidth + 4);

          svg.append('svg:text')
            .attr('font-size', fonts.fs + 'px')
            .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; fill:' + color)
            .attr('class','fs-progress-text')
            .attr('dy', fonts.fs)
            .attr('dx', '0')
            .transition()
            .duration(750)
            .tween('text', function() {
              let that = select(this);
              let i = interpolateNumber(that.text(), number);
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

          if (label !== null) {
            svg.append('svg:text')
              .attr('font-size', fonts.ls + 'px')
              .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; fill:' + rgba)
              .attr('class','ls-progress-text')
              .attr('dy', fonts.fs - 2)
              .attr('dx', size.numberWidth + 4)
              .text(' ' + label);
          }


          d3.select(window).on(`resize.${self.id}_${i}`, () => {
            fonts = self.getFontSize();
            size = self.getSvgNumberSize(svg, number, label, fonts, integer);

            svg
              .attr('height', size.heigth)
              .attr('width', size.numberWidth + size.labelWidth + 4)

            svg.selectAll('.fs-progress-text')
              .attr('font-size', fonts.fs + 'px')
              .attr('dy', fonts.fs - 2)
              .attr('dx', '0')

            svg.selectAll('.ls-progress-text')
              .attr('font-size', fonts.ls + 'px')
              .attr('dy', fonts.fs - 4)
              .attr('dx', size.numberWidth + 4)
          });

        });
    }
  }

  getChartNumberSize(number) {
    let fs;
    let dy;
    let ls;
    let ts = 16;
    let dx = 16;

    if (number < 100) {
      fs = 72;
      dy = 72;
      ls = 48;
    } else {
      fs = 60;
      dy = 72;
      ls = 35;
    }

    return {fs, dy, ts, ls, dx};
  }

  drawChartNumbers() {
    let el = document.getElementById(this.id).querySelector('.s-chart');
    const padding = 7;
    if (el) {
      let bgColor = this.data.bgColor || null;
      let number = Math.round(+el.dataset.percent) || 0;
      let size = this.getChartNumberSize(number);
      let color = this.getDefaultColor();
      if (!isEmpty(bgColor) && !!bgColor.value) {
        color = (bgColor.text) ? bgColor.text : '#ffffff';
      }
      let label = el.dataset.label || null;
      let title = el.dataset.title || null;
      let rgba = this.getRgba(color, '.6');

      let svg = select(el).append('svg:svg');
      let parent = svg.node().parentNode;

      let height = el.getBoundingClientRect().height - padding;

      let sizeText = {
        width: 0
      };

      if (label !== null) {
        let svgText = svg.append('svg:text')
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size:' + size.ls + 'px;')
          .attr('dy', size.dy + 'px')
          .attr('class', 't-text')
          .text(' ' + label);

        let stw = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().width + 4 + size.dx;
        sizeText = {
          width: stw
        };
        svgText.remove();
      }

      let svgNumber = svg.append('svg:text')
        .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; font-size:' + size.fs + 'px;')
        .attr('dy', size.dy + 'px')
        .attr('class','n-text')
        .text(number);

      let snw = svg.node().querySelectorAll('.n-text')[0].getBoundingClientRect().width;
      let sizeNumber = {
        width: snw
      };
      svgNumber.remove();

      svg.attr('height', height + padding);

      select(parent).attr('style', 'height: ' + (height + padding) + 'px;');

      svg.append('svg:text')
        .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; font-size:' + size.fs + 'px; fill:' + color)
        .attr('dy', height - 1 + 'px')
        .attr('dx', size.dx)
        .transition()
        .duration(750)
        .tween('text', function() {
          let that = select(this);
          let i = interpolateNumber(that.text(), number);
          return function(t) {
            that.text(Math.round(i(t)));
          };
        });

      if (label !== null) {
        svg.append('svg:text')
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size:' + size.ls + 'px; fill:' + rgba)
          .attr('dy', height + 'px')
          .attr('dx', sizeNumber.width + size.dx + 10)
          .text(' ' + label);
      }

      if (title !== null) {
        svg.append('svg:text')
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size:' + size.ts + 'px; fill:' + rgba)
          .attr('dy', height - size.fs + 'px')
          .attr('dx', size.dx)
          .text(title);
      }
    }
  }

  arcTween(newAngle, arc) {
    return function(d) {
      let interpolate = interpolate(d.endAngle, newAngle);
      return function(t) {
        d.endAngle = interpolate(t);
        return arc(d);
      };
    };
  }

  getTemplate() {
    const tmp = super.getInnerTemplate(templateBody);
    const temp = template(tmp);
    return temp;
  }

  getColor() {
    const defaultColor = this.data.color || null;
    const colorConfig = this.data.colorConfig || null;
    const blue = '#0091d0';
    let color;

    if (!isEmpty(defaultColor)) {
      return defaultColor;
    }

    if (isEmpty(colorConfig)) {
      color = blue;
    } else {
      color = (+colorConfig.value < +colorConfig.min) ? '#da5e51' : '#54c089';
    }
    return color;
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
    let color = this.getColor();

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
      color,
      loading
    };

    let tmplOptions = assign(defaultOptions, options);

    return tmplOptions;
  }

  drawOptions() {
    let self = this;
    let bgColor = this.data.bgColor || null;

    if (!isEmpty(bgColor) && !!bgColor.value) {
      let text = bgColor.text || '#ffffff';
      let block = document.getElementById(this.id).querySelector('.dashboard-item');
      let p = block.querySelectorAll('p');
      let h2 = block.querySelector('h2');
      let title = block.querySelector('.item-title');
      let btn = block.querySelectorAll('.sv-btn');

      forEach(btn, function(e) {
        let svg = e.querySelector('svg').querySelector('path');
        svg.style.fill = self.getRgba(text, '.6');
      });
      forEach(p, function(e) {
        e.style.color = text;
      });
      h2.style.color = text;
      block.style.background = bgColor.value;
      title.style.borderBottom = '1px solid ' + this.getRgba(text, '.1');
      block.className = 'dashboard-item dashboard-color';
    }

    if (!this.loading) {
      this.drawNumbers();
      this.drawChartNumbers();
      this.drawProgress();
    }
  }

}
