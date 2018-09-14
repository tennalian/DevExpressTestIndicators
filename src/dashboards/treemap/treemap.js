import { forEach, includes, template, isEmpty, assign, map, cloneDeep, chain, first, size } from 'lodash';
// import { d3.select, d3.selectAll, d3.selection } from 'd3-selection';
// import { treemap, hierarchy, d3.treemapBinary } from 'd3-hierarchy';
// import { d3.scaleOrdinal } from 'd3-scale';
// import {  d3.schemeCategory20 } from 'd3-scale-chromatic';
import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';

'use strict';
export default class TreemapDashboard extends Dashboard{
  constructor(...args) {
    super(...args);
  }

  getSize() {
    const sizes = ['sm','md','lg','max'];
    let size;
    if (this.options.colSize && includes(sizes, this.options.colSize)) {
      size = this.options.colSize;
    } else {
      size = 'md';
    }
    return size;
  }

  resizeWidth() {
    const margin = 24;
    const header = 40;
    const el = document.getElementById(this.id);
    const width = el.offsetWidth - 2 * margin;
    const height = el.offsetHeight - 2 * margin - header;

    return {width,height};
  }

  getParams(){
    const sizes = this.resizeWidth();
    const width = sizes.width;
    const height = sizes.height;
    const duration = 800;

    return {width, height, duration}
  }

  drawTreemap() {
    const self = this;
    const el = document.getElementById(this.id).querySelector('.sv-treemap-chart');
    const data =  this.data.rows[0] || [];
    const color = d3.scaleOrdinal(d3.schemeCategory20);
    const params = this.getParams();
    const svg = d3.select(el).append('svg:svg');

    d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    forEach(data.children, (group, i) =>{
      group.count = i;
      group.title = group.title || group.name;
    })

    let outData = {
      id:"parent",
      name:"parent",
      children: map(cloneDeep(data.children), (group, i) => {
        return {
          id: 'parent.' + i,
          count: group.count,
          title: group.title || group.count,
          value: group.value,
          children: []
        }
      })
    }

    svg.attr('width',params.width)
      .attr('height',params.height)
      .attr('class','outer-treemap')

    var tmap = d3.treemap()
        .tile(d3.treemapBinary)
        .size([params.width, params.height])
        .round(true)
        .paddingInner(1);

    var root = d3.hierarchy(outData)
        .eachBefore(function(d) {
          d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.count;
        })
        .sum(function (d) {
          return d.value;
        })
        .sort(function(a, b) {
          return b.value - a.value;
        })

    tmap(root);

    var cell = svg.selectAll("g")
      .data(root.leaves())
      .enter().append("g")
      .attr('class','sv-t-grandparent')
      .attr("transform", function(d) {return "translate(" + d.x0 + "," + d.y0 + ")";})
      .on('click', zoom)

    cell.append("rect")
      .attr('class','sv-t-rect')
      .attr("id", function(d) {
        return d.data.id;
      })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("fill", function(d) {
        var c = d.data.count;
        return color(c);
      })

    cell.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: bold; font-size: 14px;')
      .attr('fill','white')
      .attr('class', function(d, i) {
        let cl = self.getTextClass(d, i, svg);
        return 'sv-t-parent ' + cl;
      })
      .text(function(d) {
        let name = (d.data.title) ? d.data.title : d.data.count;
        return name;
      });

    cell.append("title")
      .text(function(d) {
        let name = (d.data.title) ? d.data.title : d.data.count;
        return name;
      });

    function zoom(d) {
      if (size(data.children) > 0) {
        const parent = d3.select(this);
        const rect = parent.select('rect');
        const text = parent.select('text');

        parent.moveToFront();

        let color = rect.attr('fill');
        let innerData = chain(cloneDeep(data.children))
          .reject( group => {
            return (group.count !== d.data.count)
          })
          .map(group => {
            return {
              name: 'inner',
              children: group.children
            };
          })
          .value();
        self.drawInnerTreemap(first(innerData), params.width, params.height, color);
      }
    }


    d3.select(window).on('resize.' + self.id , function() {
      let element = document.getElementById(self.id);
      if (element && element !== null) {
        const w = self.getParams().width;

        svg.attr('width', w)
        tmap.size([w, params.height])
        tmap(root);

        cell.attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
          .attr('class', 'sv-t-grandparent')
          .on('click', zoom)

        svg.selectAll('.sv-t-rect')
          .attr("width", function(d) { return d.x1 - d.x0; })
          .attr("height", function(d) { return d.y1 - d.y0; })

        cell.selectAll('text')
          .attr('class', function(d, i) {
            let cls = d3.select(this).attr('class').split(' ');
            let val = self.checkDefaultClass(cls);
            let cl = self.getTextClass(d, i, svg);
            return val + cl;
          })
      }
    });
  }

  drawInnerTreemap(data, w, h, color) {
    let self = this;

    const el = document.getElementById(this.id).querySelector('.sv-treemap-chart');
    const svg = d3.select(el).append('svg:svg');
    let width = d3.select(el).select('.outer-treemap').attr('width');

    svg.attr('width', width)
      .attr('height', h)
      .attr('class', 'inner-treemap')
      .attr('style', 'position: absolute; z-index: 20; top: 0; left: 0; background: #fff;')
      .on('click', function(){
        d3.selectAll('.inner-treemap').remove();
      })

    var tmap = d3.treemap()
        .tile(d3.treemapBinary)
        .size([width, h])
        .round(true)
        .paddingInner(1);

    var root = d3.hierarchy(data)
        .eachBefore(function(d) {
          d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
        })
        .sum(function (d) {return d.value;})
        .sort(function(a, b) { return b.value - a.value;})

    tmap(root);

    var cell = svg.selectAll("g")
      .data(root.leaves())
      .enter().append("g")
      .attr('class','sv-t-inner-grandparent')
      .attr('fill','#ffffff')
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .moveToFront();

    cell.append("rect")
      .attr('class','sv-t-rect')
      .attr("id", function(d) {
        return d.data.id;
      })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("fill", color)
      .moveToFront();

    cell.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-weight: bold; font-size: 14px;')
      .attr('fill','white')
      .append('tspan')
      .attr('class', 'inner-title')
      .text(function(d) {
        let name = (d.data.title) ? d.data.title : d.data.name;
        return name;
      }).each(this.textWrap);

    cell.append("text")
      .attr("x", 10)
      .attr("y", 40)
      .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 12px;')
      .attr('fill','white')
      .append('tspan')
      .attr('class', 'inner-value')
      .text(function(d) {
        return d.data.value;
      }).each(this.textWrap);


    cell.append("title")
      .text(function(d) {
        let name = (d.data.title) ? d.data.title : d.data.name;
        return name;
      });

    d3.select(window).on('resize.inner.' + self.id , function() {
      let element = document.getElementById(self.id);
      if (element && element !== null) {
        const wdth = self.getParams().width;

        svg.attr('width', wdth);
        tmap.size([wdth, h]);
        tmap(root);

        cell.attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
          .attr('class','sv-t-inner-grandparent')

        svg.selectAll('.sv-t-rect')
          .attr("width", function(d) { return d.x1 - d.x0; })
          .attr("height", function(d) { return d.y1 - d.y0; })

        cell.selectAll('.inner-value')
          .text(function(d) {
            return d.data.value;
          }).each(self.textWrap);

        cell.selectAll('.inner-title')
          .text(function(d) {
            let name = (d.data.title) ? d.data.title : d.data.name;
            return name;
          }).each(self.textWrap);
      }
    });
  }

  checkDefaultClass(cls) {
    let cl = '';
    if (includes(cls, 'sv-t-value')) {
      cl = 'sv-t-value '
    }
    if (includes(cls, 'sv-t-parent')) {
      cl = 'sv-t-parent '
    }
    if (includes(cls, 'sv-t-name')) {
      cl = 'sv-t-name '
    }
    return cl;
  }

  getTextClass(d, i, svg) {
    let name = d.data.title || d.data.name;
    let size = this.getTextSize(name, i, svg);
    let cl = null;
    if ((d.x1 - d.x0 >= size.width + 15) && (d.y1 - d.y0) >= size.height + 20) {
      cl = 'sv-t-text'
    } else {
      cl = 'sv-t-hidden-text'
    }
    return cl;
  }

  findFirstParent(data){
    var d = data;
    if (d.depth > 2) {
      d = d.parent;
      this.findFirstParent(d);
    }
    if (d.depth == 2) {
      return d.parent.data.id;
    }
  }

  getTextSize(text, id, svg) {
    let tmp = svg.append('svg:text')
      .attr('class', 'id-' + id)
      .attr('style','font-family: "SourceSansPro", "STSansPro", Arial, sans-serif; font-size: 14px;')
      .text(text);

    let size = svg.node().querySelector('.id-' + id).getBoundingClientRect();
    tmp.remove()
    return size;
  }

  textWrap() {
    let g = this.parentNode.parentNode;
    let width = d3.select(g).select('rect').attr('width');
    let self = d3.select(this);
    let textLength = self.node().getComputedTextLength();
    let text = self.text();
    while (textLength > (width - 15) && text.length > 0) {
      text = text.slice(0, -1);
      self.text(text + '...');
      textLength = self.node().getComputedTextLength();
    }
  }


  sumByCount(d) {
    return d.children ? 0 : 1;
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
        console.warn('Dashboard type is not defined (id: ' + this.id + ')');
      }
    }

    let rows = this.data.rows[0] || [];
    let options = {rows, loading};

    let tmplOptions = assign(defaultOptions, options);
    return tmplOptions;
  }

  drawOptions() {
    if (!this.loading) {
      this.drawTreemap();
    }
  }

}










