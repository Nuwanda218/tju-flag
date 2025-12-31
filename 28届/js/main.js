// ========== 滚动位置保存与恢复功能 ==========
(function() {
    // 保存和恢复滚动位置的功能
    document.addEventListener('DOMContentLoaded', function() {
        // 保存滚动位置
        function saveScrollPosition() {
            sessionStorage.setItem('indexScrollPosition', window.pageYOffset);
            console.log('保存滚动位置:', window.pageYOffset);
        }
        
        // 恢复滚动位置
        function restoreScrollPosition() {
            const savedPosition = sessionStorage.getItem('indexScrollPosition');
            const shouldRestore = sessionStorage.getItem('restoreScroll');
            
            if (shouldRestore === 'true' && savedPosition) {
                console.log('正在恢复滚动位置:', savedPosition);
                
                // 等待页面完全渲染
                setTimeout(() => {
                    window.scrollTo({
                        top: parseInt(savedPosition, 10),
                        behavior: 'instant'
                    });
                    
                    // 清除标识
                    sessionStorage.removeItem('restoreScroll');
                    sessionStorage.removeItem('indexScrollPosition');
                }, 100);
            }
        }
        
        // 监听页面显示事件（处理浏览器后退）
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                restoreScrollPosition();
            }
        });
        
        // 监听页面加载完成
        window.addEventListener('load', function() {
            restoreScrollPosition();
        });
        
        // 监听离开页面
        window.addEventListener('beforeunload', function() {
            saveScrollPosition();
        });
        
        // 为所有离开页面的链接添加点击事件
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('.html') && !href.startsWith('#')) {
                link.addEventListener('click', function() {
                    sessionStorage.setItem('restoreScroll', 'true');
                    saveScrollPosition();
                });
            }
        });
    });
})();

// ========== 学号查询功能 ==========
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const studentIdInput = document.getElementById('studentIdInput');
        const queryButton = document.getElementById('queryButton');
        
        if (!studentIdInput || !queryButton) return;
        
        queryButton.addEventListener('click', function() {
            const studentId = studentIdInput.value.trim();
            
            if (!studentId) {
                alert('请输入您的学号');
                studentIdInput.focus();
                return;
            }
            
            if (!/^\d{10}$/.test(studentId)) {
                alert('请输入正确的10位数字学号');
                studentIdInput.select();
                return;
            }
            
            // 添加查询动画
            queryButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 查询中...';
            queryButton.disabled = true;
            
            // 模拟查询过程
            setTimeout(() => {
                // 跳转到个人页面，携带学号参数
                window.location.href = `pages/member.html?sid=${studentId}`;
            }, 800);
        });
        
        // 按回车键也可查询
        studentIdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                queryButton.click();
            }
        });
        
        // 输入框获得焦点时清空内容
        studentIdInput.addEventListener('focus', function() {
            this.select();
        });
    });
})();

// ========== 开屏动画控制 ==========
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const splashScreen = document.getElementById('splashScreen');
        const flagBackground = document.getElementById('flagBackground');
        const body = document.body;
        
        if (!splashScreen) return;
        
        // 检查是否已经看过开屏动画
        const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
        
        if (hasSeenSplash === 'true') {
            // 如果已经看过，立即隐藏开屏动画
            splashScreen.style.display = 'none';
            body.classList.remove('splash-active');
            
            // 显示页面内容
            const pageElements = document.querySelectorAll('.page-header, main, footer');
            pageElements.forEach(el => {
                el.style.opacity = '1';
                el.style.transition = 'opacity 0.5s ease';
            });
        } else {
            // 第一次访问，显示开屏动画
            // 设置开屏动画总时长
            const splashDuration = 6500; // 6.5秒
            
            // 动画结束后移除开屏层并显示页面内容
            setTimeout(function() {
                splashScreen.style.display = 'none';
                body.classList.remove('splash-active');
                
                // 显示页面内容
                const pageElements = document.querySelectorAll('.page-header, main, footer');
                pageElements.forEach(el => {
                    el.style.opacity = '1';
                    el.style.transition = 'opacity 0.5s ease';
                });
                
                // 标记用户已经看过开屏动画
                sessionStorage.setItem('hasSeenSplash', 'true');
            }, splashDuration);
            
            // 如果用户点击屏幕，可以提前结束开屏动画
            splashScreen.addEventListener('click', function() {
                splashScreen.style.display = 'none';
                body.classList.remove('splash-active');
                
                const pageElements = document.querySelectorAll('.page-header, main, footer');
                pageElements.forEach(el => {
                    el.style.opacity = '1';
                    el.style.transition = 'opacity 0.5s ease';
                });
                
                // 标记用户已经看过开屏动画
                sessionStorage.setItem('hasSeenSplash', 'true');
            });
            
            // 图片加载失败时的后备方案
            const tjuLogo = document.getElementById('tjuLogo');
            const guardLogo = document.getElementById('guardLogo');
            
            // 为队旗背景设置备用样式，如果图片加载失败
            if (flagBackground) {
                flagBackground.addEventListener('error', function() {
                    console.log('队旗图片加载失败，使用纯色背景');
                    this.style.background = 'linear-gradient(180deg, rgba(179, 25, 66, 0.8) 0%, rgba(139, 12, 47, 0.6) 100%)';
                    this.style.backgroundSize = 'cover';
                });
            }
            
            if (tjuLogo) {
                tjuLogo.addEventListener('error', function() {
                    console.log('天津大学校徽图片加载失败，请检查路径');
                    // 创建替代元素
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'splash-logo';
                    fallbackDiv.innerHTML = '<i class="fas fa-university" style="font-size: 40px; color: white;"></i>';
                    this.parentNode.replaceChild(fallbackDiv, this);
                });
            }
            
            if (guardLogo) {
                guardLogo.addEventListener('error', function() {
                    console.log('国旗护卫队队徽图片加载失败，请检查路径');
                    // 创建替代元素
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'splash-logo';
                    fallbackDiv.innerHTML = '<i class="fas fa-flag" style="font-size: 40px; color: white;"></i>';
                    this.parentNode.replaceChild(fallbackDiv, this);
                });
            }
        }
    });
})();

// ========== 滚动动画效果 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('main.js已加载');
    
    // ========== 滚动动画部分 ==========
    try {
        // 获取所有需要观察的元素
    const animatedElements = document.querySelectorAll(
        '.phase-title, .event, .summary-title, .summary-item, .time-badge'
        );

        console.log('找到的动画元素数量:', animatedElements.length);
        
        if (animatedElements.length > 0) {
            // 创建 Intersection Observer 实例
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // 如果元素进入视口
                    if (entry.isIntersecting) {
                        // 添加可见类触发动画
                        entry.target.classList.add('visible');
                        
                        // 如果已经触发过动画，可以取消观察
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                // 触发阈值：当元素20%进入视口时触发
                threshold: 0.2,
                // 提前200px触发
                rootMargin: '0px 0px -200px 0px'
            });
            
            // 开始观察每个元素
            animatedElements.forEach(el => {
                observer.observe(el);
            });
        }
    } catch (error) {
        console.warn('滚动动画初始化失败:', error);
    }
    
    // ========== 回到顶部按钮部分 ==========
    try {
        // 获取回到顶部按钮
        const backToTopButton = document.getElementById('back-to-top');
        
        if (backToTopButton) {
            console.log('找到回到顶部按钮');
            
            // 回到顶部按钮的显示/隐藏逻辑
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    backToTopButton.classList.add('visible');
                } else {
                    backToTopButton.classList.remove('visible');
                }
            });
            
            // 回到顶部按钮点击事件
            backToTopButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        } else {
            console.warn('未找到回到顶部按钮，ID为"back-to-top"的元素不存在');
        }
    } catch (error) {
        console.warn('回到顶部按钮初始化失败:', error);
    }
    
    // ========== 滚动指示器部分 ==========
    try {
        // 滚动指示器点击事件
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            console.log('找到滚动指示器');
            
            scrollIndicator.addEventListener('click', function(e) {
                e.preventDefault();
                // 滚动到时间轴开始位置
                const timeline = document.querySelector('.timeline');
                if (timeline) {
                    timeline.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        }
    } catch (error) {
        console.warn('滚动指示器初始化失败:', error);
    }
    
    // ========== 链接调试部分（新增）==========
    try {
        // 为所有"查看详情"链接添加点击事件监听
        const detailLinks = document.querySelectorAll('.view-more-link');
        console.log('找到的详情链接数量:', detailLinks.length);
        
        detailLinks.forEach((link, index) => {
            // 添加点击事件监听
            link.addEventListener('click', function(e) {
                console.log(`点击链接 ${index + 1}:`, this.href);
                console.log('链接文本:', this.textContent.trim());
                
                // 检查是否是有效的event-detail链接
                if (this.href.includes('event-detail.html')) {
                    console.log('✅ 这是一个有效的event-detail链接');
                    
                    // 检查是否有阻止默认行为的JavaScript
                    if (typeof window.eventLogger === 'undefined') {
                        console.log('没有发现阻止默认行为的代码');
                    }
                } else {
                    console.warn('⚠️ 链接不包含event-detail.html');
                }
            });
        });
        
        // 检查是否有阻止链接跳转的其他代码
        document.addEventListener('click', function(e) {
            // 如果点击的是.view-more-link元素
            if (e.target.closest('.view-more-link')) {
                console.log('全局点击事件捕获到view-more-link点击');
                
                // 检查是否有preventDefault被调用
                setTimeout(() => {
                    if (!e.defaultPrevented) {
                        console.log('✅ 没有阻止默认行为，应该能正常跳转');
                    } else {
                        console.warn('⚠️ 默认行为被阻止了！');
                    }
                }, 0);
            }
        }, true); // 使用捕获阶段
    } catch (error) {
        console.warn('链接调试初始化失败:', error);
    }
    
    // 设置页面加载完成标志
    setTimeout(() => {
        console.log('页面完全加载完成');
        
        // 检查所有链接的href属性
        document.querySelectorAll('.view-more-link').forEach((link, index) => {
            console.log(`链接${index + 1}的href:`, link.getAttribute('href'));
            console.log(`链接${index + 1}的完整URL:`, link.href);
        });
    }, 1000);
});

// ========== 全局事件监听器（用于调试）==========
(function() {
    console.log('安装全局点击监控');
    
    // 保存原始的addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // 重写addEventListener来监控'click'事件
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click') {
            console.log('发现click事件监听器:', listener.toString().substring(0, 100) + '...');
            
            // 包装监听器以监控preventDefault调用
            const wrappedListener = function(e) {
                const originalPreventDefault = e.preventDefault;
                let preventDefaultCalled = false;
                
                e.preventDefault = function() {
                    preventDefaultCalled = true;
                    console.warn('⚠️ preventDefault被调用!', e.target);
                    return originalPreventDefault.apply(this, arguments);
                };
                
                // 调用原始监听器
                const result = listener.call(this, e);
                
                // 检查是否调用了preventDefault
                if (preventDefaultCalled && e.target.closest('.view-more-link')) {
                    console.error('❌ 发现阻止.view-more-link跳转的代码!');
                    console.log('调用堆栈:', new Error().stack);
                }
                
                return result;
            };
            
            // 使用包装后的监听器
            return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        
        // 对于非click事件，正常处理
        return originalAddEventListener.call(this, type, listener, options);
    };
})();