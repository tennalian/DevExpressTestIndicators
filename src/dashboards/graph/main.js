//chart & histogram
import { includes, isUndefined, forEach, size, isEmpty, first, map, template, assign } from 'lodash';
// import { d3.select, d3.selectAll, d3.selection } from 'd3-d3.selection';
// import { transition, duration, ease } from 'd3-transition';
// import { d3.easeLinear } from 'd3-ease';
// import { d3.axisBottom, d3.axisLeft } from 'd3-axis';
// import { d3.scaleLinear, d3.scalePoint } from 'd3-scale';
// import { line } from 'd3-shape';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';

'use strict';
export default class ChartDashboard extends Dashboard {
  constructor(...args) {
    super(...args);
  }

  getSize() {
    const sizes = ['xs','sm','md','lg','max'];
    let size;
    if (this.options.colSize && includes(sizes, this.options.colSize)) {
      size = (this.options.colSize == 'xs') ? 'sm' : this.options.colSize;
    } else {
      size = 'sm';
    }
    return size;
  }

  resizeWidth() {
    const margin = 16;
    const offset = 8;
    const el = document.getElementById(this.id);
    const width = el.offsetWidth - 2 * margin - offset;

    return width;
  }

  isTouchDevice() {
    return 'ontouchstart' in window ||
        navigator.maxTouchPoints;
  };

  getTrendlineStyles(i) {
    return {
      stroke:  '#da5e51',
      strokeWidth: 1,
      strokeDasharray: (i && i > 0) ? '2,2' : ''
    };
  }

  getColors() {
    return this.data.colors || ['#ffaa00','#0091d0','#6dd000','#d00000','#d000b7','#00c7d0'];
  }

  getParams() {
    let colors =  this.getColors();
    let width = this.resizeWidth();
    let height = 350;
    let margin = 24;
    let offset = 8;
    let duration = 800;

    return {
      colors,
      width,
      height,
      margin,
      offset,
      duration
    };
  }

  drawLegend() {
    const self = this;
    const legend = document.getElementById(this.id).querySelector('.legend');
    if (legend) {
      const data = self.data.rows || null;
      const colors =  self.getColors();
      const hiddenTrend = self.data.hiddenTrend || false;

      if (size(data) > 1) {
        legend.classList.add('double-legend');
      }

      forEach(data, (row, i) => {
        let graphColor = (isUndefined(colors[i])) ? colors[0] : colors[i];
        let title = d3.select(legend).append('svg:svg')
          .attr('class', 'list-item');

        title.append('svg:circle')
          .attr('r', 5)
          .attr('cx', 5)
          .attr('cy', 5)
          .attr('transform', 'translate(0,3)')
          .attr('fill', graphColor);

        title.append('svg:text')
          .attr('style', 'font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 12px;')
          .attr('dy', 12)
          .attr('dx', 18)
          .text(t => {
            return (size(row.title) > 15) ? row.title.substring(0, 13) + '...' : row.title;
          })
          .append("svg:title")
            .text(row.title);

        if (!hiddenTrend && size(data) > 1) {
          const trendStyles = self.getTrendlineStyles(i);
          title.append("line")
            .attr("x1", 0)
            .attr("x2", 10)
            .attr("y1", 8)
            .attr("y2", 8)
            .attr('stroke-width', trendStyles.strokeWidth)
            .style("stroke-dasharray",trendStyles.strokeDasharray)
            .attr('stroke', trendStyles.stroke)
            .attr('transform', 'translate(0, 14)');

          title.append('svg:text')
            .attr('style', 'font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 12px;')
            .attr('dy', 12)
            .attr('dx', 18)
            .text('Тренд')
            .attr('transform', 'translate(0, 14)');
        }

        let stw = title.node().getElementsByTagName('text')[0].getBoundingClientRect().width + 24;
        let sth0 = title.node().getElementsByTagName('text')[0].getBoundingClientRect().height;
        let sth1 = (size(data) > 1) ? title.node().getElementsByTagName('text')[1].getBoundingClientRect().height : 0;


        title
          .attr('width', stw)
          .attr('height', sth0 + sth1 + 2);
      });

      if (!hiddenTrend && size(data) === 1) {
        forEach(data, (row, i) => {
          const trendStyles = self.getTrendlineStyles(i);

          let tlTitle = d3.select(legend).append('svg:svg')
            .attr('class', 'list-item trend-item');

          tlTitle.append("line")
            .attr("x1", 0)
            .attr("x2", 10)
            .attr("y1", 8)
            .attr("y2", 8)
            .attr('stroke-width', trendStyles.strokeWidth)
            .style("stroke-dasharray",trendStyles.strokeDasharray)
            .attr('stroke', trendStyles.stroke);

          tlTitle.append('svg:text')
            .attr('style', 'font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 12px;')
            .attr('dy', 12)
            .attr('dx', 20)
            .text('Тренд');

          let tlw = tlTitle.node().getElementsByTagName('text')[0].getBoundingClientRect().width + 24;
          let tlh = tlTitle.node().getElementsByTagName('text')[0].getBoundingClientRect().height;

          tlTitle
            .attr('width', tlw)
            .attr('height', tlh);
        });
      }
    }
  }

  drawChart() {
    const self = this;
    const el = document.getElementById(this.id).querySelector('.s-chart');

    if (el) {
      const data = self.data.rows || null;
      const xLabel = el.dataset.xlabel || null;
      const yLabel = el.dataset.ylabel || null;

      let params = self.getParams();

      let yAxisLength = params.height - 3 * params.margin;
      let xAxisLength = params.width - 2 * params.margin;

      let labels = [];
      let maxValue = 0;
      let minValue = 5;

      let t = d3.transition()
            .duration(params.duration)
            .ease(d3.easeLinear);

      d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
              this.parentNode.insertBefore(this, firstChild);
            }
          });
      };

      if ((data !== null) && !isEmpty(data)) {
        let svg = d3.select(el).append('svg:svg')
          .attr('class', 'axis')
          .attr('width', params.width)
          .attr('height', params.height);

        forEach(data, function(row) {
          forEach(row.values, function(d) {
            if (!includes(labels, d.label)) {
              labels.push(d.label);
            }
            maxValue = (maxValue < d.val) ? d.val : maxValue;
            minValue = (minValue > d.val) ? d.val : minValue;
          });
        });

        if (maxValue % 5 > 0) {
          maxValue = maxValue + (5 - (maxValue % 5));
        }

        if (minValue % 5 > 0) {
          minValue = minValue - (minValue % 5);
        }

        let x = d3.scalePoint()
            .domain(labels)
            .range([0, xAxisLength]);

        let y = d3.scaleLinear()
          .domain([minValue,maxValue])
          .range([yAxisLength,0]);


        let xAxis = d3.axisBottom(x)
          .ticks(15)
          .tickSizeInner(-yAxisLength);

        let yAxis = d3.axisLeft(y)
          .ticks(Math.floor(maxValue / 5))
          .tickSizeInner(-xAxisLength - 2 * params.margin);

        svg.append('g')
          .attr('class', 'x-axis')
          .attr('transform',
            'translate(' + (params.margin + params.offset + 5) + ',' + (params.height - params.margin) + ')')
          .call(xAxis);

        svg.append('g')
          .attr('class', 'y-axis')
          .attr('transform',
                  'translate(' + params.margin + ',' +  2 * params.margin + ')')
          .call(yAxis);

        svg.selectAll('.x-axis text')
          .attr('dy', 12)
          .text(t => t.substring(0, 3))
          .append("svg:title")
            .text(t => t);

        svg.selectAll('.y-axis text')
          .attr('dx', -3);

        //labels
        if (yLabel !== null) {
          svg.append('svg:text')
          .attr('class', 'y-axis-label')
          .attr('dx', '0')
          .attr('dy', '10')
          .text(yLabel);
        }

        if (xLabel !== null) {
          svg.append('svg:text')
          .attr('class', 'x-axis-label')
          .attr('dx', params.width / 2)
          .attr('dy', params.height - 1)
          .attr('text-ancor','middle')
          .text(xLabel);
        }


        self.drawGraphs(data, svg, x, y);

        //trendline
        let hiddenTrend = !!self.data.hiddenTrend || false;

        if (!hiddenTrend) {
          forEach(data, (line, i) => {
            let trendStyles = self.getTrendlineStyles(i);
            let lr = self.getLinearRegression(line);

            svg.append('svg:line')
              .attr('x1', x(labels[0]) + params.offset)
              .attr('y1', y(lr.intercept))
              .attr('x2', x(labels[labels.length - 1]) + params.offset)
              .attr('y2', y((labels.length - 1) * lr.slope + lr.intercept))
              .attr('class', `trendline-${i} sv-hide`)
              .attr('stroke', trendStyles.stroke)
              .attr('stroke-width', trendStyles.strokeWidth)
              .attr('stroke-dasharray', trendStyles.strokeDasharray)
              .attr('fill', 'transparent')
              .attr('transform', 'translate(' + params.margin + ',' + (params.margin - 5) + ')');

            setTimeout(function() {
              svg.selectAll(`.trendline-${i}`)
                .attr('class', `trendline-${i} sv-visible`);
            }, params.duration);
          });
        }

        //resize
        d3.select(window).on('resize.' + self.id, function() {
          let element = document.getElementById(self.id);
          if (element && element !== null) {
            let w = self.resizeWidth();

            svg.attr('width', w);

            xAxisLength = w - 2 * params.margin;
            x.range([0, xAxisLength]);

            svg.selectAll('.x-axis')
                .remove();

            svg.selectAll('.y-axis')
                .remove();

            let xAxis = d3.axisBottom(x)
              .ticks(15)
              .tickSizeInner(-yAxisLength);

            let yAxis = d3.axisLeft(y)
              .ticks(Math.floor(maxValue / 5))
              .tickSizeInner(-xAxisLength - 2 * params.margin);

            svg.append('g')
              .attr('class', 'x-axis')
              .attr('transform',
                'translate(' + (params.margin + params.offset) + ',' + (params.height - params.margin) + ')')
              .call(xAxis);

            svg.append('g')
              .attr('class', 'y-axis')
              .attr('transform',
                      'translate(' + params.margin + ',' + 2 * params.margin + ')')
              .call(yAxis);

            svg.selectAll('.x-axis text')
              .attr('dy', 12)
              .text(t => t.substring(0, 3));

            svg.selectAll('.y-axis text')
              .attr('dx', -3);

            self.resizeGraph(data, svg, x, y);

            svg.selectAll('.y-axis').moveToBack();

            if (!hiddenTrend) {
              forEach(data, (line, i) => {
                let lr = self.getLinearRegression(line);
                svg.selectAll(`.trendline-${i}`)
                  .attr('x1', x(labels[0]) + params.offset)
                  .attr('y1', y(lr.intercept))
                  .attr('x2', x(labels[labels.length - 1]) + params.offset)
                  .attr('y2', y((labels.length - 1) * lr.slope + lr.intercept))
              });
            }
          }

        });
      }
    }

  }

  drawGraphs(data, svg, x, y) { }

  resizeGraph(data, svg, x, y) { }

  getLinearRegression(data) {
    const row = data;
    let xData = [];
    let xLabels = [];
    let yData = [];

    forEach(row.values, function(item) {
      yData.push(item.val);
      xLabels.push(item.label);
    });

    xData = map(xLabels,function(item, i) {
      return i + 1;
    });

    let lr = this.countLinearRegression(yData, xData);
    return lr;
  }

  countLinearRegression(y, x) {
    var lr = {};
    var n = y.length;
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    for (var i = 0; i < y.length; i++) {

      sum_x += x[i];
      sum_y += y[i];
      sum_xy += (x[i] * y[i]);
      sum_xx += (x[i] * x[i]);
      sum_yy += (y[i] * y[i]);
    }

    lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    lr['intercept'] = (sum_y - lr.slope * sum_x) / n;
    lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)),2);

    return lr;
  }

  getTemplate() {
    const tmp = super.getInnerTemplate(templateBody);
    const temp = template(tmp);
    return temp;
  }

  getTmplOptions() {
    let defaultOptions = super.getTmplOptions();

    if (this.data.codeKey && !isEmpty(this.data.codeKey)) {
      let dbData = new DashboardData(this.options.type, this.data.codeKey.data).getData();
      if (dbData.type) {
        this.data = assign({}, this.data, dbData.data);
      } else {
        console.warn('Dashboard type is not equal CodeKey type (id: ' + this.id + ')');
      }
    }

    let rows = this.data.rows || [];
    let xLabel = this.data.xLabel || null;
    let yLabel = this.data.yLabel || null;
    let loading = this.loading;
    let options = {
      rows,
      xLabel,
      yLabel,
      loading
    };

    let tmplOptions = assign(defaultOptions, options);
    return tmplOptions;
  }

  drawOptions() {
    if (!this.loading) {
      this.drawChart();
      this.drawLegend();
    }
  }
}
