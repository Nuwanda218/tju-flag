// 队长和队委寄语页面逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let messagesData = null;
    let currentPage = 1;
    const itemsPerPage = 6;
    let currentFilter = 'all';
    
    // 初始化页面
    initPage();
    
    // 初始化页面
    async function initPage() {
        try {
            // 加载数据
            messagesData = await loadMessagesData();
            
            // 设置页面标题
            document.getElementById('pageTitle').textContent = messagesData.pageTitle;
            document.getElementById('pageSubtitle').textContent = messagesData.pageSubtitle;
            
            // 渲染统计数据
            renderStats();
            
            // 渲染分类筛选按钮
            renderFilterButtons();
            
            // 渲染寄语卡片
            renderMessages();
            
            // 渲染分页
            renderPagination();
            
            // 初始化事件监听
            initEventListeners();
            
        } catch (error) {
            console.error('初始化页面失败:', error);
            showErrorMessage('加载寄语数据失败，请刷新页面重试。');
        }
    }
    
    // 加载寄语数据
    async function loadMessagesData() {
        try {
            const response = await fetch('../data/messages.json');
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('加载数据失败:', error);
            // 返回默认数据或抛出错误
            throw error;
        }
    }
    
    // 渲染统计数据
    function renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        const stats = messagesData.stats;
        
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="stat-number">${stats.totalMessages}</div>
                <div class="stat-label">位队委寄语</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">
                    <i class="fas fa-layer-group"></i>
                </div>
                <div class="stat-number">${stats.categories}</div>
                <div class="stat-label">个组别分类</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="stat-number">${stats.generations}</div>
                <div class="stat-label">届精神传承</div>
            </div>
        `;
    }
    
    // 渲染分类筛选按钮
    function renderFilterButtons() {
        const filterContainer = document.getElementById('filterButtons');
        const categories = messagesData.categories;
        
        let buttonsHTML = '';
        categories.forEach(category => {
            const activeClass = category.id === currentFilter ? 'active' : '';
            buttonsHTML += `
                <button class="filter-btn ${activeClass}" data-filter="${category.id}">
                    <i class="fas ${category.icon}"></i> ${category.name}
                </button>
            `;
        });
        
        filterContainer.innerHTML = buttonsHTML;
    }
    
    // 渲染寄语卡片
    function renderMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        
        // 获取过滤后的消息
        const filteredMessages = filterMessages();
        
        // 计算分页
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pagedMessages = filteredMessages.slice(startIndex, endIndex);
        
        // 如果没有消息
        if (pagedMessages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-messages" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888;">
                    <i class="fas fa-comments" style="font-size: 60px; margin-bottom: 20px; color: #ddd;"></i>
                    <h3>暂无寄语</h3>
                    <p>当前分类下暂无寄语内容。</p>
                </div>
            `;
            return;
        }
        
        // 生成卡片HTML
        let cardsHTML = '';
        pagedMessages.forEach(message => {
            const captainClass = message.isCaptain ? 'captain-card' : '';
            const rolesHTML = renderRoles(message.roles);
            
            cardsHTML += `
                <div class="message-card ${captainClass}" data-category="${message.categories.join(' ')}" data-id="${message.id}">
                    <div class="message-header">
                        <img src="${message.avatar}" alt="${message.name}" class="message-avatar" onerror="this.onerror=null; this.src='../images/default-avatar.jpg';">
                        <div class="message-info">
                            <h3>${message.name}</h3>
                            <div class="position">${message.position}</div>
                            <div class="role-tags">
                                ${rolesHTML}
                            </div>
                        </div>
                    </div>
                    <div class="message-content">
                        <p>${message.excerpt}</p>
                        ${message.quote ? `<div class="message-quote">${message.quote}</div>` : ''}
                        ${message.highlight ? `<p><span class="highlight-text">${message.highlight}</span></p>` : ''}
                    </div>
                    <div class="card-footer">
                        <div class="message-date">${message.date}</div>
                        <a href="#" class="view-detail" data-id="${message.id}">
                            查看完整寄语 <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        });
        
        messagesContainer.innerHTML = cardsHTML;
    }
    
    // 渲染角色标签
    function renderRoles(roles) {
        let rolesHTML = '';
        roles.forEach(role => {
            const isGold = role.includes('总指挥') || role.includes('动作教官') || 
                          role.includes('军姿指导') || role.includes('训练标兵');
            const goldClass = isGold ? 'gold' : '';
            rolesHTML += `<span class="role-tag ${goldClass}">${role}</span>`;
        });
        return rolesHTML;
    }
    
    // 渲染分页
    function renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        const filteredMessages = filterMessages();
        const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // 上一页按钮
        if (currentPage > 1) {
            paginationHTML += `<div class="page-btn prev-btn"><i class="fas fa-chevron-left"></i></div>`;
        }
        
        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<div class="page-btn page-number ${activeClass}" data-page="${i}">${i}</div>`;
        }
        
        // 下一页按钮
        if (currentPage < totalPages) {
            paginationHTML += `<div class="page-btn next-btn"><i class="fas fa-chevron-right"></i></div>`;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }
    
    // 过滤消息
    function filterMessages() {
        if (currentFilter === 'all') {
            return messagesData.messages;
        }
        
        return messagesData.messages.filter(message => 
            message.categories.includes(currentFilter)
        );
    }
    
    // 初始化事件监听
    function initEventListeners() {
        // 分类筛选
        document.addEventListener('click', function(e) {
            if (e.target.closest('.filter-btn')) {
                const filterBtn = e.target.closest('.filter-btn');
                const filterValue = filterBtn.getAttribute('data-filter');
                
                if (filterValue !== currentFilter) {
                    currentFilter = filterValue;
                    currentPage = 1;
                    
                    // 更新按钮状态
                    document.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    filterBtn.classList.add('active');
                    
                    // 重新渲染
                    renderMessages();
                    renderPagination();
                }
            }
            
            // 查看完整寄语
            if (e.target.closest('.view-detail')) {
                e.preventDefault();
                const viewBtn = e.target.closest('.view-detail');
                const messageId = parseInt(viewBtn.getAttribute('data-id'));
                showFullMessage(messageId);
            }
            
            // 分页
            if (e.target.closest('.page-btn')) {
                const pageBtn = e.target.closest('.page-btn');
                
                if (pageBtn.classList.contains('prev-btn')) {
                    if (currentPage > 1) {
                        currentPage--;
                        updatePage();
                    }
                } else if (pageBtn.classList.contains('next-btn')) {
                    const filteredMessages = filterMessages();
                    const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
                    
                    if (currentPage < totalPages) {
                        currentPage++;
                        updatePage();
                    }
                } else if (pageBtn.classList.contains('page-number')) {
                    const pageNumber = parseInt(pageBtn.getAttribute('data-page'));
                    if (pageNumber !== currentPage) {
                        currentPage = pageNumber;
                        updatePage();
                    }
                }
            }
        });
        
        // 模态框关闭
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('modalContainer');
            
            // 点击关闭按钮
            if (e.target.classList.contains('modal-close')) {
                closeModal();
            }
            
            // 点击背景关闭
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }
    
    // 更新页面
    function updatePage() {
        renderMessages();
        renderPagination();
        
        // 平滑滚动到顶部
        window.scrollTo({
            top: document.querySelector('.filter-buttons').offsetTop - 100,
            behavior: 'smooth'
        });
    }
    
    // 显示完整寄语
    function showFullMessage(messageId) {
        const message = messagesData.messages.find(m => m.id === messageId);
        if (!message) return;
        
        const modalContainer = document.getElementById('modalContainer');
        const rolesHTML = renderRoles(message.roles);
        
        // 生成完整寄语内容
        let fullMessageHTML = '';
        if (Array.isArray(message.fullMessage)) {
            message.fullMessage.forEach(paragraph => {
                fullMessageHTML += `<p>${paragraph}</p>`;
            });
        } else {
            fullMessageHTML = `<p>${message.fullMessage}</p>`;
        }
        
        modalContainer.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${message.name} - ${message.position}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <div class="role-tags">
                            ${rolesHTML}
                        </div>
                    </div>
                    ${fullMessageHTML}
                </div>
                <div class="modal-footer">
                    ${message.date}
                </div>
            </div>
        `;
        
        modalContainer.style.display = 'flex';
    }
    
    // 关闭模态框
    function closeModal() {
        const modalContainer = document.getElementById('modalContainer');
        modalContainer.style.display = 'none';
    }
    
    // 显示错误消息
    function showErrorMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #d32f2f;">
                <i class="fas fa-exclamation-triangle" style="font-size: 60px; margin-bottom: 20px;"></i>
                <h3>加载失败</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
    }
});