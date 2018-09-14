const templateBody =	`<div class="row-list">
                        <div class="row-item">
                          <% rows.forEach(function(item, i) { %>
                            <% if (i == 0) { %>
                              <div class="s-number" data-number="<%=item.val%>" data-label="<%=item.label%>" data-color="<%=color%>" data-img="<%=img%>"></div>
                            <% } %>
                          <% }); %>
                        </div>
                      </div>`;

export default templateBody;
