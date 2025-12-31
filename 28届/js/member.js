// 个人页面核心逻辑 - 增强版
class MemberPage {
    constructor() {
        this.studentId = null;
        this.memberData = null;
        this.trainingData = null;
        this.photos = [];
        this.dataProcessor = new DataProcessor();
        this.init();
    }
    
    async init() {
        try {
            // 1. 获取URL参数中的学号
            this.studentId = this.getStudentIdFromURL();
            
            if (!this.studentId) {
                this.showError('未提供学号参数');
                return;
            }
            
            // 2. 查找队员基础数据
            this.memberData = membersData[this.studentId];
            
            if (!this.memberData) {
                this.memberData = this.createDefaultMemberData();
            }
            
            // 3. 加载训练数据
            this.trainingData = this.dataProcessor.getTrainingData(this.studentId);
            
            // 4. 加载数据并渲染页面
            await this.loadMemberData();
            this.renderPage();
            this.loadPhotos();
            this.initAnimations();
            
            // 5. 更新页脚时间
            this.updateLastUpdateTime();
            
            // 6. 生成训练报告
            this.generateTrainingReport();
            
            // 7. 隐藏加载动画
            this.hideLoadingOverlay();
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('页面加载失败，请刷新重试');
        }
    }
    
    getStudentIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('sid');
    }
    
    createDefaultMemberData() {
        const currentYear = new Date().getFullYear();
        const joinYear = currentYear - 1;
        
        return {
            name: '国旗护卫队队员',
            class: '天津大学',
            position: '28届预备队员',
            rank: '预备队员',
            joinDate: `${joinYear}年9月`,
            status: 'active',
            department: '待补充学院信息'
        };
    }
    
    async loadMemberData() {
        // 模拟异步加载
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    renderPage() {
        // 更新头部信息
        this.renderHeaderInfo();
        
        // 更新统计数据
        this.renderStatistics();
        
        // 渲染训练图表
        this.renderTrainingChart();
        
        // 渲染每周训练时长
        this.renderWeeklyTrainingChart();
        
        // 渲染时间轴（训练历程）
        this.renderTimeline();
        
        // 渲染奖项
        this.renderAwards();
        
        // 渲染成就列表
        this.renderAchievements();
        
        // 渲染徽章
        this.renderBadges();
        
        // 添加年度总结区域
        this.renderAnnualSummary();
    }
    
    renderHeaderInfo() {
        document.getElementById('memberName').textContent = this.memberData.name;
        document.getElementById('memberClass').textContent = `学院：${this.memberData.department || this.memberData.class}`;
        document.getElementById('memberPosition').textContent = `职务：${this.memberData.position}`;
        document.getElementById('memberJoinDate').textContent = `入队：${this.memberData.joinDate}`;
        document.getElementById('studentIdDisplay').textContent = `学号：${this.studentId}`;
        document.getElementById('studentIdDisplayHeader').textContent = `学号：${this.studentId}`;
        document.getElementById('memberRank').textContent = this.memberData.rank || '28届预备队员';
        
        // 更新状态标识
        this.renderMemberStatus();
    }
    
    renderMemberStatus() {
        const statusEl = document.getElementById('memberStatus');
        const status = this.memberData.status || 'active';
        const statusMap = {
            'active': { text: '在役', class: 'status-active' },
            'inactive': { text: '休整', class: 'status-inactive' },
            'graduated': { text: '毕业', class: 'status-graduated' },
            'reserve': { text: '预备', class: 'status-reserve' }
        };
        
        const statusInfo = statusMap[status] || statusMap.active;
        statusEl.textContent = statusInfo.text;
        statusEl.className = `avatar-status ${statusInfo.class}`;
        
        // 添加状态动画
        setTimeout(() => {
            statusEl.classList.add('pulse-animation');
        }, 1000);
    }
    
    renderStatistics() {
        if (!this.trainingData) {
            // 使用默认数据
            this.trainingData = {
                statistics: {
                    totalHours: 98,
                    averageWeeklyHours: 4.9,
                    attendanceRate: '95.6%',
                    attendances: 43,
                    totalTrainings: 45
                },
                photoStats: {
                    total: 30
                }
            };
        }
        
        const stats = this.trainingData.statistics;
        const photoStats = this.trainingData.photoStats || {};
        
        document.getElementById('totalTrainingHours').textContent = stats.totalHours || 0;
        document.getElementById('attendanceRate').textContent = stats.attendanceRate || '0%';
        document.getElementById('attendanceCount').textContent = 
            `${stats.attendances || 0}/${stats.totalTrainings || 0}次`;
        
        // 计算每周平均训练时长
        const weeklyAvg = stats.averageWeeklyHours || 0;
        document.getElementById('weeklyTrainingHours').textContent = `周均: ${weeklyAvg.toFixed(1)}小时`;
        
        // 计算照片总数
        const photoCount = photoStats.total || 0;
        document.getElementById('photoCount').textContent = photoCount;
        document.getElementById('galleryCount').textContent = photoCount;
        
        // 计算奖项总数
        const awardCount = this.memberData.awards?.length || 0;
        document.getElementById('awardCount').textContent = awardCount;
        document.getElementById('awardsTotalBadge').textContent = `${awardCount}项`;
        
        // 添加数字增长动画
        this.animateNumbers();
    }
    
    animateNumbers() {
        const elements = [
            { id: 'totalTrainingHours', duration: 2000 },
            { id: 'awardCount', duration: 1500 },
            { id: 'photoCount', duration: 1500 }
        ];
        
        elements.forEach(item => {
            const element = document.getElementById(item.id);
            const finalValue = parseInt(element.textContent);
            if (isNaN(finalValue) || finalValue === 0) return;
            
            this.animateValue(element, 0, finalValue, item.duration);
        });
    }
    
    animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    renderTrainingChart() {
        const chartEl = document.getElementById('trainingChart');
        const legendEl = document.getElementById('chartLegend');
        
        const weeklyHours = this.trainingData?.weeklyHours || [];
        
        if (!weeklyHours || weeklyHours.length === 0) {
            chartEl.innerHTML = '<div class="no-data">暂无训练数据</div>';
            legendEl.innerHTML = '';
            return;
        }
        
        // 创建CSS柱状图
        const maxHours = Math.max(...weeklyHours);
        const chartHTML = weeklyHours.map((hours, index) => {
            const height = (hours / maxHours) * 100;
            const weekNumber = index + 1;
            
            // 标记重要的训练周（第一次晚训、第一次大训练等）
            let specialClass = '';
            if (weekNumber === 1) specialClass = 'first-training';
            if (weekNumber === Math.floor(weeklyHours.length / 2)) specialClass = 'mid-term';
            if (weekNumber === weeklyHours.length) specialClass = 'final-term';
            
            return `
                <div class="chart-bar-container ${specialClass}">
                    <div class="chart-bar" style="height: ${height}%">
                        <div class="chart-bar-inner"></div>
                    </div>
                    <div class="chart-label">第${weekNumber}周</div>
                    <div class="chart-value">${hours}h</div>
                </div>
            `;
        }).join('');
        
        chartEl.innerHTML = `
            <div class="chart-bars">
                ${chartHTML}
            </div>
        `;
        
        // 创建图例
        const total = weeklyHours.reduce((a, b) => a + b, 0);
        const avg = (total / weeklyHours.length).toFixed(1);
        const max = maxHours;
        const trend = this.dataProcessor.calculateAdvancedStats(this.trainingData)?.trend || 'stable';
        
        const trendText = {
            'improving': '上升趋势',
            'declining': '下降趋势',
            'stable': '稳定状态'
        }[trend];
        
        legendEl.innerHTML = `
            <div class="legend-item">
                <span class="legend-color first-training"></span>
                <span>起始周: ${weeklyHours[0]}小时</span>
            </div>
            <div class="legend-item">
                <span class="legend-color mid-term"></span>
                <span>期中周: ${weeklyHours[Math.floor(weeklyHours.length/2)]}小时</span>
            </div>
            <div class="legend-item">
                <span class="legend-color final-term"></span>
                <span>期末周: ${weeklyHours[weeklyHours.length-1]}小时</span>
            </div>
            <div class="legend-item trend-${trend}">
                <i class="fas fa-chart-line"></i>
                <span>训练趋势: ${trendText}</span>
            </div>
        `;
        
        // 添加柱状图动画
        setTimeout(() => {
            document.querySelectorAll('.chart-bar').forEach((bar, index) => {
                bar.style.transitionDelay = `${index * 50}ms`;
                bar.classList.add('animated');
            });
        }, 500);
    }
    
    renderWeeklyTrainingChart() {
        const weeklyEl = document.getElementById('weeklyChart');
        
        const weeklyHours = this.trainingData?.weeklyHours || [];
        
        if (!weeklyHours || weeklyHours.length === 0) {
            weeklyEl.innerHTML = '<div class="no-data">暂无每周训练数据</div>';
            return;
        }
        
        const maxHours = Math.max(...weeklyHours);
        const weeklyBars = weeklyHours.map((hours, index) => {
            const height = (hours / maxHours) * 80;
            const weekNumber = index + 1;
            
            // 根据训练时长设置不同颜色
            let barColor = '';
            if (hours >= maxHours * 0.8) barColor = 'high-effort';
            else if (hours >= maxHours * 0.5) barColor = 'medium-effort';
            else barColor = 'low-effort';
            
            return `
                <div class="weekly-bar-container" title="第${weekNumber}周: ${hours}小时">
                    <div class="weekly-bar ${barColor}" style="height: ${height}px">
                        <div class="weekly-bar-value">${hours}</div>
                    </div>
                    <div class="weekly-label">${weekNumber}</div>
                </div>
            `;
        }).join('');
        
        weeklyEl.querySelector('.weekly-bars').innerHTML = weeklyBars;
        
        // 添加柱状图动画
        setTimeout(() => {
            document.querySelectorAll('.weekly-bar').forEach((bar, index) => {
                bar.style.animationDelay = `${index * 100}ms`;
                bar.classList.add('animate-grow');
            });
        }, 800);
    }
    
    renderTimeline() {
        const timelineContent = document.getElementById('timelineContent');
        const timelineEvents = this.trainingData?.milestones || [];
        
        if (timelineEvents.length === 0) {
            timelineContent.innerHTML = `
                <div class="no-timeline">
                    <i class="fas fa-history"></i>
                    <p>暂无训练历程记录</p>
                </div>
            `;
            return;
        }
        
        // 按日期排序
        timelineEvents.sort((a, b) => new Date(b.date.replace('.', '-')) - new Date(a.date.replace('.', '-'))).reverse();
        
        const timelineHTML = timelineEvents.map((event, index) => `
            <div class="timeline-item ${event.type}" data-type="${event.type}">
                <div class="timeline-marker">
                    <div class="marker-dot"></div>
                    ${index < timelineEvents.length - 1 ? '<div class="marker-line"></div>' : ''}
                </div>
                <div class="timeline-content animated-item">
                    <div class="timeline-date">
                        <i class="far fa-calendar-alt"></i>
                        ${event.date}
                    </div>
                    <h3>
                        <i class="fas ${this.getEventIcon(event.type)}"></i>
                        ${event.event}
                    </h3>
                    <p>${event.description}</p>
                    ${event.score ? `<div class="timeline-score">成绩: ${event.score}</div>` : ''}
                    ${event.significance ? `<div class="timeline-significance">${event.significance}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        timelineContent.innerHTML = timelineHTML;
        
        // 添加时间轴动画
        this.animateTimelineItems();
        
        // 添加筛选功能
        document.getElementById('timelineFilter').addEventListener('change', (e) => {
            this.filterTimeline(e.target.value);
        });
    }
    
    animateTimelineItems() {
        const items = document.querySelectorAll('.timeline-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        items.forEach(item => {
            observer.observe(item);
        });
    }
    
    getEventIcon(type) {
        const iconMap = {
            'training': 'fa-running',
            'exam': 'fa-clipboard-check',
            'award': 'fa-trophy',
            'event': 'fa-flag'
        };
        return iconMap[type] || 'fa-circle';
    }
    
    filterTimeline(filter) {
        const items = document.querySelectorAll('.timeline-item');
        items.forEach(item => {
            if (filter === 'all' || item.dataset.type === filter) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    renderAwards() {
        const awardsList = document.getElementById('awardsList');
        const noAwardsMessage = document.getElementById('noAwardsMessage');
        
        const awards = this.memberData.awards || [];
        
        if (awards.length === 0) {
            awardsList.innerHTML = '';
            noAwardsMessage.style.display = 'block';
            return;
        }
        
        noAwardsMessage.style.display = 'none';
        
        const awardsHTML = awards.map((award, index) => `
            <div class="award-card animated-item" style="animation-delay: ${index * 100}ms">
                <div class="award-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="award-content">
                    <h3>${award.name}</h3>
                    <div class="award-meta">
                        <span class="award-date">
                            <i class="far fa-calendar"></i>
                            ${award.date}
                        </span>
                        <span class="award-level ${award.level === '校级' ? 'level-school' : 'level-team'}">
                            ${award.level}
                        </span>
                    </div>
                    <p class="award-desc">${award.description}</p>
                </div>
                <div class="award-badge">${index + 1}</div>
            </div>
        `).join('');
        
        awardsList.innerHTML = awardsHTML;
    }
    
    renderAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        
        const achievements = this.dataProcessor.getAchievements(this.studentId);
        
        if (!achievements || achievements.length === 0) {
            achievementsList.innerHTML = `
                <div class="no-achievements">
                    <i class="fas fa-medal"></i>
                    <p>努力训练，解锁更多成就！</p>
                </div>
            `;
            return;
        }
        
        const achievementsHTML = achievements.map((achievement, index) => `
            <div class="achievement-card" style="border-left-color: ${achievement.color}; animation-delay: ${index * 150}ms">
                <div class="achievement-icon" style="color: ${achievement.color}">
                    <i class="fas ${achievement.icon}"></i>
                </div>
                <div class="achievement-content">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
                <div class="achievement-level level-${achievement.level}">
                    Lv.${achievement.level}
                </div>
            </div>
        `).join('');
        
        achievementsList.innerHTML = achievementsHTML;
    }
    
    renderBadges() {
        const badgesEl = document.getElementById('avatarBadges');
        const badges = [];
        
        // 根据数据添加徽章
        if (this.memberData.awards?.length > 0) {
            badges.push({
                icon: 'fa-trophy',
                title: '获奖者',
                color: '#FFD700'
            });
        }
        
        const attendanceRate = parseFloat(this.trainingData?.statistics?.attendanceRate || 0);
        if (attendanceRate === 100) {
            badges.push({
                icon: 'fa-calendar-check',
                title: '全勤之星',
                color: '#4CAF50'
            });
        } else if (attendanceRate >= 95) {
            badges.push({
                icon: 'fa-calendar',
                title: '高出勤',
                color: '#2196F3'
            });
        }
        
        const totalHours = this.trainingData?.statistics?.totalHours || 0;
        if (totalHours >= 100) {
            badges.push({
                icon: 'fa-clock',
                title: '百时训练',
                color: '#9C27B0'
            });
        } else if (totalHours >= 50) {
            badges.push({
                icon: 'fa-clock',
                title: '五十小时',
                color: '#FF9800'
            });
        }
        
        if (this.memberData.rank?.includes('优秀')) {
            badges.push({
                icon: 'fa-star',
                title: '优秀队员',
                color: '#FF5722'
            });
        }
        
        if (badges.length === 0) {
            badgesEl.innerHTML = '';
            return;
        }
        
        const badgesHTML = badges.map((badge, index) => `
            <div class="badge-item animated-item" 
                 style="background: ${badge.color}; animation-delay: ${index * 200}ms" 
                 title="${badge.title}">
                <i class="fas ${badge.icon}"></i>
            </div>
        `).join('');
        
        badgesEl.innerHTML = badgesHTML;
    }
    
    renderAnnualSummary() {
        // 在时间轴区域后添加年度总结
        const timelineContainer = document.querySelector('.member-timeline');
        
        const summaryHTML = `
            <div class="annual-summary animated-item">
                <h3><i class="fas fa-file-alt"></i> 年度训练总结</h3>
                <div class="summary-content">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-number">${this.trainingData?.statistics?.totalTrainings || 0}</div>
                            <div class="stat-label">总训练次数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${this.trainingData?.statistics?.totalHours || 0}</div>
                            <div class="stat-label">总训练时长(小时)</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${this.trainingData?.statistics?.attendanceRate || '0%'}</div>
                            <div class="stat-label">出勤率</div>
                        </div>
                    </div>
                    <div class="summary-text">
                        <p>作为天津大学国旗护卫队28届预备队员，您在2024-2025学年中展现了出色的训练态度和团队精神。从第一次晚训到期末考核，您一步一个脚印，不断进步。</p>
                        <p>期待在新的学期中，您能继续保持训练热情，取得更大的进步！</p>
                    </div>
                </div>
            </div>
        `;
        
        // 在时间轴后插入
        timelineContainer.insertAdjacentHTML('afterend', summaryHTML);
    }
    
    generateTrainingReport() {
        const report = this.dataProcessor.generateTrainingReport(this.studentId, this.memberData);
        if (report) {
            console.log('训练报告:', report);
            // 可以将报告显示在页面上，或保存到localStorage供其他页面使用
            localStorage.setItem(`training-report-${this.studentId}`, JSON.stringify(report));
        }
    }
    
    loadPhotos() {
        const photoGrid = document.getElementById('photoGrid');
        const noPhotosMessage = document.getElementById('noPhotosMessage');
        
        // 清空现有照片
        photoGrid.innerHTML = '';
        
        // 获取照片数据
        const photos = this.dataProcessor.getPhotos(this.studentId);
        
        if (!photos || photos.length === 0) {
            this.loadFallbackPhotos();
            noPhotosMessage.style.display = 'block';
            return;
        }
        
        // 加载真实照片
        photos.forEach((photo, index) => {
            this.loadPhotoItem(photo, index);
        });
        
        // 更新照片计数
        document.getElementById('galleryCount').textContent = photos.length;
        noPhotosMessage.style.display = 'none';
    }
    
    loadPhotoItem(photo, index) {
        const photoGrid = document.getElementById('photoGrid');
        
        const container = document.createElement('div');
        container.className = 'photo-container animated-item';
        container.dataset.category = photo.category;
        container.style.animationDelay = `${index * 100}ms`;
        
        // 创建图片元素
        const img = new Image();
        img.className = 'gallery-photo';
        img.src = photo.src;
        img.alt = photo.alt;
        img.loading = 'lazy';
        
        // 创建覆盖层
        const overlay = document.createElement('div');
        overlay.className = 'photo-overlay';
        overlay.innerHTML = `
            <div class="photo-info">
                <h3>${photo.alt}</h3>
                <p><i class="far fa-calendar"></i> ${photo.date}</p>
                ${photo.tags ? `
                    <div class="photo-tags">
                        ${photo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="photo-action">
                <i class="fas fa-expand"></i>
            </div>
        `;
        
        container.appendChild(img);
        container.appendChild(overlay);
        
        // 添加点击事件
        container.addEventListener('click', () => {
            this.showPhotoModal(photo);
        });
        
        photoGrid.appendChild(container);
        
        // 图片加载完成的动画
        img.onload = () => {
            container.classList.add('loaded');
        };
        
        img.onerror = () => {
            // 如果图片加载失败，使用占位图
            container.classList.add('error');
            container.querySelector('.photo-info h3').textContent = '图片加载中...';
        };
    }
    
    showPhotoModal(photo) {
        const modal = document.getElementById('photoModal');
        const modalImg = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDescription');
        const modalDate = document.getElementById('modalDate');
        
        modalImg.src = photo.src;
        modalImg.alt = photo.alt;
        modalTitle.textContent = photo.alt;
        modalDesc.textContent = photo.description || '国旗护卫队训练瞬间';
        modalDate.textContent = `拍摄时间: ${photo.date}`;
        
        // 显示模态框
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // 添加关闭事件
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };
        
        // 点击模态框背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        };
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }
    
    loadFallbackPhotos() {
        const photoGrid = document.getElementById('photoGrid');
        const categories = [
            { name: 'training', label: '训练', count: 4 },
            { name: 'exam', label: '考核', count: 3 },
            { name: 'event', label: '活动', count: 3 },
            { name: 'award', label: '获奖', count: 2 }
        ];
        
        categories.forEach((category, catIndex) => {
            for (let i = 1; i <= category.count; i++) {
                const index = catIndex * category.count + i;
                
                const container = document.createElement('div');
                container.className = 'photo-placeholder animated-item';
                container.dataset.category = category.name;
                container.style.animationDelay = `${index * 80}ms`;
                
                container.innerHTML = `
                    <div class="placeholder-icon">
                        <i class="fas fa-camera"></i>
                    </div>
                    <div class="placeholder-text">${category.label}瞬间 ${i}</div>
                    <div class="placeholder-subtext">照片整理中</div>
                `;
                
                photoGrid.appendChild(container);
            }
        });
    }
    
    initAnimations() {
        // 添加页面滚动动画
        this.initScrollAnimations();
        
        // 添加悬浮效果
        this.initHoverEffects();
        
        // 添加点击动画
        this.initClickAnimations();
    }
    
    initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animated-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }
    
    initHoverEffects() {
        // 卡片悬停效果
        document.querySelectorAll('.stat-card, .award-card, .achievement-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover-effect');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover-effect');
            });
        });
    }
    
    initClickAnimations() {
        // 返回按钮点击效果
        const backLink = document.querySelector('.back-link');
        if (backLink) {
            backLink.addEventListener('click', (e) => {
                e.preventDefault();
                backLink.classList.add('clicked');
                setTimeout(() => {
                    window.location.href = backLink.href;
                }, 300);
            });
        }
    }
    
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdateTime').textContent = timeString;
    }
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
    
    showError(message) {
        const mainContent = document.querySelector('main');
        mainContent.innerHTML = `
            <div class="error-message animated-item">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>${message}</h2>
                <p>请检查学号是否正确，或联系管理员</p>
                <button onclick="window.location.href='../index.html'" class="btn-primary">
                    <i class="fas fa-home"></i> 返回首页
                </button>
            </div>
        `;
        
        this.hideLoadingOverlay();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化页面
    const memberPage = new MemberPage();
    
    // 添加照片筛选功能
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-filter');
        if (btn) {
            const filter = btn.dataset.filter;
            
            // 更新按钮状态
            document.querySelectorAll('.btn-filter').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            
            // 筛选照片
            filterPhotos(filter);
        }
    });
});

function filterPhotos(filter) {
    const photos = document.querySelectorAll('.photo-container, .photo-placeholder');
    let visibleCount = 0;
    
    photos.forEach(photo => {
        if (filter === 'all' || photo.dataset.category === filter) {
            photo.style.display = 'block';
            setTimeout(() => {
                photo.classList.add('filter-match');
            }, 10);
            visibleCount++;
        } else {
            photo.classList.remove('filter-match');
            photo.style.display = 'none';
        }
    });
    
    // 更新照片计数
    document.getElementById('galleryCount').textContent = visibleCount;
}

// 添加全局错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
});