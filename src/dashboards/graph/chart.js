import { isUndefined, forEach } from 'lodash';
// import { d3.selectAll,d3.selection } from 'd3-selection';
// import { transition, duration, ease } from 'd3-transition';
// import { d3.easeLinear } from 'd3-ease';
// import { line } from 'd3-shape';
import Graph from './main';

'use strict';
export default class ChartDashboard extends Graph {
  constructor(...args) {
    super(...args);
  }

  drawGraphs(data, svg, x, y) {
    const self = this;
    const params = super.getParams();
    const touchSuport = super.isTouchDevice();
    let t = d3.transition()
          .duration(params.duration)
          .ease(d3.easeLinear);

   d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    forEach(data, function(row, i) {
      let item = row.values;
      let graphColor = (isUndefined(params.colors[i])) ? params.colors[0] : params.colors[i];
      let valueline= d3.line()
        .x(function(d) {
          return x(d.label) + params.offset + 5;
        })
        .y(function(d) {
          return y(d.val);
        });

      svg.append('path')
        .data([item])
        .attr('class', 'line')
        .attr('stroke', graphColor)
        .attr('stroke-width', 2)
        .attr('fill', 'transparent')
        .attr('transform',
          'translate(' + params.margin  + ',' + 2 * params.margin + ')')
        .attr('d', valueline)
        .attr('stroke-dasharray', function(d) { return this.getTotalLength(); })
        .attr('stroke-dashoffset', function(d) { return this.getTotalLength(); })
        .transition(t)
        .attr('stroke-dashoffset', 0);

      setTimeout(() => {
        svg.selectAll('dot')
          .data(item)
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('r', function(d) {
            if (touchSuport) {
              return 7
            } else {
              return 3.5
            }
          })
          .attr('fill', 'white')
          .attr('stroke', graphColor)
          .attr('stroke-width', 2)
          .attr('cx', function(d) { return x(d.label) + params.offset + params.margin + 5;})
          .attr('cy', function(d) { return y(d.val) + 2 * params.margin; })
          .on('mouseleave', d => self.mouseleave(d))
          .on('mouseenter', d => self.mouseenter(d))
          .on('click', d => {
            if (touchSuport) {
              self.mouseleave(d)
              self.mouseenter(d)
            }
          })
          .moveToFront()
      }, 200);

    });
  }

  mouseleave(d) {
    d3.selectAll('.sv-chart-tip').remove();
  }

  mouseenter(d) {
    if (d.popup) {
      const touchSuport = super.isTouchDevice();
      let el = document.createElement('div');
      el.className = 'sv-chart-tip sv-tip-hide';
      el.innerHTML = '<p>' + d.popup.label + '<span>' + this.convertPopupValue(d.popup.val) + '</span></p>';

      let t = event.target;
      let size = t.getBoundingClientRect();
      let scrollTop = window.pageYOffset || t.scrollTop || document.body.scrollTop;
      let scrollLeft = window.pageXOffset || t.scrollLeft || document.body.scrollLeft;
      scrollLeft = (touchSuport)? scrollLeft + 3 : scrollLeft;
      el.style.opacity = '0';

      document.body.appendChild(el);

      let elSize = el.getBoundingClientRect();
      el.style.left = size.left + scrollLeft - elSize.width / 2 + 'px';
      el.style.top = size.top + scrollTop - elSize.height - 10 + 'px';
      el.style.opacity = '1';
      el.className = 'sv-chart-tip';
    }
  }

  convertPopupValue(value){
    value = (value >= 100) ? Math.floor(value) : value;
    return String(value).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
  }

  resizeGraph(data, svg, x, y) {
    let params = super.getParams();
    forEach(data, function(row, i) {
      let lines= d3.line()
          .x(function(d) {
            return x(d.label) + params.offset;
          })
          .y(function(d) {
            return y(d.val);
          });

      svg.selectAll('.line')
        .attr('d', lines)
        .attr('stroke-dasharray', function(d) { return this.getTotalLength(); });

      svg.selectAll('.dot')
      .attr('cx', function(d) { return x(d.label) + params.offset + params.margin;});
    });
  }
}
