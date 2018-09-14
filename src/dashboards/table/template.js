const templateBody = `
                      <% if (!rows.length) { %>
                        <div class="s-table-wrap s-table-wrap--empty">
                          <h3>Нет данных</h3>
                        </div>
                      <% } else { %>
                        <div class="s-table-wrap">
                          <table class="s-table">
                            <tr>
                              <%titles.forEach(function(title, i) {%>
                                <th class="item-<%=i+1%>">
                                  <p title="<%=title%>">
                                    <span class="target" data-label="<%=title%>">
                                      <%=title%>
                                      <% if (!_.isEmpty(sorted) && (sorted.label == title)) {%>
                                        <% if (sorted.type == 'up') {%>
                                          <svg class="s-array" viewBox="0 0 24 24">
                                            <path d="M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z" />
                                          </svg>
                                        <% } else {%>
                                          <svg class="s-array" viewBox="0 0 24 24">
                                            <path d="M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z" />
                                          </svg>
                                        <% } %>
                                      <% } %>
                                    </span>
                                  </p>
                                </th>
                                <% if ((i==0) && extend.val) {%>
                                  <th></th>
                                <% } %>
                              <%});%>
                              <% if (extend.val) {%>
                                <th class="extend"></th>
                              <% } %>
                            </tr>
                            <%rows.forEach(function(row, k) {%>
                              <tr>
                                <%row.forEach(function(item, i) {%>
                                  <td class="item-<%=i+1%>">
                                    <span title="<%=item.value.val%>"><%=item.value.val%><%=item.value.label%></span>
                                  </td>
                                  <% if ((i==0) && extend.val) {%>
                                    <td class="process-extend"><div class="s-progress" data-percent="<%=extend.values[k]%>" data-index="<%=k%>" data-min="<%=extend.min%>"></div></td>
                                  <% } %>
                                <%});%>
                                <% if (extend.val) {%>
                                  <td class="extend">
                                    <div class="s-round" data-percent="<%=extend.values[k]%>" data-min="<%=extend.min%>"></div>
                                  </td>
                                <% } %>
                              </tr>
                            <%});%>
                          </table>
                        </div>
                      <% } %>`;

export default templateBody;

