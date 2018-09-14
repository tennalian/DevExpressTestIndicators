import { includes, isEmpty, forEach, assign, template } from 'lodash';
// import { d3.select, d3.selectAll } from 'd3-selection';
// import { d3.interpolateNumber, d3.interpolate } from 'd3-d3.interpolate';
// import { transition, duration, tween, attrTween } from 'd3-transition';
// import { arc } from 'd3-shape';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';

'use strict';
export default class CircleDashboard extends Dashboard{
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

  getColor(extend) {
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

    if (extend) {
      color = blue;
    }

    return color;
  }

  drawRoundChart() {
    let self = this;
    let els = document.getElementById(this.id).querySelectorAll('.s-chart');
    forEach(els, function(el) {
      let label = el.dataset.label || null;
      let percent = +el.dataset.percent || 0;
      percent = (el.dataset.percent == 0) ? 0.001 : percent;

      let color = self.getColor();
      let defaultColor = self.getDefaultColor();
      let rgba = self.getRgba(defaultColor, '.6');

      if (percent > 0) {

        const tau = 2 * Math.PI;
        const w = 120;
        const h = 120;

        let rArc = d3.arc()
          .outerRadius(60)
          .innerRadius(53)
          .startAngle(0);

        let svg = d3.select(el).append('svg:svg')
          .attr('width', w)
          .attr('height', h);

        let arcs = svg
          .append('svg:g')
          .attr('class','arc')
          .attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')');

        arcs.append('svg:path')
          .datum({endAngle: tau})
          .style('fill', '#e5e5e5')
          .attr('d', rArc);

        let animate = arcs.append('svg:path')
          .datum({endAngle: 0})
          .style('fill', color)
          .attr('d', rArc);

        animate.transition()
          .duration(750)
          .attrTween('d', self.arcTween(percent / 100 * tau, rArc));

        let dx;
        let dxx;
        let dy = (label == null) ? '10px' : '15px';
        if ((percent >= 10) && (percent < 100)) {
          dx = '-30px';
          dxx = '10px';
        } else if (percent >= 100) {
          dx = '-30px';
          dxx = '20px';
        } else {
          dx = '-15px';
          dxx = '10px';
        }
        arcs.append('svg:text')
          .attr('dy', dy)
          .attr('dx', dx)
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 30px; font-weight: 600; fill: ' + defaultColor)
          .text(0)
          .transition()
          .duration(750)
          .tween('text', function() {
            let that = d3.select(this);
            let i = d3.interpolateNumber(that.text(), percent);
            return function(t) {
              that.text(Math.round(i(t)));
            };
          });

        arcs.append('svg:text')
        .attr('dy', dy)
        .attr('dx', dxx)
        .attr('text-ancor','middle')
        .text('%')
        .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 20px; fill: ' + defaultColor);

        if (label !== null) {
          arcs.append('svg:text')
           .attr('dy', '-' + dy)
           .attr('text-anchor', 'middle')
           .text(label)
           .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 12px; fill: ' + rgba);
        }
      }
    });
  }

  resizeWidth() {
    const el = document.getElementById(this.id);
    const width = el.offsetWidth;

    return width;
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

  getSvgNumberSize(svg, number, label, fonts, dy, integer) {
    let txt = number;
    if (!integer) {
      txt = Math.round(number) + 0.99;
    }
    let svgNumber = svg.append('svg:text')
      .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; font-size:' + fonts.fs + 'px;')
      .attr('dy', dy + 'px')
      .attr('class','n-text')
      .text(txt);

    let snw = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().width;
    let snh = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().height;
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
        .attr('dy', dy + 'px')
        .attr('class', 't-text')
        .text(' ' + label);

      let stw = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().width + 4;
      let sth = svg.node().getElementsByTagName('text')[0].getBoundingClientRect().height;
      sizeText = {
        width: stw,
        height: sth
      };
      svgText.remove();
    }

    return {
      numberWidth: sizeNumber.width,
      labelWidth: sizeText.width,
      height: sizeNumber.height
    };
  }

  drawNumbers() {
    let self = this;
    let numbers = document.getElementById(this.id).querySelectorAll('.s-circle-number');
    forEach(numbers, function(el, i) {
      let number = +el.dataset.number || 0;
      let color = el.dataset.color || self.getDefaultColor();
      let type = el.dataset.type || null;
      let label = el.dataset.label || null;

      let className = el.className.split(' ');
      if ((className.length > 1) && (className[1] == 'double')) {
        type = 'biggest',
        label = '';
      }

      let integer = (number - Math.floor(number) == 0);
      let rgba = self.getRgba(color, '.6');
      let rgbaPercent = self.getRgba(self.getDefaultColor(), '.4');

      if (type == 'middle') {
        color = rgbaPercent;
        rgba = rgbaPercent;
      }

      let fonts = self.getFontSize();

      let dy = (type != 'big') ? fonts.fs : fonts.fs / 11 * 10;
      let svg = d3.select(el).append('svg:svg');

      let size = self.getSvgNumberSize(svg, number, label, fonts, dy, integer);

      svg.attr('width', size.numberWidth + size.labelWidth)
        .attr('height', size.height);

      svg.append('svg:text')
        .attr('font-size', fonts.fs + 'px')
        .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; fill:' + color)
        .attr('class', 'fs-circle-text')
        .attr('dy', dy + 'px')
        .attr('dx', '0')
        .transition()
        .duration(750)
        .tween('text', function() {
          let that = d3.select(this);
          let i = d3.interpolateNumber(that.text(), number);
          return function(t) {
            if (integer) {
              that.text(Math.round(i(t)));
            } else {
              let str = i(t).toFixed(2).replace('.', ',');
              that.text(str);
            }
          };
        });

      if (label !== null) {
        svg.append('svg:text')
          .attr('font-size', fonts.ls + 'px')
          .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: 600; fill:' + rgba)
          .attr('dy', dy + 'px')
          .attr('dx', size.numberWidth + 4)
          .attr('class','ls-circle-text')
          .text(' ' + label);
      }

      d3.select(window).on('resize.' + self.id + '_' + i, function() {
        let element = document.getElementById(self.id);
        if (element && element !== null) {
          fonts = self.getFontSize();
          dy = (type != 'big') ? fonts.fs : fonts.fs / 11 * 10;
          size = self.getSvgNumberSize(svg, number, label, fonts, dy, integer);

          svg.selectAll('.fs-circle-text')
            .attr('font-size', fonts.fs + 'px')
            .attr('dy', dy + 'px');

          if (label !== null) {
            svg.selectAll('.ls-circle-text')
              .attr('font-size', fonts.ls + 'px')
              .attr('dy', dy + 'px')
              .attr('dx', size.numberWidth + 9);
          }

          svg.attr('width', size.numberWidth + size.labelWidth + 10)
            .attr('height', size.height);
        }
      });
    });
  }

  arcTween(newAngle, rArc) {
    return function(d) {
      let interp = d3.interpolate(d.endAngle, newAngle);
      return function(t) {
        d.endAngle = interp(t);
        return rArc(d);
      };
    };
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
    let color = this.getColor();

    if (isEmpty(this.data.chart)) {
      chart = {};
    } else {
      chart = {
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
    if (!this.loading) {
      this.drawNumbers();
      this.drawRoundChart();
    }
  }

}
