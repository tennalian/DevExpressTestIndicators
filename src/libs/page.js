import { isEmpty, forEach, assign } from 'lodash';
import Masonry from 'masonry-layout';
import * as esPromise from 'es6-promise';
import { httpClient } from './http';
import '../assets/styles/page.less';

esPromise.polyfill();

export default class StPageCompiler {
  constructor(options, stDashboardItem) {
    this.requests = [];
    this.stDashboardItem = stDashboardItem;
    this.options = {
      id: options.id || null,
      pageKey: options.pageKey || null,
      headers: {
        page: (options.headers && options.headers.page) ? options.headers.page : {},
        items: (options.headers && options.headers.items) ? options.headers.items : {}
      },
      query: {
        page: (options.query && options.query.page) ? options.query.page : {},
        items: (options.query && options.query.items) ? options.query.items : {}
      },
      url: {
        page: (options.url && options.url.page) ? options.url.page : '',
        items: (options.url && options.url.items) ? options.url.items : ''
      }
    };
    this.language = this.options.language || 'default';
    this.page = [];
    this.dashboards = [];
    this.msnry = null;
  }

  cancelRequests() {
    this.requests.forEach(xhr => xhr.abort());
  }

  fetchPageData() {
    let self = this;
    let element = document.getElementById(this.options.id);
    let loader = document.getElementById('sv-page-loader');
    let url = this.options.url.page + '/' + this.options.pageKey;
    let requestOptions = this.getRequestOptions('page', url);
    const http = httpClient();
    this.requests.push(http.xhr);

    return http.get(requestOptions.url, requestOptions.headers)
      .then(response => {
        if (isEmpty(self.page)) {
          self.page = response.dashboards;
        }
        if (isEmpty(response.dashboards)) {
          element.removeChild(loader);
          self.addPageEmpty();
          return;
        }
        let promises = self.getDataDashboards(response.dashboards);
        return Promise.all(promises)
          .then(data => {
            if (loader && loader !== null) {
              element.removeChild(loader);
            };
            forEach(data, (item, i) => {
              let id = 'item_' + item.data.codeKey.value + '_' + i;
              let tmp = document.createElement('div');
              tmp.id = id;
              element.appendChild(tmp);
              let db = new self.stDashboardItem(id, item.options, item.data);
              self.dashboards.push(db);
              db.draw();
            });
          });
      }, error => {
        if (loader && loader !== null) {
          element.removeChild(loader);
        };
        self.addPageEmpty();
      });
  }

  getDataDashboards(data) {
    let self = this;
    let promises = [];
    forEach(data, dashboard => {
      let url = self.options.url.items + '/' + dashboard.codeKey;
      let requestOptions = this.getRequestOptions('items', url);
      const http = httpClient();
      this.requests.push(http.xhr);
      let promise = http.get(requestOptions.url, requestOptions.headers).then(response => {
        return {
          options: {
            type: dashboard.type.toLowerCase() === '13' ? 'geomap' : dashboard.type.toLowerCase(),
            colSize: self.convertSize(dashboard.width),
            rowSize: self.convertSize(dashboard.height)
          },
          data: {
            title: dashboard.title,
            webReportsLink: dashboard.webReportsLink,
            wiki: dashboard.wikiLink,
            period: self.convertPeriod(dashboard.period),
            rows: [],
            codeKey: {
              value: dashboard.codeKey,
              data: response
            }
          }
        };
      }, error => {
        return {
          options: {
            type: dashboard.type.toLowerCase() === '13' ? 'geomap' : dashboard.type.toLowerCase(),
            colSize: self.convertSize(dashboard.width),
            rowSize: self.convertSize(dashboard.height)
          },
          data: {
            title: dashboard.title,
            webReportsLink: dashboard.webReportsLink,
            wiki: dashboard.wikiLink,
            period: self.convertPeriod(dashboard.period),
            rows: [],
            codeKey: {
              value: dashboard.codeKey,
              data: []
            }
          }
        };
      });
      promises.push(promise);
    });
    return promises;
  }

  getRequestOptions(value, inputUrl) {
    let queries = '';
    let headers = { 'Accept': 'application/json' };
    let fetchHeaders = (value == 'items') ? this.options.headers.items : this.options.headers.page;
    let fetchQueries = (value == 'items') ? this.options.query.items : this.options.query.page;

    if (!isEmpty(fetchHeaders)) {
      headers = Object.assign(headers, fetchHeaders);
    }
    if (!isEmpty(fetchQueries)) {
      queries = Object.keys(fetchQueries)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(fetchQueries[k]))
        .join('&');

      console.log(queries)
    }
    const url = (queries.length > 0) ? inputUrl + '?' + queries : inputUrl;
    return { headers, url };
  }

  convertSize(val) {
    let size = '';
    if (val === 1) {
      size = 'xs';
    } else if (val === 2) {
      size = 'sm';
    } else if (val === 3) {
      size = 'md';
    } else if (val === 4) {
      size = 'lg';
    } else if (val === 5) {
      size = 'max';
    }
    return size;
  }

  convertPeriod(period) {
    let output;
    if ((period.type === 'CurrentDay') || (period.type === 'LastNDays' && (period.value === 1))) {
      output = `Сегодня`;
    } else if ((period.type === 'CurrentWeek') || (period.type === 'LastNWeeks' && (period.value === 1))) {
      output = `На этой неделе`;
    } else if ((period.type === 'CurrentMonth') || (period.type === 'LastNMonths' && (period.value === 1))) {
      output = `В этом месяце`;
    } else if (period.type === 'CurrentYear') {
      output = `В этом году`;
    } else if (period.type === 'PreviousDay') {
      output = `Вчера`;
    } else if ((period.type === 'LastNDays') && (period.value > 1)) {
      output = `За последние ${period.value} дн.`;
    } else if ((period.type === 'LastNWeeks') && (period.value > 1)) {
      output = `За последние ${period.value} нед.`;
    } else if ((period.type === 'LastNMonths') && (period.value > 1)) {
      output = `За последние ${period.value} мес.`;
    } else {
      output = null;
    }
    return output;
  }

  addPageLoader() {
    this.msnry = null;
    let element = document.getElementById(this.options.id);
    let loader = document.createElement('div');
    let spinner = document.createElement('div');
    spinner.className = 'spinner';
    loader.id = 'sv-page-loader';
    loader.appendChild(spinner);
    element.appendChild(loader);
  }

  addPageEmpty() {
    let element = document.getElementById(this.options.id);
    let emptyError = document.createElement('div');
    emptyError.innerHTML = `<h3>Нет данных</h3>`;
    emptyError.id = 'sv-page-empty';
    element.appendChild(emptyError);
  }

  updatePage(updateHandler) {
    let self = this;
    let element = document.getElementById(this.options.id);
    let emptyError = document.getElementById('sv-page-empty');
    return updateHandler.then(options => {
      if (emptyError && emptyError !== null) {
        element.removeChild(emptyError);
      };
      if (options && !isEmpty(options)) {
        self.options.headers = (options.headers && options.headers.page && options.headers.items) ? assign({}, self.options.headers, options.headers) : self.options.headers;
        self.options.url = (options.url && options.url.page && options.url.items) ? assign({}, self.options.url, options.url) : self.options.url;
        self.options.query = (options.query && options.query.page && options.query.items) ? assign({}, self.options.query, options.query) : self.options.query;
        self.options.pageKey = (options.pageKey) ? options.pageKey : self.options.pageKey;
      }
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.removeAttribute('style');
      self.page = [];
      self.dashboards = [];
      self.addPageLoader();
      self.fetchPageData().then(() => this.initMasonry());
    }, err => {
      console.error(err);
    });
  }

  updateData(updateHandler) {
    let self = this;
    return updateHandler.then(options => {
      if (options && !isEmpty(options)) {
        this.options.headers = (options.headers && options.headers.items) ? assign({}, this.options.headers, options.headers) : this.options.headers;
        this.options.query = (options.query && options.query.items) ? assign({}, this.options.query, options.query) : this.options.query;
      }
      forEach(self.dashboards, el => el.setLoading());
      let promises = self.getDataDashboards(self.page);
      return Promise.all(promises).then(data => {
        forEach(data, (item, i) => {
          let itemId = 'item_' + item.data.codeKey.value + '_' + i;
          forEach(self.dashboards, el => {
            if (itemId == el.id) {
              let updateHandler = new Promise((resolve, reject) => {
                var result = item.data;
                resolve(result);
              });
              el.update(updateHandler);
            }
          });
        });
      });
    }, err => {
      console.error(err);
    });
  }

  updateDashboardData() {
    let promises = this.getDataDashboards(this.page);
    return Promise.all(promises).then(data => {
      forEach(data, (item, i) => {
        let itemId = 'item_' + item.data.codeKey.value + '_' + i;
        if (itemId == el.id) {
          data = item.data;
        }
      });
      if (!isEmpty(data)) {
        return data;
      }
    });
  }

  initMasonry() {
    const element = document.querySelector('.sv-page');
    if (element) {
      this.msnry = new Masonry('.sv-page', {
        itemSelector: '.sv-dashboard',
        columnWidth: 216,
        gutter: 24,
        resize: true,
        transitionDuration: 0
      });
    }
  }

  draw() {
    let element = document.getElementById(this.options.id);
    let emptyError = document.getElementById('sv-page-empty');
    element.className = 'sv-page';
    if (emptyError && emptyError !== null) {
      element.removeChild(emptyError);
    };
    this.addPageLoader();
    this.fetchPageData().then(() => this.initMasonry());
  }
};

