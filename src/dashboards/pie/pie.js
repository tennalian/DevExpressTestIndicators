import { forEach, includes, isUndefined, template, isEmpty, assign, size } from 'lodash';
// import { d3.select, d3.selectAll, = d3.arc, d3.event } from 'd3-= d3.arc';
// import { d3.interpolate } from 'd3-d3.interpolate';
// import { arc, pie } from 'd3-shape';
// import { transition, duration, delay } from 'd3-transition';
// import { d3.axisBottom, d3.axisLeft } from 'd3-axis';
// import { d3.scaleBand, d3.scaleLinear } from 'd3-scale';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';

'use strict';
export default class PieDashboard extends Dashboard{
  constructor(...args) {
    super(...args);
  }

  getSize() {
    const sizes = ['lg','max'];
    let size;
    if (this.options.colSize && includes(sizes, this.options.colSize)) {
      size = this.options.colSize;
    } else {
      size = 'lg';
    }
    return size;
  }

  getColors() {
    const pie = ['#c17b5f','#7dbc56','#beb2d1','#f8b64a','#66c4d1'];
    const his = ['#fbba00','#7dbc56','#00a0c6'];
    return {pie, his};
  }

  getData() {
    const defaultData = this.data.rows;
    let data = [];

    forEach(defaultData, function(item, i) {
      let path = {};
      let ext = [];
      if (i < 5) {
        path.val = item.val;
        path.label = item.label;
        forEach(item.extend, function(e, j) {
          if (j < 3) {
            ext.push({val: e.val, label: e.label, popup: e.popup || null});
          }
        });
        path.extend = ext;
      }
      data.push(path);
    });
    data.sort(function(a, b) {
      if (a.val > b.val) {
        return -1;
      }
      if (a.val < b.val) {
        return 1;
      }
      return 0;
    });
    return data;
  }

  getParams() {
    const width = 270;
    const height = 270;
    const margin = 24;
    const offset = 8;
    const duration = 800;

    return {width, height, margin, offset, duration};
  }

  drawPie() {
    const self = this;
    const data = this.getData();
    const width = 270;
    const height = 270;
    const duration = 200;
    const radius = Math.min(width, height) / 2 - 5;
    const colors = this.getColors().pie;

    const el = document.getElementById(this.id).querySelector('.sv-pie-chart');

    if (el) {
      d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
              this.parentNode.insertBefore(this, firstChild);
            }
          });
      };

      let svg = d3.select(el).append('svg:svg')
        .attr('class', 'pie-' + self.id)
        .attr('width', width)
        .attr('height',height)
        .append('g')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

      let arcBefore = d3.arc()
          .outerRadius(radius * .4)
          .innerRadius(0);
      let arcNew = d3.arc()
          .outerRadius(radius)
          .innerRadius(0);

      let p = d3.pie()
          .sort(null)
          .value(function(d) { return d.val; });

      let g = svg.selectAll('.arc')
        .data(p(data))
        .enter().append('g')
        .attr('class', 'arc')
        .on('click', function(d, i) {
          let path = d3.select(this).select('path');
          if (path.attr('class') !== 'clicked') {
            svg.selectAll('.arc').selectAll('path')
              .attr('class', null)
              .transition()
              .duration(duration)
              .attr('transform', 'translate(0,0)');

            path.attr('class', 'clicked')
              .transition()
              .duration(duration)
              .attr('transform', explode);

            self.updateHis(d.data.extend, i);
          } else {
            path.attr('class', null)
              .transition()
              .duration(duration)
              .attr('transform', 'translate(0,0)');
          }
        });

      g.append('path')
        .attr('fill', function(d, i) {
          return colors[i];
        })
        .attr('d', arcBefore);

      d3.selectAll('.arc').selectAll('path')
          .transition()
          .duration(750)
          .delay(10)
          .attr('d', arcNew);

      svg.select('.arc').selectAll('path')
        .attr('transform', explode);

      this.drawHisCore(data[0].extend, 0);

      let tweenPie = function(b) {
        b.innerRadius = 0;
        let i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
        return function(t) { return arcNew(i(t)); };
      };

      function explode(x, first) {
        const offset = 5;
        let angle = (x.startAngle + x.endAngle) / 2;
        let xOff = Math.sin(angle) * offset;
        let yOff = -Math.cos(angle) * offset;
        return 'translate(' + xOff + ',' + yOff + ')';
      }
    }
  }

  drawHisCore(data, i) {
    const self = this;
    const el = document.getElementById(this.id).querySelector('.sv-pie-histogram');
    const params = this.getParams();

    let yAxisLength = params.height - params.margin;
    let xAxisLength = params.width - params.margin;

    let labels = [];
    let maxValue = 0;
    let minValue = 5;

    let svg = d3.select(el).append('svg:svg')
      .attr('class', 'his-' + self.id)
      .attr('width', params.width)
      .attr('height', params.height);

    forEach(data, function(d) {
      if (!includes(labels, d.label)) {
        labels.push(d.label);
      }
      maxValue = (maxValue < d.val) ? d.val : maxValue;
      minValue = (minValue > d.val) ? d.val : minValue;
    });


    if (maxValue % 5 > 0) {
      maxValue = maxValue + (5 - (maxValue % 5));
    }

    if (minValue % 5 > 0) {
      minValue = minValue - (minValue % 5);
    }

    let x = d3.scaleBand()
        .domain(labels)
        .range([0, xAxisLength]);

    let y = d3.scaleLinear()
      .domain([minValue,maxValue])
      .range([yAxisLength,0]);

    let xAxis = d3.axisBottom(x)
      .ticks(15);

    let yAxis = d3.axisLeft(y)
      .ticks(Math.floor(maxValue / 5))
      .tickSizeInner(-xAxisLength);

    svg.append('g')
         .attr('class', 'x-axis')
         .attr('transform',
           'translate(' + (params.margin + params.offset - 10) + ',' + (params.height - params.margin) + ')')
         .call(xAxis);

    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform',
              'translate(' + params.margin + ',' + 5 + ')')
      .call(yAxis);

    svg.selectAll('.x-axis text')
      .attr('dy', 12)

    svg.selectAll('.y-axis text')
      .attr('dx', -3);

    self.drawHis(data, svg, x, y, yAxisLength, i);
  }

  drawHis(data, svg, x, y, yAxisLength, i) {
    const colors = this.getColors();
    const params = this.getParams();
    const index = i;

    let bar = svg.selectAll('.rect')
      .data(data)
      .enter().append('rect')
        .attr('x', function(d) {return x(d.label) + params.offset + params.margin; })
        .attr('y',  params.height - params.margin + 5)
        .attr('height', 0)
        .attr('width', x.bandwidth() - 20)
        .attr('fill', function(d, i) {
          if (isUndefined(index)) {
            return colors.his[i];
          } else {
            return colors.pie[index];
          }
        })
        .attr('class', 'sv-rect')
        .on('mouseleave', function(d) {
          d3.selectAll(".sv-chart-tip").remove();
        })
        .on('mouseenter', function(d) {
          let val = (d.popup !== null) ? d.popup : d.val;
          let el = document.createElement('div');
          el.className = 'sv-chart-tip sv-tip-hide';
          el.innerHTML = '<p>' + d.label + '<span>' + val + '</span></p>';

          let t = d3.event.target;
          let size = t.getBoundingClientRect();
          let scrollTop = window.pageYOffset || t.scrollTop || document.body.scrollTop;
          let scrollLeft = window.pageXOffset || t.scrollLeft || document.body.scrollLeft;
          el.style.opacity = '0';

          document.body.appendChild(el);

          let elSize = el.getBoundingClientRect();
          el.style.left = size.left + scrollLeft - elSize.width / 2 + (x.bandwidth() - 30) / 2 + 'px';
          el.style.top = size.top + scrollTop - elSize.height - 10 + 'px';
          el.style.opacity = '1';
          el.className = 'sv-chart-tip';
        });

    bar.transition()
      .duration(params.duration)
      .attr('y', function(d) { return y(d.val) + 5; })
      .attr('height', function(d) {
        return params.height - y(d.val) - params.margin;
      });
  }

  updateHis(data, i) {
    const params = this.getParams();
    const colors = this.getColors();
    const index = i;

    let yAxisLength = params.height - params.margin;
    let xAxisLength = params.width - params.margin;

    let labels = [];
    let maxValue = 0;
    let minValue = 5;

    let svg = d3.select('.his-' + this.id);

    const el = document.getElementById(this.id).querySelector('.sv-pie-histogram');

    forEach(data, function(d) {
      if (!includes(labels, d.label)) {
        labels.push(d.label);
      }
      maxValue = (maxValue < d.val) ? d.val : maxValue;
      minValue = (minValue > d.val) ? d.val : minValue;
    });

    if (maxValue % 5 > 0) {
      maxValue = maxValue + (5 - (maxValue % 5));
    }

    if (minValue % 5 > 0) {
      minValue = minValue - (minValue % 5);
    }

    let x = d3.scaleBand()
        .domain(labels)
        .range([0, xAxisLength]);

    let y = d3.scaleLinear()
      .domain([minValue,maxValue])
      .range([yAxisLength,0]);

    let xAxis = d3.axisBottom(x)
      .ticks(15);

    let yAxis = d3.axisLeft(y)
      .ticks(Math.floor(maxValue / 5))
      .tickSizeInner(-xAxisLength);

    svg.selectAll('.x-axis').remove();
    svg.selectAll('.y-axis').remove();

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform',
      'translate(' + (params.margin + params.offset - 10) + ',' + (params.height - params.margin) + ')')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform',
              'translate(' + params.margin + ',' + 5 + ')')
      .call(yAxis);

    svg.selectAll('.x-axis text')
      .attr('dy', 12)

    svg.selectAll('.y-axis text')
      .attr('dx', -3);

    svg.selectAll('.y-axis').moveToBack();

    let rects = svg.selectAll('.sv-rect').size();
    let bar = svg.selectAll('.sv-rect');

    if (size(data) == rects) {
      bar.exit().remove();
      bar.data(data).enter().append('rect')
        .merge(bar)
        .attr('fill', function(d) {
          if (isUndefined(index)) {
            return colors.his[i];
          } else {
            return colors.pie[index];
          }
        })
        .transition()
        .duration(params.duration)
        .attr('y', function(d) { return y(d.val) + 5; })
        .attr('height', function(d) {
          return params.height - y(d.val) - params.margin;
        });
    } else {
      svg.selectAll(".sv-rect").remove()
      this.drawHis(data, svg, x, y, yAxisLength, i);
    }
  }

  drawLegend() {
    const data = this.getData();
    const colors = this.getColors().pie;
    const legend = document.getElementById(this.id).querySelector('.sv-pie-legend');
    if (legend) {
      const el = legend.querySelector('ul');
      const size = 12;
      forEach(data, function(d, i) {
        let li = document.createElement('li');
        li.innerHTML = '<span class="item-' + i + '"></span>' + d.label;
        el.appendChild(li);

        let span = el.querySelector('.item-' + i);
        let svg = d3.select(span).append('svg:svg')
            .attr('class', 'list-item')
            .attr('width', size)
            .attr('height', size);

        svg.append('svg:circle')
            .attr('r', size / 2)
            .attr('cx', size / 2)
            .attr('cy', size / 2)
            .attr('fill', colors[i]);
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
      loading
    };

    let tmplOptions = assign(defaultOptions, options);
    return tmplOptions;
  }

  drawOptions() {
    if (!this.loading) {
      this.drawPie();
      this.drawLegend();
    }
  }
}
