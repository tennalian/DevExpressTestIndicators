const templateBody = `<div class="sv-block sv-progress-chart"></div>
                      <div class="sv-block total">
                        <% rows.forEach(function(row, i) { %>
                          <div class="row-list">
                            <% row.forEach(function(item, j) { %>
                              <div class="row-item">
                                  <p title="<%=item.title%>"><%=item.title%></p>
                                  <span><%= item.value.val%></span>
                                  <span><%= item.value.label%></span>
                              </div>
                            <% }); %>
                          </div>
                        <% }); %>
                      </div>
                      <div class="sv-progress-line"></div>`;

export default templateBody;