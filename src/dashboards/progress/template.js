const templateBody = `<div class="sv-block s-chart" data-color="<%=color%>" data-percent="<%=chart.value%>" data-title="<%=chart.title%>" data-label="<%=chart.label%>"></div>
                      <div class="sv-block total <%=rows.length > 1 ? 'total-double' : 'total-single'%>">
                        <% rows.forEach(function(row, i) { %>
                          <div class="row-list">
                            <% row.forEach(function(item, j) { %>
                                <div class="row-item">
                                  <p title="<%=item.title%>"><%=item.title%></p>
                                  <% if (i == 0) {  %>
                                    <% if ((j == 1) && rows.length == 1) {  %>
                                      <span class="s-progress-number" data-number="<%=item.value.val%>" data-label="<%=item.value.label%>" data-color="<%=color%>"></span>
                                    <% } else { %>
                                      <span class="s-progress-number" data-number="<%=item.value.val%>" data-label="<%=item.value.label%>"></span>
                                    <% } %>
                                  <% } else { %>
                                    <span class="s-progress-number" data-number="<%=item.value.val%>" data-label="<%=item.value.label%>" data-color="<%=color%>"></span>
                                  <% } %>
                              </div>
                            <% }); %>
                          </div>
                        <% }); %>
                      </div>
                      <div class="sv-progress-line" data-value="<%=chart.value%>" data-color="<%=color%>"></div>`;

export default templateBody;



