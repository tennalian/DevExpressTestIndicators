import { isUndefined, forEach } from 'lodash';
import { selectAll, selection, event } from 'd3-selection';
// import { d3.selectAll, d3.selection, event } from 'd3-d3.selection';
// import { transition, duration } from 'd3-transition';
import Graph from './main';

'use strict';
export default class HistogramDashboard extends Graph {
  constructor(...args) {
    super(...args);
  }

  resizeWidth() {
    const margin = 16;
    const el = document.getElementById(this.id);
    const width = el.offsetWidth - 2 * margin;

    return width;
  }

  getTrendlineStyles(i) {
    return {
      stroke: '#da5e51',
      strokeWidth: 2,
      strokeDasharray: (i && i > 0) ? '2,2' : ''
    }
  }

  drawGraphs(data, svg, x, y, chartValues, yAxisLength) {
    const self = this;
    const rectWidth = 10;
    let params = super.getParams();
    let touchSuport = super.isTouchDevice();

    d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    forEach(data, function(row, i) {
      let item = row.values;
      let graphColor = (isUndefined(params.colors[i])) ? params.colors[0] : params.colors[i];
      let index = i + 1;
      let dx = (index % 2 == 0) ? -rectWidth : 0;

      let bar = svg.selectAll('.rect')
        .data(item)
        .enter().append('rect')
          .attr('x', function(d) {return x(d.label) + dx + params.offset + params.margin; })
          .attr('y',  params.height - params.margin)
          .attr('height', 0)
          .attr('width', rectWidth)
          .attr('fill', graphColor)
          .attr('class', 'sv-rect' + i)
          .on('mouseleave', d => self.mouseleave(d))
          .on('mouseenter', d => self.mouseenter(d))
          .on('click', d => {
            if (touchSuport) {
              self.mouseleave(d)
              self.mouseenter(d)
            }
          })
          .moveToFront()

        bar.transition()
          .duration(params.duration)
          .attr('y', function(d) { return y(d.val) + 2*params.margin; })
          .attr('height', function(d) {
            return params.height - y(d.val) - 3*params.margin
          });

    });
  }

  mouseenter(d) {
    if (d.popup) {
      let el = document.createElement('div');
      el.className = 'sv-chart-tip sv-tip-hide';
      el.innerHTML = '<p>' + d.popup.label + '<span>' + this.convertPopupValue(d.popup.val) + '</span></p>';

      let t = d3.event.target;
      let size = t.getBoundingClientRect();
      let scrollTop = window.pageYOffset || t.scrollTop || document.body.scrollTop;
      let scrollLeft = window.pageXOffset || t.scrollLeft || document.body.scrollLeft;
      el.style.opacity = '0';

      document.body.appendChild(el);

      let elSize = el.getBoundingClientRect();
      el.style.left = size.left + scrollLeft - elSize.width / 2 + 'px';
      el.style.top = size.top + scrollTop - elSize.height - 10 + 'px';
      el.style.opacity = '1';
      el.className = 'sv-chart-tip';
    }
  }

  mouseleave(d) {
    d3.selectAll('.sv-chart-tip').remove();
  }

  convertPopupValue(value) {
    value = (value >= 100) ? Math.floor(value) : value;
    return String(value).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
  }

  resizeGraph(data, svg, x, y) {
    const rectWidth = 10;
    let params = super.getParams();
    forEach(data, function(row, i) {
      let index = i + 1;
      let dx = (index % 2 == 0) ? -rectWidth : 0;

      svg.selectAll('.sv-rect' + i)
        .attr('x', function(d) { return x(d.label) + dx + params.offset + params.margin; });
    });
  }
}
