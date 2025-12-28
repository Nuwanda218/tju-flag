// 滚动动画效果
document.addEventListener('DOMContentLoaded', function() {
    console.log('script.js已加载');
    
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
    
    // ========== 移除原setTimeout部分，避免重复触发 ==========
    // 原代码第45-56行的setTimeout可能会干扰IntersectionObserver
    // 可以安全移除，因为IntersectionObserver已经处理了初始可见元素
    
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

// 添加全局事件监听器来检测是否有人阻止了链接跳转
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