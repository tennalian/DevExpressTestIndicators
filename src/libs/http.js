class HttpClient {
  constructor() {
    this.xhr = new XMLHttpRequest();
    this.async = true;
  }

  get(url, headers) {
    return this.request('GET', url, headers, null);
  }

  request(method, url, headers, body) {
    return new Promise((resolve, reject) => {
      const self = this;
      this.xhr.open(method, url, this.async);
      if (headers) {
        Object.keys(headers).map(header => this.xhr.setRequestHeader(header, headers[header]))
      }
      this.xhr.withCredentials = true;
      this.xhr.send(body);
      this.xhr.onreadystatechange = function onRequestStateChange() {
        var done = 4;
        var ok = 200;
        if (self.xhr.readyState != done) {
          return;
        }
        if (self.xhr.status !== ok) {
          reject({ status: self.xhr.status, statusText: self.xhr.statusText });
          return;
        } else {
          resolve(self.xhr.response ? JSON.parse(self.xhr.response) : null);
        }
      }
    });
  }
}

export const httpClient = function() {
  return new HttpClient();
}
