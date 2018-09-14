export const innerTemplate = (templateBody) => {
  return `<div class="dashboard-item">
            <div class="item-title">
              <div class="title">
                <h2 title="<%=title%>"><%=title%></h2>
                <% if (period) { %>
                  <p title="<%=period%>"><%=period%></p>
                <% } %>
              </div>
              <div class="actions">
                <% if (wiki.length > 0) { %>
                  <a href="<%=wiki%>" class="sv-btn" target="_blank">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24"><path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z" /></svg>
                  </a>
                <% } %>
                <% if (webReport.length > 0) { %>
                  <a href="<%=webReport%>" class="sv-btn" target="_blank">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24"><path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" /></svg>
                  </a>
                <% } %>
              </div>
            </div>
            <% if (!loading) {%>
              <% if (rows.length < 1) { %>
                <div class="item-info item-info-error">
                  <h3>Нет данных</h3>
                </div>
              <% } else {%>
                <div class="item-info <%=extendClass%>">
                  ${templateBody}
                </div>
              <% } %>
            <% } else { %>
              <div class="item-info item-info-error">
                  <div class="spinner"></div>
              </div>
            <% } %>
          </div>`;
};