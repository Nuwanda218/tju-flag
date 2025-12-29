// 个人页面核心逻辑
class MemberPage {
    constructor() {
        this.studentId = null;
        this.memberData = null;
        this.photos = [];
        this.init();
    }
    
    async init() {
        // 1. 获取URL参数中的学号
        this.studentId = this.getStudentIdFromURL();
        
        if (!this.studentId) {
            this.showError('未提供学号参数');
            return;
        }
        
        // 2. 查找队员数据
        this.memberData = membersData[this.studentId];
        
        if (!this.memberData) {
            this.memberData = this.createDefaultMemberData();
        }
        
        // 3. 加载数据
        await this.loadMemberData();
        this.renderPage();
        this.loadPhotos();
        
        // 4. 隐藏加载动画
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            }, 500);
        }, 800);
    }
    
    getStudentIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('sid');
    }
    
    createDefaultMemberData() {
        return {
            name: '国旗护卫队队员',
            class: '天津大学',
            position: '预备队员',
            joinDate: '2023年',
            achievements: [
                '圆满完成本学期训练',
                '坚持每周训练任务',
                '展现团队合作精神'
            ],
            trainingHours: 45,
            attendance: '95%',
            photos: {
                'training': 4,
                'exam': 2,
                'event': 2
            }
        };
    }
    
    async loadMemberData() {
        try {
            // 如果有后端，这里可以调用API
            // const response = await fetch(`/api/member/${this.studentId}`);
            // this.memberData = await response.json();
            
            // 模拟加载延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error('加载队员数据失败:', error);
        }
    }
    
    renderPage() {
        // 更新头部信息
        document.getElementById('memberName').textContent = this.memberData.name;
        document.getElementById('memberClass').textContent = `学院：${this.memberData.class}`;
        document.getElementById('memberPosition').textContent = `职务：${this.memberData.position}`;
        document.getElementById('memberJoinDate').textContent = `入队：${this.memberData.joinDate}`;
        
        // 更新统计数据
        document.getElementById('trainingHours').textContent = this.memberData.trainingHours;
        document.getElementById('attendanceRate').textContent = this.memberData.attendance;
        
        // 计算照片总数
        const photoCount = Object.values(this.memberData.photos || {}).reduce((a, b) => a + b, 0);
        document.getElementById('photoCount').textContent = photoCount;
        
        // 更新学号显示
        document.getElementById('studentIdDisplay').textContent = `学号：${this.studentId}`;
        
        // 渲染时间轴
        this.renderTimeline();
        
        // 渲染成就列表
        this.renderAchievements();
    }
    
    renderTimeline() {
        const timelineContent = document.getElementById('timelineContent');
        const timelineEvents = [
            {
                date: '2025.10.08',
                title: '新队员见面会',
                description: '第一次与队友们见面，了解国旗护卫队的使命与责任'
            },
            {
                date: '2025.10.14',
                title: '开始晚训',
                description: '正式开启训练生活，学习基础队列动作'
            },
            {
                date: '2025.11.02',
                title: '素质拓展活动',
                description: '与队友们一起完成团队建设活动，增进了解'
            },
            {
                date: '2025.11.16',
                title: '第一次考核',
                description: '接受阶段性检验，找到自身不足'
            },
            {
                date: '2025.12.14',
                title: '期末大训练',
                description: '为本学期训练画上圆满句号'
            },
            {
                date: '2025.12.21',
                title: '结训晚会',
                description: '总结学期成果，展望未来'
            }
        ];
        
        const timelineHTML = timelineEvents.map(event => `
            <div class="timeline-item">
                <div class="timeline-date">${event.date}</div>
                <div class="timeline-content">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                </div>
            </div>
        `).join('');
        
        timelineContent.innerHTML = timelineHTML;
    }
    
    renderAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        
        const achievementsHTML = this.memberData.achievements.map((achievement, index) => `
            <div class="achievement-item">
                <div class="achievement-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="achievement-text">
                    <strong>成就 ${index + 1}:</strong> ${achievement}
                </div>
            </div>
        `).join('');
        
        achievementsList.innerHTML = achievementsHTML;
    }
    
    loadPhotos() {
        const photoGrid = document.getElementById('photoGrid');
        const noPhotosMessage = document.getElementById('noPhotosMessage');
        
        // 清空现有照片
        photoGrid.innerHTML = '';
        
        // 尝试加载队员个人照片
        const photoPromises = [];
        
        // 为每个训练阶段加载照片
        Object.entries(this.memberData.photos || {}).forEach(([category, count]) => {
            for (let i = 1; i <= count; i++) {
                photoPromises.push(
                    this.loadPhoto(category, i)
                        .then(imgElement => {
                            if (imgElement) {
                                photoGrid.appendChild(imgElement);
                            }
                        })
                );
            }
        });
        
        // 如果没有配置照片，使用占位图
        if (photoPromises.length === 0) {
            this.loadFallbackPhotos();
        }
        
        // 显示/隐藏无照片消息
        Promise.all(photoPromises).then(() => {
            if (photoGrid.children.length === 0) {
                noPhotosMessage.style.display = 'block';
            } else {
                noPhotosMessage.style.display = 'none';
            }
        });
    }
    
    async loadPhoto(category, index) {
        return new Promise((resolve) => {
            const img = new Image();
            const photoPath = `images/members/${this.studentId}/${category}-${index}.jpg`;
            
            img.onload = () => {
                img.className = 'gallery-photo';
                img.alt = `${category}照片-${index}`;
                img.dataset.category = category;
                resolve(img);
            };
            
            img.onerror = () => {
                // 如果照片不存在，使用占位图
                const fallbackImg = this.createFallbackPhoto(category, index);
                resolve(fallbackImg);
            };
            
            img.src = photoPath;
        });
    }
    
    createFallbackPhoto(category, index) {
        const fallbacks = {
            'training': ['队列训练', '动作练习', '体能训练'],
            'exam': ['考核现场', '评委打分', '动作展示'],
            'event': ['团队活动', '集体合影', '拓展训练']
        };
        
        const titles = fallbacks[category] || ['训练瞬间'];
        const title = titles[(index - 1) % titles.length];
        
        const div = document.createElement('div');
        div.className = 'photo-placeholder';
        div.dataset.category = category;
        div.innerHTML = `
            <div class="placeholder-icon">
                <i class="fas fa-camera"></i>
            </div>
            <div class="placeholder-text">${title}</div>
            <div class="placeholder-subtext">照片整理中</div>
        `;
        
        return div;
    }
    
    loadFallbackPhotos() {
        const photoGrid = document.getElementById('photoGrid');
        const categories = ['训练', '考核', '活动'];
        
        categories.forEach(category => {
            for (let i = 1; i <= 3; i++) {
                const placeholder = this.createFallbackPhoto(category.toLowerCase(), i);
                photoGrid.appendChild(placeholder);
            }
        });
    }
    
    showError(message) {
        const mainContent = document.querySelector('main');
        mainContent.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 100px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 60px; color: #dc3545; margin-bottom: 20px;"></i>
                <h2 style="color: #dc3545;">${message}</h2>
                <p>请检查学号是否正确，或联系管理员</p>
                <button onclick="window.location.href='index.html'" 
                        style="margin-top: 30px; padding: 12px 30px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    返回首页
                </button>
            </div>
        `;
        
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MemberPage();
    
    // 添加照片筛选功能
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-filter')) {
            const filter = e.target.dataset.filter;
            
            // 更新按钮状态
            document.querySelectorAll('.btn-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // 筛选照片
            filterPhotos(filter);
        }
    });
    
    // 点击照片放大查看
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('gallery-photo')) {
            showPhotoModal(e.target.src, e.target.alt);
        }
    });
});

function filterPhotos(filter) {
    const photos = document.querySelectorAll('.gallery-photo, .photo-placeholder');
    
    photos.forEach(photo => {
        if (filter === 'all' || photo.dataset.category === filter) {
            photo.style.display = 'block';
        } else {
            photo.style.display = 'none';
        }
    });
}

function showPhotoModal(src, alt) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; max-height: 90%;">
            <img src="${src}" alt="${alt}" style="max-width: 100%; max-height: 100%;">
            <div class="modal-close" style="position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; cursor: pointer;">×</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 点击关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            document.body.removeChild(modal);
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', function closeModal(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', closeModal);
        }
    });
}